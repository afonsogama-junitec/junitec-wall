# JUNITEC Wall

Mural dos colegas da formação de Claude e GitHub.
Site: https://afonsogama-junitec.github.io/junitec-wall/

## Entrar no mural da sala

1. Abre o site e preenche o teu cartão.
2. Carrega em **Publicar na sala**. O cartão aparece logo para toda a gente, sem refresh.

Também podes enviar o teu cartão a alguém com **Copiar link do cartão**.

### Alternativa pelo GitHub (PR)

Faz fork, cria `people/o-teu-nome.json` e abre um PR. Depois do merge o cartão fica no mural.

```json
{
  "name": "O teu nome",
  "emoji": "😎",
  "tech": "Python",
  "fact": "Algo que ninguém sabe sobre ti",
  "color": "#6c5ce7"
}
```

Limites: nome 30 caracteres, tecnologia 24, fun fact 100.

## Base de dados

O mural ao vivo usa o Supabase. A tabela e as regras de segurança estão em `supabase/schema.sql`:
o público só pode **ler** e **publicar** (máximo 500 cartões), nunca editar nem apagar.
A chave que está em `app.js` é a chave pública (publishable), pensada para ir para o browser.

## Desenvolvimento

Abre `index.html` no browser. Para validar os cartões: `node scripts/build-index.mjs --check`.
O site é publicado por GitHub Actions (`.github/workflows/pages.yml`).
