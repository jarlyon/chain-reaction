// ─────────────────────────────────────────────────────────
//  APP  —  bootstraps UI, wires all event listeners
// ─────────────────────────────────────────────────────────

// ── Screen helpers ────────────────────────────────────────
function showGameScreen() {
  document.getElementById('screen-auth').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  if (!puzzle) initGame();
}

function showAuthScreen() {
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-auth').classList.add('active');
}

// ── Modal helpers ─────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Init auth (handles screen routing)
  initAuth();

  // Mode buttons
  document.getElementById('mode-easy').addEventListener('click', () => setMode('easy'));
  document.getElementById('mode-hard').addEventListener('click', () => setMode('hard'));

  // Game inputs
  document.getElementById('btn-submit').addEventListener('click', submitGuess);
  document.getElementById('word-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitGuess();
  });
  document.getElementById('btn-hint').addEventListener('click', useHint);
  document.getElementById('btn-new').addEventListener('click', () => initGame());

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
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.remove();
    });

    document.getElementById('install-no').addEventListener('click', () => {
      localStorage.setItem('install-dismissed', '1');
      banner.remove();
    });
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  }
});
