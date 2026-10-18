// Digirota Topluluk: her paylaşıma kaydet (bookmark) butonu ekler.
(() => {
  const CARD = 'article.community-post-card[data-post-id]';
  const key = id => 'post:' + id;
  const txt = (root, sel) => (root.querySelector(sel)?.innerText || '').trim();
  const store = chrome.storage.local;

  const ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.6-6.5 4.6v-16a1 1 0 0 1 1-1z" fill="var(--dk-fill, none)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

  // Sadece listede tanımak için gereken bilgi; içerik sitede açılır (?postId=)
  function extract(card) {
    const body = txt(card, '.community-post-body').replace(/\s+/g, ' ');
    return {
      id: card.dataset.postId,
      title: txt(card, '.community-post-title'),
      preview: body.length > 220 ? body.slice(0, 220) + '…' : body,
      author: txt(card, '.community-xp-author-name') || txt(card, '.community-author-name'),
      date: txt(card, '.community-author-meta'),
      category: txt(card, '.community-post-category'),
      folders: [],
      savedAt: Date.now()
    };
  }

  // Alt ortada kısa bildirim
  function toast(msg, ms = 2000) {
    document.querySelector('.dk-toast')?.remove();
    const t = document.createElement('div');
    t.className = 'dk-toast';
    const label = document.createElement('span');
    label.textContent = msg;
    t.appendChild(label);
    document.body.appendChild(t);
    let timer = setTimeout(() => t.remove(), ms);
    // Üzerindeyken kapanmasın
    t.onmouseenter = () => clearTimeout(timer);
    t.onmouseleave = () => { timer = setTimeout(() => t.remove(), 1500); };
    return t;
  }

  // Kaydettikten sonra, klasör varsa isteğe bağlı olarak klasöre koyma seçeneği
  async function offerFolders(k) {
    const folders = (await store.get('folders')).folders || [];
    if (!folders.length) return toast('Kaydedildi');
    const t = toast('Kaydedildi · Klasöre de ekle:', 6000);
    t.classList.add('has-folders');
    for (const f of folders) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dk-chip';
      b.textContent = f;
      b.onclick = async () => {
        const p = (await store.get(k))[k];
        if (!p) return t.remove();
        const on = !(p.folders || []).includes(f);
        p.folders = on ? [...(p.folders || []), f] : p.folders.filter(x => x !== f);
        await store.set({ [k]: p });
        b.classList.toggle('on', on);
        b.textContent = (on ? '✓ ' : '') + f;
      };
      t.appendChild(b);
    }
  }

  function paint(btn, saved) {
    btn.classList.toggle('is-saved', saved);
    btn.title = saved ? 'Kayıttan çıkar' : 'Kaydet';
    btn.setAttribute('aria-label', btn.title);
  }

  // Tek tık: kaydet / kayıttan çıkar. Klasör sormaz; klasör varsa bildirimde isteğe bağlı sunar.
  async function onClick(e) {
    e.preventDefault();
    e.stopPropagation(); // kartın kendi "aç" tıklamasını tetikleme
    const card = e.currentTarget.closest(CARD);
    if (!card) return;
    const k = key(card.dataset.postId);
    if ((await store.get(k))[k]) {
      await store.remove(k);
      toast('Kayıttan çıkarıldı');
    } else {
      await store.set({ [k]: extract(card) });
      await offerFolders(k);
    }
  }

  async function decorate(card) {
    if (card.querySelector(':scope .dk-save-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dk-save-btn';
    btn.innerHTML = ICON;
    btn.addEventListener('click', onClick);
    btn.addEventListener('keydown', e => e.stopPropagation());
    // Tercihen "Gönderiyi aç" ile yan yana, yoksa aksiyon satırına / başlığa
    const openBtn = card.querySelector('.community-open-post');
    if (openBtn) {
      const wrap = document.createElement('span');
      wrap.className = 'dk-wrap';
      openBtn.before(wrap);
      wrap.append(btn, openBtn);
    } else {
      (card.querySelector('.community-post-actions') || card.querySelector('.community-post-header') || card).appendChild(btn);
    }
    const k = key(card.dataset.postId);
    paint(btn, !!(await store.get(k))[k]);
  }

  // Üst çubuğa, Duyurular zilinin soluna sitenin kendi simge butonu görünümünde "Kaydedilenler"
  function navbarButton() {
    if (document.querySelector('.dk-nav-item')) return;
    const anchor = document.querySelector('.rs-app-navbar .rs-announcement-center')
      || document.querySelector('.rs-app-navbar > .app-navbar-item:last-child');
    if (!anchor) return;
    const item = document.createElement('div');
    item.className = 'app-navbar-item dk-nav-item';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rs-header-icon-button dk-nav-btn';
    b.title = 'Kaydedilenler';
    b.setAttribute('aria-label', 'Kaydedilenleri aç');
    b.innerHTML = ICON.replace('width="18" height="18"', 'width="20" height="20"');
    b.onclick = e => { e.preventDefault(); e.stopPropagation(); window.dkPanel.toggle(); };
    item.appendChild(b);
    anchor.before(item);
  }

  function scan() {
    document.querySelectorAll(CARD).forEach(decorate);
    navbarButton();
  }

  // Kayıtlar başka sekmeden/listeden değişirse butonları güncelle
  chrome.storage.onChanged.addListener(changes => {
    for (const [k, ch] of Object.entries(changes)) {
      if (!k.startsWith('post:')) continue;
      const id = k.slice(5);
      document.querySelectorAll(`${CARD}[data-post-id="${CSS.escape(id)}"] .dk-save-btn`)
        .forEach(b => paint(b, !!ch.newValue));
    }
  });

  // Sonsuz kaydırma ve modal için yeni kartları izle
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });

  scan();

  // Araç çubuğundaki eklenti simgesi → paneli aç/kapat
  chrome.runtime.onMessage.addListener(msg => {
    if (msg?.type === 'dk-toggle') window.dkPanel.toggle();
  });
  // Başka sayfadan simgeyle gelindiyse paneli açık başlat
  if (location.hash === '#kaydedilenler') {
    history.replaceState(null, '', location.pathname + location.search);
    window.dkPanel.open();
  }

  // ?postId= ile açılan paylaşım kapatılınca adresten temizle; yoksa F5 aynı paylaşımı tekrar açıyor
  function cleanPostParam() {
    const url = new URL(location.href);
    if (!url.searchParams.has('postId')) return;
    url.searchParams.delete('postId');
    url.searchParams.delete('commentId');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }
  let threadWasOpen = false;
  setInterval(() => {
    const open = !!document.querySelector('.community-thread-modal.show');
    if (threadWasOpen && !open) cleanPostParam();
    threadWasOpen = open;
  }, 400);
})();
