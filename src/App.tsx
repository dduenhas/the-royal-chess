import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  RotateCcw,
  Undo2,
  Lightbulb,
  Play,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Hourglass,
  Trophy,
  BookOpen,
  Camera,
  ArrowRight,
  RefreshCw,
  Music,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import {
  ActiveObjectiveCard,
  BoardState,
  CardTransformAction,
  GameLevel,
  GameMode,
  ObjectiveCardData,
  PieceType,
  RoundPhase,
} from './game/types';
import { OBJECTIVE_DECK } from './game/cards';
import {
  applyPieceMove,
  describeTransformAction,
  getValidMoves,
  PIECE_LABELS_PT,
  SQUARE_SHORT_COORDS,
  transformCardBoard,
} from './game/rules';
import { checkBoardMatchesCard, solveRoundOptimal } from './game/solver';
import { soundFX } from './game/audio';
import { CameraPreset, RoyalStudyCanvas } from './three/RoyalStudyCanvas';
import { ObjectiveCardPreview } from './components/ObjectiveCardPreview';
import { RulesModal } from './components/RulesModal';
import { PedagogicalModal } from './components/PedagogicalModal';

interface HistoryEntry {
  board: BoardState;
  activeCards: ActiveObjectiveCard[];
  movesUsed: number;
  cardTransformedIndex: 0 | 1 | null;
  logText: string;
}

const HOURGLASS_SECONDS = 20;
const WINNING_SCORE = 6;

function createActiveCard(card: ObjectiveCardData): ActiveObjectiveCard {
  return {
    card,
    currentBoard: [...card.board],
    rotationDeg: 0,
    flippedH: false,
    flippedV: false,
    transformHistory: [],
    completed: false,
  };
}

export default function App() {
  // Game Configuration State
  const [level, setLevel] = useState<GameLevel>(1);
  const [bonusTwoCards, setBonusTwoCards] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>('SOLO');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('TABLETOP');
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [musicVolume, setMusicVolume] = useState<number>(0.45);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [pedagogicalOpen, setPedagogicalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Deck & Board State (Setup rule: Card 0 sets initial pieces on box, Card 1+ are objectives)
  const [deckOrder, setDeckOrder] = useState<ObjectiveCardData[]>(() => [
    ...OBJECTIVE_DECK,
  ]);
  const [deckCursor, setDeckCursor] = useState<number>(2);

  // Start with the official rulebook example (Card #1 on board, Card #2 as first objective!)
  const [board, setBoard] = useState<BoardState>(() => [
    ...OBJECTIVE_DECK[0].board,
  ]);
  const [roundStartBoard, setRoundStartBoard] = useState<BoardState>(() => [
    ...OBJECTIVE_DECK[0].board,
  ]);
  const [activeCards, setActiveCards] = useState<ActiveObjectiveCard[]>(() => [
    createActiveCard(OBJECTIVE_DECK[1]),
  ]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<0 | 1>(0);

  // Turn & Move State
  const [phase, setPhase] = useState<RoundPhase>('ESTIMATE');
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [movesUsed, setMovesUsed] = useState<number>(0);
  const [cardTransformedIndex, setCardTransformedIndex] = useState<
    0 | 1 | null
  >(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastActionNote, setLastActionNote] = useState<string>(
    'Observe a carta de objetivo ao lado da caixa e estime o número mínimo de lances.'
  );

  // Competitive Estimation & Hourglass State
  const [estimateInput, setEstimateInput] = useState<number>(4);
  const [declaredMoves, setDeclaredMoves] = useState<number | null>(null);
  const [declaringPlayer, setDeclaringPlayer] = useState<1 | 2>(1);
  const [executingPlayer, setExecutingPlayer] = useState<1 | 2>(1);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [roundWinnerInfo, setRoundWinnerInfo] = useState<string | null>(null);

  // Hourglass Timer
  const [hourglassLeft, setHourglassLeft] = useState<number>(HOURGLASS_SECONDS);
  const [hourglassActive, setHourglassActive] = useState<boolean>(false);
  const [hourglassFlipCount, setHourglassFlipCount] = useState<number>(0);

  // Hint & Auto-Demo Playback
  const [hintMove, setHintMove] = useState<{ from: number; to: number } | null>(
    null
  );
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);
  const demoTimeoutRef = useRef<number | null>(null);

  // Compute Optimal Solution via exact BFS from roundStartBoard
  const optimalSolution = useMemo(() => {
    const targetBoards = activeCards.map((ac) => ac.card.board);
    return solveRoundOptimal(roundStartBoard, targetBoards, level);
  }, [roundStartBoard, activeCards, level]);

  // Valid moves for currently selected square on the 3x3 board
  const validTargetSquares = useMemo(() => {
    if (selectedSquare === null || phase !== 'EXECUTE' || isPlayingDemo) {
      return [];
    }
    return getValidMoves(board, selectedSquare);
  }, [board, selectedSquare, phase, isPlayingDemo]);

  // Keyboard shortcut 'H' to collapse/expand bottom HUD dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'h' && !rulesOpen && !pedagogicalOpen) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rulesOpen, pedagogicalOpen]);

  // Clear demo timer on unmount and auto-start music on first user interaction
  useEffect(() => {
    const startAudioOnInteraction = () => {
      soundFX.startMusicIfAllowed();
    };
    window.addEventListener('pointerdown', startAudioOnInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', startAudioOnInteraction);
      if (demoTimeoutRef.current) window.clearTimeout(demoTimeoutRef.current);
      soundFX.stopMusic();
    };
  }, []);

  // Hourglass countdown effect during CHALLENGE_WINDOW
  useEffect(() => {
    if (phase !== 'CHALLENGE_WINDOW' || !hourglassActive) return;

    const interval = window.setInterval(() => {
      setHourglassLeft((prev) => {
        if (prev <= 0.2) {
          window.clearInterval(interval);
          setHourglassActive(false);
          setPhase('EXECUTE');
          setExecutingPlayer(declaringPlayer);
          setLastActionNote(
            'Tempo da ampulheta esgotado! Execute seu plano dentro dos lances declarados.'
          );
          return 0;
        }
        return Number((prev - 0.2).toFixed(1));
      });
    }, 200);

    return () => window.clearInterval(interval);
  }, [phase, hourglassActive, declaringPlayer]);

  // Bot decision during CHALLENGE_WINDOW in VS_BOT mode
  useEffect(() => {
    if (
      phase !== 'CHALLENGE_WINDOW' ||
      gameMode !== 'VS_BOT' ||
      declaredMoves === null
    ) {
      return;
    }

    const botTimer = window.setTimeout(() => {
      // If player declared strictly more moves than optimal minimum, Bot challenges!
      if (declaredMoves > optimalSolution.minMoves) {
        const botBid = optimalSolution.minMoves;
        soundFX.playHourglassFlip();
        setDeclaredMoves(botBid);
        setExecutingPlayer(2);
        setHourglassActive(false);
        setPhase('EXECUTE');
        setLastActionNote(
          `O Bot Mestre desafiou sua estimativa anunciando ${botBid} lances! Observe a execução do Bot.`
        );
      }
    }, 2600);

    return () => window.clearTimeout(botTimer);
  }, [phase, gameMode, declaredMoves, optimalSolution]);

  // Check if all active objective cards are completed
  const evaluateCompletion = useCallback(
    (
      nextBoard: BoardState,
      nextCards: ActiveObjectiveCard[],
      nextMovesUsed: number
    ) => {
      const updatedCards = nextCards.map((ac) => {
        if (ac.completed) return ac;
        if (checkBoardMatchesCard(nextBoard, ac.currentBoard)) {
          return { ...ac, completed: true };
        }
        return ac;
      });

      const newlyCompleted = updatedCards.some(
        (ac, i) => ac.completed && !nextCards[i].completed
      );
      if (newlyCompleted) {
        soundFX.playSuccess();
      }

      const allDone = updatedCards.every((ac) => ac.completed);

      if (allDone) {
        const newScores: [number, number] = [...scores];
        let summary = '';

        if (gameMode === 'SOLO') {
          newScores[0] += 1;
          const diff = nextMovesUsed - optimalSolution.minMoves;
          summary =
            diff <= 0
              ? `Perfeito! Objetivo concluído em ${nextMovesUsed} lances (Mínimo Ótimo atingido!).`
              : `Objetivo concluído em ${nextMovesUsed} lances (O mínimo ótimo era ${optimalSolution.minMoves} lances).`;
        } else {
          const limit = declaredMoves ?? nextMovesUsed;
          const succeeded = nextMovesUsed <= limit;
          const winner: 1 | 2 = succeeded
            ? executingPlayer
            : executingPlayer === 1
            ? 2
            : 1;
          newScores[winner - 1] += 1;

          const winnerLabel =
            gameMode === 'VS_BOT'
              ? winner === 1
                ? 'Você'
                : 'Bot Mestre'
              : `Jogador ${winner}`;

          summary = succeeded
            ? `${winnerLabel} cumpriu o plano em ${nextMovesUsed} lances (meta: ${limit}) e marcou 1 ponto!`
            : `Limite de ${limit} lances excedido (${nextMovesUsed} usados). Ponto para ${winnerLabel}!`;
        }

        setScores(newScores);
        setRoundWinnerInfo(summary);
        setLastActionNote(summary);
        setSelectedSquare(null);
        setHintMove(null);

        if (newScores[0] >= WINNING_SCORE || newScores[1] >= WINNING_SCORE) {
          setPhase('MATCH_OVER');
        } else {
          setPhase('ROUND_END');
        }
      }

      return updatedCards;
    },
    [scores, gameMode, optimalSolution.minMoves, declaredMoves, executingPlayer]
  );

  // If Bot is the executingPlayer in VS_BOT mode, play out the optimal steps automatically
  useEffect(() => {
    if (
      phase !== 'EXECUTE' ||
      gameMode !== 'VS_BOT' ||
      executingPlayer !== 2 ||
      isPlayingDemo
    ) {
      return;
    }

    setIsPlayingDemo(true);
    let stepIdx = 0;
    let curBoard = [...roundStartBoard];
    let curCards: ActiveObjectiveCard[] = activeCards.map((ac) => ({
      ...ac,
      currentBoard: [...ac.card.board],
      completed: false,
      transformHistory: [] as CardTransformAction[],
    }));
    let curMoves = 0;

    const runNextBotStep = () => {
      if (stepIdx >= optimalSolution.steps.length) {
        setIsPlayingDemo(false);
        return;
      }
      const step = optimalSolution.steps[stepIdx++];
      curMoves += 1;

      if (step.kind === 'CARD_TRANSFORM' && step.transform) {
        const cIdx = step.cardIndex ?? 0;
        soundFX.playCardTransform();
        curCards = curCards.map((ac, idx) =>
          idx === cIdx
            ? {
                ...ac,
                currentBoard: transformCardBoard(
                  ac.currentBoard,
                  step.transform!
                ),
                transformHistory: [...ac.transformHistory, step.transform!],
              }
            : ac
        );
      } else if (
        step.kind === 'PIECE_MOVE' &&
        typeof step.from === 'number' &&
        typeof step.to === 'number'
      ) {
        soundFX.playWoodPlace();
        curBoard = applyPieceMove(curBoard, step.from, step.to);
      }

      setBoard(curBoard);
      setMovesUsed(curMoves);
      setLastActionNote(`Bot Mestre (${curMoves}): ${step.description}`);
      const checkedCards = evaluateCompletion(curBoard, curCards, curMoves);
      setActiveCards(checkedCards);

      if (!checkedCards.every((c) => c.completed)) {
        demoTimeoutRef.current = window.setTimeout(runNextBotStep, 750);
      } else {
        setIsPlayingDemo(false);
      }
    };

    demoTimeoutRef.current = window.setTimeout(runNextBotStep, 700);
  }, [
    phase,
    gameMode,
    executingPlayer,
    isPlayingDemo,
    roundStartBoard,
    activeCards,
    optimalSolution,
    evaluateCompletion,
  ]);

  // Handle clicking a square or piece on the 3x3 board
  const handleSquareClick = useCallback(
    (sqIndex: number) => {
      if (isPlayingDemo) return;

      // In SOLO mode, clicking a piece during ESTIMATE automatically enters EXECUTE phase
      let activePhase = phase;
      if (phase === 'ESTIMATE' && gameMode === 'SOLO') {
        activePhase = 'EXECUTE';
        setPhase('EXECUTE');
        if (declaredMoves === null) {
          setDeclaredMoves(estimateInput);
        }
      }

      if (activePhase !== 'EXECUTE') return;
      if (gameMode === 'VS_BOT' && executingPlayer === 2) return;

      const clickedPiece = board[sqIndex];
      setHintMove(null);

      // 1. Clicking an already selected piece deselects it
      if (selectedSquare === sqIndex) {
        setSelectedSquare(null);
        return;
      }

      // 2. Clicking a piece selects it
      if (clickedPiece !== null) {
        soundFX.playWoodSelect();
        setSelectedSquare(sqIndex);
        const valid = getValidMoves(board, sqIndex);
        setLastActionNote(
          valid.length > 0
            ? `${PIECE_LABELS_PT[clickedPiece]} em ${SQUARE_SHORT_COORDS[sqIndex]} selecionado (${valid.length} ${valid.length === 1 ? 'casa livre válida' : 'casas livres válidas'}).`
            : `${PIECE_LABELS_PT[clickedPiece]} em ${SQUARE_SHORT_COORDS[sqIndex]} não possui movimentos livres válidos.`
        );
        return;
      }

      // 3. Clicking an empty square when a piece is selected -> validate and move!
      if (selectedSquare !== null) {
        const movingPiece = board[selectedSquare];
        if (!movingPiece) return;

        const validTargets = getValidMoves(board, selectedSquare);
        if (!validTargets.includes(sqIndex)) {
          soundFX.playError();
          setLastActionNote(
            `Movimento inválido para ${PIECE_LABELS_PT[movingPiece]} segundo as regras de The Royal Study.`
          );
          return;
        }

        // Save undo history entry
        setHistory((prev) => [
          ...prev,
          {
            board: [...board],
            activeCards: activeCards.map((ac) => ({
              ...ac,
              currentBoard: [...ac.currentBoard],
              transformHistory: [...ac.transformHistory],
            })),
            movesUsed,
            cardTransformedIndex,
            logText: lastActionNote,
          },
        ]);

        soundFX.playWoodPlace();
        const nextBoard = applyPieceMove(board, selectedSquare, sqIndex);
        const nextMoves = movesUsed + 1;
        const moveText = `Lance ${nextMoves}: ${PIECE_LABELS_PT[movingPiece]} de ${SQUARE_SHORT_COORDS[selectedSquare]} para ${SQUARE_SHORT_COORDS[sqIndex]}.`;

        setBoard(nextBoard);
        setMovesUsed(nextMoves);
        setSelectedSquare(null);
        setLastActionNote(moveText);

        const updatedCards = evaluateCompletion(
          nextBoard,
          activeCards,
          nextMoves
        );
        setActiveCards(updatedCards);
      }
    },
    [
      isPlayingDemo,
      phase,
      gameMode,
      declaredMoves,
      estimateInput,
      executingPlayer,
      board,
      selectedSquare,
      activeCards,
      movesUsed,
      cardTransformedIndex,
      lastActionNote,
      evaluateCompletion,
    ]
  );

  // Handle Level 2 (Rotate 90° CW/CCW) and Level 3 (Mirror H/V) Objective Card action
  const handleTransformCard = useCallback(
    (cardIdx: 0 | 1, action: CardTransformAction) => {
      if (isPlayingDemo || level === 1) return;

      // Bonus Challenge rule (PDF Page 7):
      // "When using a rotate or mirroring action choose one of the two objective cards to mirror or rotate."
      if (
        bonusTwoCards &&
        cardTransformedIndex !== null &&
        cardTransformedIndex !== cardIdx
      ) {
        soundFX.playError();
        setLastActionNote(
          'Regra do Desafio Bônus: Ações de girar ou espelhar só podem ser aplicadas em uma das duas cartas!'
        );
        return;
      }

      if (phase === 'ESTIMATE' && gameMode === 'SOLO') {
        setPhase('EXECUTE');
        if (declaredMoves === null) {
          setDeclaredMoves(estimateInput);
        }
      } else if (phase !== 'EXECUTE') {
        return;
      }

      setHistory((prev) => [
        ...prev,
        {
          board: [...board],
          activeCards: activeCards.map((ac) => ({
            ...ac,
            currentBoard: [...ac.currentBoard],
            transformHistory: [...ac.transformHistory],
          })),
          movesUsed,
          cardTransformedIndex,
          logText: lastActionNote,
        },
      ]);

      soundFX.playCardTransform();
      const nextMoves = movesUsed + 1;
      const nextCards = activeCards.map((ac, idx) => {
        if (idx !== cardIdx) return ac;
        const nextCardBoard = transformCardBoard(ac.currentBoard, action);
        return {
          ...ac,
          currentBoard: nextCardBoard,
          transformHistory: [...ac.transformHistory, action],
        };
      });

      setCardTransformedIndex(cardIdx);
      setMovesUsed(nextMoves);
      setHintMove(null);
      setLastActionNote(
        `Lance ${nextMoves}: ${describeTransformAction(action)} (+1 lance).`
      );

      const updatedCards = evaluateCompletion(board, nextCards, nextMoves);
      setActiveCards(updatedCards);
    },
    [
      isPlayingDemo,
      level,
      bonusTwoCards,
      cardTransformedIndex,
      phase,
      gameMode,
      declaredMoves,
      estimateInput,
      board,
      activeCards,
      movesUsed,
      lastActionNote,
      evaluateCompletion,
    ]
  );

  // Undo last move
  const handleUndo = () => {
    if (history.length === 0 || isPlayingDemo) return;
    const last = history[history.length - 1];
    soundFX.playWoodSelect();
    setBoard(last.board);
    setActiveCards(last.activeCards);
    setMovesUsed(last.movesUsed);
    setCardTransformedIndex(last.cardTransformedIndex);
    setLastActionNote(last.logText);
    setSelectedSquare(null);
    setHintMove(null);
    setHistory((prev) => prev.slice(0, -1));
    if (phase === 'ROUND_END') {
      setPhase('EXECUTE');
    }
  };

  // Solo / Cooperative Rule: "Record the starting position if you wish to retry the challenge or explore alternative solutions with fewer moves."
  const handleRetryStartingPosition = () => {
    if (isPlayingDemo) return;
    soundFX.playCardTransform();
    setBoard([...roundStartBoard]);
    setActiveCards((prev) =>
      prev.map((ac) => ({
        ...ac,
        currentBoard: [...ac.card.board],
        transformHistory: [],
        completed: false,
      }))
    );
    setMovesUsed(0);
    setCardTransformedIndex(null);
    setHistory([]);
    setSelectedSquare(null);
    setHintMove(null);
    setRoundWinnerInfo(null);
    setPhase('EXECUTE');
    setLastActionNote(
      'Posição inicial da rodada restaurada! Tente encontrar uma solução com menos lances.'
    );
  };

  // Show tactical hint from current board state
  const handleShowHint = () => {
    if (isPlayingDemo) return;
    const uncompleted = activeCards.filter((ac) => !ac.completed);
    if (uncompleted.length === 0) return;

    const currentSol = solveRoundOptimal(
      board,
      uncompleted.map((ac) => ac.currentBoard),
      level
    );

    if (currentSol.steps.length === 0) {
      setLastActionNote('O tabuleiro já coincide com a carta de objetivo!');
      return;
    }

    const nextStep = currentSol.steps[0];
    soundFX.playWoodSelect();

    if (
      nextStep.kind === 'PIECE_MOVE' &&
      typeof nextStep.from === 'number' &&
      typeof nextStep.to === 'number'
    ) {
      setSelectedSquare(nextStep.from);
      setHintMove({ from: nextStep.from, to: nextStep.to });
      setLastActionNote(
        `Dica Ótima (${currentSol.minMoves} lances restantes): ${nextStep.description}.`
      );
    } else {
      setLastActionNote(
        `Dica Ótima (${currentSol.minMoves} lances restantes): ${nextStep.description}.`
      );
    }
  };

  // Play full optimal solution step-by-step from roundStartBoard
  const handlePlayOptimalDemo = () => {
    if (isPlayingDemo) return;
    setIsPlayingDemo(true);
    setSelectedSquare(null);
    setHintMove(null);

    let curBoard = [...roundStartBoard];
    let curCards: ActiveObjectiveCard[] = activeCards.map((ac) => ({
      ...ac,
      currentBoard: [...ac.card.board],
      transformHistory: [] as CardTransformAction[],
      completed: false,
    }));
    setBoard(curBoard);
    setActiveCards(curCards);
    setMovesUsed(0);

    let idx = 0;
    const stepTick = () => {
      if (idx >= optimalSolution.steps.length) {
        setIsPlayingDemo(false);
        return;
      }
      const step = optimalSolution.steps[idx++];
      if (step.kind === 'CARD_TRANSFORM' && step.transform) {
        const cIdx = step.cardIndex ?? 0;
        soundFX.playCardTransform();
        curCards = curCards.map((ac, i) =>
          i === cIdx
            ? {
                ...ac,
                currentBoard: transformCardBoard(
                  ac.currentBoard,
                  step.transform!
                ),
                transformHistory: [...ac.transformHistory, step.transform!],
              }
            : ac
        );
      } else if (
        step.kind === 'PIECE_MOVE' &&
        typeof step.from === 'number' &&
        typeof step.to === 'number'
      ) {
        soundFX.playWoodPlace();
        curBoard = applyPieceMove(curBoard, step.from, step.to);
      }

      setBoard(curBoard);
      setMovesUsed(idx);
      setLastActionNote(
        `Demonstração Ótima (${idx}/${optimalSolution.minMoves}): ${step.description}`
      );

      curCards = curCards.map((ac) =>
        ac.completed || checkBoardMatchesCard(curBoard, ac.currentBoard)
          ? { ...ac, completed: true }
          : ac
      );
      setActiveCards(curCards);

      if (idx < optimalSolution.steps.length) {
        demoTimeoutRef.current = window.setTimeout(stepTick, 750);
      } else {
        soundFX.playSuccess();
        setIsPlayingDemo(false);
      }
    };

    demoTimeoutRef.current = window.setTimeout(stepTick, 450);
  };

  // Draw next Objective Card(s) while keeping pieces in their current final positions!
  const drawNextChallenge = useCallback(
    (
      overrideLevel?: GameLevel,
      overrideBonus?: boolean,
      resetMatchScores = false
    ) => {
      if (demoTimeoutRef.current) window.clearTimeout(demoTimeoutRef.current);
      setIsPlayingDemo(false);

      const useBonus =
        overrideBonus !== undefined ? overrideBonus : bonusTwoCards;
      const cardsNeeded = useBonus ? 2 : 1;

      let currentDeck = deckOrder;
      let cursor = deckCursor;

      // If we start a brand new match or run out of cards, shuffle the 60-card deck
      if (resetMatchScores || cursor + cardsNeeded > currentDeck.length) {
        const shuffled = [...OBJECTIVE_DECK];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        currentDeck = shuffled;
        setDeckOrder(shuffled);

        if (resetMatchScores) {
          // Rulebook Setup Step 3-5: Draw 1 card to position the pieces on the box, then lay it aside
          const setupCard = shuffled[0];
          const nextCards = shuffled
            .slice(1, 1 + cardsNeeded)
            .map(createActiveCard);
          setBoard([...setupCard.board]);
          setRoundStartBoard([...setupCard.board]);
          setActiveCards(nextCards);
          setDeckCursor(1 + cardsNeeded);
          setScores([0, 0]);
        } else {
          const nextCards = shuffled
            .slice(0, cardsNeeded)
            .map(createActiveCard);
          setRoundStartBoard([...board]);
          setActiveCards(nextCards);
          setDeckCursor(cardsNeeded);
        }
      } else {
        // Rulebook "After Scoring a Point":
        // "Leave the chess pieces in their final positions. Draw a new objective card and repeat!"
        let drawn = currentDeck
          .slice(cursor, cursor + cardsNeeded)
          .map(createActiveCard);
        // Ensure drawn card isn't already identical to current board
        if (checkBoardMatchesCard(board, drawn[0].currentBoard) && cursor + cardsNeeded < currentDeck.length) {
          drawn = currentDeck
            .slice(cursor + 1, cursor + 1 + cardsNeeded)
            .map(createActiveCard);
          cursor += 1;
        }
        setRoundStartBoard([...board]);
        setActiveCards(drawn);
        setDeckCursor(cursor + cardsNeeded);
      }

      if (overrideLevel !== undefined) setLevel(overrideLevel);
      if (overrideBonus !== undefined) setBonusTwoCards(overrideBonus);

      soundFX.playCardTransform();
      setSelectedCardIndex(0);
      setSelectedSquare(null);
      setHintMove(null);
      setMovesUsed(0);
      setCardTransformedIndex(null);
      setHistory([]);
      setDeclaredMoves(null);
      setRoundWinnerInfo(null);
      setHourglassActive(false);
      setHourglassLeft(HOURGLASS_SECONDS);
      setExecutingPlayer(1);
      setPhase('ESTIMATE');
      setLastActionNote(
        resetMatchScores
          ? 'Nova partida iniciada! Peças posicionadas conforme a carta inicial.'
          : 'Peças mantidas em suas posições finais! Nova carta de objetivo revelada.'
      );
    },
    [bonusTwoCards, deckOrder, deckCursor, board]
  );

  // Load Official Rulebook Example (Page 2 / Page 6: 4 moves solution)
  const handleLoadOfficialExample = () => {
    if (demoTimeoutRef.current) window.clearTimeout(demoTimeoutRef.current);
    setIsPlayingDemo(false);
    soundFX.playCardTransform();

    const startCard = OBJECTIVE_DECK[0]; // [_, Q, B, K, _, N, R, _, _]
    const targetCard = OBJECTIVE_DECK[1]; // [N, _, B, Q, _, _, _, K, R]

    setBoard([...startCard.board]);
    setRoundStartBoard([...startCard.board]);
    setActiveCards([createActiveCard(targetCard)]);
    setBonusTwoCards(false);
    setLevel(1);
    setSelectedCardIndex(0);
    setSelectedSquare(null);
    setHintMove(null);
    setMovesUsed(0);
    setCardTransformedIndex(null);
    setHistory([]);
    setEstimateInput(4);
    setDeclaredMoves(4);
    setRoundWinnerInfo(null);
    setPhase('EXECUTE');
    setLastActionNote(
      'Exemplo Oficial do Manual carregado (Meta: 4 lances — 1. Cavalo A3, 2. Torre C1, 3. Rei B1, 4. Dama A2).'
    );
  };

  // Step 2: Declare Moves & Flip Hourglass
  const handleDeclareEstimate = (player: 1 | 2 = 1) => {
    soundFX.playHourglassFlip();
    setDeclaredMoves(estimateInput);
    setDeclaringPlayer(player);
    setExecutingPlayer(player);
    setHourglassFlipCount((c) => c + 1);

    if (gameMode === 'SOLO') {
      setPhase('EXECUTE');
      setLastActionNote(
        `Estimativa definida em ${estimateInput} lances. Clique nas peças de madeira para executar seu plano!`
      );
    } else {
      setHourglassLeft(HOURGLASS_SECONDS);
      setHourglassActive(true);
      setPhase('CHALLENGE_WINDOW');
      setLastActionNote(
        `Estimativa de ${estimateInput} lances declarada! Ampulheta virada para decisão do oponente.`
      );
    }
  };

  // Step 3: Opponent Challenges with Fewer Moves
  const handleOpponentChallenge = () => {
    if (declaredMoves === null || declaredMoves <= 1) return;
    const challenger: 1 | 2 = declaringPlayer === 1 ? 2 : 1;
    const newBid = declaredMoves - 1;
    soundFX.playHourglassFlip();
    setDeclaredMoves(newBid);
    setExecutingPlayer(challenger);
    setHourglassActive(false);
    setPhase('EXECUTE');
    setLastActionNote(
      `Jogador ${challenger} desafiou para resolver em ${newBid} lances! Execute os movimentos no tabuleiro.`
    );
  };

  // Step 3: Opponent Does Not React / Accepts -> Declarer Executes
  const handleOpponentPassToExecute = () => {
    setHourglassActive(false);
    setExecutingPlayer(declaringPlayer);
    setPhase('EXECUTE');
    setLastActionNote(
      `Oponente não desafiou. Jogador ${declaringPlayer} deve executar a solução em até ${declaredMoves} lances!`
    );
  };

  const toggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    soundFX.setMusicEnabled(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVolume(val);
    soundFX.setMusicVolume(val);
    if (val > 0 && !musicEnabled) {
      setMusicEnabled(true);
      soundFX.setMusicEnabled(true);
    }
  };

  const toggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    soundFX.sfxEnabled = next;
  };

  const hourglassRatio = hourglassActive
    ? hourglassLeft / HOURGLASS_SECONDS
    : phase === 'ESTIMATE'
    ? 1.0
    : 0.05;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1b120c] select-none">
      {/* 1. Responsive Top Navigation Bar (Fluid clamp() on Desktop/Tablet + Vertical Menu on Mobile, Zero Scrollbars) */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-[#140d08]/95 border-b border-[#36251a]">
        <div
          className="flex items-center justify-between px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3"
          style={{ gap: 'clamp(0.5rem, 1.5vw, 1.75rem)' }}
        >
          {/* Zone 1: Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setCameraPreset('TABLETOP');
              setMobileMenuOpen(false);
            }}
            className="font-display italic font-bold tracking-tight text-white whitespace-nowrap shrink-0"
            style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)' }}
          >
            The Royal Study
          </a>

          {/* Zone 2: Desktop / Tablet Horizontal Navigation with fluid clamp() sizing (Never creates a scrollbar) */}
          <nav
            className="hidden md:flex items-center font-medium text-[#cbb8a4] shrink-0"
            style={{
              fontSize: 'clamp(0.74rem, 1.05vw, 0.875rem)',
              gap: 'clamp(0.65rem, 1.5vw, 1.5rem)',
            }}
          >
            <button
              type="button"
              onClick={() => drawNextChallenge(1, bonusTwoCards, false)}
              className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                level === 1
                  ? 'text-[#facc15] underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Nível 1
            </button>
            <button
              type="button"
              onClick={() => drawNextChallenge(2, bonusTwoCards, false)}
              className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                level === 2
                  ? 'text-[#facc15] underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Nível 2
            </button>
            <button
              type="button"
              onClick={() => drawNextChallenge(3, bonusTwoCards, false)}
              className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                level === 3
                  ? 'text-[#facc15] underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Nível 3
            </button>
            <button
              type="button"
              onClick={() => drawNextChallenge(level, !bonusTwoCards, false)}
              className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                bonusTwoCards
                  ? 'text-[#38bdf8] underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Desafio Bônus
            </button>
            <button
              type="button"
              onClick={() => setPedagogicalOpen(true)}
              className="flex items-center gap-1.5 text-[#facc15] hover:text-white transition-colors whitespace-nowrap cursor-pointer font-semibold"
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Área Pedagógica</span>
            </button>
            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              Regras Oficiais
            </button>
          </nav>

          {/* Zone 3: Actions & Mobile Vertical Menu Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPedagogicalOpen(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#facc15] bg-[#241811] border border-[#4a3425] rounded-lg hover:bg-[#332218] transition-colors whitespace-nowrap"
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span>Área Pedagógica</span>
            </button>

            <button
              type="button"
              onClick={() => {
                drawNextChallenge(level, bonusTwoCards, true);
                setMobileMenuOpen(false);
              }}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[#160f0a] bg-[#d4a359] rounded-lg hover:bg-[#e2b36b] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              style={{ fontSize: 'clamp(0.7rem, 0.95vw, 0.78rem)' }}
            >
              Nova<span className="hidden sm:inline"> Partida</span>
            </button>

            {/* Mobile Vertical Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-1.5 rounded-lg bg-[#241811] text-[#e2d5c6] hover:text-white border border-[#3d2b1f] transition-colors"
              aria-label="Alternar menu de navegação"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Vertical Collapsible Navigation Menu for Mobile (< md) */}
        {mobileMenuOpen && (
          <nav className="md:hidden flex flex-col gap-1 px-3 pb-3 pt-1 bg-[#140d08] border-t border-[#2c1e15] text-xs font-medium text-[#d6c5b3]">
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  drawNextChallenge(1, bonusTwoCards, false);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-lg text-left border transition-colors ${
                  level === 1
                    ? 'bg-[#2a1d13] border-[#d4a359] text-[#facc15] font-semibold'
                    : 'bg-[#1c130d] border-[#2e2017] text-[#cbb8a4]'
                }`}
              >
                Nível 1 (Fixo)
              </button>
              <button
                type="button"
                onClick={() => {
                  drawNextChallenge(2, bonusTwoCards, false);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-lg text-left border transition-colors ${
                  level === 2
                    ? 'bg-[#2a1d13] border-[#d4a359] text-[#facc15] font-semibold'
                    : 'bg-[#1c130d] border-[#2e2017] text-[#cbb8a4]'
                }`}
              >
                Nível 2 (Giro 90°)
              </button>
              <button
                type="button"
                onClick={() => {
                  drawNextChallenge(3, bonusTwoCards, false);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-lg text-left border transition-colors ${
                  level === 3
                    ? 'bg-[#2a1d13] border-[#d4a359] text-[#facc15] font-semibold'
                    : 'bg-[#1c130d] border-[#2e2017] text-[#cbb8a4]'
                }`}
              >
                Nível 3 (Espelho)
              </button>
              <button
                type="button"
                onClick={() => {
                  drawNextChallenge(level, !bonusTwoCards, false);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-lg text-left border transition-colors ${
                  bonusTwoCards
                    ? 'bg-[#162736] border-[#38bdf8] text-[#38bdf8] font-semibold'
                    : 'bg-[#1c130d] border-[#2e2017] text-[#cbb8a4]'
                }`}
              >
                Desafio Bônus (2 Cartas)
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPedagogicalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#271b13] border border-[#4a3425] text-[#facc15] font-semibold"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Área Pedagógica (BNCC)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRulesOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1c130d] border border-[#38261b] text-[#e2d5c6]"
              >
                <BookOpen className="w-4 h-4" />
                <span>Regras Oficiais</span>
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* 2. Full-Bleed 3D WebGL Viewport (100% Unobstructed Center) */}
      <RoyalStudyCanvas
        board={board}
        selectedSquare={selectedSquare}
        validTargetSquares={validTargetSquares}
        hintMove={hintMove}
        activeCards={activeCards}
        selectedCardIndex={selectedCardIndex}
        hourglassRatio={hourglassRatio}
        hourglassActive={hourglassActive}
        hourglassFlipCount={hourglassFlipCount}
        cameraPreset={cameraPreset}
        onSquareClick={handleSquareClick}
        onCardClick={(idx) => setSelectedCardIndex(idx)}
      />

      {/* 3. Unified Collapsible Bottom Control Dock (Zero Side-Panel Clutter) */}
      <div
        className="fixed left-1/2 z-30 w-full max-w-[min(940px,96vw)] lg:max-w-[min(940px,94vw)] transition-transform duration-200 ease-out"
        style={{
          bottom: '10px',
          transform: dockCollapsed
            ? 'translate(-50%, calc(100% - 32px))'
            : 'translate(-50%, 0)',
        }}
      >
        {/* Collapse / Expand Zen Mode Tab on top edge of dock */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1 rounded-t-lg bg-[#18100b] border border-b-0 border-[#3d2b1f] text-[11px] sm:text-xs font-medium text-[#d6c5b3] hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#d4a359]" />
                <span>Mostrar Controles</span>
                <span className="hidden sm:inline">(H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#d4a359]" />
                <span>Ocultar Controles</span>
                <span className="hidden sm:inline">(H)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Dock Surface (Solid dark wood tone — no scrollbar on mobile or desktop) */}
        <div className="rounded-xl bg-[#18100b]/95 border border-[#3d2b1f] p-2.5 sm:p-3.5 lg:p-4 shadow-2xl max-h-[44vh] sm:max-h-[48vh] lg:max-h-none overflow-y-auto no-scrollbar lg:overflow-visible">
          {/* Top Row: Clean Unboxed Metadata & Mode / Camera Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-[#2e2017]">
            {/* Unboxed Metadata with typographic separators */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#cbb8a4] font-mono tabular-nums">
              <span className="font-sans font-semibold text-white">
                {gameMode === 'SOLO'
                  ? `Pontos: ${scores[0]}/${WINNING_SCORE}`
                  : gameMode === 'VS_BOT'
                  ? `Você ${scores[0]} · ${scores[1]} Bot`
                  : `J1 ${scores[0]} · ${scores[1]} J2`}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Lances: <strong className="text-white">{movesUsed}</strong>
                {declaredMoves !== null ? `/${declaredMoves}` : ''}
              </span>
              <span aria-hidden="true">·</span>
              <span className="hidden xs:inline sm:inline">
                Baralho: {Math.max(0, 60 - deckCursor)}/60
              </span>
              <span aria-hidden="true" className="hidden xs:inline sm:inline">
                ·
              </span>
              <span className="font-sans text-[#d4a359]">
                Nv.{level}
                {bonusTwoCards ? '+Bônus' : ''}
              </span>
            </div>

            {/* Segmented Interactive Mode & Camera Controls */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-0.5 p-0.5 bg-[#241811] rounded-lg border border-[#38261b]">
                {(
                  [
                    ['SOLO', 'Solo'],
                    ['VS_BOT', 'Vs. Bot'],
                    ['PASS_PLAY', '2 Jog.'],
                  ] as [GameMode, string][]
                ).map(([mKey, mLabel]) => (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => {
                      setGameMode(mKey);
                      setScores([0, 0]);
                      setPhase('ESTIMATE');
                    }}
                    className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      gameMode === mKey
                        ? 'bg-[#d4a359] text-[#160f0a] font-semibold'
                        : 'text-[#cbb8a4] hover:text-white'
                    }`}
                  >
                    {mLabel}
                  </button>
                ))}
              </div>

              {/* Camera View Switcher */}
              <div className="flex items-center gap-0.5 p-0.5 bg-[#241811] rounded-lg border border-[#38261b]">
                <Camera className="w-3.5 h-3.5 text-[#9c8773] ml-1.5 mr-0.5 hidden sm:block shrink-0" />
                {(
                  [
                    ['TABLETOP', 'Mesa'],
                    ['OVERHEAD', 'Topo'],
                    ['ANGLED', 'Lateral'],
                  ] as [CameraPreset, string][]
                ).map(([cKey, cLabel]) => (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setCameraPreset(cKey)}
                    className={`px-2 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      cameraPreset === cKey
                        ? 'bg-[#38261b] text-white'
                        : 'text-[#b8a38e] hover:text-white'
                    }`}
                  >
                    {cLabel}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleLoadOfficialExample}
                className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-lg bg-[#241811] hover:bg-[#332218] text-[#e2d5c6] border border-[#38261b] transition-colors whitespace-nowrap shrink-0"
                title="Carregar o desafio de exemplo oficial da Página 2 do PDF"
              >
                Exemplo<span className="hidden md:inline"> do Manual</span>
              </button>

              <button
                type="button"
                onClick={() => setPedagogicalOpen(true)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg bg-[#241811] hover:bg-[#332218] text-[#facc15] border border-[#4a3425] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Abrir Área Pedagógica (Aspectos Formais, Filosóficos e BNCC)"
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span>Área Pedagógica</span>
              </button>

              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                className="p-1.5 rounded-lg bg-[#241811] hover:bg-[#332218] text-[#cbb8a4] hover:text-white border border-[#38261b] transition-colors cursor-pointer"
                title="Abrir Regras Oficiais (PDF)"
                aria-label="Abrir Regras Oficiais"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              {/* Music Toggle + Volume Slider + SFX Toggle */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg bg-[#241811] border border-[#38261b]">
                <button
                  type="button"
                  onClick={toggleMusic}
                  className={`flex items-center gap-1 text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    musicEnabled ? 'text-[#facc15]' : 'text-[#8c7865] line-through'
                  }`}
                  title={
                    musicEnabled
                      ? 'Desativar trilha sonora'
                      : 'Ativar trilha sonora'
                  }
                  aria-label="Alternar trilha sonora"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Música</span>
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={musicEnabled ? musicVolume : 0}
                  onChange={handleVolumeChange}
                  className="w-12 sm:w-16 h-1.5 accent-[#d4a359] bg-[#3d2b1f] rounded-lg cursor-pointer"
                  title={`Volume da música: ${Math.round(
                    (musicEnabled ? musicVolume : 0) * 100
                  )}%`}
                  aria-label="Volume da trilha sonora"
                />
                <span className="text-[10px] sm:text-[11px] font-mono tabular-nums text-[#cbb8a4] w-7 sm:w-8 text-right">
                  {Math.round((musicEnabled ? musicVolume : 0) * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={toggleSfx}
                className="p-1.5 rounded-lg bg-[#241811] hover:bg-[#332218] text-[#cbb8a4] hover:text-white border border-[#38261b] transition-colors"
                title={
                  sfxEnabled
                    ? 'Desativar efeitos sonoros das peças'
                    : 'Ativar efeitos sonoros das peças'
                }
                aria-label="Alternar efeitos sonoros"
              >
                {sfxEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Middle Row: Active Objective Card(s) + Dynamic Gameplay Phase Controls */}
          <div className="mt-2.5 sm:mt-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-4">
            {/* Left: Active Objective Card(s) 2D Tactile Inspector & Level 2/3 Rotate/Mirror Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {activeCards.map((ac, idx) => (
                <ObjectiveCardPreview
                  key={`${ac.card.code}-${idx}`}
                  activeCard={ac}
                  cardIndex={idx as 0 | 1}
                  isSelected={selectedCardIndex === idx}
                  showCardSelector={activeCards.length > 1}
                  currentBoard={board}
                  level={level}
                  canTransform={
                    !isPlayingDemo &&
                    (phase === 'EXECUTE' ||
                      (phase === 'ESTIMATE' && gameMode === 'SOLO')) &&
                    (!bonusTwoCards ||
                      cardTransformedIndex === null ||
                      cardTransformedIndex === idx)
                  }
                  onSelectCard={(cIdx) => setSelectedCardIndex(cIdx)}
                  onTransformCard={handleTransformCard}
                />
              ))}
            </div>

            {/* Right: Phase-Specific Action Panel */}
            <div className="flex-1 flex flex-col justify-between bg-[#21160f] border border-[#36251a] rounded-lg p-3">
              {/* Status / Instruction Line (Selectable text) */}
              <p className="text-xs text-[#e2d5c6] leading-snug mb-2.5 select-text">
                {lastActionNote}
              </p>

              {/* PHASE 1: ESTIMATE MOVES */}
              {phase === 'ESTIMATE' && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#cbb8a4] whitespace-nowrap">
                      Estimativa mínima:
                    </span>
                    <div className="flex items-center bg-[#160f0a] border border-[#3d2b1f] rounded-lg">
                      <button
                        type="button"
                        onClick={() =>
                          setEstimateInput((v) => Math.max(1, v - 1))
                        }
                        className="px-2.5 py-1 text-sm font-bold text-[#d4a359] hover:text-white"
                        aria-label="Diminuir estimativa de lances"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-sm font-mono font-bold text-white tabular-nums">
                        {estimateInput}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEstimateInput((v) => Math.min(20, v + 1))
                        }
                        className="px-2.5 py-1 text-sm font-bold text-[#d4a359] hover:text-white"
                        aria-label="Aumentar estimativa de lances"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {gameMode === 'PASS_PLAY' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDeclareEstimate(1)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4a359] hover:bg-[#e2b36b] text-[#160f0a] font-semibold text-xs whitespace-nowrap shrink-0 transition-colors"
                        >
                          <Hourglass className="w-3.5 h-3.5" />
                          <span>J1 Declara ({estimateInput})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclareEstimate(2)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#0f172a] font-semibold text-xs whitespace-nowrap shrink-0 transition-colors"
                        >
                          <Hourglass className="w-3.5 h-3.5" />
                          <span>J2 Declara ({estimateInput})</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeclareEstimate(1)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#d4a359] hover:bg-[#e2b36b] text-[#160f0a] font-semibold text-xs whitespace-nowrap shrink-0 transition-colors"
                      >
                        <Hourglass className="w-3.5 h-3.5" />
                        <span>
                          {gameMode === 'SOLO'
                            ? `Confirmar Meta (${estimateInput} Lances)`
                            : `Declarar ${estimateInput} Lances & Virar Ampulheta`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* PHASE 2: HOURGLASS CHALLENGE WINDOW */}
              {phase === 'CHALLENGE_WINDOW' && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#facc15]">
                    <Hourglass className="w-4 h-4 shrink-0" />
                    <span>
                      Ampulheta: {hourglassLeft.toFixed(1)}s · Declarado:{' '}
                      {declaredMoves} lances
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {declaredMoves !== null && declaredMoves > 1 && (
                      <button
                        type="button"
                        onClick={handleOpponentChallenge}
                        className="px-3 py-1.5 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#160f0a] font-semibold text-xs whitespace-nowrap shrink-0 transition-colors"
                      >
                        Desafiar com {declaredMoves - 1} Lances
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleOpponentPassToExecute}
                      className="px-3 py-1.5 rounded-lg bg-[#2e2017] hover:bg-[#3d2b1f] text-white border border-[#4a3425] font-medium text-xs whitespace-nowrap shrink-0 transition-colors"
                    >
                      Não Reagir (Mandar Executar)
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE 3: EXECUTE THE PLAN */}
              {phase === 'EXECUTE' && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={history.length === 0 || isPlayingDemo}
                      onClick={handleUndo}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2c1e15] hover:bg-[#3d2b1f] disabled:opacity-40 text-xs font-medium text-[#f5efe6] border border-[#4a3425] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Desfazer</span>
                    </button>

                    <button
                      type="button"
                      disabled={movesUsed === 0 || isPlayingDemo}
                      onClick={handleRetryStartingPosition}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2c1e15] hover:bg-[#3d2b1f] disabled:opacity-40 text-xs font-medium text-[#f5efe6] border border-[#4a3425] transition-colors whitespace-nowrap shrink-0"
                      title="Voltar à posição inicial desta rodada para tentar com menos lances"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Repetir Posição Inicial</span>
                    </button>

                    <button
                      type="button"
                      disabled={isPlayingDemo}
                      onClick={handleShowHint}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2c1e15] hover:bg-[#3d2b1f] disabled:opacity-40 text-xs font-medium text-[#facc15] border border-[#4a3425] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Dica</span>
                    </button>

                    <button
                      type="button"
                      disabled={isPlayingDemo}
                      onClick={handlePlayOptimalDemo}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2c1e15] hover:bg-[#3d2b1f] disabled:opacity-40 text-xs font-medium text-[#38bdf8] border border-[#4a3425] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>
                        Ver Mínimo ({optimalSolution.minMoves} Lances)
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => drawNextChallenge(level, bonusTwoCards, false)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#241811] hover:bg-[#332218] text-xs text-[#cbb8a4] hover:text-white border border-[#38261b] transition-colors whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Trocar Carta</span>
                  </button>
                </div>
              )}

              {/* PHASE 4: ROUND END OR MATCH OVER */}
              {(phase === 'ROUND_END' || phase === 'MATCH_OVER') && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-medium text-[#4ade80] flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-[#facc15] shrink-0" />
                      <span>
                        {phase === 'MATCH_OVER'
                          ? `Fim de Jogo! Placar Final: ${scores[0]} a ${scores[1]} (6 pontos alcançados!)`
                          : roundWinnerInfo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRetryStartingPosition}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2c1e15] hover:bg-[#3d2b1f] text-xs font-medium text-[#f5efe6] border border-[#4a3425] transition-colors whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Repetir Desafio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          drawNextChallenge(
                            level,
                            bonusTwoCards,
                            phase === 'MATCH_OVER'
                          )
                        }
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#d4a359] hover:bg-[#e2b36b] text-[#160f0a] font-semibold text-xs whitespace-nowrap shrink-0 transition-colors"
                      >
                        <span>
                          {phase === 'MATCH_OVER'
                            ? 'Jogar Nova Partida'
                            : 'Próxima Carta (Manter Peças)'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Step-by-step Optimal Solution Summary */}
                  <div className="text-[11px] text-[#b8a38e] font-mono border-t border-[#36251a] pt-1.5 select-text">
                    <span className="text-white font-sans font-medium">
                      Solução Ótima ({optimalSolution.minMoves} lances):{' '}
                    </span>
                    {optimalSolution.steps
                      .map((s, idx) => `${idx + 1}. ${s.description}`)
                      .join(' · ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Official Illustrated Rules Modal */}
      <RulesModal
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
        onLoadOfficialExample={handleLoadOfficialExample}
      />

      {/* 5. Formal & Pedagogical Aspects Modal (README.md / BNCC / Computação) */}
      <PedagogicalModal
        isOpen={pedagogicalOpen}
        onClose={() => setPedagogicalOpen(false)}
      />
    </div>
  );
}
