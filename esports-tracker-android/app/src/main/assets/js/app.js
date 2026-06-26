/**
 * E-Spor Takip Merkezi — Ana Uygulama Kontrolcüsü
 */

const App = (() => {
  let currentFilter = 'all';
  let currentSection = 'today';
  let refreshInterval = null;
  let allMatches = { running: [], upcoming: [], past: [] };
  let isLoading = false;

  // ===== BAŞLATMA =====
  async function init() {
    FavoritesManager.init();
    await NotificationEngine.init();
    setupEventListeners();
    setupNotificationListener();
    await refreshData();
    startAutoRefresh();
    updateFavoritesUI();
    updateNotificationBadge();
    checkApiKeyStatus();

    // Hoşgeldin bildirimi
    setTimeout(() => {
      NotificationEngine.sendInAppNotification(
        '🎮 E-Spor Takip Merkezi',
        'Hoş geldiniz! Maç programınız yükleniyor. Favori takımlarınızı ekleyerek kişisel bildirimler alabilirsiniz.',
        'info'
      );
    }, 1500);
  }

  // ===== VERİ YÜKLEME =====
  async function refreshData() {
    if (isLoading) return;
    isLoading = true;
    showLoadingState();

    try {
      const [running, upcoming, past] = await Promise.all([
        EsportsAPI.getRunningMatches(),
        EsportsAPI.getUpcomingMatches(),
        EsportsAPI.getPastMatches(),
      ]);

      allMatches.running = (running || []).map(m => EsportsAPI.normalizeMatch(m));
      allMatches.upcoming = (upcoming || []).map(m => EsportsAPI.normalizeMatch(m));
      allMatches.past = (past || []).map(m => EsportsAPI.normalizeMatch(m));

      renderAll();
    } catch (e) {
      console.error('Veri yükleme hatası:', e);
    } finally {
      isLoading = false;
      hideLoadingState();
    }
  }

  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => refreshData(), 5 * 60 * 1000);
  }

  // ===== FİLTRELEME =====
  function filterMatches(matches) {
    if (currentFilter === 'all') return matches;
    if (currentFilter === 'favorites') {
      return matches.filter(m => FavoritesManager.matchHasFavorite(m));
    }
    return matches.filter(m => m.game === currentFilter);
  }

  // ===== RENDER =====
  function renderAll() {
    renderLiveMatches();
    renderTodayMatches();
    renderUpcomingMatches();
    renderPastMatches();
    renderFavoriteMatches();
    updateStats();
  }

  function renderLiveMatches() {
    const container = document.getElementById('live-matches-grid');
    const section = document.getElementById('live-section');
    const filtered = filterMatches(allMatches.running);

    if (filtered.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    container.innerHTML = filtered.map(m => createMatchCard(m, 'live')).join('');
    attachMatchCardListeners(container);
  }

  function renderTodayMatches() {
    const container = document.getElementById('today-matches-grid');
    const badge = document.getElementById('today-count');
    const filtered = filterMatches(allMatches.upcoming.filter(m => Utils.isToday(m.beginAt)));

    badge.textContent = filtered.length;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>Bugün planlanmış maç bulunmuyor</p>
          <p class="empty-sub">Diğer filtreleri deneyin veya yarınki maçlara göz atın</p>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(m => createMatchCard(m, 'today')).join('');
    attachMatchCardListeners(container);
  }

  function renderUpcomingMatches() {
    const container = document.getElementById('upcoming-matches-grid');
    const filtered = filterMatches(
      allMatches.upcoming.filter(m => !Utils.isToday(m.beginAt))
    ).slice(0, 20);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔮</div>
          <p>Yaklaşan maç bulunmuyor</p>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(m => createMatchCard(m, 'upcoming')).join('');
    attachMatchCardListeners(container);
  }

  function renderPastMatches() {
    const container = document.getElementById('past-matches-grid');
    const filtered = filterMatches(allMatches.past).slice(0, 15);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p>Geçmiş maç sonucu bulunmuyor</p>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(m => createMatchCard(m, 'result')).join('');
    attachMatchCardListeners(container);
  }

  function renderFavoriteMatches() {
    const container = document.getElementById('favorite-matches-grid');
    const section = document.getElementById('favorites-section');
    const badge = document.getElementById('fav-count');

    if (FavoritesManager.count() === 0) {
      badge.textContent = '0';
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <p>Henüz favori takım eklemediniz</p>
          <p class="empty-sub">Takım yönetim panelinden favori takımlarınızı ekleyin</p>
        </div>`;
      return;
    }

    const allCurrentMatches = [...allMatches.running, ...allMatches.upcoming];
    const favMatches = allCurrentMatches.filter(m => FavoritesManager.matchHasFavorite(m));
    badge.textContent = favMatches.length;

    if (favMatches.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <p>Favori takımlarınızın yaklaşan maçı yok</p>
          <p class="empty-sub">Favori takımlarınız: ${FavoritesManager.getAll().map(f => f.acronym || f.name).join(', ')}</p>
        </div>`;
      return;
    }

    container.innerHTML = favMatches.map(m => createMatchCard(m, m.status === 'running' ? 'live' : 'today', true)).join('');
    attachMatchCardListeners(container);
  }

  // ===== MAÇ KARTI =====
  function createMatchCard(match, type = 'today', isFavSection = false) {
    const gameColor = Utils.GAME_COLORS[match.game] || Utils.GAME_COLORS.lol;
    const isFav = FavoritesManager.matchHasFavorite(match);
    const statusClass = Utils.getMatchStatusClass(match.status);
    const statusText = Utils.getMatchStatusText(match.status);
    const relativeTime = Utils.formatRelativeTime(match.beginAt);

    const t1Initial = (match.team1.acronym || match.team1.name || '?')[0];
    const t2Initial = (match.team2.acronym || match.team2.name || '?')[0];

    const isLive = match.status === 'running';
    const isFinished = match.status === 'finished';

    let timeDisplay = '';
    if (isLive) {
      timeDisplay = `<span class="match-time-live">🔴 CANLI</span>`;
    } else if (isFinished) {
      timeDisplay = `<span class="match-time-finished">${Utils.formatTime(match.beginAt)}</span>`;
    } else {
      timeDisplay = `<span class="match-time">${Utils.formatTime(match.beginAt)}</span>`;
    }

    let dateLabel = '';
    if (type === 'upcoming') {
      if (Utils.isTomorrow(match.beginAt)) {
        dateLabel = `<span class="match-date-label">Yarın</span>`;
      } else {
        dateLabel = `<span class="match-date-label">${Utils.formatDateShort(match.beginAt)}</span>`;
      }
    }

    const streamHTML = match.stream.url && match.stream.url !== '#'
      ? `<a href="${match.stream.url}" target="_blank" class="stream-link" style="--stream-color:${match.stream.color}">
           <span class="stream-icon">${match.stream.icon}</span>
           <span>${match.stream.name}</span>
         </a>`
      : `<span class="stream-unavailable">Yayın bilgisi yok</span>`;

    return `
      <div class="match-card ${statusClass} ${isFav ? 'match-fav' : ''} ${isLive ? 'match-live-glow' : ''}"
           data-match-id="${match.id}" data-game="${match.game}"
           style="--game-color:${gameColor.primary}">
        <div class="match-card-header">
          <div class="match-game-badge" style="background:${gameColor.gradient}">
            ${Utils.getGameIcon(match.game)}
            <span>${match.gameName}</span>
          </div>
          ${dateLabel}
          <div class="match-meta">
            <span class="match-league">${match.league}</span>
            ${match.bestOf > 1 ? `<span class="match-bo">BO${match.bestOf}</span>` : ''}
          </div>
        </div>

        <div class="match-teams">
          <div class="team team-left ${isFinished && match.team1.score > match.team2.score ? 'team-winner' : ''}">
            <div class="team-logo" style="background:${gameColor.gradient}">${t1Initial}</div>
            <span class="team-name">${match.team1.acronym || match.team1.name}</span>
            ${isFav && FavoritesManager.isFavoriteByName(match.team1.name) ? '<span class="fav-star">⭐</span>' : ''}
          </div>

          <div class="match-score-area">
            ${isLive || isFinished
              ? `<div class="score-display ${isLive ? 'score-live' : ''}">
                   <span class="score-num">${match.team1.score}</span>
                   <span class="score-sep">:</span>
                   <span class="score-num">${match.team2.score}</span>
                 </div>`
              : `<div class="match-vs">VS</div>`
            }
            <div class="match-time-row">
              ${timeDisplay}
              <span class="match-relative">${relativeTime}</span>
            </div>
          </div>

          <div class="team team-right ${isFinished && match.team2.score > match.team1.score ? 'team-winner' : ''}">
            ${isFav && FavoritesManager.isFavoriteByName(match.team2.name) ? '<span class="fav-star">⭐</span>' : ''}
            <span class="team-name">${match.team2.acronym || match.team2.name}</span>
            <div class="team-logo" style="background:${gameColor.gradient}">${t2Initial}</div>
          </div>
        </div>

        <div class="match-card-footer">
          ${streamHTML}
          <div class="match-actions">
            <button class="btn-fav-toggle ${isFav ? 'is-fav' : ''}"
                    data-team1-name="${match.team1.name}" data-team1-id="${match.team1.id || ''}"
                    data-team2-name="${match.team2.name}" data-team2-id="${match.team2.id || ''}"
                    title="Favori takım">
              ${isFav ? '★' : '☆'}
            </button>
          </div>
        </div>
      </div>`;
  }

  function attachMatchCardListeners(container) {
    container.querySelectorAll('.btn-fav-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Basit favori toggle — takımlardan herhangi birini ekle/çıkar
        // Eğer zaten favori olan takım varsa onu çıkar, yoksa bir modal aç
        const t1Name = btn.dataset.team1Name;
        const t2Name = btn.dataset.team2Name;

        if (FavoritesManager.isFavoriteByName(t1Name) || FavoritesManager.isFavoriteByName(t2Name)) {
          // Favori olanı çıkar
          FavoritesManager.getAll().forEach(f => {
            if (f.name === t1Name || f.name === t2Name) {
              FavoritesManager.remove(f.id || f.slug);
            }
          });
        } else {
          // Takım seçimi modalı aç
          showTeamPickModal(btn);
        }
        renderAll();
        updateFavoritesUI();
      });
    });
  }

  function showTeamPickModal(btn) {
    const t1Name = btn.dataset.team1Name;
    const t2Name = btn.dataset.team2Name;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content team-pick-modal">
        <h3>⭐ Hangi takımı favorilere eklemek istersiniz?</h3>
        <div class="team-pick-options">
          <button class="team-pick-btn" data-pick="team1">
            <span class="team-pick-name">${t1Name}</span>
          </button>
          <button class="team-pick-btn" data-pick="team2">
            <span class="team-pick-name">${t2Name}</span>
          </button>
          <button class="team-pick-btn pick-both" data-pick="both">
            <span class="team-pick-name">İkisini de ekle</span>
          </button>
        </div>
        <button class="modal-close-btn">İptal</button>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-visible'));

    overlay.querySelector('.modal-close-btn').addEventListener('click', () => closeModal(overlay));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });

    overlay.querySelectorAll('.team-pick-btn').forEach(pickBtn => {
      pickBtn.addEventListener('click', () => {
        const pick = pickBtn.dataset.pick;
        if (pick === 'team1' || pick === 'both') {
          FavoritesManager.add({ id: btn.dataset.team1Id || t1Name, slug: t1Name.toLowerCase().replace(/\s/g, '-'), name: t1Name, acronym: t1Name });
        }
        if (pick === 'team2' || pick === 'both') {
          FavoritesManager.add({ id: btn.dataset.team2Id || t2Name, slug: t2Name.toLowerCase().replace(/\s/g, '-'), name: t2Name, acronym: t2Name });
        }
        closeModal(overlay);
        renderAll();
        updateFavoritesUI();
      });
    });
  }

  function closeModal(overlay) {
    overlay.classList.remove('modal-visible');
    setTimeout(() => overlay.remove(), 300);
  }

  // ===== İSTATİSTİKLER =====
  function updateStats() {
    const liveCount = allMatches.running.length;
    const todayCount = allMatches.upcoming.filter(m => Utils.isToday(m.beginAt)).length;

    document.getElementById('stat-live').textContent = liveCount;
    document.getElementById('stat-today').textContent = todayCount;
    document.getElementById('stat-upcoming').textContent = allMatches.upcoming.length;
    document.getElementById('stat-favorites').textContent = FavoritesManager.count();

    // Canlı göstergesi
    const liveIndicator = document.getElementById('live-indicator');
    if (liveCount > 0) {
      liveIndicator.classList.add('has-live');
      liveIndicator.textContent = liveCount;
    } else {
      liveIndicator.classList.remove('has-live');
      liveIndicator.textContent = '0';
    }
  }

  // ===== FAVORİ PANEL =====
  function updateFavoritesUI() {
    const container = document.getElementById('favorites-list');
    const favs = FavoritesManager.getAll();

    if (favs.length === 0) {
      container.innerHTML = '<p class="favorites-empty">Henüz favori takım yok</p>';
      return;
    }

    container.innerHTML = favs.map(f => `
      <div class="fav-team-item">
        <span class="fav-team-name">⭐ ${f.acronym || f.name}</span>
        <button class="fav-remove-btn" data-fav-id="${f.id}" data-fav-slug="${f.slug}" title="Çıkar">✕</button>
      </div>
    `).join('');

    container.querySelectorAll('.fav-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        FavoritesManager.remove(btn.dataset.favId || btn.dataset.favSlug);
        renderAll();
        updateFavoritesUI();
      });
    });
  }

  // ===== BİLDİRİM PANELİ =====
  function updateNotificationBadge() {
    const badge = document.getElementById('notif-badge');
    const count = NotificationEngine.getUnreadCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  function renderNotificationPanel() {
    const container = document.getElementById('notification-list');
    const history = NotificationEngine.getHistory();

    if (history.length === 0) {
      container.innerHTML = '<p class="notif-empty">Henüz bildirim yok</p>';
      return;
    }

    container.innerHTML = history.slice(0, 30).map(n => {
      const typeIcons = { info: 'ℹ️', match: '🎮', score: '🏆', reminder: '⏰', summary: '📋' };
      return `
        <div class="notif-item ${n.read ? '' : 'notif-unread'}">
          <span class="notif-icon">${typeIcons[n.type] || '🔔'}</span>
          <div class="notif-content">
            <strong>${n.title}</strong>
            <p>${n.body.replace(/\n/g, '<br>')}</p>
            <span class="notif-time">${Utils.formatRelativeTime(n.timestamp)}</span>
          </div>
        </div>`;
    }).join('');
  }

  function setupNotificationListener() {
    NotificationEngine.onNotification(() => {
      updateNotificationBadge();
      renderNotificationPanel();
    });
  }

  // ===== API ANAHTARI =====
  function checkApiKeyStatus() {
    const indicator = document.getElementById('api-status');
    const input = document.getElementById('api-key-input');
    if (EsportsAPI.hasApiKey()) {
      indicator.className = 'api-status connected';
      indicator.innerHTML = '🟢 API Bağlı';
      if (input) input.value = '••••••••';
    } else {
      indicator.className = 'api-status demo';
      indicator.innerHTML = '🟡 Demo Modu';
    }
  }

  // ===== LOADING =====
  function showLoadingState() {
    document.querySelectorAll('.matches-grid').forEach(grid => {
      if (grid.children.length === 0) {
        grid.innerHTML = Array(3).fill(0).map(() => `
          <div class="match-card skeleton">
            <div class="skeleton-line skeleton-line-sm"></div>
            <div class="skeleton-teams">
              <div class="skeleton-circle"></div>
              <div class="skeleton-line skeleton-line-xs"></div>
              <div class="skeleton-circle"></div>
            </div>
            <div class="skeleton-line skeleton-line-lg"></div>
          </div>`).join('');
      }
    });
  }

  function hideLoadingState() {
    // Loading state is replaced by actual content via renderAll()
  }

  // ===== TEAM MANAGEMENT PANEL =====
  function showTeamManager() {
    const teams = EsportsAPI.getAllTeams();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content team-manager-modal">
        <div class="modal-header">
          <h2>⭐ Takım Yönetimi</h2>
          <button class="modal-close-x">&times;</button>
        </div>
        <div class="team-search-box">
          <input type="text" id="team-search-input" placeholder="Takım ara..." autocomplete="off">
        </div>
        <div class="team-tabs">
          <button class="team-tab active" data-tab="all">Tümü</button>
          <button class="team-tab" data-tab="lol">LoL</button>
          <button class="team-tab" data-tab="cs2">CS2</button>
          <button class="team-tab" data-tab="valorant">Valorant</button>
          <button class="team-tab" data-tab="dota2">Dota 2</button>
        </div>
        <div class="team-list" id="team-manager-list"></div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-visible'));

    const listContainer = overlay.querySelector('#team-manager-list');
    let activeTab = 'all';

    function renderTeamList(filter = '', tab = 'all') {
      let filtered = teams;
      if (tab !== 'all') filtered = filtered.filter(t => t.game === tab);
      if (filter) filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        (t.acronym && t.acronym.toLowerCase().includes(filter.toLowerCase()))
      );

      listContainer.innerHTML = filtered.map(t => {
        const isFav = FavoritesManager.isFavorite(t.id) || FavoritesManager.isFavorite(t.slug) || FavoritesManager.isFavoriteByName(t.name);
        const gameColor = Utils.GAME_COLORS[t.game] || Utils.GAME_COLORS.lol;
        return `
          <div class="team-manager-item ${isFav ? 'is-fav' : ''}">
            <div class="team-manager-info">
              <div class="team-manager-logo" style="background:${gameColor.gradient}">${(t.acronym || t.name)[0]}</div>
              <div>
                <span class="team-manager-name">${t.name}</span>
                <span class="team-manager-game">${Utils.GAME_NAMES[t.game] || t.game}</span>
              </div>
            </div>
            <button class="team-manager-toggle ${isFav ? 'is-fav' : ''}"
                    data-team-id="${t.id}" data-team-slug="${t.slug}"
                    data-team-name="${t.name}" data-team-acronym="${t.acronym || t.name}"
                    data-team-game="${t.game}">
              ${isFav ? '★ Favorilerde' : '☆ Ekle'}
            </button>
          </div>`;
      }).join('');

      listContainer.querySelectorAll('.team-manager-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          FavoritesManager.toggle({
            id: btn.dataset.teamId,
            slug: btn.dataset.teamSlug,
            name: btn.dataset.teamName,
            acronym: btn.dataset.teamAcronym,
            game: btn.dataset.teamGame,
          });
          renderTeamList(overlay.querySelector('#team-search-input').value, activeTab);
          renderAll();
          updateFavoritesUI();
        });
      });
    }

    renderTeamList();

    overlay.querySelector('#team-search-input').addEventListener('input', Utils.debounce((e) => {
      renderTeamList(e.target.value, activeTab);
    }, 200));

    overlay.querySelectorAll('.team-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        overlay.querySelectorAll('.team-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        renderTeamList(overlay.querySelector('#team-search-input').value, activeTab);
      });
    });

    overlay.querySelector('.modal-close-x').addEventListener('click', () => closeModal(overlay));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  }

  // ===== EVENT LISTENERS =====
  function setupEventListeners() {
    // Oyun filtreleri
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderAll();
      });
    });

    // Yenile butonu
    document.getElementById('btn-refresh')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-refresh');
      btn.classList.add('spinning');
      await refreshData();
      setTimeout(() => btn.classList.remove('spinning'), 1000);
    });

    // Günlük özet butonu
    document.getElementById('btn-daily-summary')?.addEventListener('click', () => {
      NotificationEngine.triggerDailySummary();
    });

    // Bildirim izni butonu
    document.getElementById('btn-notif-permission')?.addEventListener('click', async () => {
      const granted = await NotificationEngine.requestPermission();
      const btn = document.getElementById('btn-notif-permission');
      if (granted) {
        btn.innerHTML = '🔔 Bildirimler Aktif';
        btn.classList.add('notif-granted');
      }
    });

    // Bildirim paneli toggle
    document.getElementById('btn-notif-panel')?.addEventListener('click', () => {
      const panel = document.getElementById('notification-panel');
      panel.classList.toggle('panel-open');
      if (panel.classList.contains('panel-open')) {
        NotificationEngine.markAllRead();
        updateNotificationBadge();
        renderNotificationPanel();
      }
    });

    // Bildirim paneli kapat
    document.getElementById('notif-panel-close')?.addEventListener('click', () => {
      document.getElementById('notification-panel').classList.remove('panel-open');
    });

    // Bildirim geçmişini temizle
    document.getElementById('btn-clear-notif')?.addEventListener('click', () => {
      NotificationEngine.clearHistory();
      renderNotificationPanel();
      updateNotificationBadge();
    });

    // API anahtarı kaydet
    document.getElementById('btn-save-api')?.addEventListener('click', () => {
      const input = document.getElementById('api-key-input');
      EsportsAPI.setApiKey(input.value);
      checkApiKeyStatus();
      refreshData();
    });

    // Takım yönetimi aç
    document.getElementById('btn-manage-teams')?.addEventListener('click', () => {
      showTeamManager();
    });

    // Sidebar bölüm navigasyonu
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const target = item.dataset.section;
        if (target) {
          document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
          item.classList.add('active');
        }
      });
    });

    // Sidebar toggle (mobil)
    document.getElementById('btn-sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('sidebar-open');
    });

    // Settings panel toggle
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      document.getElementById('settings-panel').classList.toggle('panel-open');
    });

    document.getElementById('settings-close')?.addEventListener('click', () => {
      document.getElementById('settings-panel').classList.remove('panel-open');
    });
  }

  return { init };
})();

// Uygulama başlat
document.addEventListener('DOMContentLoaded', () => App.init());
