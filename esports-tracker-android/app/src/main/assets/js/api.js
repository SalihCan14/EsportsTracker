/**
 * E-Spor Takip Merkezi — API Servisi
 * PandaScore API entegrasyonu + Mock/Demo veri
 */

const EsportsAPI = (() => {
  const BASE_URL = 'https://api.pandascore.co';
  let apiKey = localStorage.getItem('pandascore_api_key') || '';
  let cache = {};
  const CACHE_TTL = 5 * 60 * 1000; // 5 dakika

  // API anahtarını ayarla
  function setApiKey(key) {
    apiKey = key.trim();
    localStorage.setItem('pandascore_api_key', apiKey);
    cache = {};
  }

  function getApiKey() {
    return apiKey;
  }

  function hasApiKey() {
    return apiKey.length > 0;
  }

  // API çağrısı
  async function apiCall(endpoint, params = {}) {
    if (!hasApiKey()) return null;

    const cacheKey = endpoint + JSON.stringify(params);
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return cached.data;
    }

    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    url.searchParams.append('token', apiKey);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      cache[cacheKey] = { data, time: Date.now() };
      return data;
    } catch (err) {
      console.warn('API çağrısı başarısız:', err.message);
      return null;
    }
  }

  // Yaklaşan maçlar
  async function getUpcomingMatches(game = null, perPage = 50) {
    if (!hasApiKey()) return getMockUpcomingMatches(game);
    const params = { per_page: perPage, sort: 'begin_at' };
    const endpoint = game ? `/${game}/matches/upcoming` : '/matches/upcoming';
    const data = await apiCall(endpoint, params);
    return data || getMockUpcomingMatches(game);
  }

  // Canlı maçlar
  async function getRunningMatches(game = null) {
    if (!hasApiKey()) return getMockRunningMatches(game);
    const endpoint = game ? `/${game}/matches/running` : '/matches/running';
    const data = await apiCall(endpoint, { per_page: 50 });
    return data || getMockRunningMatches(game);
  }

  // Geçmiş maçlar
  async function getPastMatches(game = null, perPage = 20) {
    if (!hasApiKey()) return getMockPastMatches(game);
    const endpoint = game ? `/${game}/matches/past` : '/matches/past';
    const data = await apiCall(endpoint, { per_page: perPage, sort: '-end_at' });
    return data || getMockPastMatches(game);
  }

  // Tüm maçları al (bugünkü + yaklaşan + canlı)
  async function getAllTodayMatches() {
    const [upcoming, running] = await Promise.all([
      getUpcomingMatches(),
      getRunningMatches()
    ]);
    const all = [...(running || []), ...(upcoming || [])];
    return all.filter(m => {
      if (!m.begin_at) return false;
      return Utils.isToday(m.begin_at) || m.status === 'running';
    });
  }

  // ========== MOCK VERİ ==========

  const MOCK_TEAMS = {
    lol: [
      { id: 1, name: 'T1', acronym: 'T1', image_url: null, slug: 't1' },
      { id: 2, name: 'Gen.G', acronym: 'GEN', image_url: null, slug: 'gen-g' },
      { id: 3, name: 'G2 Esports', acronym: 'G2', image_url: null, slug: 'g2' },
      { id: 4, name: 'Fnatic', acronym: 'FNC', image_url: null, slug: 'fnatic' },
      { id: 5, name: 'Cloud9', acronym: 'C9', image_url: null, slug: 'cloud9' },
      { id: 6, name: 'Team Liquid', acronym: 'TL', image_url: null, slug: 'team-liquid' },
      { id: 7, name: 'JD Gaming', acronym: 'JDG', image_url: null, slug: 'jdg' },
      { id: 8, name: 'Bilibili Gaming', acronym: 'BLG', image_url: null, slug: 'blg' },
      { id: 9, name: 'DRX', acronym: 'DRX', image_url: null, slug: 'drx' },
      { id: 10, name: 'Hanwha Life Esports', acronym: 'HLE', image_url: null, slug: 'hle' },
    ],
    cs2: [
      { id: 11, name: 'Natus Vincere', acronym: 'NAVI', image_url: null, slug: 'navi' },
      { id: 12, name: 'FaZe Clan', acronym: 'FaZe', image_url: null, slug: 'faze' },
      { id: 13, name: 'Vitality', acronym: 'VIT', image_url: null, slug: 'vitality' },
      { id: 14, name: 'G2 Esports', acronym: 'G2', image_url: null, slug: 'g2-cs' },
      { id: 15, name: 'Team Spirit', acronym: 'Spirit', image_url: null, slug: 'spirit' },
      { id: 16, name: 'MOUZ', acronym: 'MOUZ', image_url: null, slug: 'mouz' },
      { id: 17, name: 'Heroic', acronym: 'Heroic', image_url: null, slug: 'heroic' },
      { id: 18, name: 'Complexity', acronym: 'COL', image_url: null, slug: 'complexity' },
    ],
    valorant: [
      { id: 21, name: 'Sentinels', acronym: 'SEN', image_url: null, slug: 'sentinels' },
      { id: 22, name: 'Fnatic', acronym: 'FNC', image_url: null, slug: 'fnatic-val' },
      { id: 23, name: 'LOUD', acronym: 'LOUD', image_url: null, slug: 'loud' },
      { id: 24, name: 'DRX', acronym: 'DRX', image_url: null, slug: 'drx-val' },
      { id: 25, name: 'Paper Rex', acronym: 'PRX', image_url: null, slug: 'paper-rex' },
      { id: 26, name: 'Evil Geniuses', acronym: 'EG', image_url: null, slug: 'eg' },
      { id: 27, name: 'Team Heretics', acronym: 'TH', image_url: null, slug: 'heretics' },
      { id: 28, name: 'EDward Gaming', acronym: 'EDG', image_url: null, slug: 'edg' },
    ],
    dota2: [
      { id: 31, name: 'Team Spirit', acronym: 'Spirit', image_url: null, slug: 'spirit-dota' },
      { id: 32, name: 'Gaimin Gladiators', acronym: 'GG', image_url: null, slug: 'gg' },
      { id: 33, name: 'Team Liquid', acronym: 'TL', image_url: null, slug: 'tl-dota' },
      { id: 34, name: 'Tundra Esports', acronym: 'Tundra', image_url: null, slug: 'tundra' },
      { id: 35, name: 'OG', acronym: 'OG', image_url: null, slug: 'og' },
      { id: 36, name: 'PSG.LGD', acronym: 'LGD', image_url: null, slug: 'lgd' },
      { id: 37, name: 'BetBoom Team', acronym: 'BB', image_url: null, slug: 'betboom' },
      { id: 38, name: 'Entity', acronym: 'Entity', image_url: null, slug: 'entity' },
    ],
  };

  const MOCK_TOURNAMENTS = {
    lol: [
      { name: 'LCK Summer 2026', slug: 'lck-summer-2026' },
      { name: 'LEC Summer 2026', slug: 'lec-summer-2026' },
      { name: 'LCS Summer 2026', slug: 'lcs-summer-2026' },
      { name: 'Worlds 2026 Qualifier', slug: 'worlds-2026-qual' },
    ],
    cs2: [
      { name: 'IEM Katowice 2026', slug: 'iem-katowice-2026' },
      { name: 'BLAST Premier Spring', slug: 'blast-spring' },
      { name: 'ESL Pro League S22', slug: 'esl-pro-s22' },
    ],
    valorant: [
      { name: 'VCT Champions 2026', slug: 'vct-champions-2026' },
      { name: 'VCT Masters Tokyo', slug: 'vct-masters-tokyo' },
      { name: 'VCT EMEA League', slug: 'vct-emea' },
    ],
    dota2: [
      { name: 'The International 2026', slug: 'ti-2026' },
      { name: 'DreamLeague S24', slug: 'dreamleague-s24' },
      { name: 'ESL One Bangkok', slug: 'esl-one-bangkok' },
    ],
  };

  const STREAM_URLS = [
    'https://www.twitch.tv/riotgames',
    'https://www.youtube.com/live/esports',
    'https://www.twitch.tv/esl_csgo',
    'https://www.twitch.tv/valorant',
    'https://www.twitch.tv/dikirikiri',
    'https://www.youtube.com/live/lolesports',
    'https://www.twitch.tv/paboron',
  ];

  function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateMockMatches(game, count, status, startOffset = 0) {
    const games = game ? [game] : ['lol', 'cs2', 'valorant', 'dota2'];
    const matches = [];

    for (let i = 0; i < count; i++) {
      const g = randomPick(games);
      const teams = MOCK_TEAMS[g];
      const t1Index = Math.floor(Math.random() * teams.length);
      let t2Index = Math.floor(Math.random() * teams.length);
      while (t2Index === t1Index) t2Index = Math.floor(Math.random() * teams.length);

      const team1 = teams[t1Index];
      const team2 = teams[t2Index];
      const tournament = randomPick(MOCK_TOURNAMENTS[g]);
      const streamUrl = randomPick(STREAM_URLS);

      const now = new Date();
      let beginAt;
      if (status === 'running') {
        beginAt = new Date(now.getTime() - Math.random() * 3600000);
      } else if (status === 'not_started') {
        const todayStart = new Date(now);
        todayStart.setHours(startOffset + Math.floor(Math.random() * 14), Math.floor(Math.random() * 4) * 15, 0, 0);
        if (todayStart < now) todayStart.setDate(todayStart.getDate() + 1);
        beginAt = todayStart;
      } else {
        beginAt = new Date(now.getTime() - (Math.random() * 86400000 * 3));
      }

      const score1 = status === 'finished' ? Math.floor(Math.random() * 3) : (status === 'running' ? Math.floor(Math.random() * 2) : 0);
      const score2 = status === 'finished' ? Math.floor(Math.random() * 3) : (status === 'running' ? Math.floor(Math.random() * 2) : 0);

      matches.push({
        id: 10000 + i + Math.floor(Math.random() * 10000),
        name: `${team1.acronym} vs ${team2.acronym}`,
        status: status,
        begin_at: beginAt.toISOString(),
        end_at: status === 'finished' ? new Date(beginAt.getTime() + 3600000 + Math.random() * 7200000).toISOString() : null,
        number_of_games: randomPick([1, 3, 5]),
        videogame: { id: g === 'lol' ? 1 : g === 'cs2' ? 3 : g === 'valorant' ? 26 : 4, name: Utils.GAME_NAMES[g], slug: g },
        videogame_title: { name: Utils.GAME_NAMES[g] },
        league: { name: tournament.name, slug: tournament.slug, image_url: null },
        serie: { full_name: tournament.name },
        tournament: { name: tournament.name, slug: tournament.slug },
        opponents: [
          { type: 'Team', opponent: team1 },
          { type: 'Team', opponent: team2 },
        ],
        results: [
          { team_id: team1.id, score: score1 },
          { team_id: team2.id, score: score2 },
        ],
        streams_list: [{ raw_url: streamUrl, language: 'en', main: true }],
        official_stream_url: streamUrl,
        _game: g,
      });
    }

    return matches.sort((a, b) => new Date(a.begin_at) - new Date(b.begin_at));
  }

  function getMockUpcomingMatches(game) {
    return generateMockMatches(game, 20, 'not_started', 10);
  }

  function getMockRunningMatches(game) {
    return generateMockMatches(game, Math.floor(Math.random() * 3) + 1, 'running');
  }

  function getMockPastMatches(game) {
    return generateMockMatches(game, 15, 'finished');
  }

  // Takım listesi (search/filter için)
  function getAllTeams() {
    const all = [];
    Object.entries(MOCK_TEAMS).forEach(([game, teams]) => {
      teams.forEach(t => all.push({ ...t, game }));
    });
    return all;
  }

  // Normalize match data
  function normalizeMatch(m) {
    const game = m._game || (m.videogame ? Utils.normalizeGameSlug(m.videogame.slug || m.videogame.name) : 'lol');
    const team1 = m.opponents?.[0]?.opponent || { name: 'TBD', acronym: 'TBD' };
    const team2 = m.opponents?.[1]?.opponent || { name: 'TBD', acronym: 'TBD' };
    const streamUrl = m.official_stream_url || m.streams_list?.[0]?.raw_url || null;
    const platform = Utils.getPlatformInfo(streamUrl);

    return {
      id: m.id,
      name: m.name,
      status: m.status,
      beginAt: m.begin_at,
      endAt: m.end_at,
      bestOf: m.number_of_games,
      game,
      gameName: Utils.GAME_NAMES[game] || game,
      league: m.league?.name || m.tournament?.name || 'Turnuva',
      team1: { ...team1, score: m.results?.[0]?.score ?? 0 },
      team2: { ...team2, score: m.results?.[1]?.score ?? 0 },
      stream: { url: streamUrl, ...platform },
      raw: m,
    };
  }

  return {
    setApiKey, getApiKey, hasApiKey,
    getUpcomingMatches, getRunningMatches, getPastMatches, getAllTodayMatches,
    getAllTeams, normalizeMatch,
    // expose mock generators for testing
    _mock: { generateMockMatches, getMockUpcomingMatches, getMockRunningMatches, getMockPastMatches },
  };
})();
