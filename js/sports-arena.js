/* ================================================================
   SPORTS ARENA — sports-arena.js
   
   Track outdoor activities, round-robin tournaments, and physical
   challenges. Bridges screen time with real-world play.
   
   Storage key: zs_sports_{userName}
   Data: {
     matches: [...],
     tournaments: [...],
     activities: [...],
     customSports: [...],
     totalStars: 0
   }
   
   Requires: auth.js
   ================================================================ */

const SportsArena = (() => {
  'use strict';

  // ── Default sports with scoring rules ──
  const DEFAULT_SPORTS = [
    { id: 'pingpong',    name: 'Table Tennis',   icon: '🏓', scoreType: 'points', winScore: 11, sets: false },
    { id: 'soccer',      name: 'Soccer Goals',   icon: '⚽', scoreType: 'goals',  winScore: null, sets: false },
    { id: 'basketball',  name: 'Basketball',     icon: '🏀', scoreType: 'points', winScore: null, sets: false },
    { id: 'badminton',   name: 'Badminton',      icon: '🏸', scoreType: 'points', winScore: 21, sets: false },
    { id: 'running',     name: 'Race / Running', icon: '🏃', scoreType: 'time',   winScore: null, sets: false },
    { id: 'biking',      name: 'Bike Ride',      icon: '🚴', scoreType: 'check',  winScore: null, sets: false },
    { id: 'walk',        name: 'Walk / Hike',    icon: '🥾', scoreType: 'check',  winScore: null, sets: false },
    { id: 'jumprope',    name: 'Jump Rope',      icon: '🪢', scoreType: 'count',  winScore: null, sets: false },
    { id: 'swimming',    name: 'Swimming',       icon: '🏊', scoreType: 'check',  winScore: null, sets: false },
  ];

  // ── Storage helpers ──

  function _key() {
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return null;
    return 'zs_sports_' + user.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _getData() {
    const key = _key();
    if (!key) return _emptyData();
    try {
      return JSON.parse(localStorage.getItem(key)) || _emptyData();
    } catch { return _emptyData(); }
  }

  function _saveData(data) {
    const key = _key();
    if (key) localStorage.setItem(key, JSON.stringify(data));
  }

  function _emptyData() {
    return {
      matches: [],
      tournaments: [],
      activities: [],
      customSports: [],
      totalStars: 0
    };
  }

  // ── Sports registry (defaults + custom) ──

  function getAllSports() {
    const data = _getData();
    return [...DEFAULT_SPORTS, ...(data.customSports || [])];
  }

  function addCustomSport(sport) {
    const data = _getData();
    if (!data.customSports) data.customSports = [];
    sport.id = 'custom_' + Date.now();
    data.customSports.push(sport);
    _saveData(data);
    return sport;
  }

  function removeCustomSport(id) {
    const data = _getData();
    data.customSports = (data.customSports || []).filter(s => s.id !== id);
    _saveData(data);
  }

  // ── Match logging ──

  function logMatch(match) {
    // match: { sportId, player1, player2, score1, score2, date, winner, notes }
    const data = _getData();
    match.id = 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    match.date = match.date || new Date().toISOString();
    match.winner = _determineWinner(match);

    data.matches.push(match);
    data.totalStars = (data.totalStars || 0) + 1; // 1 star per match played
    _saveData(data);

    if (typeof ActivityLog !== 'undefined') {
      const sport = getAllSports().find(s => s.id === match.sportId);
      ActivityLog.log('Sports Arena', '🏓', `Played a ${sport ? sport.name : 'match'} match`);
    }

    return match;
  }

  function _determineWinner(match) {
    if (match.winner) return match.winner; // Manual override
    const s1 = Number(match.score1) || 0;
    const s2 = Number(match.score2) || 0;
    if (s1 > s2) return match.player1;
    if (s2 > s1) return match.player2;
    return 'draw';
  }

  function getMatches(sportId) {
    const data = _getData();
    if (!sportId) return data.matches || [];
    return (data.matches || []).filter(m => m.sportId === sportId);
  }

  function getRecentMatches(limit) {
    const data = _getData();
    return (data.matches || []).slice(-(limit || 10)).reverse();
  }

  // ── Round Robin Tournament ──

  function createTournament(name, sportId, players) {
    const data = _getData();
    const t = {
      id: 't_' + Date.now(),
      name: name,
      sportId: sportId,
      players: players,
      matches: _generateRoundRobinPairs(players),
      results: {},
      createdAt: new Date().toISOString(),
      completed: false
    };
    data.tournaments.push(t);
    _saveData(data);
    return t;
  }

  function _generateRoundRobinPairs(players) {
    const pairs = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairs.push({
          player1: players[i],
          player2: players[j],
          score1: null,
          score2: null,
          played: false
        });
      }
    }
    return pairs;
  }

  function recordTournamentMatch(tournamentId, matchIndex, score1, score2) {
    const data = _getData();
    const t = data.tournaments.find(x => x.id === tournamentId);
    if (!t || !t.matches[matchIndex]) return null;

    t.matches[matchIndex].score1 = score1;
    t.matches[matchIndex].score2 = score2;
    t.matches[matchIndex].played = true;

    // Also log as a regular match
    const m = t.matches[matchIndex];
    logMatch({
      sportId: t.sportId,
      player1: m.player1,
      player2: m.player2,
      score1: score1,
      score2: score2,
      tournamentId: tournamentId,
      tournamentName: t.name
    });

    // Check if tournament is complete
    t.completed = t.matches.every(m => m.played);

    // Recalculate standings
    t.standings = _calcTournamentStandings(t);

    if (t.completed) {
      data.totalStars = (data.totalStars || 0) + 3; // Bonus for completing tournament
    }

    _saveData(data);
    return t;
  }

  function _calcTournamentStandings(tournament) {
    const stats = {};
    tournament.players.forEach(p => {
      stats[p] = { name: p, wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, matchesPlayed: 0 };
    });

    tournament.matches.forEach(m => {
      if (!m.played) return;
      const s1 = Number(m.score1) || 0;
      const s2 = Number(m.score2) || 0;

      stats[m.player1].pointsFor += s1;
      stats[m.player1].pointsAgainst += s2;
      stats[m.player1].matchesPlayed++;

      stats[m.player2].pointsFor += s2;
      stats[m.player2].pointsAgainst += s1;
      stats[m.player2].matchesPlayed++;

      if (s1 > s2) {
        stats[m.player1].wins++;
        stats[m.player2].losses++;
      } else if (s2 > s1) {
        stats[m.player2].wins++;
        stats[m.player1].losses++;
      } else {
        stats[m.player1].draws++;
        stats[m.player2].draws++;
      }
    });

    // Sort: wins desc, then point diff desc
    return Object.values(stats).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
    });
  }

  function getTournaments() {
    return _getData().tournaments || [];
  }

  function getTournament(id) {
    return (_getData().tournaments || []).find(t => t.id === id);
  }

  // ── Outdoor Activity Logger (non-competitive) ──

  function logActivity(activity) {
    // activity: { sportId, duration, notes, date }
    const data = _getData();
    activity.id = 'a_' + Date.now();
    activity.date = activity.date || new Date().toISOString();
    data.activities.push(activity);
    data.totalStars = (data.totalStars || 0) + 1;
    _saveData(data);

    if (typeof ActivityLog !== 'undefined') {
      const sport = getAllSports().find(s => s.id === activity.sportId);
      ActivityLog.log('Sports Arena', '🏓', `Logged activity: ${sport ? sport.name : 'outdoor activity'}`);
    }

    return activity;
  }

  function getActivities(limit) {
    const data = _getData();
    const all = data.activities || [];
    return limit ? all.slice(-limit).reverse() : all.reverse();
  }

  // ── Global Standings (across all matches) ──

  function getGlobalStandings(sportId) {
    const matches = getMatches(sportId);
    const stats = {};

    matches.forEach(m => {
      [m.player1, m.player2].forEach(p => {
        if (!p) return;
        if (!stats[p]) stats[p] = { name: p, wins: 0, losses: 0, draws: 0, played: 0, pointsFor: 0, pointsAgainst: 0 };
      });

      if (!m.player1 || !m.player2) return;

      const s1 = Number(m.score1) || 0;
      const s2 = Number(m.score2) || 0;

      stats[m.player1].played++;
      stats[m.player1].pointsFor += s1;
      stats[m.player1].pointsAgainst += s2;

      stats[m.player2].played++;
      stats[m.player2].pointsFor += s2;
      stats[m.player2].pointsAgainst += s1;

      if (m.winner === m.player1) {
        stats[m.player1].wins++;
        stats[m.player2].losses++;
      } else if (m.winner === m.player2) {
        stats[m.player2].wins++;
        stats[m.player1].losses++;
      } else if (m.winner === 'draw') {
        stats[m.player1].draws++;
        stats[m.player2].draws++;
      }
    });

    return Object.values(stats).sort((a, b) => b.wins - a.wins || b.played - a.played);
  }

  // ── Stats for hub card ──

  function getStats() {
    const data = _getData();
    return {
      totalMatches: (data.matches || []).length,
      totalActivities: (data.activities || []).length,
      totalStars: data.totalStars || 0,
      activeTournaments: (data.tournaments || []).filter(t => !t.completed).length
    };
  }

  // ── Players list (from profiles + any extras logged) ──

  function getKnownPlayers() {
    const profiles = typeof getProfiles === 'function' ? getProfiles() : [];
    const profileNames = profiles.map(p => p.name);
    
    // Also collect names from past matches
    const data = _getData();
    const matchNames = new Set();
    (data.matches || []).forEach(m => {
      if (m.player1) matchNames.add(m.player1);
      if (m.player2) matchNames.add(m.player2);
    });

    // Merge, profiles first
    const all = [...profileNames];
    matchNames.forEach(n => {
      if (!all.includes(n)) all.push(n);
    });
    return all;
  }

  // ── Weekly streak tracking ──

  function getWeeklyStreak() {
    const data = _getData();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeek = [...(data.matches || []), ...(data.activities || [])].filter(item => {
      return new Date(item.date) >= weekStart;
    });

    // Count unique days with activity
    const days = new Set(thisWeek.map(item => new Date(item.date).toDateString()));
    return { daysActive: days.size, totalThisWeek: thisWeek.length };
  }

  return {
    DEFAULT_SPORTS,
    getAllSports,
    addCustomSport,
    removeCustomSport,
    logMatch,
    getMatches,
    getRecentMatches,
    createTournament,
    recordTournamentMatch,
    getTournaments,
    getTournament,
    logActivity,
    getActivities,
    getGlobalStandings,
    getStats,
    getKnownPlayers,
    getWeeklyStreak,
    _calcTournamentStandings
  };
})();