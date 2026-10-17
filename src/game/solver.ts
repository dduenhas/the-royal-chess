import {
  applyPieceMove,
  boardsEqual,
  describeTransformAction,
  getValidMoves,
  PIECE_LABELS_PT,
  SQUARE_SHORT_COORDS,
  transformCardBoard,
} from './rules';
import {
  BoardState,
  CardTransformAction,
  GameLevel,
  OptimalSolution,
  SolutionStep,
} from './types';

function encodeBoard(board: BoardState): string {
  let s = '';
  for (let i = 0; i < 9; i++) {
    const p = board[i];
    s += p ? (p === 'KNIGHT' ? 'N' : p[0]) : '.';
  }
  return s;
}

interface TargetVariant {
  board: BoardState;
  key: string;
  cost: number;
  transforms: CardTransformAction[];
}

/**
 * Generates all reachable target orientations of an Objective Card for a given Level:
 * - Level 1: Only the base card (cost 0)
 * - Level 2: Base card + 90° CW (cost 1), 90° CCW (cost 1), 180° (cost 2)
 * - Level 3: Level 2 + Mirror H (cost 1), Mirror V (cost 1), and combinations of Mirror + Rotate (cost 2)
 */
export function getCardTargetVariants(
  baseCardBoard: BoardState,
  level: GameLevel
): TargetVariant[] {
  const variants = new Map<string, TargetVariant>();

  const queue: { board: BoardState; transforms: CardTransformAction[] }[] = [
    { board: baseCardBoard, transforms: [] },
  ];
  variants.set(encodeBoard(baseCardBoard), {
    board: baseCardBoard,
    key: encodeBoard(baseCardBoard),
    cost: 0,
    transforms: [],
  });

  if (level === 1) {
    return Array.from(variants.values());
  }

  const allowedActions: CardTransformAction[] =
    level === 2
      ? ['ROTATE_CW', 'ROTATE_CCW']
      : ['ROTATE_CW', 'ROTATE_CCW', 'MIRROR_H', 'MIRROR_V'];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.transforms.length >= 2) continue;

    for (const action of allowedActions) {
      const nextBoard = transformCardBoard(curr.board, action);
      const key = encodeBoard(nextBoard);
      const nextTransforms = [...curr.transforms, action];
      const existing = variants.get(key);
      if (!existing || nextTransforms.length < existing.cost) {
        variants.set(key, {
          board: nextBoard,
          key,
          cost: nextTransforms.length,
          transforms: nextTransforms,
        });
        queue.push({ board: nextBoard, transforms: nextTransforms });
      }
    }
  }

  return Array.from(variants.values());
}

interface SingleCardResult {
  minMoves: number;
  endBoard: BoardState;
  steps: SolutionStep[];
}

/**
 * Solves the exact shortest path from `startBoard` to `targetCardBoard` under `level` rules.
 */
function solveSingleCard(
  startBoard: BoardState,
  targetCardBoard: BoardState,
  level: GameLevel,
  cardIndex: 0 | 1 = 0
): SingleCardResult {
  const variants = getCardTargetVariants(targetCardBoard, level);
  const variantByKey = new Map<string, TargetVariant>();
  for (const v of variants) {
    variantByKey.set(v.key, v);
  }

  const startKey = encodeBoard(startBoard);

  // Run BFS over board piece moves
  const parentMap = new Map<
    string,
    { prevKey: string; from: number; to: number; piece: BoardState[number] }
  >();
  const boardByKey = new Map<string, BoardState>();
  const distMap = new Map<string, number>();

  boardByKey.set(startKey, startBoard);
  distMap.set(startKey, 0);

  const queue: string[] = [startKey];
  let head = 0;

  let bestTotalCost = Infinity;
  let bestTargetKey: string | null = null;
  let bestVariant: TargetVariant | null = null;

  // Check if startBoard already matches a variant
  if (variantByKey.has(startKey)) {
    const v = variantByKey.get(startKey)!;
    bestTotalCost = v.cost;
    bestTargetKey = startKey;
    bestVariant = v;
  }

  while (head < queue.length) {
    const currKey = queue[head++];
    const currDist = distMap.get(currKey)!;

    // Pruning: if currDist already >= bestTotalCost, no need to expand deeper
    if (currDist >= bestTotalCost) continue;

    const currBoard = boardByKey.get(currKey)!;

    for (let from = 0; from < 9; from++) {
      const piece = currBoard[from];
      if (!piece) continue;
      const moves = getValidMoves(currBoard, from);
      for (const to of moves) {
        const nextBoard = applyPieceMove(currBoard, from, to);
        const nextKey = encodeBoard(nextBoard);
        if (!distMap.has(nextKey)) {
          const nextDist = currDist + 1;
          distMap.set(nextKey, nextDist);
          boardByKey.set(nextKey, nextBoard);
          parentMap.set(nextKey, { prevKey: currKey, from, to, piece });

          if (variantByKey.has(nextKey)) {
            const v = variantByKey.get(nextKey)!;
            const totalCost = nextDist + v.cost;
            if (totalCost < bestTotalCost) {
              bestTotalCost = totalCost;
              bestTargetKey = nextKey;
              bestVariant = v;
            }
          }

          if (nextDist < bestTotalCost) {
            queue.push(nextKey);
          }
        }
      }
    }
  }

  if (!bestTargetKey || !bestVariant) {
    return {
      minMoves: 0,
      endBoard: startBoard,
      steps: [],
    };
  }

  // Reconstruct steps: first card transformations (if any), then piece moves
  const steps: SolutionStep[] = [];
  for (const tAction of bestVariant.transforms) {
    steps.push({
      kind: 'CARD_TRANSFORM',
      cardIndex,
      transform: tAction,
      description: `${describeTransformAction(tAction)}`,
    });
  }

  const moveSteps: SolutionStep[] = [];
  let traceKey = bestTargetKey;
  while (traceKey !== startKey) {
    const info = parentMap.get(traceKey)!;
    const pName = PIECE_LABELS_PT[info.piece!];
    moveSteps.push({
      kind: 'PIECE_MOVE',
      piece: info.piece!,
      from: info.from,
      to: info.to,
      description: `${pName} de ${SQUARE_SHORT_COORDS[info.from]} para ${SQUARE_SHORT_COORDS[info.to]}`,
    });
    traceKey = info.prevKey;
  }
  moveSteps.reverse();

  return {
    minMoves: bestTotalCost,
    endBoard: boardByKey.get(bestTargetKey)!,
    steps: [...steps, ...moveSteps],
  };
}

/**
 * Computes the optimal solution for 1 card (Standard) or 2 cards (Bonus Challenge).
 * Note: In the Bonus Challenge rule (PDF Page 7):
 * "When using a rotate or mirroring action choose one of the two objective cards to mirror or rotate."
 */
export function solveRoundOptimal(
  startBoard: BoardState,
  cardBoards: BoardState[],
  level: GameLevel
): OptimalSolution {
  if (cardBoards.length === 1) {
    const res = solveSingleCard(startBoard, cardBoards[0], level, 0);
    return {
      minMoves: res.minMoves,
      steps: res.steps,
      cardOrder: [0],
    };
  }

  // Bonus challenge: 2 cards (Card 0 and Card 1)
  // Player can solve in order (0 -> 1) or (1 -> 0), and in Level 2/3 can apply rotate/mirror to AT MOST one of the two cards (or either).
  const candidates: OptimalSolution[] = [];

  // Order 0 -> 1:
  // Case A: transform allowed on Card 0, Card 1 uses Level 1
  {
    const first = solveSingleCard(startBoard, cardBoards[0], level, 0);
    const second = solveSingleCard(first.endBoard, cardBoards[1], 1, 1);
    candidates.push({
      minMoves: first.minMoves + second.minMoves,
      steps: [...first.steps, ...second.steps],
      cardOrder: [0, 1],
    });
  }
  // Case B: Card 0 uses Level 1, transform allowed on Card 1
  if (level > 1) {
    const first = solveSingleCard(startBoard, cardBoards[0], 1, 0);
    const second = solveSingleCard(first.endBoard, cardBoards[1], level, 1);
    candidates.push({
      minMoves: first.minMoves + second.minMoves,
      steps: [...first.steps, ...second.steps],
      cardOrder: [0, 1],
    });
  }

  // Order 1 -> 0:
  // Case C: transform allowed on Card 1, Card 0 uses Level 1
  {
    const first = solveSingleCard(startBoard, cardBoards[1], level, 1);
    const second = solveSingleCard(first.endBoard, cardBoards[0], 1, 0);
    candidates.push({
      minMoves: first.minMoves + second.minMoves,
      steps: [...first.steps, ...second.steps],
      cardOrder: [1, 0],
    });
  }
  // Case D: Card 1 uses Level 1, transform allowed on Card 0
  if (level > 1) {
    const first = solveSingleCard(startBoard, cardBoards[1], 1, 1);
    const second = solveSingleCard(first.endBoard, cardBoards[0], level, 0);
    candidates.push({
      minMoves: first.minMoves + second.minMoves,
      steps: [...first.steps, ...second.steps],
      cardOrder: [1, 0],
    });
  }

  candidates.sort((a, b) => a.minMoves - b.minMoves);
  return candidates[0];
}

export function checkBoardMatchesCard(board: BoardState, cardBoard: BoardState): boolean {
  return boardsEqual(board, cardBoard);
}
