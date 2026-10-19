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

// Mural da sala: base de dados Supabase (tempo real) + cartões do repositório (people/index.json)
const SUPABASE_URL = 'https://tqdsvqovnysqqyzaawkq.supabase.co';
// Chave pública: é segura no browser porque a tabela só deixa ler e publicar (RLS)
const SUPABASE_KEY = 'sb_publishable_rdge_JlUTH995nYSWUDgDA_Syd37XTt';
const sharedBox = document.getElementById('grid-shared');
const sharedCount = document.getElementById('shared-count');
let live = [];
let fromRepo = [];
let db = null;

function renderShared() {
  const all = [...live, ...fromRepo];
  sharedBox.className = '';
  sharedBox.replaceChildren(...all.map((p) => cardEl(p)));
  sharedCount.textContent = all.length ? `(${all.length})` : '';
}

function addLive(row) {
  if (live.some((c) => c.id === row.id)) return;
  live.unshift(row);
  renderShared();
}

async function loadShared() {
  try {
    const res = await fetch('people/index.json', { cache: 'no-cache' });
    if (res.ok) fromRepo = await res.json();
  } catch {}
  try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await db.from('cards').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    live = data;
    db.channel('cards-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cards' }, ({ new: row }) => addLive(row))
      .subscribe();
  } catch {
    db = null;
  }
  renderShared();
  if (!db && !fromRepo.length) {
    sharedBox.textContent = 'Não foi possível ligar ao mural da sala.';
    sharedBox.className = 'hint';
  }
}

// Publicar na sala: grava na base de dados e aparece logo a toda a gente
const publishBtn = document.getElementById('publish');
publishBtn.addEventListener('click', async () => {
  if (!form.reportValidity()) return;
  if (!db) { publishBtn.textContent = 'Sem ligação ao mural'; return; }
  publishBtn.disabled = true;
  publishBtn.textContent = 'A publicar…';
  const { data, error } = await db.from('cards').insert(readForm()).select().single();
  if (!error) addLive(data);
  publishBtn.textContent = error ? 'Erro ao publicar. Tenta outra vez' : 'Publicado na sala! ✓';
  setTimeout(() => {
    publishBtn.disabled = false;
    publishBtn.textContent = 'Publicar na sala';
  }, error ? 2000 : 4000);
});

// Link de partilha: o cartão vai no endereço (#cartao=...), nada é enviado a servidores
function encodeCard(card) {
  const bytes = new TextEncoder().encode(JSON.stringify(card));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeCard(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const p = JSON.parse(new TextDecoder().decode(bytes));
  if (!p || typeof p.name !== 'string') throw new Error('cartão inválido');
  return {
    name: String(p.name).slice(0, 30),
    emoji: String(p.emoji || '🙂').slice(0, 8),
    tech: String(p.tech || '').slice(0, 24),
    fact: String(p.fact || '').slice(0, 100),
    color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : '#6c5ce7',
  };
}

const shareBtn = document.getElementById('share');
shareBtn.addEventListener('click', async () => {
  if (!form.reportValidity()) return;
  const url = `${location.origin}${location.pathname}#cartao=${encodeCard(readForm())}`;
  try {
    await navigator.clipboard.writeText(url);
    shareBtn.textContent = 'Link copiado!';
  } catch {
    prompt('Copia este link:', url);
  }
  setTimeout(() => { shareBtn.textContent = 'Copiar link do cartão'; }, 2000);
});

function showIncoming() {
  const m = location.hash.match(/^#cartao=([A-Za-z0-9_-]+)$/);
  if (!m) return;
  try {
    const card = decodeCard(m[1]);
    document.getElementById('incoming-card').replaceChildren(cardEl(card));
    document.getElementById('incoming').hidden = false;
    document.getElementById('incoming-add').onclick = () => {
      people.unshift(card);
      save();
      renderWall();
      document.getElementById('incoming').hidden = true;
      history.replaceState(null, '', location.pathname);
    };
  } catch {}
}

renderPreview();
renderWall();
loadShared();
showIncoming();
