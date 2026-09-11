# Desafio Tech — Hardware & IA 💻🤖

Um quiz interativo focado em conhecimentos básicos e intermediários sobre Hardware e Inteligência Artificial. O projeto consome as perguntas dinamicamente através de um arquivo JSON, garantindo partidas únicas a cada carregamento.

## 🚀 Funcionalidades

* **Sorteio Dinâmico:** Carrega e embaralha perguntas de um banco de dados local (`questoes.json`), exibindo 10 questões aleatórias por vez.
* **Validação de Formulário:** Impede o envio se houver perguntas em branco e direciona o usuário até a questão faltante.
* **Feedback Visual:** Ao finalizar, o sistema trava as opções, revela a pontuação final e colore as alternativas de verde (corretas) e vermelho (erradas).
* **Interface Responsiva:** Estruturado de forma semântica com formulários (`<form>` e `<input type="radio">`) e estilizado com Bootstrap e CSS customizado.

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Estrutura semântica do formulário.
* **CSS3 & Bootstrap 5:** Layout responsivo, estilização avançada dos botões (ocultando inputs nativos) e plano de fundo.
* **JavaScript (Vanilla):** Lógica de consumo de API (`fetch`), embaralhamento (`Math.random()`), renderização de elementos no DOM e validação.
* **JSON:** Armazenamento das perguntas, alternativas e gabarito.

## ⚙️ Como Executar o Projeto

Como o JavaScript utiliza a função `fetch()` para carregar o arquivo JSON, o navegador bloqueia a leitura por motivos de segurança (CORS) caso o arquivo `index.html` seja aberto diretamente com dois cliques (`file:///`).

Para rodar o projeto corretamente:

1. Faça o download ou clone o repositório.
2. Abra a pasta do projeto no **VS Code** (ou outro editor de sua preferência).
3. Instale e ative a extensão **Live Server**.
4. Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.
5. O quiz será aberto automaticamente no seu navegador padrão (geralmente em `http://localhost:5500`).

> Ou rode no terminal
>
> ```bash
> python -m http.server
> ```
