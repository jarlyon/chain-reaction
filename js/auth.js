let currentUser = null;

function initAuth() {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    const loggedIn  = document.getElementById('logged-in-view');
    const loggedOut = document.getElementById('logged-out-view');
    const emailEl   = document.getElementById('user-email');
    if (user) {
      if (loggedIn)  loggedIn.style.display  = '';
      if (loggedOut) loggedOut.style.display = 'none';
      if (emailEl)   emailEl.textContent     = user.email;
      loadUserStats(user.uid);
    } else {
      if (loggedIn)  loggedIn.style.display  = 'none';
      if (loggedOut) loggedOut.style.display = '';
    }
  });
}

async function signInEmail(email, pass) {
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    document.getElementById('profile-modal').classList.remove('open');
  } catch (err) {
    const errEl = document.getElementById('auth-error');
    if (errEl) { errEl.textContent = friendlyAuthError(err.code); errEl.style.display = 'block'; }
  }
}

async function signUpEmail(email, pass) {
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await initUserDoc(cred.user);
    document.getElementById('profile-modal').classList.remove('open');
  } catch (err) {
    const errEl = document.getElementById('auth-error');
    if (errEl) { errEl.textContent = friendlyAuthError(err.code); errEl.style.display = 'block'; }
  }
}

async function signInGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const cred = await auth.signInWithPopup(provider);
    const snap = await db.collection('users').doc(cred.user.uid).get();
    if (!snap.exists) await initUserDoc(cred.user);
    document.getElementById('profile-modal').classList.remove('open');
  } catch (err) {
    const errEl = document.getElementById('auth-error');
    if (errEl && err.code !== 'auth/popup-closed-by-user') {
      errEl.textContent = friendlyAuthError(err.code); errEl.style.display = 'block';
    }
  }
}

async function signOutUser() { await auth.signOut(); }

async function initUserDoc(user) {
  await db.collection('users').doc(user.uid).set({
    displayName: user.displayName || user.email.split('@')[0],
    email: user.email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    stats: { attempted: 0, completed: 0, hintsUsed: 0, totalWrongOnCompletions: 0,
      streak: 0, bestStreak: 0,
      easy: { attempted: 0, completed: 0 },
      hard: { attempted: 0, completed: 0 }
    },
    recentGames: []
  }, { merge: true });
}

function friendlyAuthError(code) {
  const map = {
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
