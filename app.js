const form = document.getElementById('form');
const preview = document.getElementById('preview');
const grid = document.getElementById('grid');
const count = document.getElementById('count');
const KEY = 'junitec-wall';
const REPO = 'afonsogama-junitec/junitec-wall';

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

document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(people, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'junitec-wall.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error('formato inválido');
    const valid = data.filter((p) => p && typeof p.name === 'string').map((p) => ({
      name: String(p.name).slice(0, 30),
      emoji: String(p.emoji || '🙂').slice(0, 8),
      tech: String(p.tech || '').slice(0, 24),
      fact: String(p.fact || '').slice(0, 100),
      color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : '#6c5ce7',
    }));
    people = [...valid, ...people];
    save();
    renderWall();
  } catch {
    alert('Ficheiro inválido.');
  }
  e.target.value = '';
});

// Seletor de emojis
const EMOJIS = {
  'Caras': '😀 😁 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😎 🤓 🥳 🤩 😏 🤔 😴 🤯 😱 🥶 🤠 🤖 👻 👽',
  'Pessoas': '👋 👍 👏 🙌 💪 🧠 🙏 ✌️ 🤞 👀 🧑‍💻 🦸 🧙 🥷',
  'Animais': '🐶 🐱 🦊 🐼 🐨 🦁 🐸 🐵 🐧 🦄 🐝 🦋 🐙 🦖 🐢 🐬',
  'Comida': '🍕 🍔 🍟 🌮 🍣 🍩 🍪 🍫 🍎 🍓 🥑 ☕ 🍺 🧋',
  'Atividades': '⚽ 🏀 🎮 🎧 🎸 🎨 🎬 🚀 ✈️ 🏄 🚴 🏆',
  'Símbolos': '⭐ 🔥 💡 💻 ⌨️ 🖥️ 🐛 ⚡ 🌈 ❤️ 💜 💯 ✅ 🎉',
};
const emojiInput = form.elements.emoji;
const emojiBtn = document.getElementById('emoji-btn');
const emojiPanel = document.getElementById('emoji-panel');

for (const [title, list] of Object.entries(EMOJIS)) {
  const h = document.createElement('h5');
  h.textContent = title;
  const row = document.createElement('div');
  row.className = 'emoji-grid';
  for (const e of list.split(' ')) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = e;
    b.setAttribute('aria-label', e);
    b.addEventListener('click', () => {
      emojiInput.value = e;
      emojiInput.dispatchEvent(new Event('input', { bubbles: true }));
      toggleEmojiPanel(false);
    });
    row.append(b);
  }
  emojiPanel.append(h, row);
}

function toggleEmojiPanel(open) {
  emojiPanel.hidden = !open;
  emojiBtn.setAttribute('aria-expanded', String(open));
}
emojiBtn.addEventListener('click', () => toggleEmojiPanel(emojiPanel.hidden));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleEmojiPanel(false); });

// Mural da sala: cartões vindos do repositório (people/index.json)
async function loadShared() {
  const box = document.getElementById('grid-shared');
  const counter = document.getElementById('shared-count');
  try {
    const res = await fetch('people/index.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    const cards = await res.json();
    box.replaceChildren(...cards.map((p) => cardEl(p)));
    counter.textContent = `(${cards.length})`;
  } catch {
    box.textContent = 'O mural da sala só está disponível no site publicado.';
    box.className = 'hint';
  }
}

// Abre o GitHub com o ficheiro do teu cartão já preenchido (fluxo de fork + PR)
function slugify(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cartao';
}
document.getElementById('publish').addEventListener('click', () => {
  if (!form.reportValidity()) return;
  const card = readForm();
  const url = `https://github.com/${REPO}/new/main?filename=${encodeURIComponent(`people/${slugify(card.name)}.json`)}&value=${encodeURIComponent(JSON.stringify(card, null, 2) + '\n')}`;
  window.open(url, '_blank', 'noopener');
});

renderPreview();
renderWall();
loadShared();
