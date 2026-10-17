import React, { useState, useRef } from 'react';
import {
  X,
  GraduationCap,
  Compass,
  Cpu,
  BookOpen,
  Users,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface PedagogicalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PedagogicalModal: React.FC<PedagogicalModalProps> = ({
  isOpen,
  onClose,
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

  const movementTrainingPoints = [
    {
      title: 'Cada tipo de passo aparece em todo problema.',
      body: 'São exatamente um rei, uma dama, uma torre, um bispo e um cavalo. Não dá para passar a partida inteira movendo só peão. Em poucos minutos a pessoa usou os cinco modos de andar.',
    },
    {
      title: 'A casa ocupada é parede.',
      body: 'Sem captura, a única pergunta útil é: esta linha está livre até a casa vazia? Rei, dama, torre e bispo param diante de qualquer peça. O aluno passa a contar casas vazias no caminho, que é o gesto motor de calcular uma torre aberta ou um bispo longo numa partida real.',
    },
    {
      title: 'A dama deixa de ser “a peça que vai a qualquer lugar”.',
      body: 'No 3×3 ela é, de forma visível, a torre mais o bispo. Quem treina aqui descreve o lance da dama como “subindo a coluna” ou “na diagonal”, e leva esse vocabulário para o tabuleiro grande.',
    },
    {
      title: 'O bispo fica preso à cor, e a cor está desenhada no chão.',
      body: 'As casas escuras são os quatro cantos e o centro. As claras são o meio de cada lado. O bispo começa numa casa escura e só anda na diagonal, então ele nunca pisa numa casa clara. A regra clássica — “o bispo não troca de cor” — vira algo que se vê, sem precisar de um tabuleiro de 64 casas para perceber.',
    },
    {
      title: 'O cavalo vira um conjunto pequeno de chegadas.',
      body: 'O L (duas casas numa direção e uma para o lado) cabe na palma da mão. Ele é a única peça que salta. E há uma regra própria deste jogo: o cavalo nunca pode ser colocado na casa central, B2. O centro deixa de ser um atalho automático. A pessoa escolhe um canto ou uma borda, e precisa dizer o L em voz alta antes de soltar a peça.',
    },
    {
      title: 'O rei é a dama com passo de uma casa.',
      body: 'Colocar os dois lado a lado ensina alcance. A mesma direção, distâncias diferentes.',
    },
    {
      title: 'O lance bom é anunciado antes de ser feito.',
      body: 'A rodada pede um número mínimo e só depois a execução. Isso é cálculo: simular a sequência de cabeça, segurar o tabuleiro imaginário e só então mover. É a habilidade que o xadrez competitivo chama de visualizar a variante. Aqui ela é o placar.',
    },
    {
      title: 'Chegar na carta e chegar no mínimo são coisas diferentes.',
      body: 'Um caminho longo também reproduz a figura. O ponto, porém, fica com quem usou menos lances. O treino deixa de ser “consegui” e passa a ser “consegui sem desperdício”. Na versão digital, o solucionador mostra esse mínimo quando a pessoa quer comparar o próprio plano com o caminho mais curto. A diferença entre os dois números é o conteúdo da aula.',
    },
    {
      title: 'A posição não é apagada.',
      body: 'Como as peças permanecem, o problema seguinte começa de um lugar que já tem história. O aluno sente que um lance de agora abre ou fecha o problema de depois — a mesma razão pela qual, no xadrez, desenvolve-se peça pensando na casa que ela vai ocupar, e não só na casa que ela deixa.',
    },
    {
      title: 'Girar a carta é aprender a sentar do outro lado da mesa.',
      body: 'No nível 2, a mesma figura pode ser lida de cabeça para baixo ou de lado, e cada giro entra na conta. É o treino de quem joga de pretas e precisa reconhecer um padrão que aprendeu olhando da outra ponta. No nível 3, o espelho acrescenta a reflexão: esquerda e direita trocam de lugar, como numa casa vista no espelho.',
    },
  ];

  const ageTable = [
    {
      range: '6 e 7 anos',
      grade: '1º e 2º ano',
      fits: 'Conhecer o nome e o passo de uma peça por vez, numa casa só, com um adulto nomeando as direções.',
      weighs: 'Estimar um mínimo, respeitar bloqueio e jogar no tempo da ampulheta.',
    },
    {
      range: '8 a 10 anos',
      grade: '3º ao 5º ano',
      fits: 'Nível 1 completo: coordenadas A1–C3, caminho livre, cavalo em L, bispo na cor, anunciar um número curto e executar. É a faixa para a qual o jogo físico foi desenhado.',
      weighs: 'Giro e espelho como parte da conta de lances.',
    },
    {
      range: '11 a 14 anos',
      grade: '6º ao 9º ano',
      fits: 'Níveis 2 e 3, desafio entre pares, bônus com duas cartas e a conversa sobre simetria e giro de 90°.',
      weighs: 'Pouco. A ampulheta pede mediação se o grupo ainda se frustra com tempo curto.',
    },
    {
      range: '15 anos em diante',
      grade: 'Ensino médio, clubes e adultos',
      fits: 'Partida inteira até 6 pontos, comparação com o caminho mínimo e leitura do problema como busca: estado inicial, estado final, custo de cada ação.',
      weighs: 'Nada estrutural. O tabuleiro pequeno continua difícil, porque a dificuldade está na economia, não no tamanho.',
    },
  ];

  const mathSkills = [
    {
      code: 'EF01MA11 e EF01MA12',
      desc: 'Localização com a própria posição e com um ponto de referência, usando direita, esquerda, em frente, atrás. No 1º ano o jogo inteiro é cedo; uma casa e uma peça, nomeadas pelo adulto, cabem como jogo de linguagem espacial.',
    },
    {
      code: 'EF02MA12',
      desc: 'Localização e deslocamento com mais de um ponto de referência, indicando mudança de direção e de sentido.',
    },
    {
      code: 'EF04MA16',
      desc: 'Deslocamentos em malhas quadriculadas, com direita e esquerda, mudança de direção e noções de paralelo e perpendicular. A torre anda em linhas e colunas; o bispo anda na diagonal, que corta essas linhas.',
    },
    {
      code: 'EF05MA14 e EF05MA15',
      desc: 'Coordenadas no primeiro quadrante, representação de deslocamentos, mudanças de direção e de sentido e giros. As letras A–C e os números 1–3 são um plano cartesiano de bolso. O nível 2 torna o “giro” da habilidade EF05MA15 um objeto da jogada, não um enfeite da fala: girar a carta 90° custa um lance e muda o problema.',
    },
    {
      code: 'EF07MA20',
      desc: 'Simétrico de figuras em relação aos eixos. O espelho horizontal e o vertical do nível 3 são essa operação, feita sobre a carta.',
    },
    {
      code: 'EF08MA18',
      desc: 'Figuras obtidas por composição de translação, reflexão e rotação. Uma solução de nível 3 é exatamente isso: a peça se translada segundo sua regra, e a carta pode ser girada e refletida, com um custo para cada transformação.',
    },
  ];

  const computingSkills = [
    {
      title: 'O tabuleiro é uma matriz (EF04CO01 e EF07CO01)',
      desc: 'Cada peça ocupa uma posição definida por duas coordenadas. Mover é uma manipulação simples dessa matriz: a origem fica vazia, o destino recebe a peça. Isso é o objeto de EF04CO01 — reconhecer que um objeto pode ser representado por uma matriz em que cada componente tem coordenadas, e fazer manipulações simples sobre essa representação. No 7º ano, EF07CO01 pede soluções em que registros e matrizes descrevem a informação. A versão digital guarda o tabuleiro exatamente assim, como uma lista de nove posições.',
    },
    {
      title: 'A solução é um algoritmo (EF15CO02)',
      desc: 'Uma sequência de lances é um passo a passo que outra pessoa, ou o próprio tabuleiro, consegue executar. Errar a ordem faz o algoritmo falhar, mesmo que cada lance isolado seja legal. Isso conversa com EF15CO02: construir e simular algoritmos, sozinho ou em colaboração, que resolvam problemas com sequências de instruções. Anunciar o plano em voz alta, antes de mover, é simular.',
    },
    {
      title: 'O problema se parte — Decomposição (EF15CO04)',
      desc: '“Qual peça está no caminho da torre?” é um subproblema. “O cavalo consegue sair sem ocupar o centro?” é outro. A carta fecha quando as partes se recombinam numa ordem. É a decomposição de EF15CO04: dividir um problema complexo em partes menores, resolvê-las e combinar as soluções. No bônus, a decomposição é explícita: duas cartas, uma de cada vez, e a saída da primeira é a entrada da segunda.',
    },
    {
      title: 'Entrada, saída e custo (EF69CO05)',
      desc: 'A posição atual é a entrada. A carta é a saída esperada. Cada lance, giro ou espelho é uma transformação com custo 1 (ou 2, no giro de 180°). EF69CO05 define problema como relação entre insumos de entrada e resultados de saída. Poucos jogos de mesa deixam essa definição tão literal.',
    },
    {
      title: 'O mesmo problema, várias instâncias (EF06CO06)',
      desc: 'São 60 cartas e, a cada ponto, uma posição inicial diferente. A regra das peças não muda. Muda o caso. EF06CO06 pede comparar instâncias de um mesmo problema, achar o que se repete e o que varia, e tratar os casos de forma genérica. A regra do bispo, por exemplo, é o parâmetro que vale para todas as cartas: se a casa não é escura, o lance é ilegal, qualquer que seja o desenho.',
    },
    {
      title: 'Ensino Médio — Busca no espaço de estados e refinamento (EM13CO02)',
      desc: 'O caminho mínimo é calculado por uma busca que examina os estados do tabuleiro — as 15.120 maneiras de colocar cinco peças distintas em nove casas — junto com as orientações possíveis da carta. O aluno pode, depois de tentar, ver que existia um caminho mais curto e refazer o próprio plano em níveis de detalhe. Isso sustenta EM13CO02: explorar a solução por refinamentos, em vários níveis de abstração, da especificação até a execução.',
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto no-scrollbar bg-black/85 px-3 sm:px-6 pt-6 pb-16 select-text cursor-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pedagogical-modal-title"
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl mx-auto rounded-xl bg-[#1c130d] border border-[#3d2b1f] p-5 sm:p-8 text-[#f5efe6] shadow-2xl select-text"
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#3d2b1f]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#d4a359] font-medium">
              <GraduationCap className="w-4 h-4" />
              <span>Documentação Formal, Filosófica e Curricular (BNCC & Computação)</span>
            </div>
            <h2
              id="pedagogical-modal-title"
              className="font-display italic text-2xl sm:text-3xl font-bold text-white mt-1"
            >
              Área Pedagógica — The Royal Chess / The Royal Study
            </h2>
            <p className="text-xs text-[#b8a38e] mt-1">
              Versão digital por Diego Duenhas · Jogo físico por Stan van Rooijen (Philos, artigo 2850) · 1 a 2 jogadores · 8+ anos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#271b13] hover:bg-[#36251a] text-xs font-medium text-[#e2d5c6] border border-[#3d2b1f] transition-colors cursor-pointer"
              title="Copiar todo o conteúdo pedagógico"
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
              aria-label="Fechar área pedagógica"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content (100% faithful to README.md) */}
        <div className="mt-6 space-y-8 text-sm leading-relaxed text-[#e2d5c6] select-text">
          {/* Intro */}
          <section className="space-y-3">
            <p>
              Edição digital de um estudo de xadrez em miniatura: cinco peças, um tabuleiro de nove casas e uma carta que mostra exatamente onde elas precisam chegar. Ganha quem enxerga o caminho mais curto e consegue prová-lo.
            </p>
            <p>
              O desenvolvimento desta versão foi feito por{' '}
              <a
                href="https://diegoduenhas.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#facc15] underline hover:text-white inline-flex items-center gap-1"
              >
                <span>Diego Duenhas (diegoduenhas.com.br)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              . Ela é baseada no jogo físico da empresa <strong className="text-white">Philos</strong> chamado <strong className="text-white">The Royal Chess</strong> — publicado no catálogo da Philos como <strong className="text-white">The Royal Study</strong> (artigo 2850), criado pelo designer <strong className="text-white">Stan van Rooijen</strong>. A Philos indica o jogo para 1 ou 2 pessoas, a partir dos 8 anos, em partidas de cerca de 20 minutos. Os objetivos de aprendizagem declarados pela editora são concentração, criatividade, raciocínio lógico e rapidez.
            </p>
            <div className="rounded-lg overflow-hidden border border-[#3d2b1f] bg-[#160f0a] p-2">
              <img
                src="/docs/images/tabuleiro-3x3.png"
                alt="Tabuleiro 3×3 com a posição inicial do exemplo do manual"
                referrerPolicy="no-referrer"
                className="w-full h-auto rounded object-contain max-h-64 mx-auto"
              />
            </div>
          </section>

          {/* 1. A filosofia: um estudo, não uma batalha */}
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#facc15]" />
              <span>01. A Filosofia: Um Estudo, Não uma Batalha</span>
            </h3>
            <p>
              No xadrez, um <em>estudo</em> é uma posição composta de propósito. Sobram poucas peças, existe uma ideia precisa e o valor do lance está na necessidade, não no espetáculo. O nome <em>The Royal Study</em> leva isso ao pé da letra. O tabuleiro inteiro cabe na tampa da caixa. Não há peões, não há captura, não há xeque. O conflito foi trocado por congestionamento: cinco oficiais disputam espaço em nove casas, e quatro casas vazias são o ar que o problema precisa para respirar.
            </p>
            <p>
              A pergunta de cada rodada é sempre a mesma: <strong className="text-white">Dada a posição em que as peças estão agora, qual é o menor número de lances que as deixa iguais à figura da carta?</strong>
            </p>
            <p>
              Essa pergunta muda o que conta como um bom lance. Um lance legal que chega na carta em sete movimentos perde para um caminho de quatro. O jogo treina <strong className="text-[#facc15]">economia de intenção</strong>. Antes de tocar numa peça, a pessoa anuncia um número. Esse número é uma promessa. Se a execução confirma a promessa, vale um ponto. Se a promessa era otimista demais, o ponto vai para o outro lado. A ampulheta existe para que a velocidade de ver e a honestidade da conta convivam: quem fala primeiro abre a janela, e o oponente ainda pode enxergar um caminho mais curto.
            </p>
            <p>
              Depois do ponto, as peças <strong className="text-white">ficam onde pararam</strong>. A carta seguinte nasce da posição que você mesmo construiu. A partida não reinicia o tabuleiro a cada problema. Isso aproxima o estudo de uma partida de verdade, em que a posição de agora é herança do lance anterior.
            </p>
          </section>

          {/* 2. Por que este jogo treina movimentação */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#facc15]" />
              <span>02. Por Que Este Jogo Treina Movimentação</span>
            </h3>
            <p>
              Quem está aprendendo xadrez costuma conhecer o nome das peças antes de enxergar o que elas realmente fazem. Numa partida completa, essa lacuna se esconde. Há 32 peças, capturas, ameaças e a pressa de “fazer alguma coisa”. O olho vai para a peça que pode ser tomada, e a geometria do movimento passa em branco. Aqui a geometria é o jogo inteiro.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {movementTrainingPoints.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-[#251912] border border-[#3d2b1f]"
                >
                  <h4 className="font-semibold text-white text-xs sm:text-sm">
                    {pt.title}
                  </h4>
                  <p className="mt-1.5 text-xs text-[#d6c5b3]">{pt.body}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#251912] border border-[#4a3425]">
              <h4 className="text-sm font-semibold text-white mb-2">
                Roteiro Prático para Uso em Aula ou em Casa
              </h4>
              <ol className="space-y-1.5 text-xs text-[#d6c5b3] list-decimal list-inside">
                <li>
                  Antes de mover, a pessoa diz o nome da peça, a casa de saída e a casa de chegada (<strong className="text-white">“torre de A1 para C1”</strong>).
                </li>
                <li>
                  Em seguida diz por que o caminho está livre, ou por que o cavalo pode saltar.
                </li>
                <li>
                  Para o bispo, a pergunta fixa é: <strong className="text-white">“ele continua numa casa escura?”</strong>
                </li>
                <li>
                  Para o cavalo, o dedo desenha o L e para se a chegada for <strong className="text-white">B2</strong>.
                </li>
                <li>
                  Só então se anuncia o total de lances. Quem está ensinando pode pedir uma segunda tentativa com um número menor, antes de aceitar a primeira ideia.
                </li>
                <li>
                  Quando a carta fecha, as peças ficam. A conversa seguinte é: <strong className="text-white">“o que esta posição já deixa pronto para a próxima carta?”</strong>
                </li>
              </ol>
              <p className="mt-2.5 text-xs text-[#b8a38e]">
                As casas legais destacadas na versão digital são andaime. Servem no começo, para a regra ficar visível. Quando o objetivo é treinar a visualização, o combinado passa a ser anunciar o lance antes do clique.
              </p>
            </div>

            <div className="rounded-lg overflow-hidden border border-[#3d2b1f] bg-[#160f0a] p-2">
              <img
                src="/docs/images/niveis.png"
                alt="Nível 1 com a carta fixa, nível 2 com giro, nível 3 com espelho e o desafio de duas cartas"
                referrerPolicy="no-referrer"
                className="w-full h-auto rounded object-contain max-h-64 mx-auto"
              />
            </div>
          </section>

          {/* 3. Para quem o jogo é adequado */}
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#facc15]" />
              <span>03. Para Quem o Jogo é Adequado (Progressão por Idade e Ano Escolar)</span>
            </h3>
            <p className="text-xs text-[#d6c5b3]">
              A recomendação da Philos é <strong className="text-white">a partir de 8 anos</strong>, para 1 ou 2 jogadores. A adequação pedagógica é mais fina do que um único número, porque cada nível pede uma operação mental diferente:
            </p>

            <div className="overflow-x-auto rounded-lg border border-[#3d2b1f]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#271b13] text-white border-b border-[#3d2b1f]">
                    <th className="p-3 font-semibold">Faixa</th>
                    <th className="p-3 font-semibold">Idade Escolar Típica</th>
                    <th className="p-3 font-semibold">O Que Cabe Bem</th>
                    <th className="p-3 font-semibold">O Que Ainda Pesa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#36251a] bg-[#21160f]">
                  {ageTable.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-semibold text-[#facc15] whitespace-nowrap">
                        {row.range}
                      </td>
                      <td className="p-3 text-white whitespace-nowrap">
                        {row.grade}
                      </td>
                      <td className="p-3 text-[#d6c5b3]">{row.fits}</td>
                      <td className="p-3 text-[#b8a38e]">{row.weighs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-[#d6c5b3]">
              O jogo também serve a quem já joga xadrez e quer isolar a movimentação. Um enxadrista experiente não está “abaixo” do 3×3: ele está treinando, sem o ruído das capturas, a mesma pergunta que uma partida faz o tempo todo — <strong className="text-white">qual peça precisa sair do caminho, e em que ordem?</strong>
            </p>
          </section>

          {/* 4. Onde isso encontra a BNCC */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#facc15]" />
              <span>04. Onde Isso Encontra a BNCC (Matemática & Computação)</span>
            </h3>
            <p className="text-xs text-[#d6c5b3]">
              O jogo não substitui um componente curricular e não “cumpre” uma habilidade só por ser jogado. Ele oferece uma situação em que habilidades já previstas na <strong className="text-white">Base Nacional Comum Curricular (2018)</strong> e no complemento <strong className="text-white">Computação na Educação Básica</strong> (Parecer CNE/CEB nº 2/2022 e Resolução CNE/CEB nº 1/2022) podem ser exercidas de propósito com a mediação do professor.
            </p>

            {/* Competências Gerais */}
            <div className="p-4 rounded-lg bg-[#251912] border border-[#3d2b1f] space-y-2">
              <h4 className="text-sm font-semibold text-white">
                Competências Gerais que a Partida Exercita
              </h4>
              <p className="text-xs text-[#d6c5b3]">
                • <strong className="text-[#facc15]">Competência Geral 2:</strong> Pede curiosidade intelectual, investigação, elaboração e teste de hipóteses e resolução de problemas. Cada carta é uma hipótese numérica: “eu fecho em cinco”. A execução testa a hipótese na hora.
              </p>
              <p className="text-xs text-[#d6c5b3]">
                • <strong className="text-[#facc15]">Competência Geral 5:</strong> Trata do uso de tecnologias digitais para resolver problemas e exercer autoria. A versão digital é o artefato: o aluno lê uma representação, age sobre ela e recebe um retorno verificável.
              </p>
              <p className="text-xs text-[#d6c5b3]">
                • <strong className="text-white">Competências Específicas de Matemática:</strong> Raciocínio lógico e investigação, uso de processos matemáticos para modelar e resolver problemas e enfrentamento de situações-problema em vários registros, inclusive a descrição de um passo a passo.
              </p>
            </div>

            {/* Matemática */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-semibold text-white">
                Matemática: Do Mapa da Sala ao Giro de 90° (Unidade Temática: Geometria)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mathSkills.map((sk, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#251912] border border-[#3d2b1f]"
                  >
                    <div className="font-mono font-bold text-xs text-[#facc15]">
                      {sk.code}
                    </div>
                    <p className="mt-1 text-xs text-[#d6c5b3]">{sk.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#b8a38e]">
                O registro faz a ponte para a produção matemática: o aluno desenha a malha, escreve as coordenadas de saída e de chegada, marca o giro e compara dois caminhos.
              </p>
            </div>

            {/* Computação */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#38bdf8]" />
                <span>Computação: A Carta é um Problema com Entrada, Saída e Custo (Eixo: Pensamento Computacional)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {computingSkills.map((cs, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#251912] border border-[#3d2b1f]"
                  >
                    <div className="font-semibold text-xs text-[#38bdf8]">
                      {cs.title}
                    </div>
                    <p className="mt-1 text-xs text-[#d6c5b3]">{cs.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Limites e Créditos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-lg bg-[#251912] border border-[#3d2b1f]">
                <h4 className="text-xs font-semibold text-white">
                  O Que a Escola Não Deve Esperar do Jogo
                </h4>
                <p className="mt-1 text-xs text-[#d6c5b3]">
                  Ele não cobre álgebra, grandezas, probabilidade, nem os eixos Mundo Digital e Cultura Digital. Também não substitui o xadrez escolar completo: não há peão, roque, captura, xeque-mate nem estratégia de abertura. O lugar dele é anterior e paralelo a isso — o lugar em que o movimento, a coordenada, o bloqueio, a simetria e o passo a passo ficam limpos o bastante para serem ensinados.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#251912] border border-[#3d2b1f]">
                <h4 className="text-xs font-semibold text-white">
                  O Que a Versão Digital Acrescenta & Créditos
                </h4>
                <p className="mt-1 text-xs text-[#d6c5b3]">
                  A edição feita por <strong className="text-white">Diego Duenhas</strong> (
                  <a
                    href="https://diegoduenhas.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#facc15] underline hover:text-white"
                  >
                    diegoduenhas.com.br
                  </a>
                  ) coloca o jogo numa mesa em 3D com validação de casas legais, contagem de giros/espelhos e busca do caminho mínimo entre as 15.120 posições possíveis. Jogo físico original: <em>The Royal Chess / The Royal Study</em> (Philos, design de Stan van Rooijen).
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
