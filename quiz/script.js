let questoesSelecionadas = []

// Quando a página carregar, busca o JSON e monta o quiz
document.addEventListener('DOMContentLoaded', () => {
  carregarQuestoes()
})

async function carregarQuestoes() {
  try {
    const resposta = await fetch('questoes.json')
    const todasQuestoes = await resposta.json()

    // Sorteia aleatoriamente e corta apenas as 10 primeiras
    questoesSelecionadas = todasQuestoes
      .sort(() => 0.5 - Math.random())
      .slice(0, 10)

    renderizarQuiz(questoesSelecionadas)
  } catch (erro) {
    console.error('Erro ao carregar o JSON:', erro)
    document.getElementById('quiz-questions-container').innerHTML =
      "<h4 style='color: white;'>Erro ao carregar as questões. Verifique se você está rodando um servidor local (Live Server).</h4>"
  }
}

function renderizarQuiz(questoes) {
  const container = document.getElementById('quiz-questions-container')
  container.innerHTML = ''
  const letras = ['A', 'B', 'C', 'D', 'E']

  questoes.forEach((q, index) => {
    // Cria o card da questão
    const card = document.createElement('div')
    card.className = 'card p-4 mb-4'

    // Cria o título (Pergunta)
    const titulo = document.createElement('h4')
    titulo.textContent = `${index + 1} - ${q.pergunta}`
    card.appendChild(titulo)

    // Cria as opções de rádio
    q.alternativas.forEach((textoAlternativa, i) => {
      const label = document.createElement('label')
      label.className = 'alternativa-label'

      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = `pergunta_${index}` // Agrupa os radios por pergunta
      radio.value = i
      // Removido o "radio.required" nativo para usarmos o nosso alerta personalizado

      const divBtn = document.createElement('div')
      divBtn.className = 'alternativa-btn'
      divBtn.textContent = `${letras[i]}) ${textoAlternativa}`

      label.appendChild(radio)
      label.appendChild(divBtn)
      card.appendChild(label)
    })

    container.appendChild(card)
  })

  // Mostra o botão de finalizar
  document.getElementById('btn-finalizar').style.display = 'inline-block'
}

// Lida com o envio do formulário (botão Finalizar Quiz)
document
  .getElementById('quiz-form')
  .addEventListener('submit', function (evento) {
    evento.preventDefault() // Impede a página de recarregar

    const formData = new FormData(this)

    // --- NOVA VALIDAÇÃO DE RESPOSTAS ---
    for (let index = 0; index < questoesSelecionadas.length; index++) {
      if (!formData.has(`pergunta_${index}`)) {
        // Exibe um alerta visual na tela
        alert(`Você esqueceu de responder a pergunta ${index + 1}!`)

        // Rola a tela suavemente até a pergunta que ficou em branco
        document
          .querySelectorAll('.card')
          [index].scrollIntoView({ behavior: 'smooth', block: 'center' })

        return // Interrompe a execução aqui, não deixa finalizar o quiz
      }
    }
    // -----------------------------------

    let pontuacao = 0

    // Analisa as respostas dadas
    questoesSelecionadas.forEach((q, index) => {
      const respostaUsuario = parseInt(formData.get(`pergunta_${index}`))

      // Pega o card específico no HTML para atualizar o visual
      const card = document.querySelectorAll('.card')[index]
      const labels = card.querySelectorAll('.alternativa-label')

      labels.forEach((label, i) => {
        const radio = label.querySelector('input')
        const divBtn = label.querySelector('.alternativa-btn')

        // Trava os botões para não mudar mais a resposta
        radio.disabled = true

        // Pinta a resposta que era a correta de Verde
        if (i === q.correta) {
          divBtn.classList.add('correct')
          divBtn.innerHTML += ' ✅'
        }

        // Se o usuário errou, pinta a que ele escolheu de Vermelho
        if (i === respostaUsuario && respostaUsuario !== q.correta) {
          divBtn.classList.add('incorrect')
          divBtn.innerHTML += ' ❌'
        }
      })

      // Soma pontos
      if (respostaUsuario === q.correta) {
        pontuacao++
      }
    })

    // Esconde o botão finalizar e mostra os resultados
    document.getElementById('btn-finalizar').style.display = 'none'
    document.getElementById('resultado').style.display = 'block'

    document.getElementById('pontuacaoFinal').innerHTML =
      `Sua pontuação final foi: <strong>${pontuacao} de 10</strong>.`

    // Desce a tela suavemente para o resultado final
    document.getElementById('resultado').scrollIntoView({ behavior: 'smooth' })
  })
