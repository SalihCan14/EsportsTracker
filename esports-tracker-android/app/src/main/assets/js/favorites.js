/**
 * E-Spor Takip Merkezi — Favori Takım Yönetimi
 * localStorage ile kalıcı favori listesi
 */

const FavoritesManager = (() => {
  const STORAGE_KEY = 'esports_favorites';
  let favorites = [];
  let listeners = [];

  // Başlat
  function init() {
    load();
  }

  // localStorage'dan yükle
  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      favorites = stored ? JSON.parse(stored) : [];
    } catch {
      favorites = [];
    }
  }

  // localStorage'a kaydet
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    notifyListeners();
  }

  // Favori ekle
  function add(team) {
    if (isFavorite(team.id || team.slug)) return;
    favorites.push({
      id: team.id,
      slug: team.slug,
      name: team.name,
      acronym: team.acronym || team.name,
      game: team.game || null,
      addedAt: new Date().toISOString(),
    });
    save();
  }

  // Favori çıkar
  function remove(teamIdOrSlug) {
    favorites = favorites.filter(f => f.id !== teamIdOrSlug && f.slug !== teamIdOrSlug);
    save();
  }

  // Toggle
  function toggle(team) {
    if (isFavorite(team.id || team.slug)) {
      remove(team.id || team.slug);
      return false;
    } else {
      add(team);
      return true;
    }
  }

  // Favori mi kontrol et
  function isFavorite(teamIdOrSlug) {
    return favorites.some(f => f.id === teamIdOrSlug || f.slug === teamIdOrSlug);
  }

  // Takım adına göre favori mi
  function isFavoriteByName(teamName) {
    if (!teamName) return false;
    const lower = teamName.toLowerCase();
    return favorites.some(f =>
      f.name.toLowerCase() === lower ||
      (f.acronym && f.acronym.toLowerCase() === lower)
    );
  }

  // Tüm favorileri al
  function getAll() {
    return [...favorites];
  }

  // Favori sayısı
  function count() {
    return favorites.length;
  }

  // Bir maçta favori takım var mı?
  function matchHasFavorite(match) {
    const t1 = match.team1 || match.opponents?.[0]?.opponent;
    const t2 = match.team2 || match.opponents?.[1]?.opponent;
    if (!t1 && !t2) return false;

    return (t1 && (isFavorite(t1.id) || isFavorite(t1.slug) || isFavoriteByName(t1.name) || isFavoriteByName(t1.acronym))) ||
           (t2 && (isFavorite(t2.id) || isFavorite(t2.slug) || isFavoriteByName(t2.name) || isFavoriteByName(t2.acronym)));
  }

  // Maçtaki favori takımı bul
  function getFavoriteTeamInMatch(match) {
    const t1 = match.team1 || match.opponents?.[0]?.opponent;
    const t2 = match.team2 || match.opponents?.[1]?.opponent;

    if (t1 && (isFavorite(t1.id) || isFavorite(t1.slug) || isFavoriteByName(t1.name))) return t1;
    if (t2 && (isFavorite(t2.id) || isFavorite(t2.slug) || isFavoriteByName(t2.name))) return t2;
    return null;
  }

  // Listener sistemi
  function onChange(callback) {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(l => l !== callback);
    };
  }

  function notifyListeners() {
    listeners.forEach(l => {
      try { l(favorites); } catch (e) { console.error('Favorite listener error:', e); }
    });
  }

  // Tüm favorileri temizle
  function clear() {
    favorites = [];
    save();
  }

  return {
    init, add, remove, toggle, isFavorite, isFavoriteByName,
    matchHasFavorite, getFavoriteTeamInMatch,
    getAll, count, clear, onChange,
  };
})();
