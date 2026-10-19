const form = document.getElementById('form');
const preview = document.getElementById('preview');
const grid = document.getElementById('grid');

function readForm() {
  const d = Object.fromEntries(new FormData(form));
  return {
    name: d.name.trim() || 'O teu nome',
    emoji: d.emoji.trim() || '🙂',
    tech: d.tech.trim(),
    fact: d.fact.trim(),
    color: d.color,
  };
}

function cardEl(p) {
  const el = document.createElement('article');
  el.className = 'card';
  el.style.setProperty('--c', p.color);
  el.innerHTML = '<div class="emoji"></div><h4></h4><span class="tech"></span><p></p>';
  // textContent evita injeção de HTML vinda do formulário
  el.querySelector('.emoji').textContent = p.emoji;
  el.querySelector('h4').textContent = p.name;
  const tech = el.querySelector('.tech');
  tech.textContent = p.tech;
  tech.hidden = !p.tech;
  el.querySelector('p').textContent = p.fact;
  return el;
}

function renderPreview() {
  preview.replaceChildren(cardEl(readForm()));
}

form.addEventListener('input', renderPreview);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  grid.prepend(cardEl(readForm()));
  form.reset();
  renderPreview();
});

renderPreview();
