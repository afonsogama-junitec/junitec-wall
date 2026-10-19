const form = document.getElementById('form');
const preview = document.getElementById('preview');
const grid = document.getElementById('grid');
const count = document.getElementById('count');
const KEY = 'junitec-wall';

let people = load();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(people)); } catch {}
}

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

function cardEl(p, onDelete) {
  const el = document.createElement('article');
  el.className = 'card';
  el.style.setProperty('--c', p.color);
  el.innerHTML = '<div class="emoji"></div><h4></h4><span class="tech"></span><p></p>';
  el.querySelector('.emoji').textContent = p.emoji;
  el.querySelector('h4').textContent = p.name;
  const tech = el.querySelector('.tech');
  tech.textContent = p.tech;
  tech.hidden = !p.tech;
  el.querySelector('p').textContent = p.fact;

  if (onDelete) {
    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '✕';
    del.title = 'Remover';
    del.addEventListener('click', onDelete);
    el.append(del);
    addTilt(el);
  }
  return el;
}

// Inclinação 3D que segue o rato
function addTilt(el) {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
}

function renderPreview() {
  preview.replaceChildren(cardEl(readForm()));
}

function renderWall() {
  grid.replaceChildren(...people.map((p, i) => cardEl(p, () => {
    people.splice(i, 1);
    save();
    renderWall();
  })));
  count.textContent = people.length ? `(${people.length})` : '';
}

form.addEventListener('input', renderPreview);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  people.unshift(readForm());
  save();
  renderWall();
  form.reset();
  renderPreview();
});

renderPreview();
renderWall();
