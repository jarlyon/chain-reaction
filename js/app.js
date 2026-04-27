// ─────────────────────────────────────────────────────────
//  APP  —  bootstraps UI, wires all event listeners
// ─────────────────────────────────────────────────────────

function showGameScreen() {
  document.getElementById('screen-auth').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  if (!puzzle) initGame();
}

function showAuthScreen() {
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-auth').classList.add('active');
}

function openModal(id)  { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.addEventListener('DOMContentLoaded', () => {

  // Auth
  initAuth();

  // Mode buttons
  document.getElementById('mode-easy').addEventListener('click', () => setMode('easy'));
  document.getElementById('mode-hard').addEventListener('click', () => setMode('hard'));

  // Game buttons
  document.getElementById('btn-submit') && document.getElementById('btn-submit').addEventListener('click', submitGuess);
  document.getElementById('btn-hint').addEventListener('click', useHint);
  document.getElementById('btn-new').addEventListener('click', () => initGame());

  // Hidden input keyboard handler (tile typing)
  const hiddenInput = document.getElementById('hidden-input');

  hiddenInput.addEventListener('keydown', e => {
    if (gameOver || currentRow >= puzzle.words.length) return;
    const entry  = puzzle.words[currentRow];
    const locked = hintedLetters[currentRow];
    const typed  = typedLetters[currentRow];

    if (e.key === 'Enter') {
      e.preventDefault();
      submitGuess();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (cursorPos >= locked) {
        if (typed[cursorPos]) {
          typed[cursorPos] = null;
        } else if (cursorPos > locked) {
          cursorPos--;
          typed[cursorPos] = null;
        }
      }
      renderTiles(currentRow);
      return;
    }

    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      let pos = Math.max(cursorPos, locked);
      if (pos < entry.word.length) {
        typed[pos] = e.key.toUpperCase();
        if (pos + 1 < entry.word.length) cursorPos = pos + 1;
        else cursorPos = pos;
      }
      renderTiles(currentRow);
    }
  });

  hiddenInput.addEventListener('blur', () => {
    if (!gameOver && puzzle && currentRow < puzzle.words.length) {
      setTimeout(focusHiddenInput, 80);
    }
  });

  // Stats modal
  document.getElementById('btn-stats-open').addEventListener('click', () => {
    if (currentUser) loadUserStats(currentUser.uid);
    openModal('modal-stats');
  });
  document.getElementById('btn-stats-close').addEventListener('click', () => closeModal('modal-stats'));
  document.getElementById('modal-stats').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('modal-stats');
  });

  // Profile modal
  document.getElementById('btn-profile-open').addEventListener('click', () => {
    updateProfileUI(currentUser);
    openModal('modal-profile');
  });
  document.getElementById('btn-profile-close').addEventListener('click', () => closeModal('modal-profile'));
  document.getElementById('modal-profile').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('modal-profile');
  });

  // PWA install prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  function showInstallBanner() {
    if (document.getElementById('install-banner')) return;
    if (localStorage.getItem('install-dismissed')) return;
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.id = 'install-banner';
    banner.innerHTML = `
      <span>Add to home screen for the best experience</span>
      <button id="install-yes">Install</button>
      <button class="dismiss" id="install-no">✕</button>
    `;
    document.body.appendChild(banner);
    document.getElementById('install-yes').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.remove();
    });
    document.getElementById('install-no').addEventListener('click', () => {
      localStorage.setItem('install-dismissed', '1');
      banner.remove();
    });
  }

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW failed:', err));
  }
});
