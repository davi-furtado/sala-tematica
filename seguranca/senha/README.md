# Quanto Tempo Leva Pra Quebrar Sua Senha?

Página interativa que mostra na prática por que senha forte importa. Basta abrir o `index.html` no navegador, não precisa de servidor nem internet.

Digite uma senha de teste e veja, ao vivo, uma checklist de critérios (tamanho, maiúscula, minúscula, número, símbolo) e uma barra de força, além de um terminal simulando um ataque de força bruta que desacelera visivelmente conforme a senha fica mais forte. O tempo estimado pra quebrar é calculado de verdade a partir do tamanho do alfabeto usado elevado ao comprimento da senha. Se a senha bater com uma lista de senhas comuns (visível numa tabela de referência), aparece um aviso — mesmo que os critérios técnicos estejam todos "verdes".

A senha nunca sai do navegador: sem `fetch`, sem salvar em `localStorage`. Recarregar a página zera tudo.
