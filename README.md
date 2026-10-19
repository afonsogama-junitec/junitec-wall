# JUNITEC Wall

Mural dos colegas da formação de Claude e GitHub.
Site: https://afonsogama-junitec.github.io/junitec-wall/

## Como funciona

1. Cada pessoa abre o site, preenche o cartão e carrega em **Enviar cartão**.
2. Os cartões enviados são **privados**: cada pessoa só vê os seus (identificados por um código aleatório guardado no browser).
3. O organizador abre `/#admin`, mete o código de admin e vê **todos** os cartões, atualizados de 5 em 5 segundos.

Também se pode enviar um cartão a alguém com **Copiar link do cartão**.

## Base de dados (Supabase)

- `supabase/schema.sql`: tabela `cards` com limites de tamanho.
- `supabase/private-inbox.sql`: tira o acesso direto ao público e cria três funções (`publish_card`, `my_cards`, `all_cards`). Máximo 500 cartões no total e 50 por pessoa.
- O código de admin vive em `private.admin` e **nunca** vai para o repositório.
- A chave em `app.js` é a chave pública (publishable), pensada para ir para o browser.

## Desenvolvimento

Abre `index.html` no browser. Para validar os cartões: `node scripts/build-index.mjs --check`.
O site é publicado por GitHub Actions (`.github/workflows/pages.yml`).
