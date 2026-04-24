// ─────────────────────────────────────────────────────────
//  STATS  —  save results to Firestore, load for display
// ─────────────────────────────────────────────────────────

// ── Save a game result ────────────────────────────────────
async function saveGameResult(result) {
  if (!currentUser) return; // guests don't persist

  const ref = db.collection('users').doc(currentUser.uid);

  try {
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;

      const data   = snap.data();
      const stats  = data.stats || {};
      const recent = data.recentGames || [];

      // Update aggregate stats
      const played      = (stats.played || 0) + 1;
      const wins        = (stats.wins || 0) + (result.won ? 1 : 0);
      const hintsUsed   = (stats.hintsUsed || 0) + result.hintsUsed;
      const wrongGuesses = (stats.wrongGuesses || 0) + result.wrongGuesses;

      // Streak
      let streak     = stats.streak || 0;
      let bestStreak = stats.bestStreak || 0;
      if (result.won) {
        streak++;
        if (streak > bestStreak) bestStreak = streak;
      } else {
        streak = 0;
      }

      // Mode breakdown
      const modeKey = result.mode; // 'easy' or 'hard'
      const modeStats = stats[modeKey] || { played: 0, wins: 0 };
      modeStats.played++;
      if (result.won) modeStats.wins++;

      // Recent games (keep last 10)
      const recentEntry = {
        puzzleId:  result.puzzleId,
        theme:     result.theme,
        mode:      result.mode,
        won:       result.won,
        solved:    result.solved,
        total:     result.total,
        hintsUsed: result.hintsUsed,
        timestamp: result.timestamp
      };
      const updatedRecent = [recentEntry, ...recent].slice(0, 10);

      tx.update(ref, {
        stats: {
          ...stats,
          played, wins, streak, bestStreak, hintsUsed, wrongGuesses,
          [modeKey]: modeStats
        },
        recentGames: updatedRecent
      });
    });

    // Refresh stats display if modal is open
    loadUserStats(currentUser.uid);

  } catch (err) {
    console.warn('Failed to save game result:', err);
  }
}

// ── Load and display stats ────────────────────────────────
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
  const played     = stats.played     || 0;
  const wins       = stats.wins       || 0;
  const winPct     = played > 0 ? Math.round((wins / played) * 100) : 0;
  const streak     = stats.streak     || 0;
  const bestStreak = stats.bestStreak || 0;
  const hintsUsed  = stats.hintsUsed  || 0;

  setText('ms-played',      played);
  setText('ms-wins',        wins);
  setText('ms-winpct',      winPct + '%');
  setText('ms-streak',      streak);
  setText('ms-best-streak', bestStreak);
  setText('ms-hints',       hintsUsed);

  const easy = stats.easy || { played: 0, wins: 0 };
  const hard = stats.hard || { played: 0, wins: 0 };
  setText('ms-easy-wins',   easy.wins);
  setText('ms-easy-played', easy.played);
  setText('ms-hard-wins',   hard.wins);
  setText('ms-hard-played', hard.played);

  // Recent games list
  const list = document.getElementById('recent-games-list');
  list.innerHTML = '';
  if (!recent.length) {
    list.innerHTML = '<div style="color:var(--text3);font-size:13px;text-align:center;padding:12px">no games yet</div>';
    return;
  }
  recent.forEach(g => {
    const row = document.createElement('div');
    row.className = 'recent-game-row';
    const date = new Date(g.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    row.innerHTML = `
      <div class="rg-left">
        <div class="rg-theme">${g.theme || 'untitled'}</div>
        <div class="rg-meta">${date} · ${g.mode} · ${g.solved}/${g.total} solved${g.hintsUsed ? ` · ${g.hintsUsed} hint${g.hintsUsed !== 1 ? 's' : ''}` : ''}</div>
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
