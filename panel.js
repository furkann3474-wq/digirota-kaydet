// Digirota Kaydet: topluluk sayfasının içinde sağdan açılan "Kaydedilenler" paneli.
// Shadow DOM içinde çizilir; sitenin CSS'i panele, panelin CSS'i siteye karışmaz.
(() => {
  const store = chrome.storage.local;
  const NONE = '__none__';
  const postUrl = id => 'https://app.digirota.com/Community/Index?postId=' + encodeURIComponent(id);
  const norm = s => (s || '').toLocaleLowerCase('tr');

  const I = {
    bookmark: '<svg viewBox="0 0 24 24"><path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.6-6.5 4.6v-16a1 1 0 0 1 1-1z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M5 4.5h14v15H5z"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>'
  };

  const STYLE = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; }
  button, input, textarea { font: inherit; color: inherit; }
  button { cursor: pointer; }

  .root {
    --accent: #7563be; --accent-ink: #5e4ca8; --accent-soft: #f3efff; --accent-line: #e0d6fb;
    --text: #131722; --title: #292432; --muted: #8a8595; --line: #e3e6f0; --bg: #f6f8fc; --card: #fff;
    --danger: #d14343; --danger-soft: #fdeeee;
    font: 400 13.5px/1.45 "Segoe UI", Inter, Arial, sans-serif; color: var(--text);
  }
  .backdrop {
    position: fixed; inset: 0; z-index: 2147483000; background: rgba(19, 23, 34, .28);
    opacity: 0; transition: opacity .2s ease;
  }
  .panel {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 2147483001;
    width: min(440px, 100vw); display: flex; flex-direction: column;
    background: var(--bg); border-left: 1px solid var(--line);
    box-shadow: -12px 0 40px rgba(15, 23, 42, .12);
    transform: translateX(100%); transition: transform .24s cubic-bezier(.2, .8, .2, 1);
  }
  .root.open .backdrop { opacity: 1; }
  .root.open .panel { transform: none; }
  @media (prefers-reduced-motion: reduce) { .panel, .backdrop { transition: none; } }

  header {
    padding: 22px 18px 16px; background: linear-gradient(110deg, #f3efff, #fff 75%);
    border-bottom: 1px solid var(--line);
  }
  .head { display: flex; align-items: center; gap: 12px; }
  .badge {
    width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center;
    background: #eae3fb; border: 1px solid var(--accent-line); color: var(--accent);
  }
  .badge svg { width: 20px; height: 20px; fill: currentColor; stroke: none; }
  .head h2 { margin: 0; font-size: 17px; font-weight: 700; color: var(--title); }
  .head p { margin: 1px 0 0; font-size: 12px; color: var(--muted); }
  .x {
    margin-left: auto; width: 34px; height: 34px; border-radius: 8px; display: grid; place-items: center;
    border: 1px solid transparent; background: none; color: var(--muted);
  }
  .x:hover { background: #fff; border-color: var(--line); color: var(--text); }

  .search { position: relative; display: block; margin-top: 20px; }
  .search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--muted); width: 16px; height: 16px; }
  .search input {
    width: 100%; height: 38px; padding: 0 12px 0 34px; border: 1px solid var(--line); border-radius: 10px;
    background: #fff; font-size: 13px; outline: none;
  }
  .search input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(117, 99, 190, .14); }

  .folders { display: flex; flex-wrap: wrap; gap: 6px; padding: 12px 18px 2px; }
  .pill {
    flex: none; display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
    border-radius: 999px; border: 1px solid var(--line); background: #fff; font-size: 12.5px; font-weight: 600; white-space: nowrap;
  }
  .pill small { font-size: 11.5px; font-weight: 600; color: var(--muted); }
  .pill:hover { border-color: var(--accent-line); color: var(--accent-ink); }
  .pill.on { background: var(--accent); border-color: var(--accent); color: #fff; }
  .pill.on small { color: rgba(255, 255, 255, .75); }
  .pill.add { border-style: dashed; color: var(--accent); background: transparent; }
  .pill.add svg { width: 14px; height: 14px; }
  .pill-form { flex: none; display: inline-flex; gap: 4px; }
  .pill-form input {
    width: 170px; height: 30px; padding: 0 12px; border: 1px solid var(--accent); border-radius: 999px;
    background: #fff; font-size: 12.5px; outline: none;
  }
  .pill-form button { height: 30px; padding: 0 12px; border: 0; border-radius: 999px; background: var(--accent); color: #fff; font-size: 12.5px; font-weight: 600; }

  .folder-tools { display: flex; gap: 14px; padding: 8px 18px 0; font-size: 12px; }
  .folder-tools:empty { display: none; }
  .folder-tools button { padding: 0; border: 0; background: none; font-weight: 600; color: var(--accent); }
  .folder-tools button.danger { color: var(--danger); }

  .list { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 18px 18px; display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 10px; }

  .card {
    position: relative; background: var(--card); border: 1px solid var(--line); border-radius: 14px;
    padding: 14px 16px; box-shadow: 0 3px 12px rgba(48, 51, 83, .02); transition: border-color .15s, box-shadow .15s;
  }
  .card:hover { border-color: var(--accent-line); box-shadow: 0 6px 20px rgba(100, 80, 133, .08); }
  .meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); min-height: 32px; margin: -4px -6px 0 0; }
  .meta span { white-space: nowrap; }
  .meta b { min-width: 0; color: var(--text); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tag { flex: none; padding: 1px 7px; border-radius: 6px; background: #f8f5fd; border: 1px solid #eee7f9; color: #8b78b5; font-size: 11px; }
  .post-title {
    display: block; width: 100%; margin: 6px 0 0; padding: 0; border: 0; background: none; text-align: left;
    font-size: 15px; font-weight: 700; color: var(--title); line-height: 1.35;
  }
  .post-title:hover { color: var(--accent-ink); }
  .preview {
    margin: 4px 0 0; color: #5d5a6b; font-size: 13px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  mark { background: #fff1a8; color: inherit; border-radius: 2px; padding: 0 1px; }

  .actions { margin-left: auto; display: flex; gap: 2px; flex: none; }
  .icon {
    width: 32px; height: 32px; display: grid; place-items: center; border-radius: 8px;
    border: 1px solid transparent; background: none; color: #9a96a6;
  }
  .icon svg { width: 17px; height: 17px; }
  .icon:hover { background: var(--accent-soft); color: var(--accent-ink); }
  .icon.on { color: var(--accent); }
  .icon.del:hover { background: var(--danger-soft); color: var(--danger); }
  .icon.confirm { width: auto; padding: 0 10px; background: var(--danger); color: #fff; font-size: 12px; font-weight: 600; }
  .icon.done { color: #2f9e6a; }

  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .chips:empty { display: none; }
  .chip {
    display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 9px;
    border-radius: 999px; background: var(--accent-soft); color: var(--accent-ink); font-size: 11.5px; font-weight: 600;
  }
  .chip svg { width: 12px; height: 12px; }

  .pop {
    margin-top: 10px; padding: 10px; border: 1px solid var(--accent-line); border-radius: 12px; background: #fcfbff;
  }
  .pop-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; border: 0; border-radius: 8px; background: none; text-align: left; font-size: 13px; }
  .pop-row:hover { background: var(--accent-soft); }
  .box { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid #c9c3dc; display: grid; place-items: center; flex: none; }
  .box svg { width: 12px; height: 12px; stroke-width: 2.6; opacity: 0; }
  .pop-row.on .box { background: var(--accent); border-color: var(--accent); color: #fff; }
  .pop-row.on .box svg { opacity: 1; }
  .pop-new { display: flex; gap: 6px; margin-top: 6px; }
  .pop-new input { flex: 1; min-width: 0; height: 32px; padding: 0 10px; border: 1px solid var(--line); border-radius: 8px; background: #fff; font-size: 12.5px; outline: none; }
  .pop-new input:focus { border-color: var(--accent); }
  .pop-new button { height: 32px; padding: 0 12px; border: 0; border-radius: 8px; background: var(--accent); color: #fff; font-size: 12.5px; font-weight: 600; }
  .pop-empty { margin: 2px 4px 4px; font-size: 12px; color: var(--muted); }

  .note {
    display: block; width: 100%; margin-top: 10px; padding: 8px 10px; min-height: 38px; resize: vertical;
    border: 1px dashed #d9d4e8; border-radius: 10px; background: #fdfcff; font-size: 13px; outline: none;
  }
  .note:focus { border-style: solid; border-color: var(--accent); }

  .empty { text-align: center; padding: 48px 20px; color: var(--muted); }
  .empty .badge { margin: 0 auto 12px; width: 52px; height: 52px; border-radius: 16px; }
  .empty .badge svg { width: 24px; height: 24px; }
  .empty h3 { margin: 0 0 4px; color: var(--title); font-size: 15px; }
  .empty p { margin: 0; font-size: 13px; }

  footer {
    display: flex; align-items: center; gap: 14px; padding: 10px 18px; border-top: 1px solid var(--line);
    background: #fff; font-size: 12px; color: var(--muted);
  }
  footer span { margin-right: auto; }
  footer button { padding: 0; border: 0; background: none; color: var(--accent); font-weight: 600; }
  @media (max-width: 480px) {
    .panel { border-left: 0; }
    header { padding: 18px 14px 14px; }
    .folders { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding: 12px 14px 4px; }
    .folders::-webkit-scrollbar { display: none; }
    .folder-tools { padding-left: 14px; padding-right: 14px; }
    .list { padding: 10px 14px 14px; }
    .card { padding: 12px 14px; }
    .meta .tag { display: none; }
    footer { padding: 10px 14px; gap: 12px; }
    footer span { display: none; }
    footer button:first-of-type { margin-left: auto; }
  }
  `;

  let host, root, els, posts = [], folders = [], active = '', query = '';
  let openPop = null; // hangi kartın klasör menüsü açık
  let shown = false;   // panel açık mı (animasyondan bağımsız)
  let prevOverflow = '';
  let openNote = null;

  function build() {
    host = document.createElement('div');
    host.id = 'dk-panel-host';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${STYLE}</style>
      <div class="root">
        <div class="backdrop"></div>
        <aside class="panel" role="dialog" aria-modal="true" aria-label="Kaydedilenler">
          <header>
            <div class="head">
              <span class="badge">${I.bookmark}</span>
              <div><h2>Kaydedilenler</h2><p class="sub"></p></div>
              <button class="x" type="button" aria-label="Kapat">${I.close}</button>
            </div>
            <label class="search">${I.search}<input type="search" placeholder="Kayıtlarda ara…"></label>
          </header>
          <nav class="folders" aria-label="Klasörler"></nav>
          <div class="folder-tools"></div>
          <div class="list"></div>
          <footer>
            <span>Sadece bu tarayıcıda saklanır</span>
            <button type="button" class="export">Yedekle</button>
            <button type="button" class="import">Yedeği yükle</button>
            <input type="file" accept="application/json" hidden>
          </footer>
        </aside>
      </div>`;
    root = shadow.querySelector('.root');
    els = {
      sub: shadow.querySelector('.sub'),
      search: shadow.querySelector('.search input'),
      folders: shadow.querySelector('.folders'),
      tools: shadow.querySelector('.folder-tools'),
      list: shadow.querySelector('.list'),
      file: shadow.querySelector('input[type=file]')
    };
    shadow.querySelector('.backdrop').onclick = close;
    shadow.querySelector('.x').onclick = close;
    els.search.oninput = () => { query = els.search.value.trim(); renderList(); };
    shadow.querySelector('.export').onclick = exportData;
    shadow.querySelector('.import').onclick = () => els.file.click();
    els.file.onchange = importData;
    // Panel içindeki tuşlar sitenin kısayollarına sızmasın
    root.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') close();
    });
    document.documentElement.appendChild(host);
  }

  async function load() {
    const all = await store.get(null);
    posts = Object.entries(all).filter(([k]) => k.startsWith('post:')).map(([, v]) => v)
      .sort((a, b) => b.savedAt - a.savedAt);
    folders = all.folders || [];
    if (active && active !== NONE && !folders.includes(active)) active = '';
    render();
  }

  function render() {
    els.sub.textContent = posts.length ? `${posts.length} paylaşım kayıtlı` : 'Henüz kayıt yok';
    renderFolders();
    renderList();
  }

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  function setActive(f) {
    active = f;
    openPop = null;
    render();
  }

  function pillForm(value, placeholder, label, onSave) {
    const form = el('form', 'pill-form');
    const input = el('input');
    input.maxLength = 40;
    input.placeholder = placeholder;
    input.value = value;
    const btn = el('button', null);
    btn.textContent = label;
    form.append(input, btn);
    form.onsubmit = e => { e.preventDefault(); onSave(input.value.trim(), input); };
    input.onkeydown = e => { if (e.key === 'Escape') { e.stopPropagation(); render(); } };
    return form;
  }

  function renderFolders() {
    const bar = els.folders;
    bar.replaceChildren();
    const pill = (label, value, count) => {
      const b = el('button', 'pill' + (active === value ? ' on' : ''));
      b.type = 'button';
      const s = el('span');
      s.textContent = label;
      const c = el('small');
      c.textContent = count;
      b.append(s, c);
      b.onclick = () => setActive(value);
      bar.appendChild(b);
    };
    pill('Tümü', '', posts.length);
    for (const f of folders) pill(f, f, posts.filter(p => (p.folders || []).includes(f)).length);
    const unfiled = posts.filter(p => !(p.folders || []).length).length;
    if (folders.length && unfiled) pill('Klasörsüz', NONE, unfiled);

    const add = el('button', 'pill add', I.plus + '<span>Klasör</span>');
    add.type = 'button';
    add.onclick = () => {
      const form = pillForm('', 'Klasör adı', 'Ekle', async name => {
        if (!name) return render();
        active = name;
        if (!folders.includes(name)) await store.set({ folders: [...folders, name] });
        else render();
      });
      add.replaceWith(form);
      form.querySelector('input').focus();
    };
    bar.appendChild(add);

    const tools = els.tools;
    tools.replaceChildren();
    if (!active || active === NONE) return;
    const ren = el('button', null);
    ren.type = 'button';
    ren.textContent = 'Yeniden adlandır';
    ren.onclick = () => {
      const form = pillForm(active, '', 'Kaydet', async (name, input) => {
        if (!name || name === active) return render();
        if (folders.includes(name)) return input.select();
        await changeFolder(active, name);
      });
      ren.replaceWith(form);
      form.querySelector('input').select();
    };
    const del = el('button', 'danger');
    del.type = 'button';
    del.textContent = 'Klasörü sil';
    del.onclick = async () => {
      if (!del.dataset.confirm) {
        del.dataset.confirm = '1';
        del.textContent = 'Emin misin? (paylaşımlar silinmez)';
        setTimeout(() => { delete del.dataset.confirm; del.textContent = 'Klasörü sil'; }, 3500);
        return;
      }
      await changeFolder(active, null);
    };
    tools.append(ren, del);
  }

  // Klasörü yeniden adlandır (to) ya da sil (to = null); paylaşımlardaki etiketleri de güncelle
  async function changeFolder(from, to) {
    const items = { folders: to == null ? folders.filter(f => f !== from) : folders.map(f => (f === from ? to : f)) };
    for (const p of posts) {
      if (!(p.folders || []).includes(from)) continue;
      const next = to == null ? p.folders.filter(f => f !== from) : p.folders.map(f => (f === from ? to : f));
      items['post:' + p.id] = { ...p, folders: [...new Set(next)] };
    }
    active = to || '';
    await store.set(items);
  }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function hl(node, text) {
    if (!query) { node.textContent = text; return; }
    const re = new RegExp(esc(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    node.innerHTML = esc(text).replace(re, m => `<mark>${m}</mark>`);
  }

  const save = p => store.set({ ['post:' + p.id]: p });

  function renderList() {
    const nq = norm(query);
    const rows = posts.filter(p => {
      const pf = p.folders || [];
      if (active === NONE ? pf.length : active && !pf.includes(active)) return false;
      if (!nq) return true;
      return norm([p.title, p.preview, p.body, p.author, p.note, ...pf].join('\n')).includes(nq);
    });

    const list = els.list;
    list.replaceChildren();
    if (!rows.length) {
      const [h, t] = !posts.length
        ? ['Henüz kayıt yok', 'Toplulukta bir paylaşımın altındaki kaydet simgesine bas, burada görünsün.']
        : query ? ['Sonuç yok', 'Aramanla eşleşen kayıtlı paylaşım bulunamadı.']
        : ['Bu klasör boş', 'Paylaşımları kaydederken ya da buradan klasör simgesiyle ekleyebilirsin.'];
      const e = el('div', 'empty', `<div class="badge">${I.bookmark}</div><h3></h3><p></p>`);
      e.querySelector('h3').textContent = h;
      e.querySelector('p').textContent = t;
      list.appendChild(e);
      return;
    }
    for (const p of rows) list.appendChild(card(p));
  }

  function card(p) {
    const c = el('article', 'card');
    const meta = el('div', 'meta');
    const author = el('b');
    author.textContent = p.author || 'Bilinmeyen';
    const date = el('span');
    date.textContent = p.date || '';
    meta.append(author, date);
    if (p.category) {
      const t = el('span', 'tag');
      t.textContent = p.category;
      meta.appendChild(t);
    }

    const open = el('button', 'post-title');
    open.type = 'button';
    hl(open, p.title || '(Başlıksız paylaşım)');
    open.onclick = () => openPost(p.id);

    const prev = el('p', 'preview');
    hl(prev, p.preview || (p.body || '').replace(/\s+/g, ' ').slice(0, 220));
    prev.style.cursor = 'pointer';
    prev.onclick = () => openPost(p.id);

    // Sağ üst: klasör, not, link, sil
    const actions = el('div', 'actions');
    const fBtn = el('button', 'icon' + ((p.folders || []).length ? ' on' : ''), I.folder);
    fBtn.type = 'button';
    fBtn.title = 'Klasöre ekle';
    fBtn.onclick = () => { openPop = openPop === p.id ? null : p.id; renderList(); };
    const nBtn = el('button', 'icon' + (p.note ? ' on' : ''), I.note);
    nBtn.type = 'button';
    nBtn.title = 'Not';
    nBtn.onclick = () => { openNote = openNote === p.id ? null : p.id; renderList(); };
    const lBtn = el('button', 'icon', I.link);
    lBtn.type = 'button';
    lBtn.title = 'Linki kopyala';
    lBtn.onclick = async () => {
      await navigator.clipboard.writeText(postUrl(p.id));
      lBtn.innerHTML = I.check;
      lBtn.classList.add('done');
      setTimeout(() => { lBtn.innerHTML = I.link; lBtn.classList.remove('done'); }, 1400);
    };
    const dBtn = el('button', 'icon del', I.trash);
    dBtn.type = 'button';
    dBtn.title = 'Kayıttan çıkar';
    dBtn.onclick = async () => {
      if (dBtn.classList.contains('confirm')) return store.remove('post:' + p.id);
      dBtn.classList.add('confirm');
      dBtn.textContent = 'Sil?';
      setTimeout(() => { dBtn.classList.remove('confirm'); dBtn.innerHTML = I.trash; }, 3000);
    };
    actions.append(fBtn, nBtn, lBtn, dBtn);
    meta.appendChild(actions);

    const chips = el('div', 'chips');
    for (const f of p.folders || []) {
      const ch = el('span', 'chip', I.folder);
      ch.append(f);
      chips.appendChild(ch);
    }

    c.append(meta, open, prev, chips);

    if (openPop === p.id) c.appendChild(folderPop(p));

    if (openNote === p.id || p.note) {
      const note = el('textarea', 'note');
      note.rows = 1;
      note.placeholder = 'Kendine not…';
      note.value = p.note || '';
      let t;
      note.oninput = () => {
        clearTimeout(t);
        t = setTimeout(() => { p.note = note.value; save(p); }, 400);
      };
      c.appendChild(note);
      if (openNote === p.id && !p.note) requestAnimationFrame(() => note.focus());
    }
    return c;
  }

  function folderPop(p) {
    const pop = el('div', 'pop');
    if (!folders.length) {
      const e = el('p', 'pop-empty');
      e.textContent = 'Henüz klasörün yok. İlkini oluştur:';
      pop.appendChild(e);
    }
    for (const f of folders) {
      const on = (p.folders || []).includes(f);
      const row = el('button', 'pop-row' + (on ? ' on' : ''), `<span class="box">${I.check}</span><span></span>`);
      row.type = 'button';
      row.lastChild.textContent = f;
      row.onclick = () => save({ ...p, folders: on ? p.folders.filter(x => x !== f) : [...(p.folders || []), f] });
      pop.appendChild(row);
    }
    const form = el('form', 'pop-new', '<input maxlength="40" placeholder="Yeni klasör"><button>Ekle</button>');
    form.onsubmit = async e => {
      e.preventDefault();
      const name = form.querySelector('input').value.trim();
      if (!name) return;
      await store.set({
        folders: folders.includes(name) ? folders : [...folders, name],
        ['post:' + p.id]: { ...p, folders: [...new Set([...(p.folders || []), name])] }
      });
    };
    pop.appendChild(form);
    return pop;
  }

  // Paylaşım akışta yüklüyse sayfa yenilenmeden aç; değilse sitenin kendi derin linkine git
  function openPost(id) {
    close();
    const card = document.querySelector(`article.community-post-card[data-post-id="${CSS.escape(id)}"]`);
    const btn = card?.querySelector('.community-open-post');
    // Panelin kendi tıklaması bitince aç; aynı olay içinde açılırsa site pencereyi hemen kapatıyor
    if (btn) setTimeout(() => btn.click(), 0);
    else location.href = postUrl(id);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ app: 'digirota-kaydet', version: 2, folders, posts }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `digirota-kayitlar-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function importData(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const arr = Array.isArray(data) ? data : data.posts;
      const items = {};
      let n = 0;
      const str = v => (typeof v === 'string' ? v : '');
      const names = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim().slice(0, 40)) : []);
      for (const p of Array.isArray(arr) ? arr : []) {
        if (!p || (typeof p.id !== 'string' && typeof p.id !== 'number')) continue;
        const id = String(p.id);
        items['post:' + id] = {
          id, title: str(p.title), preview: str(p.preview) || str(p.body).slice(0, 220), author: str(p.author),
          date: str(p.date), category: str(p.category), note: str(p.note), folders: [...new Set(names(p.folders))],
          savedAt: Number(p.savedAt) || Date.now()
        };
        n++;
      }
      if (!n) throw new Error('boş');
      const incoming = [...names(data.folders), ...Object.values(items).flatMap(p => p.folders)];
      items.folders = [...new Set([...folders, ...incoming])];
      await store.set(items);
      els.sub.textContent = `${n} paylaşım yüklendi`;
    } catch {
      els.sub.textContent = 'Dosya okunamadı';
    }
  }

  function isOpen() { return shown; }

  async function open() {
    if (shown) return;
    shown = true;
    if (!host) build();
    host.style.display = '';
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    await load();
    if (!shown) return; // yüklenirken kapatıldıysa
    requestAnimationFrame(() => { if (shown) root.classList.add('open'); });
    setTimeout(() => { if (shown) els.search.focus(); }, 150);
  }

  function close() {
    if (!shown) return;
    shown = false;
    root.classList.remove('open');
    document.documentElement.style.overflow = prevOverflow;
    openPop = openNote = null;
    setTimeout(() => { if (!shown) host.style.display = 'none'; }, 260);
  }

  chrome.storage.onChanged.addListener(changes => {
    if (!isOpen()) return;
    if (!Object.keys(changes).some(k => k.startsWith('post:') || k === 'folders')) return;
    // Not yazarken listeyi baştan çizip imleci kaybettirme
    const focused = host.shadowRoot.activeElement;
    if (focused?.classList.contains('note') && Object.values(changes).every(c => c.oldValue && c.newValue)) return;
    load();
  });

  window.dkPanel = { open, close, toggle: () => (isOpen() ? close() : open()) };
})();
