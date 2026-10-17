import React, { useState, useRef } from 'react';
import { X, RotateCw, FlipHorizontal, Award, Hourglass, Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handleCopyAll = () => {
    if (!contentRef.current) return;
    const text = contentRef.current.innerText;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

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
      restriction: 'Para na primeira peça que encontrar (não pula).',
    },
    {
      piece: PieceType.ROOK,
      name: 'Torre (Rook / Turm)',
      symbol: '♖',
      rule: 'Move-se quantas casas vazias quiser na horizontal ou na vertical.',
      restriction: 'Para na primeira peça que encontrar (não pula).',
    },
    {
      piece: PieceType.BISHOP,
      name: 'Bispo (Bishop / Läufer)',
      symbol: '♗',
      rule: 'Move-se quantas casas vazias quiser na diagonal.',
      restriction: 'REGRA ESPECIAL: O Bispo permanece sempre nas 5 casas escuras (os 4 cantos e o centro).',
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
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto no-scrollbar bg-black/85 px-3 sm:px-6 pt-6 pb-16 select-text cursor-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl mx-auto rounded-xl bg-[#1c130d] border border-[#3d2b1f] p-5 sm:p-8 text-[#f5efe6] shadow-2xl select-text"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#3d2b1f]">
          <div>
            <h2
              id="rules-modal-title"
              className="font-display italic text-2xl sm:text-3xl font-bold text-white"
            >
              The Royal Study — Regras Oficiais
            </h2>
            <p className="text-xs text-[#b8a38e] mt-1">
              Autor e Designer: Stan van Rooijen · Publicado por Philos (Artigo 2850) · 5 Peças · 60 Cartas de Objetivo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#271b13] hover:bg-[#36251a] text-xs font-medium text-[#e2d5c6] border border-[#3d2b1f] transition-colors cursor-pointer"
              title="Copiar todo o texto das regras"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                  <span className="text-[#4ade80]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#d4a359]" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#cbb8a4] hover:text-white hover:bg-[#2c1e15] transition-colors cursor-pointer"
              aria-label="Fechar manual de regras"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-8 text-sm leading-relaxed text-[#e2d5c6] select-text">
          {/* Visão Geral */}
          <section>
            <h3 className="text-base font-semibold text-white mb-2">
              01. Visão Geral do Jogo
            </h3>
            <p>
              Em <strong className="text-white">The Royal Study</strong>, os jogadores competem para resolver pequenos problemas de xadrez em um tabuleiro 3×3 embutido na tampa da caixa, estimando o{' '}
              <strong className="text-[#facc15]">número mínimo de movimentos</strong> necessários para que a posição das 5 peças no tabuleiro fique idêntica à imagem da Carta de Objetivo. As colunas são <strong className="text-white">A, B e C</strong> (da esquerda para a direita) e as fileiras são <strong className="text-white">1, 2 e 3</strong> (de baixo para cima; <strong className="text-white">B2</strong> é o centro). Se a estimativa e a execução estiverem corretas, o jogador marca 1 ponto. O primeiro jogador a alcançar{' '}
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

            <div className="mt-4 rounded-lg overflow-hidden border border-[#3d2b1f] bg-[#160f0a] p-2">
              <img
                src="/docs/images/movimentos-das-pecas.png"
                alt="Movimentos do rei, da dama, da torre, do bispo e do cavalo no tabuleiro 3x3"
                referrerPolicy="no-referrer"
                className="w-full h-auto rounded object-contain max-h-72 mx-auto"
              />
            </div>
          </section>

          {/* Fluxo da Partida e Níveis */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-[#facc15]" />
                <span>03. Como Corre uma Rodada (4 Passos)</span>
              </h3>
              <ol className="space-y-2 text-xs text-[#d6c5b3] list-decimal list-inside">
                <li>
                  <strong className="text-white">Revela-se a Carta:</strong> Na primeira vez, uma carta serve para montar as peças na caixa e sai de cena. A carta seguinte é o desafio.
                </li>
                <li>
                  <strong className="text-white">Alguém Anuncia um Número:</strong> Os dois olham o tabuleiro e a carta e pensam no mínimo de lances. Quem falar primeiro um número vira a ampulheta.
                </li>
                <li>
                  <strong className="text-white">O Outro Lado Decide:</strong> Enquanto a areia corre (20s nesta versão digital), o oponente pode aceitar aquele número ou prometer resolver com <strong className="text-white">menos</strong> lances.
                </li>
                <li>
                  <strong className="text-white">Quem Ficou com o Número Executa:</strong> Se cumprir o que anunciou, marca 1 ponto. Se não cumprir, o ponto vai para o adversário.
                </li>
              </ol>
              <p className="mt-3 text-xs text-[#a8927d]">
                <strong className="text-white">Após marcar um ponto:</strong> As peças permanecem nas casas finais! Uma nova carta entra e a partida segue até 6 pontos.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-[#facc15]" />
                <span>04. Os Níveis e o Desafio Bônus</span>
              </h3>
              <div className="space-y-2.5 text-xs text-[#d6c5b3]">
                <div className="p-2.5 rounded bg-[#251912] border border-[#3d2b1f]">
                  <strong className="text-white">Nível 1:</strong> A carta fica na orientação em que foi colocada na mesa. Só as peças se movem.
                </div>
                <div className="p-2.5 rounded bg-[#251912] border border-[#3d2b1f]">
                  <strong className="text-white">Nível 2 (Giro):</strong> Durante a execução, a carta pode girar. Um giro de <strong className="text-[#facc15]">90°</strong> para qualquer lado custa <strong className="text-white">1 lance</strong>; um giro de <strong className="text-[#facc15]">180°</strong> custa <strong className="text-white">2 lances</strong>.
                </div>
                <div className="p-2.5 rounded bg-[#251912] border border-[#3d2b1f]">
                  <strong className="text-white flex items-center gap-1.5">
                    <FlipHorizontal className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>Nível 3 (Espelho):</span>
                  </strong>{' '}
                  Além dos giros, a carta pode ser espelhada na horizontal ou na vertical. Cada espelho custa <strong className="text-white">1 lance</strong>.
                </div>
                <div className="p-2.5 rounded bg-[#251912] border border-[#3d2b1f]">
                  <strong className="text-white flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>Desafio Bônus (2 Cartas):</span>
                  </strong>{' '}
                  Valem duas cartas ao mesmo tempo, em qualquer nível. A pessoa anuncia o total para as duas, escolhe qual fechar primeiro e pode gastar giros ou espelhos numa delas.
                </div>
              </div>
            </div>
          </section>

          {/* Exemplo Oficial do Manual */}
          <section className="p-4 rounded-xl bg-[#271b13] border border-[#4a3425] space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Exemplo Completo do Manual (Solução em 4 Lances)
                </h4>
                <p className="text-xs text-[#cbb8a4] mt-1">
                  1. Cavalo para a superior esquerda (A3) · 2. Torre para a inferior direita (C1) · 3. Rei para o inferior centro (B1) · 4. Dama para a meio esquerda (A2).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLoadOfficialExample();
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-[#d4a359] hover:bg-[#e0b26b] text-[#160f0a] font-semibold text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Praticar Exemplo do Manual
              </button>
            </div>
            <div className="rounded-lg overflow-hidden border border-[#3d2b1f] bg-[#160f0a] p-2">
              <img
                src="/docs/images/exemplo-quatro-lances.png"
                alt="Sequência do exemplo oficial em quatro lances"
                referrerPolicy="no-referrer"
                className="w-full h-auto rounded object-contain max-h-60 mx-auto"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
