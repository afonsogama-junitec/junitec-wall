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
      fact: String(p.fact || '').slice(0, 2500),
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

// Caixa de entrada privada: cada pessoa só vê o que enviou; o admin (com código) vê tudo.
const SUPABASE_URL = 'https://tqdsvqovnysqqyzaawkq.supabase.co';
// Chave pública: a tabela não é acessível diretamente, só por funções com regras próprias
const SUPABASE_KEY = 'sb_publishable_rdge_JlUTH995nYSWUDgDA_Syd37XTt';
const OWNER_KEY = 'junitec-owner';
const sentBox = document.getElementById('grid-sent');
const sentCount = document.getElementById('sent-count');
let db = null;
try { db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch {}

// Identificador aleatório deste browser (não é uma conta)
let memoryOwner = null;
function ownerId() {
  try {
    let id = localStorage.getItem(OWNER_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(OWNER_KEY, id); }
    return id;
  } catch {
    memoryOwner = memoryOwner || crypto.randomUUID();
    return memoryOwner;
  }
}

function renderGrid(box, counter, cards) {
  box.className = '';
  box.replaceChildren(...cards.map((p) => cardEl(p)));
  counter.textContent = cards.length ? `(${cards.length})` : '';
}

async function loadSent() {
  if (!db) return;
  const { data, error } = await db.rpc('my_cards', { p_owner: ownerId() });
  if (!error) renderGrid(sentBox, sentCount, data.filter((c) => !c.room));
}

// Sala partilhada: um código aleatório no link; quem o tiver vê e escreve na sala
const ROOM_KEY = 'junitec-room';
const ROOM_RE = /^[A-Za-z0-9_-]{8,40}$/;
const roomBox = document.getElementById('grid-room');
const roomCount = document.getElementById('room-count');
const roomHint = document.getElementById('room-hint');
const publishRoomBtn = document.getElementById('publish-room');
const HINT_NO_ROOM = 'Cria uma sala e manda o link a quem quiseres. Só quem tiver o link vê e escreve os cartões da sala.';
const HINT_IN_ROOM = 'Estás numa sala. Só quem tiver o link da sala vê e escreve aqui.';
let room = null;
let roomTimer = null;
try { const r = localStorage.getItem(ROOM_KEY); if (ROOM_RE.test(r || '')) room = r; } catch {}

function newRoomCode() {
  // 32 símbolos sem l, o, 0, 1 (sem enviesamento: 256 é múltiplo de 32)
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => alphabet[x % 32]).join('');
}

async function loadRoom() {
  if (!db || !room) return;
  const { data, error } = await db.rpc('room_cards', { p_room: room });
  if (!error) renderGrid(roomBox, roomCount, data);
}

function setRoom(code) {
  room = code;
  try { code ? localStorage.setItem(ROOM_KEY, code) : localStorage.removeItem(ROOM_KEY); } catch {}
  renderRoom();
}

function renderRoom() {
  clearInterval(roomTimer);
  document.getElementById('room-create').hidden = !!room;
  document.getElementById('room-active').hidden = !room;
  publishRoomBtn.hidden = !room;
  roomHint.textContent = room ? HINT_IN_ROOM : HINT_NO_ROOM;
  if (!room) {
    roomCount.textContent = '';
    roomBox.replaceChildren();
    return;
  }
  loadRoom();
  roomTimer = setInterval(loadRoom, 5000);
}

document.getElementById('room-create').addEventListener('click', () => setRoom(newRoomCode()));
document.getElementById('room-leave').addEventListener('click', () => setRoom(null));
document.getElementById('room-copy').addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname}#sala=${room}`;
  try {
    await navigator.clipboard.writeText(url);
    roomHint.textContent = 'Link da sala copiado! Manda-o só a quem queres na sala: quem o tiver vê tudo.';
    setTimeout(() => { if (room) roomHint.textContent = HINT_IN_ROOM; }, 6000);
  } catch {
    roomHint.textContent = `Copia este link: ${url}`;
  }
});

const joined = location.hash.match(/^#sala=([A-Za-z0-9_-]{8,40})$/);
if (joined) {
  room = joined[1];
  try { localStorage.setItem(ROOM_KEY, room); } catch {}
  history.replaceState(null, '', location.pathname);
}

// Enviar: em privado (só tu e o organizador) ou para a sala
async function sendCard(btn, label, roomCode) {
  if (!form.reportValidity()) return;
  if (!db) { btn.textContent = 'Sem ligação'; return; }
  const c = readForm();
  btn.disabled = true;
  btn.textContent = 'A enviar…';
  const { error } = await db.rpc('publish_card', {
    p_owner: ownerId(), p_name: c.name, p_emoji: c.emoji, p_tech: c.tech, p_fact: c.fact, p_color: c.color, p_room: roomCode,
  });
  let msg = 'Enviado! ✓';
  if (error) msg = /limite/.test(error.message) ? 'Limite de 50 cartões atingido' : 'Erro ao enviar. Tenta outra vez';
  btn.textContent = msg;
  if (!error) { loadSent(); loadRoom(); }
  setTimeout(() => { btn.disabled = false; btn.textContent = label; }, 3000);
}
const publishBtn = document.getElementById('publish');
publishBtn.addEventListener('click', () => sendCard(publishBtn, 'Enviar cartão', null));
publishRoomBtn.addEventListener('click', () => sendCard(publishRoomBtn, 'Enviar para a sala', room));

// Painel de admin: abre com /#admin. O código fica só em memória.
const adminBox = document.getElementById('admin');
let adminTimer = null;
async function loadAdmin(code) {
  const { data, error } = await db.rpc('all_cards', { p_code: code });
  if (error) return false;
  renderGrid(document.getElementById('grid-admin'), document.getElementById('admin-count'), data);
  return true;
}
document.getElementById('admin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('admin-code');
  const msg = document.getElementById('admin-msg');
  const code = input.value;
  clearInterval(adminTimer);
  if (!db || !(await loadAdmin(code))) { msg.textContent = 'Código inválido.'; return; }
  msg.textContent = 'A atualizar de 5 em 5 segundos.';
  input.value = '';
  adminTimer = setInterval(() => loadAdmin(code), 5000);
});
if (location.hash === '#admin') adminBox.hidden = false;

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
    fact: String(p.fact || '').slice(0, 2500),
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
loadSent();
renderRoom();
if (joined) roomHint.textContent = 'Entraste na sala! Os cartões enviados para a sala aparecem aqui.';
showIncoming();
