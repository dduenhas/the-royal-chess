import { BoardState, CardTransformAction, PieceType } from './types';

export const PIECE_LABELS_PT: Record<PieceType, string> = {
  [PieceType.KING]: 'Rei',
  [PieceType.QUEEN]: 'Dama',
  [PieceType.ROOK]: 'Torre',
  [PieceType.BISHOP]: 'Bispo',
  [PieceType.KNIGHT]: 'Cavalo',
};

export const SQUARE_NAMES_PT: string[] = [
  'Superior Esquerda (A3)',
  'Superior Centro (B3)',
  'Superior Direita (C3)',
  'Meio Esquerda (A2)',
  'Centro (B2)',
  'Meio Direita (C2)',
  'Inferior Esquerda (A1)',
  'Inferior Centro (B1)',
  'Inferior Direita (C1)',
];

export const SQUARE_SHORT_COORDS: string[] = [
  'A3', 'B3', 'C3',
  'A2', 'B2', 'C2',
  'A1', 'B1', 'C1',
];

/**
 * On the 3x3 board of The Royal Study:
 * Dark squares are the 4 corners (0, 2, 6, 8) and the center (4).
 * Light squares are the 4 orthogonal edge squares (1, 3, 5, 7).
 */
export function isDarkSquare(index: number): boolean {
  return index % 2 === 0;
}

export function indexToRowCol(index: number): [number, number] {
  return [Math.floor(index / 3), index % 3];
}

export function rowColToIndex(row: number, col: number): number {
  return row * 3 + col;
}

/**
 * Returns all valid destination square indices (0..8) for the piece at `fromIndex`
 * strictly respecting The Royal Study rules:
 * - Pieces can ONLY move to an empty square (no capturing).
 * - Pieces cannot jump over other pieces, EXCEPT the Knight.
 * - King: 1 step horizontally, vertically, or diagonally.
 * - Queen: any number of empty squares horizontally, vertically, or diagonally.
 * - Rook: any number of empty squares horizontally or vertically.
 * - Bishop: any number of empty squares diagonally; MUST remain on dark squares (0,2,4,6,8).
 * - Knight: L-shape (2 squares + 1 square sideways), jumps over pieces, NEVER on middle square (4).
 */
export function getValidMoves(board: BoardState, fromIndex: number): number[] {
  const piece = board[fromIndex];
  if (!piece) return [];

  const [r, c] = indexToRowCol(fromIndex);
  const valid: number[] = [];

  const traceRays = (directions: [number, number][], maxSteps: number) => {
    for (const [dr, dc] of directions) {
      for (let step = 1; step <= maxSteps; step++) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr < 0 || nr > 2 || nc < 0 || nc > 2) break;
        const targetIdx = rowColToIndex(nr, nc);
        // Blocked by any piece (no capture and no jumping over)
        if (board[targetIdx] !== null) break;
        valid.push(targetIdx);
      }
    }
  };

  switch (piece) {
    case PieceType.KING:
      traceRays(
        [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1],
        ],
        1
      );
      break;

    case PieceType.QUEEN:
      traceRays(
        [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1],
        ],
        2
      );
      break;

    case PieceType.ROOK:
      traceRays(
        [
          [-1, 0], [1, 0], [0, -1], [0, 1],
        ],
        2
      );
      break;

    case PieceType.BISHOP:
      traceRays(
        [
          [-1, -1], [-1, 1], [1, -1], [1, 1],
        ],
        2
      );
      // Enforce rule: The bishop must remain on dark-colored squares
      return valid.filter((idx) => isDarkSquare(idx));

    case PieceType.KNIGHT: {
      const jumps: [number, number][] = [
        [-2, -1], [-2, 1],
        [-1, -2], [-1, 2],
        [1, -2],  [1, 2],
        [2, -1],  [2, 1],
      ];
      for (const [dr, dc] of jumps) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr > 2 || nc < 0 || nc > 2) continue;
        const targetIdx = rowColToIndex(nr, nc);
        // Enforce rule: Knight cannot be placed on the middle square (4) and must land on empty square
        if (targetIdx === 4) continue;
        if (board[targetIdx] === null) {
          valid.push(targetIdx);
        }
      }
      break;
    }
  }

  return valid;
}

export function applyPieceMove(board: BoardState, fromIndex: number, toIndex: number): BoardState {
  const next = [...board];
  next[toIndex] = next[fromIndex];
  next[fromIndex] = null;
  return next;
}

/**
 * Level 2 & Level 3 Objective Card Transformations
 * - ROTATE_CW: 90° clockwise rotation (costs 1 move)
 * - ROTATE_CCW: 90° counter-clockwise rotation (costs 1 move)
 * - MIRROR_H: Horizontal flip left-to-right (costs 1 move, Level 3)
 * - MIRROR_V: Vertical flip top-to-bottom (costs 1 move, Level 3)
 */
const CW_MAP = [6, 3, 0, 7, 4, 1, 8, 5, 2]; // new[i] = old[CW_MAP[i]]
const CCW_MAP = [2, 5, 8, 1, 4, 7, 0, 3, 6];
const MIRROR_H_MAP = [2, 1, 0, 5, 4, 3, 8, 7, 6];
const MIRROR_V_MAP = [6, 7, 8, 3, 4, 5, 0, 1, 2];

export function transformCardBoard(board: BoardState, action: CardTransformAction): BoardState {
  const map =
    action === 'ROTATE_CW'
      ? CW_MAP
      : action === 'ROTATE_CCW'
      ? CCW_MAP
      : action === 'MIRROR_H'
      ? MIRROR_H_MAP
      : MIRROR_V_MAP;
  return map.map((srcIdx) => board[srcIdx]);
}

export function boardsEqual(a: BoardState, b: BoardState): boolean {
  for (let i = 0; i < 9; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function describeTransformAction(action: CardTransformAction): string {
  switch (action) {
    case 'ROTATE_CW':
      return 'Girar carta 90° no sentido horário';
    case 'ROTATE_CCW':
      return 'Girar carta 90° no sentido anti-horário';
    case 'MIRROR_H':
      return 'Espelhar carta horizontalmente';
    case 'MIRROR_V':
      return 'Espelhar carta verticalmente';
  }
}
