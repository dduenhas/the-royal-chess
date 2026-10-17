import * as THREE from 'three';
import { BoardState, PieceType } from '../game/types';

/**
 * Draws a stylized chess piece silhouette on a 2D canvas context centered at (0,0).
 */
export function drawPieceSilhouette(
  ctx: CanvasRenderingContext2D,
  piece: PieceType,
  size: number,
  fillColor: string,
  accentColor?: string
) {
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = fillColor;
  const s = size * 0.42;

  // Base pedestal common to all icons
  ctx.beginPath();
  ctx.roundRect(-s * 0.85, s * 0.65, s * 1.7, s * 0.24, s * 0.08);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(-s * 0.68, s * 0.44, s * 1.36, s * 0.16, s * 0.06);
  ctx.fill();

  switch (piece) {
    case PieceType.KING: {
      // Body trapezoid + flared crown
      ctx.beginPath();
      ctx.moveTo(-s * 0.52, s * 0.44);
      ctx.lineTo(-s * 0.35, -s * 0.25);
      ctx.lineTo(-s * 0.6, -s * 0.5);
      ctx.lineTo(s * 0.6, -s * 0.5);
      ctx.lineTo(s * 0.35, -s * 0.25);
      ctx.lineTo(s * 0.52, s * 0.44);
      ctx.closePath();
      ctx.fill();

      // Collar
      ctx.beginPath();
      ctx.roundRect(-s * 0.56, -s * 0.3, s * 1.12, s * 0.14, s * 0.05);
      ctx.fill();

      // Cross on top
      ctx.beginPath();
      ctx.roundRect(-s * 0.12, -s * 1.02, s * 0.24, s * 0.55, s * 0.04);
      ctx.roundRect(-s * 0.32, -s * 0.86, s * 0.64, s * 0.2, s * 0.04);
      ctx.fill();
      break;
    }

    case PieceType.QUEEN: {
      // Body + multi-spiked crown matching the cards in the photos
      ctx.beginPath();
      ctx.moveTo(-s * 0.52, s * 0.44);
      ctx.lineTo(-s * 0.32, -s * 0.15);
      ctx.lineTo(s * 0.32, -s * 0.15);
      ctx.lineTo(s * 0.52, s * 0.44);
      ctx.closePath();
      ctx.fill();

      // Crown spikes
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.12);
      ctx.lineTo(-s * 0.72, -s * 0.75);
      ctx.lineTo(-s * 0.26, -s * 0.35);
      ctx.lineTo(0, -s * 0.85);
      ctx.lineTo(s * 0.26, -s * 0.35);
      ctx.lineTo(s * 0.72, -s * 0.75);
      ctx.lineTo(s * 0.5, -s * 0.12);
      ctx.closePath();
      ctx.fill();

      // Crown pearls
      const pearlPositions = [
        [-s * 0.72, -s * 0.82],
        [-s * 0.36, -s * 0.86],
        [0, -s * 0.92],
        [s * 0.36, -s * 0.86],
        [s * 0.72, -s * 0.82],
      ];
      for (const [px, py] of pearlPositions) {
        ctx.beginPath();
        ctx.arc(px, py, s * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case PieceType.ROOK: {
      // Tower trunk
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, s * 0.44);
      ctx.lineTo(-s * 0.42, -s * 0.38);
      ctx.lineTo(s * 0.42, -s * 0.38);
      ctx.lineTo(s * 0.5, s * 0.44);
      ctx.closePath();
      ctx.fill();

      // Battlement crown with 3 merlons
      ctx.beginPath();
      ctx.moveTo(-s * 0.62, -s * 0.35);
      ctx.lineTo(-s * 0.62, -s * 0.82);
      ctx.lineTo(-s * 0.34, -s * 0.82);
      ctx.lineTo(-s * 0.34, -s * 0.58);
      ctx.lineTo(-s * 0.14, -s * 0.58);
      ctx.lineTo(-s * 0.14, -s * 0.82);
      ctx.lineTo(s * 0.14, -s * 0.82);
      ctx.lineTo(s * 0.14, -s * 0.58);
      ctx.lineTo(s * 0.34, -s * 0.58);
      ctx.lineTo(s * 0.34, -s * 0.82);
      ctx.lineTo(s * 0.62, -s * 0.82);
      ctx.lineTo(s * 0.62, -s * 0.35);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case PieceType.BISHOP: {
      // Mitre dome
      ctx.beginPath();
      ctx.moveTo(-s * 0.48, s * 0.44);
      ctx.quadraticCurveTo(-s * 0.68, -s * 0.25, 0, -s * 0.82);
      ctx.quadraticCurveTo(s * 0.68, -s * 0.25, s * 0.48, s * 0.44);
      ctx.closePath();
      ctx.fill();

      // Top orb
      ctx.beginPath();
      ctx.arc(0, -s * 0.92, s * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Mitre slit/cutout
      if (accentColor) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = s * 0.14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s * 0.12, -s * 0.45);
        ctx.lineTo(s * 0.42, -s * 0.18);
        ctx.stroke();
      }
      break;
    }

    case PieceType.KNIGHT: {
      // Horse head silhouette
      ctx.beginPath();
      ctx.moveTo(-s * 0.54, s * 0.44);
      ctx.quadraticCurveTo(-s * 0.58, -s * 0.2, -s * 0.25, -s * 0.78);
      // Ears
      ctx.lineTo(-s * 0.15, -s * 0.98);
      ctx.lineTo(s * 0.04, -s * 0.78);
      // Snout
      ctx.lineTo(s * 0.64, -s * 0.38);
      ctx.lineTo(s * 0.52, -s * 0.15);
      ctx.lineTo(s * 0.12, -s * 0.22);
      // Throat & chest
      ctx.quadraticCurveTo(s * 0.44, s * 0.05, s * 0.48, s * 0.44);
      ctx.closePath();
      ctx.fill();

      // Inner mane highlight line
      if (accentColor) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = s * 0.09;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-s * 0.32, s * 0.28);
        ctx.quadraticCurveTo(-s * 0.36, -s * 0.2, -s * 0.14, -s * 0.62);
        ctx.stroke();
      }
      break;
    }
  }

  ctx.restore();
}

export function createTabletopTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Rich warm walnut tabletop matching Image 1
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, '#443022');
  grad.addColorStop(0.5, '#38261a');
  grad.addColorStop(1, '#2d1e14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle horizontal wood grain fibers
  for (let i = 0; i < 900; i++) {
    const y = (i / 900) * 1024;
    const alpha = 0.03 + (Math.sin(i * 0.37) * 0.5 + 0.5) * 0.05;
    ctx.strokeStyle = i % 2 === 0 ? `rgba(22, 12, 6, ${alpha})` : `rgba(98, 70, 48, ${alpha * 0.7})`;
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 64) {
      const wave = Math.sin(x * 0.008 + i * 0.15) * 6;
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createLightWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ead5b8';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 360; i++) {
    const y = (i / 360) * 512;
    ctx.strokeStyle =
      i % 3 === 0 ? 'rgba(180, 138, 92, 0.18)' : 'rgba(250, 236, 214, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + i * 0.2) * 3);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Rich warm honey-oak / carved boxwood texture specifically for the 5 wooden chess pieces
 * so they look distinctly woody and warm.
 */
export function createPieceWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, 512, 512);
  baseGrad.addColorStop(0, '#d89b56');
  baseGrad.addColorStop(0.5, '#cc8b44');
  baseGrad.addColorStop(1, '#bd7b35');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  //Pronounced warm wood grain lines & cathedral arches
  for (let i = 0; i < 420; i++) {
    const y = (i / 420) * 512;
    const isDarkVein = i % 4 === 0;
    ctx.strokeStyle = isDarkVein
      ? 'rgba(115, 62, 18, 0.34)'
      : i % 2 === 0
      ? 'rgba(148, 86, 32, 0.22)'
      : 'rgba(238, 188, 128, 0.20)';
    ctx.lineWidth = isDarkVein ? 2.2 : 1.3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 24) {
      const wave =
        Math.sin(x * 0.018 + i * 0.12) * 5 +
        Math.cos(x * 0.04 - i * 0.05) * 2;
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createDarkWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3f1811';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 380; i++) {
    const y = (i / 380) * 512;
    ctx.strokeStyle =
      i % 2 === 0 ? 'rgba(22, 6, 3, 0.35)' : 'rgba(102, 42, 28, 0.22)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) {
      ctx.lineTo(x, y + Math.sin(x * 0.025 + i * 0.3) * 2.5);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Creates the top dark-teal box surface texture with the Philos badge,
 * "The Royal Study" calligraphy, and the 5 white chess piece icons above the recessed board.
 */
export function createBoxTopInsertTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d')!;

  // Deep teal background matching Image 1
  ctx.fillStyle = '#0d3b42';
  ctx.fillRect(0, 0, 1024, 1280);

  // Outer crisp white rounded frame
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(38, 38, 1024 - 76, 1280 - 76, 36);
  ctx.stroke();

  // Philos blue/yellow top tab badge centered on the top border
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.roundRect(392, 16, 240, 62, 16);
  ctx.fill();

  // Yellow Philos tree/square icon + text
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(432, 40, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(436, 38, 22, 24);
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Philos', 466, 49);

  // Script Title "The Royal Study"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 600 86px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('The Royal Study', 512, 150);

  // 5 White Chess Piece silhouettes in the exact row order from Image 1:
  // Queen, King, Bishop, Knight, Rook
  const headerPieces: PieceType[] = [
    PieceType.QUEEN,
    PieceType.KING,
    PieceType.BISHOP,
    PieceType.KNIGHT,
    PieceType.ROOK,
  ];
  const startX = 250;
  const spacing = 131;
  headerPieces.forEach((p, idx) => {
    ctx.save();
    ctx.translate(startX + idx * spacing, 255);
    drawPieceSilhouette(ctx, p, 96, '#ffffff', '#0d3b42');
    ctx.restore();
  });

  // Author credit at bottom-left of box lid ("Autor: Stan van Rooijen")
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Autor: Stan van Rooijen', 52, 1258);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Renders an Objective Card texture matching the square brown & cream cards in the photos.
 */
export function createObjectiveCardTexture(
  board: BoardState,
  cardCode: string,
  maxAnisotropy: number,
  isCompleted = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Outer warm brown rounded card border
  ctx.fillStyle = isCompleted ? '#1f4d36' : '#855341';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle inner cream margin & dark brown grid border
  ctx.fillStyle = '#ebd4be';
  ctx.beginPath();
  ctx.roundRect(18, 18, 476, 476, 18);
  ctx.fill();

  ctx.fillStyle = '#381b12';
  ctx.fillRect(32, 32, 448, 448);

  // Small orientation reference triangle on the top edge (as shown in PDF Level 2/3 diagrams)
  ctx.fillStyle = '#381b12';
  ctx.beginPath();
  ctx.moveTo(256, 4);
  ctx.lineTo(244, 17);
  ctx.lineTo(268, 17);
  ctx.closePath();
  ctx.fill();

  const gridStart = 38;
  const gridSize = 436;
  const cellSize = gridSize / 3;

  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 3);
    const c = i % 3;
    const x = gridStart + c * cellSize;
    const y = gridStart + r * cellSize;
    const dark = i % 2 === 0;

    ctx.fillStyle = dark ? '#7d4b39' : '#ecd4be';
    ctx.fillRect(x, y, cellSize, cellSize);

    // Cell border line
    ctx.strokeStyle = '#381b12';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, cellSize, cellSize);

    const piece = board[i];
    if (piece) {
      ctx.save();
      ctx.translate(x + cellSize / 2, y + cellSize / 2);
      // On the physical cards, the piece silhouettes are tilted diagonally (-45 deg)
      ctx.rotate(-Math.PI / 4);
      drawPieceSilhouette(
        ctx,
        piece,
        cellSize * 0.88,
        '#140d0a',
        dark ? '#7d4b39' : '#ecd4be'
      );
      ctx.restore();
    }
  }

  // Subtle card code in bottom-right margin
  ctx.fillStyle = 'rgba(56, 27, 18, 0.65)';
  ctx.font = 'bold 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(cardCode, 472, 505);

  if (isCompleted) {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
    ctx.fillRect(32, 32, 448, 448);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}
