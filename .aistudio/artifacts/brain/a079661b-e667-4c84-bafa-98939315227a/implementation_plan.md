# The Royal Study — Edição 3D Interativa

Recriação fiel em Three.js do jogo de tabuleiro **The Royal Study** (criado por Stan van Rooijen e publicado pela Philos), combinando a estética física da caixa azul real, peças torneadas em madeira clara, baralho de 60 cartas de objetivo e ampulheta 3D com todas as regras oficiais dos Níveis 1, 2 e 3, Desafio Bônus e modos Solo/Cooperativo e Competitivo.

---

## Revisão do Usuário e Decisões Críticas

> [!IMPORTANT]
> **Fidelidade Visual e Regras Oficiais Confirmadas**
> O projeto segue integralmente o manual oficial anexado e as fotografias do produto físico:
> - **Tabuleiro 3x3 Embutido na Caixa**: Caixa azul (`#1E4598`) com painel superior verde-petróleo escuro (`#0B3B42`), assinatura caligráfica *"The Royal Study"*, silhuetas brancas das 5 peças e grade 3x3 em madeira clara (bordo) e escura (mogno).
> - **Regras Estritas das 5 Peças**: Movimento apenas para casas vazias (sem capturas); bloqueio de linha de visão para Dama, Torre e Bispo; **Bispo restrito às 5 casas escuras** (4 cantos e centro); **Cavalo salta sobre peças e nunca ocupa a casa central** (`1,1`).
> - **Três Níveis + Desafio Bônus**: Nível 1 (padrão), Nível 2 (rotação da carta em 90° por 1 lance ou 180° por 2 lances), Nível 3 (espelhamento horizontal ou vertical da carta por 1 lance) e Desafio Bônus (2 cartas de objetivo resolvidas em sequência).

---

## 1. Visão Geral e Conceito Central

- **O Que Faz**: Permite jogar **The Royal Study** em um ambiente 3D interativo de mesa. Os jogadores observam a posição atual das 5 peças de madeira no tabuleiro 3x3 e a(s) carta(s) de objetivo sorteada(s), estimam o número mínimo de lances para atingir a configuração da carta e executam o plano movendo as peças (e rotacionando ou espelhando a carta nos níveis avançados).
- **Modos de Jogo**:
  - **Modo Solo / Cooperativo**: Foco na resolução tática em menos movimentos, com opção de salvar/repetir a posição inicial da rodada, desfazer lances, comparar com o número mínimo ótimo calculado pelo motor de busca e visualizar a solução ótima passo a passo.
  - **Modo Competitivo (2 Jogadores Local ou vs. Bot)**: Segue os 4 passos oficiais com a ampulheta 3D — anunciar estimativa de lances, virar a ampulheta para decisão do oponente (aceitar ou desafiar com menos lances), executar o plano dentro do limite anunciado e pontuar até **6 pontos** (mantendo as peças em suas posições finais para a próxima carta).
- **Valor Principal**: Une a experiência tátil do jogo físico de madeira a um solucionador matemático exato (Busca em Largura / BFS no grafo de estados do tabuleiro 3x3 + transformações de carta) que valida instantaneamente o menor número possível de lances em qualquer nível.

---

## 2. Experiência do Usuário e Design Visual

### Fluxo de Jogo Passo a Passo
1. **Preparação na Mesa 3D**: Na primeira rodada, uma carta inicial define a posição das 5 peças sobre o tabuleiro 3x3 da caixa. Em seguida, uma nova carta de objetivo (ou duas, no Desafio Bônus) desliza do baralho para a frente da caixa.
2. **Fase de Estimativa e Ampulheta**:
   - No modo **Competitivo**, o primeiro jogador declara sua estimativa de lances e vira a ampulheta 3D. Enquanto a areia escorre, o oponente pode clicar em *"Desafiar com Menos Lances"* ou *"Mandar Executar"*.
   - No modo **Solo/Cooperativo**, o jogador pode declarar sua meta de lances ou iniciar os movimentos imediatamente, buscando atingir o mínimo possível.
3. **Fase de Execução no Tabuleiro 3D**:
   - Ao clicar em uma peça de madeira (Rei, Dama, Torre, Bispo ou Cavalo), ela se eleva suavemente e as casas vazias válidas segundo as regras daquela peça brilham discretamente no tabuleiro 3x3.
   - Clicar em uma casa válida move a peça em um arco suave (com salto mais alto para o Cavalo) e incrementa o contador de lances.
   - No **Nível 2**, botões de ação sobre a carta de objetivo permitem girá-la 90° no sentido horário ou anti-horário (+1 lance) ou 180° (+2 lances), animando a rotação física da carta 3D na mesa.
   - No **Nível 3**, botões adicionais permitem espelhar a carta horizontalmente ou verticalmente (+1 lance por espelhamento), virando e atualizando a orientação da carta em 3D.
4. **Verificação e Próxima Rodada**:
   - Assim que a disposição das peças no tabuleiro 3x3 coincide exatamente com a carta de objetivo (ou em sequência para ambas as cartas no Desafio Bônus), o ponto é atribuído conforme a regra de estimativa.
   - As peças **permanecem em suas posições finais** no tabuleiro, uma nova carta de objetivo é puxada do monte de 60 cartas e a partida segue até 6 pontos.

### Identidade Visual, Iluminação e Ergonomia 3D
- **Direção Estética**: Diorama de mesa realista (*Tabletop Studio Showcase*), reproduzindo fielmente as fotos do jogo físico sobre um tampo de nogueira escura.
- **Modelagem Procedural Composta (3 a 12 partes por modelo)**:
  - **Peças de Xadrez em Madeira Clara (`LatheGeometry` + `ExtrudeGeometry`)**: Cada uma das 5 peças é construída como um grupo composto com base torneada em camadas, colarinho chanfrado e topo esculpido característico (cruz chanfrada do Rei, coroa recortada da Dama, fenda diagonal na mitra do Bispo, ameias da Torre e perfil esculpido do Cavalo), com textura procedural de veios de madeira clara e verniz acetinado.
  - **Caixa "The Royal Study"**: Caixa azul com bordas chanfradas, topo em verde-petróleo com filete branco, logotipo, título caligráfico, ícones brancos das 5 peças e cavidade rebaixada contendo o tabuleiro 3x3 em madeira clara e escura.
  - **Baralho de 60 Cartas e Ampulheta**: Monte de cartas ao lado da caixa, carta(s) ativa(s) com ícones diagonais fiéis às cartas originais e marcador triangular de orientação no topo, além da ampulheta com tampas pretas, bulbo de vidro físico translúcido e fluxo de areia animado.
- **Paleta e Tipografia**:
  - Superfície de fundo: Nogueira escura (`#2B1D14`) e iluminação de estúdio quente/fria com sombras suaves (`PCFSoftShadowMap`).
  - Tipografia: `Cormorant Garamond` (itálico/editorial) para o título clássico *"The Royal Study"*, `Plus Jakarta Sans` para controles de interface e `JetBrains Mono` (`tabular-nums`) para contadores de lances, placar de 6 pontos e cronômetro da ampulheta.
- **Layout Viewport-First (Doca Inferior Recolhível)**:
  - O canvas WebGL ocupa `100vw x 100vh` sem painéis laterais obstruindo a caixa ou as cartas.
  - Um cabeçalho mínimo no topo exibe o placar (até 6 pontos), o nível ativo (Nível 1, 2, 3, Bônus) e botão de acesso ao Manual Oficial Ilustrado.
  - Uma doca inferior centralizada e recolhível (*Zen Mode*) reúne os controles de estimativa de lances, rotação/espelhamento da carta, botão de repetir posição inicial, desfazer, câmera (Vista Superior / Perspectiva de Mesa) e áudio sintético de peças de madeira.

---

## 3. Decisões de Produto e Trade-Offs

- **Decisão 1: Solucionador Matemático Exato (BFS) Integrado**
  - *Abordagem Escolhida*: Implementar um algoritmo de Busca em Largura (BFS) sobre o espaço de estados do tabuleiro 3x3 combinado com os estados de orientação da carta (1 orientação no Nível 1, 4 rotações no Nível 2, 8 transformações diedrais no Nível 3).
  - *Por quê*: Como o tabuleiro 3x3 possui 9 casas e 5 peças ($9 \times 8 \times 7 \times 6 \times 5 = 15.120$ estados possíveis), o BFS calcula em menos de 5 milissegundos o caminho ótimo exato para qualquer par de cartas, permitindo que o Bot jogue com precisão, que o jogador confira se havia uma solução menor e veja a animação passo a passo.
- **Decisão 2: Geração das 60 Cartas de Objetivo Válidas**
  - *Abordagem Escolhida*: Conjunto curado e determinístico de 60 cartas únicas que respeitam rigorosamente as restrições do jogo físico (Bispo sempre em uma das 5 casas escuras; Cavalo nunca na casa central; todas as 5 peças em casas distintas e 100% alcançáveis entre si).
  - *Por quê*: Garante que nunca ocorra uma posição impossível quando as peças permanecem na posição final de uma rodada para a outra.

---

## 4. Arquitetura Técnica e Estratégia de Dados

### Diagrama de Arquitetura e Hierarquia de Componentes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Aplicação Principal (React)                      │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│     Cena 3D WebGL (Three.js Ref)      │ │   Camada HUD & Doca Inferior  │
├───────────────────────────────────────┤ ├───────────────────────────────┤
│ • Mesa de Madeira + Iluminação PBR    │ │ • Barra Superior: Placar 0-6, │
│ • Caixa 3D "The Royal Study" + 3x3    │ │   Seletor de Modo e Nível     │
│ • 5 Peças Compostas (Rei, Dama,       │ │ • Doca Inferior Recolhível:   │
│   Torre, Bispo, Cavalo) + Sombras     │ │   - Fase de Lance / Ampulheta │
│ • Baralho 60 Cartas + Carta(s) Ativa  │ │   - Ações Nível 2 (Girar 90°) │
│   (Animação de Giro 90° e Espelho)    │ │   - Ações Nível 3 (Espelhar)  │
│ • Ampulheta 3D com Areia Dinâmica     │ │   - Repetir / Desfazer / Dica │
│ • Raycaster (Seleção e Casas Válidas) │ │ • Modal: Regras Oficiais PDF  │
└───────────────────┬───────────────────┘ └───────────────┬───────────────┘
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             Motor de Regras "The Royal Study" & Solver BFS              │
├─────────────────────────────────────────────────────────────────────────┤
│ • Validador de Movimentos 3x3 (Sem captura, bloqueio linear, Bispo nas  │
│   casas escuras, Cavalo salta e proibido no centro 1,1)                 │
│ • Transformador Matricial de Cartas (Rotação 90°/180° + Flip H/V)       │
│ • Solver BFS Ótimo (Caminho mínimo para 1 ou 2 cartas nos Níveis 1-3)   │
│ • Sintetizador Web Audio (Sons táteis de madeira, carta e ampulheta)    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Dados e Mapeamento de Estado Interativo
- **Estado do Tabuleiro (`BoardState`)**: Vetor de 9 posições (`0..8` representando a grade 3x3) mapeando onde estão `KING`, `QUEEN`, `ROOK`, `BISHOP` e `KNIGHT`, além do snapshot da posição inicial da rodada (`roundStartBoard`) para permitir a regra de repetir a tentativa.
- **Estado da(s) Carta(s) de Objetivo (`ObjectiveCardState`)**: Armazena a matriz base 3x3 da carta sorteada, a rotação acumulada (`0`, `90`, `180`, `270`), o estado de espelhamento (`flipH`, `flipV`) e o custo em lances gasto em transformações de carta durante a execução.
- **Fluxo da Rodada (`RoundPhase`)**:
  - `ESTIMATE`: Jogadores observam o tabuleiro e a carta; declaração do número de lances inicia o timer da ampulheta (`CHALLENGE_WINDOW`).
  - `CHALLENGE_WINDOW`: Contagem regressiva da ampulheta 3D; oponente (humano ou Bot) pode reduzir o lance anunciado ou mandar o declarante executar.
  - `EXECUTE`: Jogador ativo move as peças no 3D e/ou gira/espelha a carta (Níveis 2 e 3). A cada ação, o sistema valida se a configuração do tabuleiro 3x3 igualou a carta ativa.
  - `ROUND_COMPLETE` / `GAME_OVER`: Exibe o resultado da rodada comparando lances realizados vs. anunciados (e mostra a solução ótima do Solver se desejar), mantendo as peças onde pararam para o sorteio da próxima carta até que um jogador alcance 6 pontos.
