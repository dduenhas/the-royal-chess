import React from 'react';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  Check,
} from 'lucide-react';
import {
  ActiveObjectiveCard,
  BoardState,
  CardTransformAction,
  GameLevel,
  PieceType,
} from '../game/types';
import { PIECE_LABELS_PT } from '../game/rules';

const PIECE_UNICODE: Record<PieceType, string> = {
  [PieceType.KING]: '♚',
  [PieceType.QUEEN]: '♛',
  [PieceType.ROOK]: '♜',
  [PieceType.BISHOP]: '♝',
  [PieceType.KNIGHT]: '♞',
};

interface ObjectiveCardPreviewProps {
  activeCard: ActiveObjectiveCard;
  cardIndex: 0 | 1;
  isSelected: boolean;
  showCardSelector: boolean;
  currentBoard: BoardState;
  level: GameLevel;
  canTransform: boolean;
  onSelectCard: (idx: 0 | 1) => void;
  onTransformCard: (idx: 0 | 1, action: CardTransformAction) => void;
}

export const ObjectiveCardPreview: React.FC<ObjectiveCardPreviewProps> = ({
  activeCard,
  cardIndex,
  isSelected,
  showCardSelector,
  currentBoard,
  level,
  canTransform,
  onSelectCard,
  onTransformCard,
}) => {
  // Count how many pieces currently match this card's target squares
  let matchedCount = 0;
  for (let i = 0; i < 9; i++) {
    if (
      activeCard.currentBoard[i] !== null &&
      activeCard.currentBoard[i] === currentBoard[i]
    ) {
      matchedCount++;
    }
  }

  return (
    <div
      onClick={() => showCardSelector && onSelectCard(cardIndex)}
      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border transition-colors ${
        activeCard.completed
          ? 'bg-[#132a1f] border-[#22c55e]/50'
          : isSelected && showCardSelector
          ? 'bg-[#2a1d14] border-[#d4a359]'
          : 'bg-[#21160f] border-[#3d2b1f]'
      } ${showCardSelector ? 'cursor-pointer' : ''}`}
    >
      {/* Mini 3x3 Objective Card representation matching physical card colors */}
      <div className="relative p-1 sm:p-1.5 rounded bg-[#855341] border border-[#4a2b1d] shrink-0">
        {/* Top orientation arrow */}
        <div
          className="w-0 h-0 mx-auto mb-0.5 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-[#24110b]"
          title="Topo da Carta"
        />
        <div className="grid grid-cols-3 w-[66px] h-[66px] sm:w-[76px] sm:h-[76px] lg:w-[84px] lg:h-[84px] border border-[#2b140d]">
          {activeCard.currentBoard.map((piece, sqIdx) => {
            const isDark = sqIdx % 2 === 0;
            const pieceMatchesBoard =
              piece !== null && currentBoard[sqIdx] === piece;
            return (
              <div
                key={sqIdx}
                className={`relative flex items-center justify-center border-[0.5px] border-[#381b12] ${
                  isDark ? 'bg-[#7d4b39]' : 'bg-[#ecd4be]'
                }`}
                title={
                  piece ? `${PIECE_LABELS_PT[piece]}` : 'Casa vazia'
                }
              >
                {piece && (
                  <span
                    className={`text-sm sm:text-base lg:text-lg leading-none select-none -rotate-45 transition-transform ${
                      pieceMatchesBoard
                        ? 'text-[#052e16] drop-shadow-[0_0_2px_rgba(74,222,128,0.9)]'
                        : 'text-[#140d0a]'
                    }`}
                  >
                    {PIECE_UNICODE[piece]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {activeCard.completed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
            <Check className="w-6 h-6 lg:w-7 lg:h-7 text-[#4ade80]" />
          </div>
        )}
      </div>

      {/* Card Metadata & Level 2 / Level 3 Action Buttons */}
      <div className="flex flex-col justify-between min-w-[116px] sm:min-w-[138px]">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-[#cbb8a4]">
            <span className="font-semibold text-white">
              {showCardSelector ? `Carta ${cardIndex + 1}` : 'Carta de Objetivo'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px]">{activeCard.card.code}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-[#b8a38e] font-mono tabular-nums">
            {activeCard.completed ? (
              <span className="text-[#4ade80] font-sans font-medium">
                Objetivo Concluído
              </span>
            ) : (
              <span>Peças alinhadas: {matchedCount}/5</span>
            )}
          </div>
        </div>

        {/* Level 2 (Rotate) & Level 3 (Mirror) Controls */}
        {level >= 2 && !activeCard.completed && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!canTransform}
                onClick={(e) => {
                  e.stopPropagation();
                  onTransformCard(cardIndex, 'ROTATE_CCW');
                }}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#2d1f16] hover:bg-[#3d2b1f] disabled:opacity-40 text-[11px] text-[#f5efe6] border border-[#4a3425] transition-colors whitespace-nowrap shrink-0"
                title="Girar 90° Anti-horário (Custa 1 lance)"
              >
                <RotateCcw className="w-3 h-3 text-[#facc15]" />
                <span>90° ↺ (+1)</span>
              </button>
              <button
                type="button"
                disabled={!canTransform}
                onClick={(e) => {
                  e.stopPropagation();
                  onTransformCard(cardIndex, 'ROTATE_CW');
                }}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#2d1f16] hover:bg-[#3d2b1f] disabled:opacity-40 text-[11px] text-[#f5efe6] border border-[#4a3425] transition-colors whitespace-nowrap shrink-0"
                title="Girar 90° Horário (Custa 1 lance)"
              >
                <RotateCw className="w-3 h-3 text-[#facc15]" />
                <span>90° ↻ (+1)</span>
              </button>
            </div>

            {level === 3 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!canTransform}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTransformCard(cardIndex, 'MIRROR_H');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#2d1f16] hover:bg-[#3d2b1f] disabled:opacity-40 text-[11px] text-[#f5efe6] border border-[#4a3425] transition-colors whitespace-nowrap shrink-0"
                  title="Espelhar Horizontalmente (Custa 1 lance)"
                >
                  <FlipHorizontal2 className="w-3 h-3 text-[#38bdf8]" />
                  <span>Esp. H (+1)</span>
                </button>
                <button
                  type="button"
                  disabled={!canTransform}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTransformCard(cardIndex, 'MIRROR_V');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#2d1f16] hover:bg-[#3d2b1f] disabled:opacity-40 text-[11px] text-[#f5efe6] border border-[#4a3425] transition-colors whitespace-nowrap shrink-0"
                  title="Espelhar Verticalmente (Custa 1 lance)"
                >
                  <FlipVertical2 className="w-3 h-3 text-[#38bdf8]" />
                  <span>Esp. V (+1)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {level === 1 && !activeCard.completed && (
          <p className="mt-2 text-[11px] text-[#9c8773]">
            Nível 1: Orientação fixa
          </p>
        )}
      </div>
    </div>
  );
};
