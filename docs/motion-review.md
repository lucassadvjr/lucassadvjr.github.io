# Análise e implementação — 25/09/2026

## Direção visual

Referência observada: https://landonorris.com/ (desktop e largura móvel). O site combina formas orgânicas, interação com o ponteiro e uma composição WebGL. Esta implementação é uma interpretação própria dessa linguagem, não uma reprodução do shader, do capacete ou dos assets da referência.

No portfólio, o símbolo Python que acompanhava o mouse foi substituído por um cursor circular com rastro fluido verde-lima. As partículas orbitais da cena Java foram substituídas por um campo em três faixas onduladas no fundo da página, com dispersão e retorno elástico ao redor do mouse. A fase das ondas, a profundidade e um impulso amortecido respondem ao scroll. O conteúdo, a identidade LS e o objeto Java foram preservados.

## Decisões técnicas

- Manter HTML, CSS e módulos JavaScript: a página estática não precisa de um framework para essas interações.
- Canvas 2D independente da CDN e do WebGL; nenhuma dependência adicionada.
- Fundo a até 30 atualizações por segundo, com limite de pontos e resolução. O cursor acompanha a taxa do navegador com interpolação baseada em tempo.
- Camadas decorativas sem captura de cliques e ocultas das tecnologias assistivas.
- Cursor nativo em dispositivos de toque, campos editáveis e navegação por teclado; foco visível nos controles.
- `prefers-reduced-motion` observado em tempo real, removendo os efeitos e interrompendo a animação Java.
- Pausa em aba oculta; cena Java também pausa fora da tela. Correção do identificador de frame que impedia a retomada após alternar de aba.
- A xícara procedural é renderizada antes da verificação assíncrona do GLB opcional, evitando que uma rede lenta deixe a cena vazia.
- Conteúdo das seções visível mesmo sem JavaScript: a ocultação para entrada animada só é aplicada após instalar o observador.
- Animações da cena Java usam um único delta de tempo, corrigindo a atualização do mixer de modelos importados.

## Próximas prioridades da análise

Antes de acrescentar mais efeitos, medir LCP, INP e CLS na hospedagem real e verificar contraste/tamanho dos textos menores. Fontes externas, imagens dos projetos e a cena 3D são os principais candidatos a otimização. Não há medição de Core Web Vitals de produção nesta alteração; limites de partículas não equivalem a uma garantia de FPS em todos os aparelhos.

## Verificação reproduzível

`node --check assets/js/motion-effects.js`

`node --check assets/js/main.js`

`node --test tests/motion-effects.test.cjs`

Os testes de ciclo de vida usam um DOM simulado para verificar redução de movimento, dispositivos de toque, pausa/retomada, teclado e ausência de Canvas. A inspeção visual deve ser realizada servindo a página por HTTP, conforme o README.
