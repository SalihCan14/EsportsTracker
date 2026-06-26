/**
 * E-Spor Takip Merkezi — Bildirim Motoru
 * Günlük özet, maç hatırlatıcı ve skor bildirimleri
 */

const NotificationEngine = (() => {
  let permission = 'default';
  let timers = {};
  let notificationHistory = [];
  const HISTORY_KEY = 'esports_notification_history';
  let onNotificationCallback = null;
  let dailySummaryTimer = null;
  let matchCheckInterval = null;
  let trackedMatches = new Set();

  // Başlat
  async function init() {
    loadHistory();
    permission = ('Notification' in window) ? Notification.permission : 'default';
    startMatchChecker();
    startDailySummaryChecker();
  }

  // Bildirim izni iste
  async function requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Bu tarayıcı bildirimleri desteklemiyor.');
      return false;
    }
    try {
      permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  function isPermissionGranted() {
    return permission === 'granted';
  }

  // Tarayıcı bildirimi gönder
  function sendBrowserNotification(title, body, options = {}) {
    if (permission !== 'granted' || !('Notification' in window)) return null;
    try {
      const notif = new Notification(title, {
        body,
        icon: options.icon || '🎮',
        badge: options.badge || '🎮',
        tag: options.tag || `esports-${Date.now()}`,
        silent: false,
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        if (options.onClick) options.onClick();
        notif.close();
      };

      return notif;
    } catch (e) {
      console.warn('Bildirim gönderilemedi:', e);
      return null;
    }
  }

  // In-App bildirim (toast)
  function sendInAppNotification(title, body, type = 'info', options = {}) {
    const notification = {
      id: Utils.uid(),
      title,
      body,
      type, // 'info', 'match', 'score', 'reminder', 'summary'
      timestamp: new Date().toISOString(),
      read: false,
      ...options,
    };

    notificationHistory.unshift(notification);
    if (notificationHistory.length > 100) notificationHistory = notificationHistory.slice(0, 100);
    saveHistory();

    // Toast UI göster
    showToast(notification);

    // Callback çağır
    if (onNotificationCallback) {
      onNotificationCallback(notification);
    }

    return notification;
  }

  // Toast mesajı göster
  function showToast(notification) {
    const container = document.getElementById('toast-container') || createToastContainer();

    const typeIcons = {
      info: 'ℹ️',
      match: '🎮',
      score: '🏆',
      reminder: '⏰',
      summary: '📋',
    };

    const typeColors = {
      info: 'var(--accent-blue)',
      match: 'var(--accent-purple)',
      score: 'var(--accent-gold)',
      reminder: 'var(--accent-red)',
      summary: 'var(--accent-green)',
    };

    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-enter';
    toast.innerHTML = `
      <div class="toast-accent" style="background:${typeColors[notification.type] || typeColors.info}"></div>
      <div class="toast-content">
        <div class="toast-header">
          <span class="toast-icon">${typeIcons[notification.type] || '🔔'}</span>
          <span class="toast-title">${notification.title}</span>
          <button class="toast-close" aria-label="Kapat">&times;</button>
        </div>
        <p class="toast-body">${notification.body}</p>
        <span class="toast-time">${Utils.formatTime(notification.timestamp)}</span>
      </div>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      removeToast(toast);
    });

    container.appendChild(toast);

    // Animasyon
    requestAnimationFrame(() => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-visible');
    });

    // Otomatik kaldır (8 saniye)
    setTimeout(() => removeToast(toast), 8000);
  }

  function removeToast(toast) {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 400);
  }

  function createToastContainer() {
    const c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
    return c;
  }

  // ===== GÜNLÜK ÖZET (10:00) =====

  function startDailySummaryChecker() {
    // Her dakika kontrol et
    if (dailySummaryTimer) clearInterval(dailySummaryTimer);
    dailySummaryTimer = setInterval(() => {
      checkDailySummary();
    }, 60000);

    // İlk kontrol
    checkDailySummary();
  }

  async function checkDailySummary() {
    const now = new Date();
    const todayKey = `daily_summary_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;

    // 10:00-10:01 arası ve bugün henüz gönderilmemişse
    if (now.getHours() === 10 && now.getMinutes() === 0 && !localStorage.getItem(todayKey)) {
      localStorage.setItem(todayKey, 'sent');
      await sendDailySummary();
    }
  }

  async function sendDailySummary() {
    try {
      const todayMatches = await EsportsAPI.getAllTodayMatches();
      const normalized = todayMatches.map(m => EsportsAPI.normalizeMatch(m));

      if (normalized.length === 0) {
        sendInAppNotification(
          '📅 Günlük E-Spor Özeti',
          'Bugün planlanmış önemli bir e-spor maçı bulunmuyor.',
          'summary'
        );
        return;
      }

      // Oyuna göre grupla
      const grouped = {};
      normalized.forEach(m => {
        if (!grouped[m.game]) grouped[m.game] = [];
        grouped[m.game].push(m);
      });

      let summaryBody = `📊 Bugün ${normalized.length} maç planlanıyor:\n\n`;

      Object.entries(grouped).forEach(([game, matches]) => {
        const gameName = Utils.GAME_NAMES[game] || game;
        summaryBody += `🎮 ${gameName} (${matches.length} maç)\n`;
        matches.slice(0, 5).forEach(m => {
          const time = Utils.formatTime(m.beginAt);
          const favStar = FavoritesManager.matchHasFavorite(m) ? ' ⭐' : '';
          summaryBody += `  ${time} — ${m.team1.acronym || m.team1.name} vs ${m.team2.acronym || m.team2.name} (${m.stream.name})${favStar}\n`;
        });
        summaryBody += '\n';
      });

      // Favori takım maçları
      const favMatches = normalized.filter(m => FavoritesManager.matchHasFavorite(m));
      if (favMatches.length > 0) {
        summaryBody += `⭐ Favori takımlarının ${favMatches.length} maçı var bugün!`;
      }

      sendInAppNotification('📅 Günlük E-Spor Özeti', summaryBody, 'summary');
      sendBrowserNotification(
        '🎮 Günlük E-Spor Özeti',
        `Bugün ${normalized.length} maç var! ${favMatches.length > 0 ? `⭐ ${favMatches.length} favori takım maçı!` : ''}`,
        { tag: 'daily-summary' }
      );
    } catch (e) {
      console.error('Günlük özet oluşturulamadı:', e);
    }
  }

  // Manuel günlük özet tetikle
  async function triggerDailySummary() {
    await sendDailySummary();
  }

  // ===== MAÇ HATIRLATICI (15dk) =====

  function startMatchChecker() {
    if (matchCheckInterval) clearInterval(matchCheckInterval);
    matchCheckInterval = setInterval(() => {
      checkUpcomingFavoriteMatches();
    }, 60000); // Her dakika kontrol
  }

  async function checkUpcomingFavoriteMatches() {
    if (FavoritesManager.count() === 0) return;

    try {
      const upcoming = await EsportsAPI.getUpcomingMatches();
      if (!upcoming) return;

      upcoming.forEach(m => {
        const normalized = EsportsAPI.normalizeMatch(m);
        if (!FavoritesManager.matchHasFavorite(normalized)) return;

        const minutes = Utils.minutesUntil(normalized.beginAt);
        const matchKey = `reminder_${normalized.id}`;

        // 15 dakika kala hatırlatma (14-16 dakika arası)
        if (minutes >= 14 && minutes <= 16 && !trackedMatches.has(matchKey)) {
          trackedMatches.add(matchKey);
          const favTeam = FavoritesManager.getFavoriteTeamInMatch(normalized);
          const opponent = normalized.team1.name === favTeam?.name ? normalized.team2 : normalized.team1;

          sendInAppNotification(
            '⏰ Maç Hatırlatıcı',
            `${favTeam?.name || 'Favori takımın'} ${minutes} dakika sonra ${opponent.acronym || opponent.name} ile karşılaşıyor!\n🎮 ${normalized.gameName} — ${normalized.league}\n📺 ${normalized.stream.name}`,
            'reminder',
            { matchId: normalized.id }
          );

          sendBrowserNotification(
            `⏰ ${favTeam?.name} Maçı 15dk Sonra!`,
            `${favTeam?.name} vs ${opponent.acronym || opponent.name} — ${normalized.gameName}\n📺 ${normalized.stream.name}`,
            { tag: `reminder-${normalized.id}` }
          );
        }
      });

      // Biten maçların skorlarını kontrol et
      checkFinishedMatches();
    } catch (e) {
      console.error('Maç kontrolü başarısız:', e);
    }
  }

  // ===== SKOR BİLDİRİMİ =====

  async function checkFinishedMatches() {
    try {
      const past = await EsportsAPI.getPastMatches(null, 10);
      if (!past) return;

      past.forEach(m => {
        const normalized = EsportsAPI.normalizeMatch(m);
        if (!FavoritesManager.matchHasFavorite(normalized)) return;

        const scoreKey = `score_${normalized.id}`;
        if (trackedMatches.has(scoreKey)) return;

        // Son 2 saat içinde biten maçlar
        if (normalized.endAt) {
          const endTime = new Date(normalized.endAt);
          const hoursSinceEnd = (Date.now() - endTime) / 3600000;
          if (hoursSinceEnd > 2) return;
        }

        trackedMatches.add(scoreKey);
        const favTeam = FavoritesManager.getFavoriteTeamInMatch(normalized);
        const isTeam1 = normalized.team1.name === favTeam?.name || normalized.team1.acronym === favTeam?.acronym;
        const favScore = isTeam1 ? normalized.team1.score : normalized.team2.score;
        const oppScore = isTeam1 ? normalized.team2.score : normalized.team1.score;
        const opponent = isTeam1 ? normalized.team2 : normalized.team1;
        const won = favScore > oppScore;

        const resultEmoji = won ? '🎉' : '😔';
        const resultText = won ? 'KAZANDI!' : 'kaybetti.';

        sendInAppNotification(
          `🏆 Maç Sonucu`,
          `${resultEmoji} ${favTeam?.name} ${favScore}-${oppScore} ${opponent.acronym || opponent.name} — ${resultText}\n🎮 ${normalized.gameName} — ${normalized.league}`,
          'score',
          { matchId: normalized.id }
        );

        sendBrowserNotification(
          `🏆 ${favTeam?.name} ${favScore}-${oppScore} ${opponent.acronym || opponent.name}`,
          `${resultEmoji} ${favTeam?.name} ${resultText}\n${normalized.gameName} — ${normalized.league}`,
          { tag: `score-${normalized.id}` }
        );
      });
    } catch (e) {
      console.error('Skor kontrolü başarısız:', e);
    }
  }

  // ===== GEÇM İŞ & AYARLAR =====

  function loadHistory() {
    try {
      notificationHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
      notificationHistory = [];
    }
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(notificationHistory));
  }

  function getHistory() {
    return [...notificationHistory];
  }

  function getUnreadCount() {
    return notificationHistory.filter(n => !n.read).length;
  }

  function markAllRead() {
    notificationHistory.forEach(n => n.read = true);
    saveHistory();
    if (onNotificationCallback) onNotificationCallback(null);
  }

  function clearHistory() {
    notificationHistory = [];
    saveHistory();
  }

  function onNotification(callback) {
    onNotificationCallback = callback;
  }

  // Cleanup
  function destroy() {
    if (dailySummaryTimer) clearInterval(dailySummaryTimer);
    if (matchCheckInterval) clearInterval(matchCheckInterval);
    Object.values(timers).forEach(t => clearTimeout(t));
    timers = {};
  }

  return {
    init, requestPermission, isPermissionGranted,
    sendBrowserNotification, sendInAppNotification,
    triggerDailySummary, checkUpcomingFavoriteMatches, checkFinishedMatches,
    getHistory, getUnreadCount, markAllRead, clearHistory,
    onNotification, destroy,
  };
})();
