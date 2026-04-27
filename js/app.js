// ─────────────────────────────────────────────────────────
//  APP  —  bootstrap, event wiring, tab switching
// ─────────────────────────────────────────────────────────

let activeTab = 'daily'; // 'daily' | 'archive'

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  wireKeyboard();
  wireButtons();
  wireTabs();
  checkAndLoadDaily();
});

// ── Tab switching ─────────────────────────────────────────
function wireTabs() {
  document.getElementById('tab-daily').addEventListener('click', () => switchTab('daily'));
  document.getElementById('tab-archive').addEventListener('click', () => switchTab('archive'));
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-daily').classList.toggle('active', tab === 'daily');
  document.getElementById('tab-archive').classList.toggle('active', tab === 'archive');
  document.getElementById('daily-section').style.display   = tab === 'daily'   ? '' : 'none';
  document.getElementById('archive-section').style.display = tab === 'archive' ? '' : 'none';
  if (tab === 'archive') renderArchiveList();
}

// ── Daily puzzle load + lockout check ─────────────────────
function checkAndLoadDaily() {
  const lastPlayed  = localStorage.getItem('lastPlayedDate');
  const todayKey    = getTodayKey();
  const alreadyDone = lastPlayed === todayKey;

  const playArea    = document.getElementById('daily-play-area');
  const doneScreen  = document.getElementById('daily-done-screen');
  const countdown   = document.getElementById('daily-countdown');

  if (alreadyDone) {
    // Show "come back tomorrow" screen
    playArea.style.display   = 'none';
    doneScreen.style.display = 'flex';
    startCountdown(countdown);
    // Pre-render so they can review
    initGame(getTodaysPuzzle(), false);
    // Show the archived result if stored
    const res = JSON.parse(localStorage.getItem('lastPlayedResult') || '{}');
    if (res.won !== undefined) {
      const msg = document.getElementById('daily-done-msg');
      if (msg) msg.textContent = res.won
        ? `✅ You finished today's chain! ${res.solvedCount || res.total || ''} words, ${res.wrongCount || 0} mistakes.`
        : `❌ You ran out of guesses. Better luck tomorrow!`;
    }
  } else {
    playArea.style.display   = '';
    doneScreen.style.display = 'none';
    initGame(getTodaysPuzzle(), false);
  }
}

function startCountdown(el) {
  function tick() {
    const now      = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    const h  = Math.floor(diff / 3600000);
    const m  = Math.floor((diff % 3600000) / 60000);
    const s  = Math.floor((diff % 60000) / 1000);
    el.textContent = `Next puzzle in ${h}h ${m}m ${s}s`;
  }
  tick();
  setInterval(tick, 1000);
}

// ── Archive list ──────────────────────────────────────────
function renderArchiveList() {
  const container = document.getElementById('archive-list');
  container.innerHTML = '';

  // Build list: always-available archive puzzles + past daily puzzles
  // Past dailies = ones whose date has already passed
  const epoch   = new Date('2025-01-01').getTime();
  const today   = new Date(); today.setHours(0,0,0,0);
  const dayNum  = Math.floor((today.getTime() - epoch) / 86400000);

  // Which daily indices have been "played" (i.e. day has passed)
  const pastDailies = [];
  for (let d = 0; d < dayNum; d++) {
    const idx = d % DAILY_PUZZLES.length;
    const p   = DAILY_PUZZLES[idx];
    if (!pastDailies.find(x => x.id === p.id)) pastDailies.push({ ...p, pastDay: d });
  }

  const allArchive = [...pastDailies.slice(-30), ...ARCHIVE_PUZZLES]; // last 30 past dailies + fixed archive

  if (!allArchive.length) {
    container.innerHTML = '<p style="color:var(--text3);text-align:center;padding:24px">No archive puzzles yet. Come back after day 1!</p>';
    return;
  }

  allArchive.forEach(p => {
    const card = document.createElement('div');
    card.className = 'archive-card';
    const isFixed = p.id.startsWith('a');
    card.innerHTML = `
      <div class="archive-card-info">
        <div class="archive-card-theme">${p.theme}</div>
        <div class="archive-card-meta">${isFixed ? 'Bonus puzzle' : 'Past daily'} · ${p.words.length} words</div>
      </div>
      <button class="archive-play-btn">Play</button>
    `;
    card.querySelector('.archive-play-btn').addEventListener('click', () => {
      // Switch to daily section (reused as play area) and init archive game
      switchTab('daily');
      document.getElementById('daily-play-area').style.display   = '';
      document.getElementById('daily-done-screen').style.display = 'none';
      document.getElementById('archive-badge').style.display     = 'flex';
      initGame(p, true);
    });
    container.appendChild(card);
  });
}

// ── Keyboard wiring ───────────────────────────────────────
function wireKeyboard() {
  const inp = document.getElementById('hidden-input');
  if (!inp) return;

  inp.addEventListener('keydown', e => {
    if (gameOver || activeTab !== 'daily') return;
    const key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
      handleLetter(key); e.preventDefault();
    } else if (e.key === 'Backspace') {
      handleBackspace(); e.preventDefault();
    } else if (e.key === 'Enter') {
      submitGuess(); e.preventDefault();
    }
  });

  // On-screen keyboard
  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      if (!k) return;
      if (k === 'ENTER')  { submitGuess();  focusHiddenInput(); }
      else if (k === 'DEL') { handleBackspace(); focusHiddenInput(); }
      else                { handleLetter(k); focusHiddenInput(); }
    });
  });
}

function handleLetter(letter) {
  if (gameOver || currentRow >= puzzle.words.length) return;
  const rowLen = puzzle.words[currentRow].word.length;
  const locked = hintedLetters[currentRow];
  if (cursorPos < locked || cursorPos >= rowLen) {
    cursorPos = locked;
    if (cursorPos >= rowLen) return;
  }
  typedLetters[currentRow][cursorPos] = letter;
  if (cursorPos < rowLen - 1) cursorPos++;
  renderTiles(currentRow);
}

function handleBackspace() {
  if (gameOver) return;
  const locked = hintedLetters[currentRow];
  if (cursorPos >= locked && typedLetters[currentRow][cursorPos]) {
    typedLetters[currentRow][cursorPos] = null;
  } else if (cursorPos > locked) {
    cursorPos--;
    typedLetters[currentRow][cursorPos] = null;
  }
  renderTiles(currentRow);
}

// ── Buttons ───────────────────────────────────────────────
function wireButtons() {
  document.getElementById('btn-hint').addEventListener('click', useHint);
  document.getElementById('btn-enter').addEventListener('click', () => { submitGuess(); focusHiddenInput(); });

  document.getElementById('mode-easy').addEventListener('click', () => setMode('easy'));
  document.getElementById('mode-hard').addEventListener('click', () => setMode('hard'));

  document.getElementById('btn-stats').addEventListener('click', () => {
    document.getElementById('stats-modal').classList.add('open');
    if (currentUser) loadUserStats(currentUser.uid);
  });
  document.getElementById('close-stats').addEventListener('click', () =>
    document.getElementById('stats-modal').classList.remove('open'));

  document.getElementById('btn-profile').addEventListener('click', () =>
    document.getElementById('profile-modal').classList.add('open'));
  document.getElementById('close-profile').addEventListener('click', () =>
    document.getElementById('profile-modal').classList.remove('open'));

  document.getElementById('sign-out-btn').addEventListener('click', () => {
    signOutUser();
    document.getElementById('profile-modal').classList.remove('open');
  });

  document.getElementById('btn-info').addEventListener('click', () =>
    document.getElementById('info-modal').classList.add('open'));
  document.getElementById('close-info').addEventListener('click', () =>
    document.getElementById('info-modal').classList.remove('open'));

  document.querySelectorAll('.modal-overlay').forEach(m =>
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));

  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email-inp').value;
    const pass  = document.getElementById('pass-inp').value;
    signInEmail(email, pass);
  });
  document.getElementById('signup-btn').addEventListener('click', () => {
    const email = document.getElementById('email-inp').value;
    const pass  = document.getElementById('pass-inp').value;
    signUpEmail(email, pass);
  });
  document.getElementById('google-btn').addEventListener('click', signInGoogle);
}
