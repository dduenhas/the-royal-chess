import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ActiveObjectiveCard,
  BoardState,
  PieceType,
} from '../game/types';
import {
  BoxBoardMaterials,
  createChessPieceMesh,
  createHourglassGroup,
  HourglassRig,
} from './models';
import {
  createBoxTopInsertTexture,
  createContactShadowTexture,
  createDarkWoodTexture,
  createLightWoodTexture,
  createObjectiveCardTexture,
  createPieceWoodTexture,
  createTabletopTexture,
} from './textures';

export type CameraPreset = 'TABLETOP' | 'OVERHEAD' | 'ANGLED';

interface RoyalStudyCanvasProps {
  board: BoardState;
  selectedSquare: number | null;
  validTargetSquares: number[];
  hintMove: { from: number; to: number } | null;
  activeCards: ActiveObjectiveCard[];
  selectedCardIndex: 0 | 1;
  hourglassRatio: number; // 1.0 = full top sand, 0.0 = empty
  hourglassActive: boolean;
  hourglassFlipCount: number;
  cameraPreset: CameraPreset;
  onSquareClick: (squareIndex: number) => void;
  onCardClick: (cardIndex: 0 | 1) => void;
}

// Pre-allocated scratch vectors at module scope to prevent GC in the render loop
const _scratchVec3 = new THREE.Vector3();
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();

// 3x3 board square world coordinates on top of the Royal Study Box
// Box center is at (0.3, 0, 0.2), board center is slightly lower on Z (z = 0.72) as on the physical box
const BOARD_CENTER_X = 0.4;
const BOARD_CENTER_Z = 0.75;
const TILE_SIZE = 1.36;
const BOARD_SURFACE_Y = 0.90;

function getSquareWorldXZ(squareIndex: number): [number, number] {
  const r = Math.floor(squareIndex / 3);
  const c = squareIndex % 3;
  const x = BOARD_CENTER_X + (c - 1) * TILE_SIZE;
  const z = BOARD_CENTER_Z + (r - 1) * TILE_SIZE;
  return [x, z];
}

export const RoyalStudyCanvas: React.FC<RoyalStudyCanvasProps> = ({
  board,
  selectedSquare,
  validTargetSquares,
  hintMove,
  activeCards,
  selectedCardIndex,
  hourglassRatio,
  hourglassActive,
  hourglassFlipCount,
  cameraPreset,
  onSquareClick,
  onCardClick,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Store latest props & callbacks in refs so React UI updates never re-create the WebGL scene
  const callbacksRef = useRef({ onSquareClick, onCardClick });
  callbacksRef.current = { onSquareClick, onCardClick };

  const stateRef = useRef({
    board,
    selectedSquare,
    validTargetSquares,
    hintMove,
    activeCards,
    selectedCardIndex,
    hourglassRatio,
    hourglassActive,
    hourglassFlipCount,
    cameraPreset,
  });
  stateRef.current = {
    board,
    selectedSquare,
    validTargetSquares,
    hintMove,
    activeCards,
    selectedCardIndex,
    hourglassRatio,
    hourglassActive,
    hourglassFlipCount,
    cameraPreset,
  };

  // Mutable 3D scene references for incremental updates
  const sceneObjectsRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    pieceGroups: Map<PieceType, THREE.Group>;
    pieceAnim: Map<
      PieceType,
      {
        currX: number;
        currZ: number;
        currY: number;
        startX: number;
        startZ: number;
        targetX: number;
        targetZ: number;
        moveProgress: number; // 0..1
        isKnightJump: boolean;
      }
    >;
    tileHighlightMeshes: THREE.Mesh[];
    tileHintMeshes: THREE.Mesh[];
    tileSelectedMeshes: THREE.Mesh[];
    cardGroups: THREE.Group[];
    cardFaceMeshes: THREE.Mesh[];
    cardRingMeshes: THREE.Mesh[];
    cardCacheKeys: string[];
    hourglassRig?: HourglassRig;
    targetFlipAngle: number;
    currentFlipAngle: number;
    presetDirty: boolean;
    maxAnisotropy: number;
  }>({
    pieceGroups: new Map(),
    pieceAnim: new Map(),
    tileHighlightMeshes: [],
    tileHintMeshes: [],
    tileSelectedMeshes: [],
    cardGroups: [],
    cardFaceMeshes: [],
    cardRingMeshes: [],
    cardCacheKeys: ['', ''],
    targetFlipAngle: 0,
    currentFlipAngle: 0,
    presetDirty: true,
    maxAnisotropy: 1,
  });

  // Trigger camera preset transition when cameraPreset prop changes
  useEffect(() => {
    sceneObjectsRef.current.presetDirty = true;
  }, [cameraPreset]);

  // Trigger hourglass 180-deg flip animation when hourglassFlipCount increments
  useEffect(() => {
    sceneObjectsRef.current.targetFlipAngle = hourglassFlipCount * Math.PI;
  }, [hourglassFlipCount]);

  // Update piece target positions whenever `board` changes
  useEffect(() => {
    const s = sceneObjectsRef.current;
    board.forEach((piece, sqIdx) => {
      if (!piece) return;
      const [tx, tz] = getSquareWorldXZ(sqIdx);
      const anim = s.pieceAnim.get(piece);
      if (anim) {
        const dist = Math.hypot(tx - anim.targetX, tz - anim.targetZ);
        if (dist > 0.01) {
          anim.startX = anim.currX;
          anim.startZ = anim.currZ;
          anim.targetX = tx;
          anim.targetZ = tz;
          anim.moveProgress = 0;
          anim.isKnightJump = piece === PieceType.KNIGHT;
        }
      }
    });
  }, [board]);

  // Update 3D Objective Card textures when activeCards change
  useEffect(() => {
    const s = sceneObjectsRef.current;
    if (s.cardFaceMeshes.length === 0) return;

    activeCards.forEach((ac, idx) => {
      const cardMesh = s.cardFaceMeshes[idx];
      const cardGroup = s.cardGroups[idx];
      if (!cardMesh || !cardGroup) return;

      cardGroup.visible = true;
      const cacheKey = `${ac.card.code}_${ac.currentBoard.map((p) => p || '.').join('')}_${ac.completed ? '1' : '0'}`;
      if (s.cardCacheKeys[idx] !== cacheKey) {
        s.cardCacheKeys[idx] = cacheKey;
        const newTex = createObjectiveCardTexture(
          ac.currentBoard,
          ac.card.code,
          s.maxAnisotropy,
          ac.completed
        );
        const mat = cardMesh.material as THREE.MeshStandardMaterial;
        if (mat.map) mat.map.dispose();
        mat.map = newTex;
        mat.needsUpdate = true;
      }
    });

    if (activeCards.length === 1 && s.cardGroups[1]) {
      s.cardGroups[1].visible = false;
    }
  }, [activeCards]);

  // Initialize Three.js WebGL scene once on mount
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f140e);
    scene.fog = new THREE.FogExp2(0x1f140e, 0.032);

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 11.2, 8.8);
    camera.lookAt(0, 0.4, 0.3);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isHeadless ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    sceneObjectsRef.current.maxAnisotropy = maxAnisotropy;
    sceneObjectsRef.current.renderer = renderer;
    sceneObjectsRef.current.camera = camera;

    // Studio Environment Map (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    // OrbitControls with smooth damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.minPolarAngle = 0.05;
    controls.minDistance = 6.5;
    controls.maxDistance = 20;
    controls.target.set(0, 0.4, 0.25);
    sceneObjectsRef.current.controls = controls;

    // Interrupt preset auto-glide if user manually orbits
    const onControlStart = () => {
      sceneObjectsRef.current.presetDirty = false;
    };
    controls.addEventListener('start', onControlStart);

    // 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xfff4e6, 0x2c3e50, 0.75);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff0dd, 2.2);
    keyLight.position.set(6.5, 13.5, 7.5);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    const d = 8.0;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0012;
    keyLight.shadow.normalBias = 0.035;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.75);
    rimLight.position.set(-7, 8, -6);
    scene.add(rimLight);

    // Procedural Textures & PBR Materials
    const tabletopTex = createTabletopTexture(maxAnisotropy);
    const lightWoodTex = createLightWoodTexture(maxAnisotropy);
    const pieceWoodTex = createPieceWoodTexture(maxAnisotropy);
    const darkWoodTex = createDarkWoodTexture(maxAnisotropy);
    const boxInsertTex = createBoxTopInsertTexture(maxAnisotropy);
    const shadowTex = createContactShadowTexture();

    const mats: BoxBoardMaterials = {
      lightWoodMat: new THREE.MeshPhysicalMaterial({
        map: lightWoodTex,
        roughness: 0.38,
        metalness: 0.02,
        clearcoat: 0.3,
        clearcoatRoughness: 0.25,
      }),
      darkWoodMat: new THREE.MeshPhysicalMaterial({
        map: darkWoodTex,
        roughness: 0.34,
        metalness: 0.03,
        clearcoat: 0.35,
        clearcoatRoughness: 0.22,
      }),
      pieceWoodMat: new THREE.MeshPhysicalMaterial({
        map: pieceWoodTex,
        color: 0xe0a360,
        roughness: 0.32,
        metalness: 0.03,
        clearcoat: 0.55,
        clearcoatRoughness: 0.2,
      }),
      pieceAccentWoodMat: new THREE.MeshPhysicalMaterial({
        map: pieceWoodTex,
        color: 0xc5833e,
        roughness: 0.42,
        metalness: 0.04,
        clearcoat: 0.35,
        clearcoatRoughness: 0.25,
      }),
      feltMat: new THREE.MeshStandardMaterial({
        color: 0x14532d,
        roughness: 0.92,
        metalness: 0.0,
      }),
      shadowPlaneMat: new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    };

    // 1. Wooden Tabletop Surface
    const tableGeo = new THREE.PlaneGeometry(48, 48);
    tableGeo.rotateX(-Math.PI / 2);
    const tableMat = new THREE.MeshStandardMaterial({
      map: tabletopTex,
      roughness: 0.62,
      metalness: 0.04,
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // 2. "The Royal Study" Blue Box & Recessed 3x3 Wooden Board
    // Non-overlapping Y heights to completely prevent Z-fighting:
    // - Table: y = 0.00
    // - Box Shadow: y = 0.01
    // - Outer Blue Box: y = 0.00 .. 0.78
    // - Top Dark-Teal Insert: y = 0.805
    // - White Board Frame Rim: y = 0.79 .. 0.84 (top at 0.84)
    // - 3x3 Wooden Tiles: y = 0.84 .. 0.90 (top at BOARD_SURFACE_Y = 0.90, 0.06 above rim!)
    const boxGroup = new THREE.Group();
    boxGroup.position.set(BOARD_CENTER_X, 0, 0);
    scene.add(boxGroup);

    // Box contact shadow on table
    const boxShadowGeo = new THREE.PlaneGeometry(6.4, 7.6);
    boxShadowGeo.rotateX(-Math.PI / 2);
    const boxShadow = new THREE.Mesh(boxShadowGeo, mats.shadowPlaneMat);
    boxShadow.position.y = 0.01;
    boxGroup.add(boxShadow);

    // Royal Blue outer box walls (top at y = 0.78)
    const blueBoxMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e4598,
      roughness: 0.38,
      metalness: 0.05,
      clearcoat: 0.25,
    });
    const outerBoxGeo = new THREE.BoxGeometry(5.35, 0.78, 6.55);
    outerBoxGeo.translate(0, 0.39, 0);
    const outerBoxMesh = new THREE.Mesh(outerBoxGeo, blueBoxMat);
    outerBoxMesh.castShadow = false;
    outerBoxMesh.receiveShadow = true;
    boxGroup.add(outerBoxMesh);

    // Top dark-teal graphic insert ("The Royal Study" + Philos badge + 5 icons) at y = 0.805
    const topInsertGeo = new THREE.PlaneGeometry(4.95, 6.15);
    topInsertGeo.rotateX(-Math.PI / 2);
    const topInsertMat = new THREE.MeshStandardMaterial({
      map: boxInsertTex,
      roughness: 0.42,
      metalness: 0.04,
    });
    const topInsertMesh = new THREE.Mesh(topInsertGeo, topInsertMat);
    topInsertMesh.position.y = 0.805;
    topInsertMesh.receiveShadow = true;
    boxGroup.add(topInsertMesh);

    // White border frame around the 3x3 board (top at y = 0.84)
    const boardRimGeo = new THREE.BoxGeometry(4.28, 0.04, 4.28);
    const boardRimMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
    });
    const boardRimMesh = new THREE.Mesh(boardRimGeo, boardRimMat);
    boardRimMesh.position.set(0, 0.82, BOARD_CENTER_Z);
    boardRimMesh.castShadow = false;
    boardRimMesh.receiveShadow = true;
    boxGroup.add(boardRimMesh);

    // 9 Interactive 3x3 Wooden Squares (top cleanly at BOARD_SURFACE_Y = 0.90)
    const clickableSquares: THREE.Object3D[] = [];
    const tileGeo = new THREE.BoxGeometry(TILE_SIZE - 0.015, 0.06, TILE_SIZE - 0.015);

    const validHighlightGeo = new THREE.RingGeometry(0.24, 0.38, 32);
    validHighlightGeo.rotateX(-Math.PI / 2);
    const validHighlightMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const selectedRingGeo = new THREE.RingGeometry(0.46, 0.56, 36);
    selectedRingGeo.rotateX(-Math.PI / 2);
    const selectedRingMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const hintRingGeo = new THREE.RingGeometry(0.35, 0.5, 32);
    hintRingGeo.rotateX(-Math.PI / 2);
    const hintRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    sceneObjectsRef.current.tileHighlightMeshes = [];
    sceneObjectsRef.current.tileSelectedMeshes = [];
    sceneObjectsRef.current.tileHintMeshes = [];

    for (let sqIdx = 0; sqIdx < 9; sqIdx++) {
      const [wx, wz] = getSquareWorldXZ(sqIdx);
      const isDark = sqIdx % 2 === 0;
      const tileMesh = new THREE.Mesh(
        tileGeo,
        isDark ? mats.darkWoodMat : mats.lightWoodMat
      );
      tileMesh.position.set(wx, BOARD_SURFACE_Y - 0.03, wz);
      tileMesh.receiveShadow = true;
      tileMesh.userData = { squareIndex: sqIdx };
      scene.add(tileMesh);
      clickableSquares.push(tileMesh);

      // Valid move target ring
      const hlMesh = new THREE.Mesh(validHighlightGeo, validHighlightMat);
      hlMesh.position.set(wx, BOARD_SURFACE_Y + 0.015, wz);
      hlMesh.visible = false;
      scene.add(hlMesh);
      sceneObjectsRef.current.tileHighlightMeshes.push(hlMesh);

      // Selected square ring
      const selMesh = new THREE.Mesh(selectedRingGeo, selectedRingMat);
      selMesh.position.set(wx, BOARD_SURFACE_Y + 0.016, wz);
      selMesh.visible = false;
      scene.add(selMesh);
      sceneObjectsRef.current.tileSelectedMeshes.push(selMesh);

      // Hint ring
      const hintMesh = new THREE.Mesh(hintRingGeo, hintRingMat);
      hintMesh.position.set(wx, BOARD_SURFACE_Y + 0.018, wz);
      hintMesh.visible = false;
      scene.add(hintMesh);
      sceneObjectsRef.current.tileHintMeshes.push(hintMesh);
    }

    // 3. Create the 5 Sculpted Wooden Chess Pieces
    const allPieces: PieceType[] = [
      PieceType.KING,
      PieceType.QUEEN,
      PieceType.ROOK,
      PieceType.BISHOP,
      PieceType.KNIGHT,
    ];
    const clickablePieceMeshes: THREE.Object3D[] = [];

    allPieces.forEach((pType) => {
      const pGroup = createChessPieceMesh(pType, mats);
      const initialSq = stateRef.current.board.indexOf(pType);
      const [ix, iz] = getSquareWorldXZ(initialSq >= 0 ? initialSq : 0);
      pGroup.position.set(ix, BOARD_SURFACE_Y, iz);
      scene.add(pGroup);
      clickablePieceMeshes.push(pGroup);

      sceneObjectsRef.current.pieceGroups.set(pType, pGroup);
      sceneObjectsRef.current.pieceAnim.set(pType, {
        currX: ix,
        currZ: iz,
        currY: BOARD_SURFACE_Y,
        startX: ix,
        startZ: iz,
        targetX: ix,
        targetZ: iz,
        moveProgress: 1,
        isKnightJump: pType === PieceType.KNIGHT,
      });
    });

    // 4. 60-Card Deck Stack (InstancedMesh for >20 repeated cards) on the Left of the Box
    const deckCount = 36;
    const cardSliceGeo = new THREE.BoxGeometry(2.35, 0.014, 2.35);
    const cardEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xe6d5c3,
      roughness: 0.7,
    });
    const deckInstanced = new THREE.InstancedMesh(
      cardSliceGeo,
      cardEdgeMat,
      deckCount
    );
    deckInstanced.castShadow = true;
    deckInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < deckCount; i++) {
      dummy.position.set(
        -4.15 + Math.sin(i * 1.7) * 0.018,
        0.01 + i * 0.015,
        -1.55 + Math.cos(i * 1.3) * 0.018
      );
      dummy.rotation.set(0, Math.sin(i * 0.5) * 0.025, 0);
      dummy.updateMatrix();
      deckInstanced.setMatrixAt(i, dummy.matrix);
    }
    deckInstanced.instanceMatrix.needsUpdate = true;
    deckInstanced.computeBoundingSphere();
    scene.add(deckInstanced);

    // Top decorative card on the deck stack
    const topDeckTex = createObjectiveCardTexture(
      stateRef.current.activeCards[0]?.currentBoard || stateRef.current.board,
      'DECK',
      maxAnisotropy
    );
    const topDeckGeo = new THREE.PlaneGeometry(2.34, 2.34);
    topDeckGeo.rotateX(-Math.PI / 2);
    const topDeckMesh = new THREE.Mesh(
      topDeckGeo,
      new THREE.MeshStandardMaterial({ map: topDeckTex, roughness: 0.5 })
    );
    topDeckMesh.position.set(-4.15, 0.01 + deckCount * 0.015 + 0.01, -1.55);
    scene.add(topDeckMesh);

    // 5. Active Objective Card(s) in Front-Left of the Box (1 or 2 cards for Bonus Challenge)
    const cardPositions: [number, number][] = [
      [-4.15, 1.35],
      [-4.15, 3.95],
    ];
    sceneObjectsRef.current.cardGroups = [];
    sceneObjectsRef.current.cardFaceMeshes = [];
    sceneObjectsRef.current.cardRingMeshes = [];
    const clickableCardMeshes: THREE.Object3D[] = [];

    cardPositions.forEach(([cx, cz], idx) => {
      const cGroup = new THREE.Group();
      cGroup.position.set(cx, 0.06, cz);
      scene.add(cGroup);

      // Card base slab
      const slabGeo = new THREE.BoxGeometry(2.42, 0.04, 2.42);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x7a4938,
        roughness: 0.55,
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      slabMesh.userData = { cardIndex: idx as 0 | 1 };
      cGroup.add(slabMesh);
      clickableCardMeshes.push(slabMesh);

      // Top face with dynamic Objective Card texture
      const initialCard = stateRef.current.activeCards[idx];
      const initTex = createObjectiveCardTexture(
        initialCard ? initialCard.currentBoard : stateRef.current.board,
        initialCard ? initialCard.card.code : 'RS-01',
        maxAnisotropy,
        initialCard ? initialCard.completed : false
      );
      const faceGeo = new THREE.PlaneGeometry(2.38, 2.38);
      faceGeo.rotateX(-Math.PI / 2);
      const faceMat = new THREE.MeshStandardMaterial({
        map: initTex,
        roughness: 0.45,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.position.y = 0.022;
      faceMesh.receiveShadow = true;
      faceMesh.userData = { cardIndex: idx as 0 | 1 };
      cGroup.add(faceMesh);
      clickableCardMeshes.push(faceMesh);

      // Selection border glow around active card (visible in 2-card Bonus Challenge)
      const borderGeo = new THREE.RingGeometry(1.72, 1.82, 4);
      borderGeo.rotateX(-Math.PI / 2);
      borderGeo.rotateY(Math.PI / 4);
      const borderMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.y = 0.01;
      borderMesh.visible = false;
      cGroup.add(borderMesh);

      cGroup.visible = idx < stateRef.current.activeCards.length;
      sceneObjectsRef.current.cardGroups.push(cGroup);
      sceneObjectsRef.current.cardFaceMeshes.push(faceMesh);
      sceneObjectsRef.current.cardRingMeshes.push(borderMesh);
    });

    // 6. 3D Hourglass on the Right of the Box (matching Image 1 & 4)
    const hourglassRig = createHourglassGroup(mats.shadowPlaneMat);
    hourglassRig.group.position.set(4.55, 0, -0.85);
    scene.add(hourglassRig.group);
    sceneObjectsRef.current.hourglassRig = hourglassRig;

    // Pre-warm shaders
    renderer.compile(scene, camera);

    // Raycasting for clicking pieces, board squares, and objective cards
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const moveDist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (moveDist > 6) return; // Ignore camera orbit drags

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      // 1. Check if user clicked a chess piece
      const pieceHits = raycaster.intersectObjects(clickablePieceMeshes, true);
      if (pieceHits.length > 0) {
        const hitPiece = pieceHits[0].object.userData?.pieceType as PieceType | undefined;
        if (hitPiece) {
          const sqIdx = stateRef.current.board.indexOf(hitPiece);
          if (sqIdx !== -1) {
            callbacksRef.current.onSquareClick(sqIdx);
            return;
          }
        }
      }

      // 2. Check if user clicked a 3x3 board square
      const squareHits = raycaster.intersectObjects(clickableSquares, false);
      if (squareHits.length > 0) {
        const sqIdx = squareHits[0].object.userData?.squareIndex;
        if (typeof sqIdx === 'number') {
          callbacksRef.current.onSquareClick(sqIdx);
          return;
        }
      }

      // 3. Check if user clicked an Objective Card
      const cardHits = raycaster.intersectObjects(clickableCardMeshes, false);
      if (cardHits.length > 0) {
        const cIdx = cardHits[0].object.userData?.cardIndex;
        if (cIdx === 0 || cIdx === 1) {
          callbacksRef.current.onCardClick(cIdx);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Responsive Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 60fps Animation Loop with Frame-Rate Independent Exponential Damping
    const clock = new THREE.Clock();
    let animFrameId = 0;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;
      const sc = sceneObjectsRef.current;

      // 1. Camera Preset Smooth Damping
      if (sc.presetDirty) {
        if (st.cameraPreset === 'OVERHEAD') {
          _camTargetPos.set(-0.2, 13.8, 0.65);
          _camLookTarget.set(-0.2, 0.4, 0.55);
        } else if (st.cameraPreset === 'ANGLED') {
          _camTargetPos.set(-3.8, 9.6, 8.8);
          _camLookTarget.set(-0.3, 0.4, 0.5);
        } else {
          // TABLETOP default
          _camTargetPos.set(0.0, 10.8, 8.2);
          _camLookTarget.set(-0.2, 0.4, 0.55);
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTargetPos.x, 5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTargetPos.y, 5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTargetPos.z, 5, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _camLookTarget.x, 5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _camLookTarget.y, 5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _camLookTarget.z, 5, dt);

        if (camera.position.distanceTo(_camTargetPos) < 0.03) {
          sc.presetDirty = false;
        }
      }
      controls.update();

      // 2. Animate 5 Wooden Chess Pieces (Smooth glide + Parabolic Arc + Selection Lift)
      sc.pieceGroups.forEach((pGroup, pType) => {
        const anim = sc.pieceAnim.get(pType);
        if (!anim) return;

        if (anim.moveProgress < 1) {
          anim.moveProgress = Math.min(1, anim.moveProgress + dt * 3.8);
          // Smoothstep interpolation
          const t =
            anim.moveProgress *
            anim.moveProgress *
            (3 - 2 * anim.moveProgress);
          anim.currX = THREE.MathUtils.lerp(anim.startX, anim.targetX, t);
          anim.currZ = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, t);

          // Knight leaps high over pieces; sliding pieces lift slightly
          const arcHeight = anim.isKnightJump ? 1.35 : 0.32;
          const arcOffset = Math.sin(t * Math.PI) * arcHeight;
          anim.currY = BOARD_SURFACE_Y + arcOffset;
        } else {
          const sqIdx = st.board.indexOf(pType);
          const isSelected = sqIdx !== -1 && st.selectedSquare === sqIdx;
          const targetY = isSelected
            ? BOARD_SURFACE_Y + 0.32 + Math.sin(elapsed * 5) * 0.04
            : BOARD_SURFACE_Y;
          anim.currY = THREE.MathUtils.damp(anim.currY, targetY, 12, dt);
        }

        pGroup.position.set(anim.currX, anim.currY, anim.currZ);
      });

      // 3. Update Tile Highlight Rings (Valid Targets, Selected Square, Hint Move)
      for (let i = 0; i < 9; i++) {
        const hl = sc.tileHighlightMeshes[i];
        const sel = sc.tileSelectedMeshes[i];
        const hnt = sc.tileHintMeshes[i];

        if (hl) {
          hl.visible = st.validTargetSquares.includes(i);
          if (hl.visible) {
            const s = 0.92 + Math.sin(elapsed * 4.5) * 0.08;
            hl.scale.set(s, 1, s);
          }
        }
        if (sel) {
          sel.visible = st.selectedSquare === i;
        }
        if (hnt) {
          hnt.visible =
            st.hintMove !== null &&
            (st.hintMove.from === i || st.hintMove.to === i);
          if (hnt.visible) {
            const s = 0.9 + Math.sin(elapsed * 6) * 0.1;
            hnt.scale.set(s, 1, s);
          }
        }
      }

      // 4. Update Active Objective Card Selection Border (in 2-card Bonus mode)
      sc.cardRingMeshes.forEach((ring, idx) => {
        ring.visible =
          st.activeCards.length > 1 && st.selectedCardIndex === idx;
      });

      // 5. Update 3D Hourglass Flip & Sand Flow
      if (sc.hourglassRig) {
        sc.currentFlipAngle = THREE.MathUtils.damp(
          sc.currentFlipAngle,
          sc.targetFlipAngle,
          7,
          dt
        );
        // Always keep sand cones upright relative to gravity after flip settles
        const flipMod = sc.currentFlipAngle % (Math.PI * 2);
        sc.hourglassRig.innerFlipGroup.rotation.z = Math.sin(flipMod) * 0.35;

        const r = THREE.MathUtils.clamp(st.hourglassRatio, 0.02, 1);
        sc.hourglassRig.topSandMesh.scale.set(1, r, 1);
        sc.hourglassRig.bottomSandMesh.scale.set(1, 1.02 - r, 1);
        sc.hourglassRig.streamMesh.visible = st.hourglassActive && r > 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-screen h-screen overflow-hidden cursor-grab active:cursor-grabbing"
      aria-label="Tabuleiro 3D The Royal Study"
    />
  );
};
