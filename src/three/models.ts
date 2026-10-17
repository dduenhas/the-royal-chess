import * as THREE from 'three';
import { PieceType } from '../game/types';

export interface BoxBoardMaterials {
  lightWoodMat: THREE.MeshPhysicalMaterial;
  darkWoodMat: THREE.MeshPhysicalMaterial;
  pieceWoodMat: THREE.MeshPhysicalMaterial;
  pieceAccentWoodMat: THREE.MeshPhysicalMaterial;
  feltMat: THREE.MeshStandardMaterial;
  shadowPlaneMat: THREE.MeshBasicMaterial;
}

/**
 * Builds a composite 3–12 part procedural wooden chess piece (THREE.Group)
 * with bottom-center pivot at y=0 and soft contact shadow grounding.
 */
export function createChessPieceMesh(
  type: PieceType,
  mats: BoxBoardMaterials
): THREE.Group {
  const group = new THREE.Group();
  group.name = `PIECE_${type}`;
  group.userData = { pieceType: type };

  // 1. Soft radial contact shadow plane at y = 0.008
  const shadowGeo = new THREE.PlaneGeometry(1.18, 1.18);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMesh = new THREE.Mesh(shadowGeo, mats.shadowPlaneMat);
  shadowMesh.position.y = 0.008;
  group.add(shadowMesh);

  // 2. Green tournament felt pad at bottom (y = 0..0.04)
  const feltGeo = new THREE.CylinderGeometry(0.42, 0.43, 0.04, 32);
  feltGeo.translate(0, 0.02, 0);
  const feltMesh = new THREE.Mesh(feltGeo, mats.feltMat);
  feltMesh.castShadow = true;
  feltMesh.receiveShadow = true;
  group.add(feltMesh);

  // Helper to add a Lathe turned body from 2D profile points
  const addLathePart = (
    coords: [number, number][],
    mat: THREE.Material = mats.pieceWoodMat
  ) => {
    const pts = coords.map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(pts, 40);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Helper to add a turned collar torus ring
  const addCollarRing = (y: number, radius: number, tube: number) => {
    const geo = new THREE.TorusGeometry(radius, tube, 16, 36);
    geo.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mats.pieceAccentWoodMat);
    mesh.position.y = y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };

  switch (type) {
    case PieceType.KING: {
      // Turned base + waisted column + flared crown cup
      addLathePart([
        [0.0, 0.04],
        [0.43, 0.04],
        [0.44, 0.14],
        [0.37, 0.24],
        [0.39, 0.31],
        [0.28, 0.44],
        [0.21, 0.85],
        [0.19, 1.25],
        [0.31, 1.38],
        [0.24, 1.48],
        [0.35, 1.82],
        [0.31, 1.92],
        [0.18, 2.02],
        [0.0, 2.04],
      ]);
      addCollarRing(1.38, 0.29, 0.045);
      addCollarRing(0.3, 0.36, 0.035);

      // Rounded wooden cross finial on top (vertical + horizontal beveled blocks)
      const vBarGeo = new THREE.BoxGeometry(0.14, 0.34, 0.12);
      const hBarGeo = new THREE.BoxGeometry(0.3, 0.12, 0.12);
      const vBar = new THREE.Mesh(vBarGeo, mats.pieceAccentWoodMat);
      vBar.position.y = 2.18;
      vBar.castShadow = true;
      const hBar = new THREE.Mesh(hBarGeo, mats.pieceAccentWoodMat);
      hBar.position.y = 2.2;
      hBar.castShadow = true;
      group.add(vBar, hBar);
      break;
    }

    case PieceType.QUEEN: {
      // Turned base + column + flared coronet
      addLathePart([
        [0.0, 0.04],
        [0.42, 0.04],
        [0.43, 0.14],
        [0.35, 0.24],
        [0.37, 0.3],
        [0.26, 0.42],
        [0.2, 0.82],
        [0.18, 1.18],
        [0.29, 1.3],
        [0.22, 1.4],
        [0.35, 1.72],
        [0.28, 1.78],
        [0.0, 1.75],
      ]);
      addCollarRing(1.3, 0.27, 0.04);
      addCollarRing(0.28, 0.35, 0.032);

      // 8 sculpted coronet pearls around the rim
      const pearlGeo = new THREE.SphereGeometry(0.055, 16, 16);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const pearl = new THREE.Mesh(pearlGeo, mats.pieceAccentWoodMat);
        pearl.position.set(Math.cos(angle) * 0.29, 1.77, Math.sin(angle) * 0.29);
        pearl.castShadow = true;
        group.add(pearl);
      }

      // Central dome + top ball finial
      const domeGeo = new THREE.SphereGeometry(0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const dome = new THREE.Mesh(domeGeo, mats.pieceWoodMat);
      dome.position.y = 1.68;
      dome.castShadow = true;
      const finialGeo = new THREE.SphereGeometry(0.085, 20, 20);
      const finial = new THREE.Mesh(finialGeo, mats.pieceAccentWoodMat);
      finial.position.y = 1.94;
      finial.castShadow = true;
      group.add(dome, finial);
      break;
    }

    case PieceType.BISHOP: {
      // Turned base + column
      addLathePart([
        [0.0, 0.04],
        [0.39, 0.04],
        [0.4, 0.13],
        [0.33, 0.22],
        [0.34, 0.28],
        [0.24, 0.4],
        [0.18, 0.78],
        [0.17, 1.06],
        [0.26, 1.15],
        [0.2, 1.22],
        [0.0, 1.22],
      ]);
      addCollarRing(1.15, 0.24, 0.038);

      // Mitre head with a real inward-carved diagonal V-slot (no protruding plate)
      const mitreGeo = new THREE.SphereGeometry(0.26, 64, 48);
      mitreGeo.scale(1, 1.38, 1);

      const posAttr = mitreGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        let vz = posAttr.getZ(i);

        // Diagonal notch plane across the upper front of the mitre
        const slitCenterY = 0.05 + vz * 0.32;
        const distToSlit = Math.abs(vy - slitCenterY);
        const halfWidth = 0.042;

        if (vz > -0.02 && distToSlit < halfWidth) {
          const depthProfile = 1 - distToSlit / halfWidth;
          const frontFade = THREE.MathUtils.smoothstep(vz, -0.02, 0.07);
          const indentFactor = 1 - 0.55 * depthProfile * frontFade;
          vx *= indentFactor;
          vz *= indentFactor;
          posAttr.setXYZ(i, vx, vy, vz);
        }
      }
      posAttr.needsUpdate = true;
      mitreGeo.computeVertexNormals();

      const mitre = new THREE.Mesh(mitreGeo, mats.pieceWoodMat);
      mitre.position.y = 1.44;
      mitre.castShadow = true;
      mitre.receiveShadow = true;
      group.add(mitre);

      // Top knop sphere
      const knopGeo = new THREE.SphereGeometry(0.075, 20, 20);
      const knop = new THREE.Mesh(knopGeo, mats.pieceAccentWoodMat);
      knop.position.y = 1.82;
      knop.castShadow = true;
      group.add(knop);
      break;
    }

    case PieceType.KNIGHT: {
      // Turned wooden pedestal base
      addLathePart([
        [0.0, 0.04],
        [0.4, 0.04],
        [0.41, 0.14],
        [0.34, 0.24],
        [0.35, 0.32],
        [0.28, 0.44],
        [0.0, 0.44],
      ]);
      addCollarRing(0.32, 0.33, 0.032);

      // Sculpted Horse Head using ExtrudeGeometry with smooth bevels
      const shape = new THREE.Shape();
      shape.moveTo(-0.22, 0.42);
      shape.quadraticCurveTo(-0.28, 0.85, -0.2, 1.25);
      shape.quadraticCurveTo(-0.14, 1.48, -0.04, 1.58);
      // Pointed ear
      shape.lineTo(0.02, 1.68);
      shape.lineTo(0.09, 1.52);
      // Forehead & snout
      shape.lineTo(0.34, 1.26);
      shape.quadraticCurveTo(0.38, 1.16, 0.3, 1.08);
      // Jaw & under-chin
      shape.lineTo(0.1, 1.12);
      shape.quadraticCurveTo(0.22, 0.86, 0.24, 0.42);
      shape.closePath();

      const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.22,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.05,
        bevelSegments: 5,
      });
      extrudeGeo.translate(0, 0, -0.11);
      extrudeGeo.computeVertexNormals();

      const headMesh = new THREE.Mesh(extrudeGeo, mats.pieceWoodMat);
      headMesh.castShadow = true;
      headMesh.receiveShadow = true;
      group.add(headMesh);

      // Carved mane ridge along the back of the neck
      const maneShape = new THREE.Shape();
      maneShape.moveTo(-0.2, 0.45);
      maneShape.quadraticCurveTo(-0.32, 0.92, -0.18, 1.48);
      maneShape.lineTo(-0.08, 1.44);
      maneShape.quadraticCurveTo(-0.2, 0.9, -0.12, 0.45);
      maneShape.closePath();

      const maneGeo = new THREE.ExtrudeGeometry(maneShape, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.025,
        bevelSegments: 3,
      });
      maneGeo.translate(0, 0, -0.05);
      const maneMesh = new THREE.Mesh(maneGeo, mats.pieceAccentWoodMat);
      maneMesh.castShadow = true;
      group.add(maneMesh);

      // Twin sculpted ears on top
      const earGeo = new THREE.ConeGeometry(0.055, 0.18, 12);
      const leftEar = new THREE.Mesh(earGeo, mats.pieceAccentWoodMat);
      leftEar.position.set(0.0, 1.64, 0.08);
      leftEar.rotation.z = -0.15;
      const rightEar = new THREE.Mesh(earGeo, mats.pieceAccentWoodMat);
      rightEar.position.set(0.0, 1.64, -0.08);
      rightEar.rotation.z = -0.15;
      group.add(leftEar, rightEar);
      break;
    }

    case PieceType.ROOK: {
      // Turned base + tapered castle tower trunk + parapet rim
      addLathePart([
        [0.0, 0.04],
        [0.4, 0.04],
        [0.41, 0.14],
        [0.34, 0.23],
        [0.35, 0.3],
        [0.27, 0.42],
        [0.24, 1.05],
        [0.31, 1.14],
        [0.32, 1.26],
        [0.2, 1.26],
        [0.2, 1.18],
        [0.0, 1.18],
      ]);
      addCollarRing(1.12, 0.28, 0.035);

      // 4 carved battlements (merlons) around the top crown
      const merlonGeo = new THREE.BoxGeometry(0.16, 0.18, 0.14);
      const angles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
      for (const ang of angles) {
        const merlon = new THREE.Mesh(merlonGeo, mats.pieceAccentWoodMat);
        merlon.position.set(Math.cos(ang) * 0.23, 1.33, Math.sin(ang) * 0.23);
        merlon.rotation.y = -ang;
        merlon.castShadow = true;
        merlon.receiveShadow = true;
        group.add(merlon);
      }
      break;
    }
  }

  // Propagate userData to all child meshes for raycasting
  group.traverse((child) => {
    child.userData = { pieceType: type, parentPieceGroup: group };
  });

  return group;
}

export interface HourglassRig {
  group: THREE.Group;
  innerFlipGroup: THREE.Group;
  topSandMesh: THREE.Mesh;
  bottomSandMesh: THREE.Mesh;
  streamMesh: THREE.Mesh;
}

/**
 * Builds the 3D Hourglass with black caps, transmissive glass bulbs, and animated sand cones.
 */
export function createHourglassGroup(
  shadowPlaneMat: THREE.MeshBasicMaterial
): HourglassRig {
  const group = new THREE.Group();
  group.name = 'HOURGLASS';

  // Contact shadow on the wooden table
  const shadowGeo = new THREE.PlaneGeometry(2.1, 2.1);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowPlaneMat);
  shadowMesh.position.y = 0.01;
  group.add(shadowMesh);

  const innerFlipGroup = new THREE.Group();
  // Center of hourglass is at y = 1.65 so it can rotate 180 deg smoothly when flipped
  innerFlipGroup.position.y = 1.65;
  group.add(innerFlipGroup);

  const blackCapMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.35,
    metalness: 0.2,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.0,
    transmission: 0.92,
    ior: 1.5,
    thickness: 0.35,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });

  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xf6f3ec,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Top and Bottom black caps
  const capGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.16, 32);
  const bottomCap = new THREE.Mesh(capGeo, blackCapMat);
  bottomCap.position.y = -1.57;
  bottomCap.castShadow = true;
  bottomCap.receiveShadow = true;

  const topCap = new THREE.Mesh(capGeo, blackCapMat);
  topCap.position.y = 1.57;
  topCap.castShadow = true;
  topCap.receiveShadow = true;

  innerFlipGroup.add(bottomCap, topCap);

  // Outer clear acrylic cylinder tube + inner hourglass glass bulb (LatheGeometry)
  const bulbPts: [number, number][] = [
    [0.0, -1.48],
    [0.54, -1.48],
    [0.54, -0.95],
    [0.44, -0.45],
    [0.07, -0.04],
    [0.07, 0.04],
    [0.44, 0.45],
    [0.54, 0.95],
    [0.54, 1.48],
    [0.0, 1.48],
  ];
  const bulbGeo = new THREE.LatheGeometry(
    bulbPts.map(([r, y]) => new THREE.Vector2(r, y)),
    36
  );
  const bulbMesh = new THREE.Mesh(bulbGeo, glassMat);
  bulbMesh.renderOrder = 3;
  innerFlipGroup.add(bulbMesh);

  // Top sand cone
  const topSandGeo = new THREE.CylinderGeometry(0.46, 0.06, 1.1, 28);
  topSandGeo.translate(0, 0.55, 0);
  const topSandMesh = new THREE.Mesh(topSandGeo, sandMat);
  topSandMesh.position.y = 0.05;
  innerFlipGroup.add(topSandMesh);

  // Bottom sand cone
  const bottomSandGeo = new THREE.ConeGeometry(0.49, 1.15, 28);
  bottomSandGeo.translate(0, 0.575, 0);
  const bottomSandMesh = new THREE.Mesh(bottomSandGeo, sandMat);
  bottomSandMesh.position.y = -1.48;
  innerFlipGroup.add(bottomSandMesh);

  // Falling sand stream
  const streamGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.45, 12);
  const streamMesh = new THREE.Mesh(streamGeo, sandMat);
  streamMesh.position.y = -0.72;
  innerFlipGroup.add(streamMesh);

  return {
    group,
    innerFlipGroup,
    topSandMesh,
    bottomSandMesh,
    streamMesh,
  };
}
