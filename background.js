// Eklenti simgesi: Digirota'daysan paneli aç/kapat; değilsen topluluğu panel açık şekilde aç.
const COMMUNITY = 'https://app.digirota.com/Community/Index';

chrome.action.onClicked.addListener(async tab => {
  if (tab.url?.startsWith('https://app.digirota.com/')) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'dk-toggle' });
      return;
    } catch {
      // Eklenti yeni yüklendiyse sayfada betik yoktur; topluluğu panel açık yükle
      chrome.tabs.update(tab.id, { url: COMMUNITY + '#kaydedilenler' });
      return;
    }
  }
  // Açık bir Digirota sekmesi varsa ona geç
  const [dg] = await chrome.tabs.query({ url: 'https://app.digirota.com/*' });
  if (dg) {
    await chrome.tabs.update(dg.id, { active: true });
    chrome.windows.update(dg.windowId, { focused: true });
    chrome.tabs.sendMessage(dg.id, { type: 'dk-toggle' })
      .catch(() => chrome.tabs.update(dg.id, { url: COMMUNITY + '#kaydedilenler' }));
  } else {
    chrome.tabs.create({ url: COMMUNITY + '#kaydedilenler' });
  }
});

// Önceki sürümden kalan sayı rozetini temizle
chrome.runtime.onInstalled.addListener(() => chrome.action.setBadgeText({ text: '' }));
