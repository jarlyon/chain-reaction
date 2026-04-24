// ─────────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────────

let currentUser = null;
let authTab = 'signin';

function initAuth() {
  // Auth state listener
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      showGameScreen();
      updateProfileUI(user);
      loadUserStats(user.uid);
    } else {
      // Stay on auth screen unless they chose guest
    }
  });

  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      authTab = tab.dataset.tab;
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const nameField = document.getElementById('auth-name');
      const pwField   = document.getElementById('auth-password');
      if (authTab === 'signup') {
        nameField.classList.remove('hidden');
        pwField.setAttribute('autocomplete', 'new-password');
        document.getElementById('auth-submit').textContent = 'sign up';
      } else {
        nameField.classList.add('hidden');
        pwField.setAttribute('autocomplete', 'current-password');
        document.getElementById('auth-submit').textContent = 'sign in';
      }
      clearAuthError();
    });
  });

  // Email/password form
  document.getElementById('auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const name     = document.getElementById('auth-name').value.trim();
    const btn      = document.getElementById('auth-submit');
    btn.disabled = true;
    btn.textContent = '...';

    try {
      if (authTab === 'signup') {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        if (name) await cred.user.updateProfile({ displayName: name });
        await initUserDoc(cred.user);
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }
    } catch (err) {
      showAuthError(friendlyAuthError(err.code));
      btn.disabled = false;
      btn.textContent = authTab === 'signup' ? 'sign up' : 'sign in';
    }
  });

  // Google sign in
  document.getElementById('btn-google').addEventListener('click', async () => {
    try {
      const cred = await auth.signInWithPopup(googleProvider);
      // Create doc if first time
      const snap = await db.collection('users').doc(cred.user.uid).get();
      if (!snap.exists) await initUserDoc(cred.user);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        showAuthError(friendlyAuthError(err.code));
      }
    }
  });

  // Guest play
  document.getElementById('btn-guest').addEventListener('click', () => {
    showGameScreen();
    updateProfileUI(null);
  });

  // Sign in from profile modal
  document.getElementById('btn-signin-from-profile').addEventListener('click', () => {
    closeModal('modal-profile');
    showAuthScreen();
  });

  // Sign out
  document.getElementById('btn-signout').addEventListener('click', async () => {
    await auth.signOut();
    closeModal('modal-profile');
    showAuthScreen();
    // Reset local stats display
    resetStatsDisplay();
  });
}

async function initUserDoc(user) {
  await db.collection('users').doc(user.uid).set({
    displayName: user.displayName || user.email.split('@')[0],
    email: user.email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    stats: {
      played: 0, wins: 0, streak: 0, bestStreak: 0,
      hintsUsed: 0, wrongGuesses: 0,
      easy: { played: 0, wins: 0 },
      hard: { played: 0, wins: 0 }
    },
    recentGames: []
  }, { merge: true });
}

function updateProfileUI(user) {
  const avatarEl  = document.getElementById('profile-avatar');
  const nameEl    = document.getElementById('profile-name');
  const emailEl   = document.getElementById('profile-email');
  const actionsEl = document.getElementById('profile-actions');
  const signoutEl = document.getElementById('signout-actions');

  if (user) {
    const initials = (user.displayName || user.email || '?')
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    avatarEl.textContent = initials;
    nameEl.textContent   = user.displayName || user.email.split('@')[0];
    emailEl.textContent  = user.email;
    actionsEl.classList.add('hidden');
    signoutEl.classList.remove('hidden');
  } else {
    avatarEl.textContent = '?';
    nameEl.textContent   = 'Guest';
    emailEl.textContent  = 'not signed in';
    actionsEl.classList.remove('hidden');
    signoutEl.classList.add('hidden');
  }
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearAuthError() {
  document.getElementById('auth-error').classList.add('hidden');
}

function friendlyAuthError(code) {
  const map = {
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password should be at least 6 characters.',
    'auth/too-many-requests':    'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
