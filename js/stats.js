// ─────────────────────────────────────────────────────────
//  STATS
//  Tracks: attempted, completed, avg wrong guesses per completion
// ─────────────────────────────────────────────────────────

async function saveGameResult(result) {
  if (!currentUser) return;

  const ref = db.collection('users').doc(currentUser.uid);

  try {
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;

      const data   = snap.data();
      const stats  = data.stats || {};
      const recent = data.recentGames || [];

      const attempted  = (stats.attempted  || 0) + 1;
      const completed  = (stats.completed  || 0) + (result.won ? 1 : 0);
      const hintsUsed  = (stats.hintsUsed  || 0) + result.hintsUsed;
      const totalWrong = (stats.totalWrong || 0) + result.wrongGuesses;

      // totalWrongOnCompletions: sum of wrong guesses only on games that were won
      // used to calculate avg attempts per completion
      const totalWrongOnCompletions = (stats.totalWrongOnCompletions || 0) +
        (result.won ? result.wrongGuesses : 0);

      // Streak
      let streak     = stats.streak     || 0;
      let bestStreak = stats.bestStreak || 0;
      if (result.won) { streak++; if (streak > bestStreak) bestStreak = streak; }
      else streak = 0;

      // Mode breakdown
      const modeKey   = result.mode;
      const modeStats = stats[modeKey] || { attempted: 0, completed: 0 };
      modeStats.attempted++;
      if (result.won) modeStats.completed++;

      // Recent games (keep last 10)
      const recentEntry = {
        puzzleId:    result.puzzleId,
        theme:       result.theme,
        mode:        result.mode,
        won:         result.won,
        solved:      result.solved,
        total:       result.total,
        hintsUsed:   result.hintsUsed,
        wrongGuesses:result.wrongGuesses,
        timestamp:   result.timestamp
      };
      const updatedRecent = [recentEntry, ...recent].slice(0, 10);

      tx.update(ref, {
        stats: {
          ...stats,
          attempted, completed, hintsUsed, totalWrong,
          totalWrongOnCompletions, streak, bestStreak,
          [modeKey]: modeStats
        },
        recentGames: updatedRecent
      });
    });

    loadUserStats(currentUser.uid);
  } catch (err) {
    console.warn('Failed to save game result:', err);
  }
}

async function loadUserStats(uid) {
  try {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return;
    const data = snap.data();
    renderStatsModal(data.stats || {}, data.recentGames || []);
  } catch (err) {
    console.warn('Failed to load stats:', err);
  }
}

function renderStatsModal(stats, recent) {
  const attempted   = stats.attempted   || 0;
  const completed   = stats.completed   || 0;
  const hintsUsed   = stats.hintsUsed   || 0;
  const streak      = stats.streak      || 0;
  const bestStreak  = stats.bestStreak  || 0;

  // Avg wrong guesses per completion (lower = better)
  // = total wrong guesses across won games / number of wins
  const totalWrongOnCompletions = stats.totalWrongOnCompletions || 0;
  const avgAttempts = completed > 0
    ? (totalWrongOnCompletions / completed).toFixed(1)
    : '—';

  setText('ms-attempted',   attempted);
  setText('ms-completed',   completed);
  setText('ms-avg-attempts', avgAttempts);
  setText('ms-streak',      streak);
  setText('ms-best-streak', bestStreak);
  setText('ms-hints',       hintsUsed);

  const easy = stats.easy || { attempted: 0, completed: 0 };
  const hard = stats.hard || { attempted: 0, completed: 0 };
  setText('ms-easy-completed', easy.completed || 0);
  setText('ms-easy-attempted', easy.attempted || 0);
  setText('ms-hard-completed', hard.completed || 0);
  setText('ms-hard-attempted', hard.attempted || 0);

  // Recent games list
  const list = document.getElementById('recent-games-list');
  list.innerHTML = '';
  if (!recent.length) {
    list.innerHTML = '<div style="color:var(--text3);font-size:13px;text-align:center;padding:12px">no games yet</div>';
    return;
  }
  recent.forEach(g => {
    const row  = document.createElement('div');
    row.className = 'recent-game-row';
    const date = new Date(g.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const wrongStr = g.wrongGuesses > 0 ? ` · ${g.wrongGuesses} wrong` : '';
    const hintStr  = g.hintsUsed   > 0 ? ` · ${g.hintsUsed} hint${g.hintsUsed !== 1 ? 's' : ''}` : '';
    row.innerHTML = `
      <div class="rg-left">
        <div class="rg-theme">${g.theme || 'untitled'}</div>
        <div class="rg-meta">${date} · ${g.mode} · ${g.solved}/${g.total} solved${wrongStr}${hintStr}</div>
      </div>
      <div class="rg-result ${g.won ? 'win' : 'loss'}">${g.won ? 'win' : 'loss'}</div>
    `;
    list.appendChild(row);
  });
}

function resetStatsDisplay() {
  renderStatsModal({}, []);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}