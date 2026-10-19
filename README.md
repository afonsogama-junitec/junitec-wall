# JUNITEC Wall

Mural dos colegas da formação de Claude e GitHub.
Site: https://afonsogama-junitec.github.io/junitec-wall/

## Entrar no mural da sala

1. Abre o site e preenche o teu cartão.
2. Carrega em **Publicar na sala (abre o GitHub)**.
3. No GitHub, inicia sessão e carrega em **Propose changes** e depois **Create pull request**.
4. Espera pela validação automática (visto verde) e pelo merge. O teu cartão aparece no site em cerca de um minuto.

Ou faz à mão: faz fork, cria `people/o-teu-nome.json` e abre um PR.

```json
{
  "name": "O teu nome",
  "emoji": "😎",
  "tech": "Python",
  "fact": "Algo que ninguém sabe sobre ti",
  "color": "#6c5ce7"
}
```

Limites: nome 30 caracteres, tecnologia 24, fun fact 100. O nome do ficheiro só leva `a-z`, `0-9` e hífens.

## Desenvolvimento

Abre `index.html` no browser. Para validar os cartões: `node scripts/build-index.mjs --check`.
O site é publicado por GitHub Actions (`.github/workflows/pages.yml`).
