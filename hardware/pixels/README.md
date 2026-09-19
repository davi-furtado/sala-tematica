# Pixels de Verdade

Página interativa que mostra como uma foto é só uma grade de números (RGB). Basta abrir o `index.html` no navegador, não precisa de servidor nem internet.

Tela inicial oferece duas opções igualmente visíveis: ativar a câmera ou usar uma foto de exemplo (uma paisagem desenhada em canvas, sem depender de nenhum arquivo externo). Depois de capturada ou escolhida, a imagem aparece pixelizada, com um slider pra controlar o nível de detalhe — de bem quadriculada até quase nítida — e mostra a resolução aproximada em pixels. Passar o mouse (ou o dedo) sobre um bloco mostra o RGB e o HEX daquela cor, com R/G/B também em binário de 8 bits.

A foto nunca sai do navegador: sem upload, sem `fetch`, sem salvar em `localStorage`. Recarregar a página zera tudo.
