export enum PieceType {
  KING = 'KING',
  QUEEN = 'QUEEN',
  ROOK = 'ROOK',
  BISHOP = 'BISHOP',
  KNIGHT = 'KNIGHT',
}

export type SquareIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// BoardState is a 9-element array representing the 3x3 grid (row-major 0..8)
export type BoardState = (PieceType | null)[];

export interface ObjectiveCardData {
  id: number;
  code: string;
  board: BoardState; // Base un-transformed 3x3 layout
}

export type CardTransformAction = 'ROTATE_CW' | 'ROTATE_CCW' | 'MIRROR_H' | 'MIRROR_V';

export interface ActiveObjectiveCard {
  card: ObjectiveCardData;
  currentBoard: BoardState;
  rotationDeg: number; // 0, 90, 180, 270
  flippedH: boolean;
  flippedV: boolean;
  transformHistory: CardTransformAction[];
  completed: boolean;
}

export type GameLevel = 1 | 2 | 3;

export type GameMode = 'SOLO' | 'VS_BOT' | 'PASS_PLAY';

export type RoundPhase =
  | 'ESTIMATE'         // Players inspect board & card(s) and declare minimum moves
  | 'CHALLENGE_WINDOW' // Hourglass runs; opponent can challenge with fewer moves or accept
  | 'EXECUTE'          // Active player moves pieces (and transforms card in Lv 2/3)
  | 'ROUND_END'        // Point awarded; shows optimal solution comparison
  | 'MATCH_OVER';      // A player reached 6 points

export interface SolutionStep {
  kind: 'PIECE_MOVE' | 'CARD_TRANSFORM';
  piece?: PieceType;
  from?: number;
  to?: number;
  cardIndex?: 0 | 1;
  transform?: CardTransformAction;
  description: string;
}

export interface OptimalSolution {
  minMoves: number;
  steps: SolutionStep[];
  cardOrder?: [0] | [0, 1] | [1, 0];
}
