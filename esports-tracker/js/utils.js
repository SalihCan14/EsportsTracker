/**
 * E-Spor Takip Merkezi — Yardımcı Fonksiyonlar
 * Tarih/saat formatlama, platform algılama, ikon eşleştirme
 */

const Utils = (() => {
  // Oyun renk kodları
  const GAME_COLORS = {
    lol: { primary: '#C89B3C', secondary: '#0A1428', gradient: 'linear-gradient(135deg, #C89B3C, #785A28)' },
    csgo: { primary: '#DE9B35', secondary: '#1B1B1B', gradient: 'linear-gradient(135deg, #DE9B35, #E8A948)' },
    cs2: { primary: '#DE9B35', secondary: '#1B1B1B', gradient: 'linear-gradient(135deg, #DE9B35, #E8A948)' },
    valorant: { primary: '#FF4655', secondary: '#0F1923', gradient: 'linear-gradient(135deg, #FF4655, #BD3944)' },
    dota2: { primary: '#A02722', secondary: '#1A1A1A', gradient: 'linear-gradient(135deg, #A02722, #E23D2E)' },
  };

  // Oyun isimleri (Türkçe)
  const GAME_NAMES = {
    lol: 'League of Legends',
    csgo: 'Counter-Strike 2',
    cs2: 'Counter-Strike 2',
    valorant: 'VALORANT',
    dota2: 'Dota 2',
  };

  // Oyun slug → normalize
  function normalizeGameSlug(slug) {
    if (!slug) return 'lol';
    const s = slug.toLowerCase().replace(/[-_\s]/g, '');
    if (s.includes('league') || s === 'lol') return 'lol';
    if (s.includes('cs') || s.includes('counterstrike') || s === 'csgo' || s === 'cs2') return 'cs2';
    if (s.includes('valorant') || s === 'val') return 'valorant';
    if (s.includes('dota')) return 'dota2';
    return slug;
  }

  // Oyun ikonu SVG
  function getGameIcon(game) {
    const g = normalizeGameSlug(game);
    const icons = {
      lol: `<svg viewBox="0 0 24 24" fill="currentColor" class="game-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
      cs2: `<svg viewBox="0 0 24 24" fill="currentColor" class="game-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`,
      valorant: `<svg viewBox="0 0 24 24" fill="currentColor" class="game-icon"><path d="M2 12l10 8V4L2 12zm12-8v16l8-8-8-8z"/></svg>`,
      dota2: `<svg viewBox="0 0 24 24" fill="currentColor" class="game-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
    };
    return icons[g] || icons.lol;
  }

  // Platform ikon ve renk
  function getPlatformInfo(url) {
    if (!url) return { name: 'Bilinmiyor', icon: '📺', color: '#888', url: '#' };
    const u = url.toLowerCase();
    if (u.includes('twitch')) return { name: 'Twitch', icon: getTwitchSVG(), color: '#9146FF', url };
    if (u.includes('youtube') || u.includes('youtu.be')) return { name: 'YouTube', icon: getYouTubeSVG(), color: '#FF0000', url };
    if (u.includes('kick')) return { name: 'Kick', icon: '🟢', color: '#53FC18', url };
    if (u.includes('bilibili')) return { name: 'Bilibili', icon: '📺', color: '#00A1D6', url };
    if (u.includes('huya')) return { name: 'Huya', icon: '📺', color: '#FFB800', url };
    return { name: 'Canlı Yayın', icon: '📺', color: '#888', url };
  }

  function getTwitchSVG() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" class="platform-icon" style="color:#9146FF"><path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43z"/></svg>`;
  }

  function getYouTubeSVG() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" class="platform-icon" style="color:#FF0000"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>`;
  }

  // Tarih/Saat formatlama (Türkçe)
  const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const TR_DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
  }

  function formatFullDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${TR_DAYS[d.getDay()]}`;
  }

  function formatDateShort(dateStr) {
    const d = new Date(dateStr);
    return `${d.getDate()} ${TR_MONTHS[d.getMonth()].substring(0, 3)}`;
  }

  function formatRelativeTime(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = d - now;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMs < 0) {
      const absDiffMin = Math.abs(diffMin);
      if (absDiffMin < 60) return `${absDiffMin} dk önce`;
      const absDiffHour = Math.abs(diffHour);
      if (absDiffHour < 24) return `${absDiffHour} saat önce`;
      return `${Math.abs(diffDay)} gün önce`;
    }

    if (diffMin < 1) return 'Şimdi';
    if (diffMin < 60) return `${diffMin} dk sonra`;
    if (diffHour < 24) return `${diffHour} saat sonra`;
    if (diffDay === 1) return 'Yarın';
    return `${diffDay} gün sonra`;
  }

  function isToday(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
  }

  function isTomorrow(dateStr) {
    const d = new Date(dateStr);
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return d.getDate() === tmr.getDate() &&
      d.getMonth() === tmr.getMonth() &&
      d.getFullYear() === tmr.getFullYear();
  }

  // Saat farkı hesaplama (dakika)
  function minutesUntil(dateStr) {
    return Math.floor((new Date(dateStr) - new Date()) / 60000);
  }

  // Status metni
  function getMatchStatusText(status) {
    const statusMap = {
      'not_started': 'Başlamadı',
      'running': '🔴 CANLI',
      'finished': 'Tamamlandı',
      'canceled': 'İptal',
      'postponed': 'Ertelendi',
    };
    return statusMap[status] || status;
  }

  function getMatchStatusClass(status) {
    const classMap = {
      'not_started': 'status-upcoming',
      'running': 'status-live',
      'finished': 'status-finished',
      'canceled': 'status-canceled',
      'postponed': 'status-postponed',
    };
    return classMap[status] || 'status-upcoming';
  }

  // Skor formatlama
  function formatScore(match) {
    if (!match.results || match.results.length < 2) return '— vs —';
    const r = match.results;
    return `${r[0].score} - ${r[1].score}`;
  }

  // Debounce
  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // Element oluşturucu
  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') el.className = v;
      else if (k === 'innerHTML') el.innerHTML = v;
      else if (k === 'textContent') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      else if (c) el.appendChild(c);
    });
    return el;
  }

  // Unique ID
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  return {
    GAME_COLORS, GAME_NAMES,
    normalizeGameSlug, getGameIcon, getPlatformInfo,
    formatTime, formatDate, formatFullDate, formatDateShort, formatRelativeTime,
    isToday, isTomorrow, minutesUntil,
    getMatchStatusText, getMatchStatusClass, formatScore,
    debounce, createElement, uid,
    TR_MONTHS, TR_DAYS, TR_DAYS_SHORT,
  };
})();
