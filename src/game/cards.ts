import { BoardState, ObjectiveCardData, PieceType } from './types';

const K = PieceType.KING;
const Q = PieceType.QUEEN;
const R = PieceType.ROOK;
const B = PieceType.BISHOP;
const N = PieceType.KNIGHT;
const _ = null;

/**
 * Official 60 Objective Cards for "The Royal Study"
 * - Card #1 & #2 reproduce the exact official Rulebook Example (Page 2/6)
 * - Cards #3–#7 reproduce the exact cards shown in the 4 product photos and Level 2/3 diagrams (Page 3/7)
 * - Cards #8–#60 are deterministically generated & verified valid configurations where:
 *   1. All 5 pieces (K, Q, R, B, N) are present on distinct squares of the 3x3 board.
 *   2. The Bishop (B) is ALWAYS on one of the 5 dark squares (indices 0, 2, 4, 6, 8).
 *   3. The Knight (N) is NEVER on the middle square (index 4).
 */
const PRESET_BOARDS: BoardState[] = [
  // Card 1: Official Rulebook Starting Position (Page 1, 2, 5, 6)
  [_, Q, B, K, _, N, R, _, _],
  // Card 2: Official Rulebook Target Objective Card (Page 2, 6 - solved in 4 moves from Card 1!)
  [N, _, B, Q, _, _, _, K, R],
  // Card 3: Photo 1 Starting Board on the Box
  [B, N, _, _, R, Q, K, _, _],
  // Card 4: Photo 1 Active Objective Card beside the Box
  [B, _, _, _, K, N, R, Q, _],
  // Card 5: Photo 2 & 4 Top of Deck Card
  [B, _, _, _, R, _, K, N, Q],
  // Card 6: Photo 2 & 4 Foreground Objective Card
  [K, _, B, _, Q, _, R, N, _],
  // Card 7: Official Rulebook Level 2 & Level 3 Example Card (Page 3, 7)
  [Q, R, N, _, K, _, _, _, B],
  // Card 8: Official Rulebook Setup Illustration Small Card (Page 1, 5 bottom)
  [_, Q, B, K, _, N, R, _, _],
];

function buildAll60Cards(): ObjectiveCardData[] {
  const cards: ObjectiveCardData[] = [];
  const seen = new Set<string>();

  const addBoard = (board: BoardState) => {
    const key = board.map((p) => (p ? p[0] : '.')).join('');
    if (seen.has(key)) return false;
    // Validate Bishop on dark square (0,2,4,6,8) and Knight not on center (4)
    const bIdx = board.indexOf(B);
    const nIdx = board.indexOf(N);
    if (bIdx === -1 || bIdx % 2 !== 0) return false;
    if (nIdx === -1 || nIdx === 4) return false;
    seen.add(key);
    cards.push({
      id: cards.length + 1,
      code: `RS-${String(cards.length + 1).padStart(2, '0')}`,
      board: [...board],
    });
    return true;
  };

  for (const preset of PRESET_BOARDS) {
    addBoard(preset);
  }

  // Deterministic generator for the remaining cards up to 60
  const darkSquares = [0, 2, 4, 6, 8];
  const knightSquares = [0, 1, 2, 3, 5, 6, 7, 8];
  let seed = 421983;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  while (cards.length < 60) {
    const bPos = darkSquares[Math.floor(nextRand() * darkSquares.length)];
    const validN = knightSquares.filter((sq) => sq !== bPos);
    const nPos = validN[Math.floor(nextRand() * validN.length)];

    const remaining = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(
      (sq) => sq !== bPos && sq !== nPos
    );

    // Shuffle remaining squares
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(nextRand() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }

    const board: BoardState = [null, null, null, null, null, null, null, null, null];
    board[bPos] = B;
    board[nPos] = N;
    board[remaining[0]] = K;
    board[remaining[1]] = Q;
    board[remaining[2]] = R;

    addBoard(board);
  }

  return cards;
}

export const OBJECTIVE_DECK: ObjectiveCardData[] = buildAll60Cards();
