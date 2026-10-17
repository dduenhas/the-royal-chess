import React from 'react';
import { X, RotateCw, FlipHorizontal, Award, Hourglass } from 'lucide-react';
import { PieceType } from '../game/types';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadOfficialExample: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  onLoadOfficialExample,
}) => {
  if (!isOpen) return null;

  const pieceRules = [
    {
      piece: PieceType.KING,
      name: 'Rei (King / König)',
      symbol: '♔',
      rule: 'Move-se exatamente 1 casa na horizontal, vertical ou diagonal para uma casa vazia.',
      restriction: 'Não pode pular sobre outras peças.',
    },
    {
      piece: PieceType.QUEEN,
      name: 'Dama (Queen / Dame)',
      symbol: '♕',
      rule: 'Move-se quantas casas vazias quiser na horizontal, vertical ou diagonal.',
      restriction: 'Não pode passar por cima de outras peças.',
    },
    {
      piece: PieceType.ROOK,
      name: 'Torre (Rook / Turm)',
      symbol: '♖',
      rule: 'Move-se quantas casas vazias quiser na horizontal ou na vertical.',
      restriction: 'Não pode passar por cima de outras peças.',
    },
    {
      piece: PieceType.BISHOP,
      name: 'Bispo (Bishop / Läufer)',
      symbol: '♗',
      rule: 'Move-se quantas casas vazias quiser na diagonal.',
      restriction: 'REGRA ESPECIAL: O Bispo deve permanecer sempre nas 5 casas escuras (os 4 cantos e o centro).',
    },
    {
      piece: PieceType.KNIGHT,
      name: 'Cavalo (Knight / Springer)',
      symbol: '♘',
      rule: 'Move-se em "L" (duas casas na horizontal ou vertical e uma para o lado) e PODE saltar sobre outras peças.',
      restriction: 'REGRA ESPECIAL: O Cavalo nunca pode ser colocado na casa central (B2).',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-xl bg-[#1c130d] border border-[#3d2b1f] p-6 md:p-8 text-[#f5efe6] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#3d2b1f]">
          <div>
            <h2
              id="rules-modal-title"
              className="font-display italic text-3xl font-bold text-white"
            >
              The Royal Study — Regras Oficiais
            </h2>
            <p className="text-xs text-[#b8a38e] mt-1">
              Autor e Designer: Stan van Rooijen · Publicado por Philos · 5 Peças · 60 Cartas de Objetivo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#cbb8a4] hover:text-white hover:bg-[#2c1e15] transition-colors"
            aria-label="Fechar manual de regras"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-8 text-sm leading-relaxed text-[#e2d5c6]">
          {/* Visão Geral */}
          <section>
            <h3 className="text-base font-semibold text-white mb-2">
              01. Visão Geral do Jogo
            </h3>
            <p>
              Em <strong className="text-white">The Royal Study</strong>, os jogadores competem para resolver pequenos problemas de xadrez em um tabuleiro 3x3 embutido na tampa da caixa, estimando o{' '}
              <strong className="text-[#facc15]">número mínimo de movimentos</strong> necessários para que a posição das 5 peças no tabuleiro fique idêntica à imagem da Carta de Objetivo. Se a estimativa e a execução estiverem corretas, o jogador marca 1 ponto. O primeiro jogador a alcançar{' '}
              <strong className="text-white">6 pontos</strong> vence!
            </p>
          </section>

          {/* Movimentos das 5 Peças */}
          <section>
            <h3 className="text-base font-semibold text-white mb-3">
              02. Movimentos das 5 Peças de Xadrez
            </h3>
            <p className="text-xs text-[#cbb8a4] mb-4">
              Regra fundamental: As peças <strong className="text-white">só podem ser movidas para uma casa vazia</strong> (não há captura de peças). Nenhuma peça pode atravessar ou pular sobre outra, exceto o Cavalo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pieceRules.map((item) => (
                <div
                  key={item.piece}
                  className="p-3.5 rounded-lg bg-[#251912] border border-[#3d2b1f]"
                >
                  <div className="flex items-center gap-2.5 font-semibold text-white">
                    <span className="text-xl text-[#facc15]">{item.symbol}</span>
                    <span>{item.name}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#d6c5b3]">{item.rule}</p>
                  <p className="mt-1 text-xs text-[#f59e0b] font-medium">
                    {item.restriction}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Fluxo da Partida e Níveis */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-[#facc15]" />
                <span>03. Fluxo da Rodada (4 Passos)</span>
              </h3>
              <ol className="space-y-2 text-xs text-[#d6c5b3] list-decimal list-inside">
                <li>
                  <strong className="text-white">Sacar o Desafio:</strong> Uma Carta de Objetivo é revelada ao lado do tabuleiro.
                </li>
                <li>
                  <strong className="text-white">Declarar Lances:</strong> Os jogadores calculam mentalmente o mínimo de lances. Quem declarar primeiro um número vira a ampulheta.
                </li>
                <li>
                  <strong className="text-white">Decisão do Oponente:</strong> Enquanto a ampulheta corre, o oponente decide se aceita ou se desafia tentando resolver em <strong className="text-white">menos lances</strong>.
                </li>
                <li>
                  <strong className="text-white">Executar o Plano:</strong> Se o oponente não reagir, quem declarou executa; se concluir dentro dos lances anunciados, ganha 1 ponto (senão o ponto vai ao oponente). Se o oponente desafiar com menos lances e conseguir, ele leva o ponto!
                </li>
              </ol>
              <p className="mt-3 text-xs text-[#a8927d]">
                <strong className="text-white">Após marcar um ponto:</strong> As peças permanecem em suas posições finais no tabuleiro! Uma nova carta é revelada e o jogo continua até 6 pontos.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-[#facc15]" />
                <span>04. Níveis 1, 2, 3 e Desafio Bônus</span>
              </h3>
              <div className="space-y-2.5 text-xs text-[#d6c5b3]">
                <div className="p-2.5 rounded bg-[#251912] border border-[#3d2b1f]">
                  <strong className="text-white">Nível 1 (Padrão):</strong> Resolva a Carta de Objetivo exatamente na orientação em que foi colocada na mesa.
                </div>
                <div className="p-2.5 rounded bg-[#251912] border border-[#3d2b1f]">
                  <strong className="text-white">Nível 2 (Rotação da Carta):</strong> Durante a execução, você pode girar a Carta de Objetivo em <strong className="text-[#facc15]">90°</strong> (horário ou anti-horário) ao custo de <strong className="text-white">1 lance</strong>, ou <strong className="text-[#facc15]">180°</strong> ao custo de <strong className="text-white">2 lances</strong>.
                </div>
                <div className="p-2.5 rounded bg-[#251912] border border-[#3d2b1f]">
                  <strong className="text-white flex items-center gap-1.5">
                    <FlipHorizontal className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>Nível 3 (Espelhamento da Carta):</span>
                  </strong>{' '}
                  Além das regras anteriores, você pode espelhar a Carta de Objetivo horizontalmente ou verticalmente. Cada espelhamento custa <strong className="text-white">1 lance</strong>.
                </div>
                <div className="p-2.5 rounded bg-[#251912] border border-[#3d2b1f]">
                  <strong className="text-white flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>Desafio Bônus (2 Cartas) & Modo Solo:</span>
                  </strong>{' '}
                  Saque 2 cartas de objetivo simultaneamente e estime o total de lances para concluir ambas em sequência (você escolhe qual concluir primeiro; ações de giro/espelho podem ser aplicadas em uma das duas cartas).
                </div>
              </div>
            </div>
          </section>

          {/* Exemplo Oficial do Manual */}
          <section className="p-4 rounded-xl bg-[#271b13] border border-[#4a3425] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white">
                Exemplo Oficial do Manual (Página 2 / 6 — Solução em 4 Lances)
              </h4>
              <p className="text-xs text-[#cbb8a4] mt-1">
                1. Cavalo para Superior Esquerda (A3) · 2. Torre para Inferior Direita (C1) · 3. Rei para Inferior Centro (B1) · 4. Dama para Meio Esquerda (A2).
              </p>
            </div>
            <button
              onClick={() => {
                onLoadOfficialExample();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-[#d4a359] hover:bg-[#e0b26b] text-[#160f0a] font-semibold text-xs whitespace-nowrap shrink-0 transition-colors"
            >
              Praticar Exemplo do Manual
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
