# Portfólio — Lucas Souza

Portfólio pessoal estático em HTML, CSS e JavaScript, preparado para GitHub Pages. O visual combina uma composição editorial inspirada em interfaces de tecnologia, cores de sinalização, conteúdo original do portfólio, cenas 3D sob demanda e movimentos discretos de interface.

## Executar localmente

Sirva a pasta por HTTP (módulos JavaScript e import maps não funcionam de forma confiável via `file://`). No VS Code, use Live Server; ou, com Python, rode na raiz do projeto:

```bash
python -m http.server 8000
```

Acesse `http://localhost:8000`.

## Modelo 3D Java

O modelo usado na hero está em:

```text
assets/java_logo.glb
```

A página carrega o arquivo com `GLTFLoader` quando a hero entra na área visível e ajusta automaticamente seu tamanho e centro. O modelo foi preparado com vapor vermelho/laranja e xícara azul, inspirado na identidade do Java. As animações embutidas no `.glb` também são reproduzidas.

Para bons resultados, exporte o modelo com o eixo Y para cima e a origem próxima ao centro do objeto. A escala é ajustada automaticamente; posicione a câmera/objeto frontalmente antes de exportar para uma leitura clara no quadro da hero.

## Three.js e efeitos

O Three.js 0.170.0 e o `GLTFLoader` são mapeados pelo import map em `index.html`. A cena da hero é carregada quando se aproxima da tela e pausa fora da área visível. Não é necessário instalar npm, React ou bundler. É preciso ter acesso à CDN do jsDelivr para carregar a biblioteca do objeto Java.

O cursor e as partículas usam Canvas 2D local, sem dependências externas, com uma interpretação própria do movimento orgânico do site [Lando Norris](https://landonorris.com/). O cursor tem rastro verde-lima com inércia e dissipação, expande sobre links/botões e devolve o cursor nativo em campos de edição e na navegação por teclado. As partículas formam três fluxos ondulados, se afastam do mouse e voltam suavemente à posição de origem. O scroll desloca a fase, a profundidade e o impulso dessas faixas, criando parallax conforme a página avança. Os efeitos não interceptam cliques.

O campo é limitado a 1.100 pontos no desktop e 420 em dispositivos de toque, com atualização de fundo a 30 fps e pixel ratio limitado. O cursor customizado só é habilitado com mouse e ponteiro preciso. Mudanças em `prefers-reduced-motion` removem imediatamente os efeitos, sem recarregar a página; retornar à preferência normal os recria. O arquivo anterior `python-cursor.js` não é mais carregado.

As animações respeitam `prefers-reduced-motion`, limitam o pixel ratio e pausam quando a página fica em segundo plano. O restante do conteúdo continua disponível quando WebGL não está ativo.

## Estrutura principal

- `index.html` — conteúdo, navegação e estrutura semântica.
- `assets/css/main.css` — tokens visuais, layouts responsivos e estados de interação.
- `assets/js/main.js` — menu, entrada no scroll e carregamento do objeto 3D Java.
- `assets/js/motion-effects.js` — cursor fluido, partículas reativas e inclinação dos cards.
- `assets/img/portfolio/` — imagens de projetos já existentes.
- `assets/java_logo.glb` — modelo 3D exibido na hero.
- `tools/recolor_java_glb.py` — utilitário usado para reaplicar as cores do Java ao modelo.
