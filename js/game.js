// ─────────────────────────────────────────────────────────
//  GAME LOGIC
// ─────────────────────────────────────────────────────────

const MAX_WRONG = 5;
const MAX_HINTS = 3;

let puzzle, currentRow, hintsLeft, wrongCount, rowStates, hintedLetters, gameOver, gameMode;
gameMode = 'easy';

// ── Pick a random puzzle (avoid repeating last) ──────────
let lastPuzzleId = null;
function pickPuzzle() {
  const pool = PUZZLES.filter(p => p.id !== lastPuzzleId);
  const p = pool[Math.floor(Math.random() * pool.length)];
  lastPuzzleId = p.id;
  return p;
}

// ── Init / reset ─────────────────────────────────────────
function initGame(puzzleOverride) {
  puzzle       = puzzleOverride || pickPuzzle();
  currentRow   = 0;
  hintsLeft    = MAX_HINTS;
  wrongCount   = 0;
  gameOver     = false;
  rowStates    = puzzle.words.map(() => ({ solved: false, revealed: false }));
  hintedLetters = puzzle.words.map(() => 1);

  // Theme badge
  const badge = document.getElementById('theme-badge');
  badge.textContent = puzzle.theme || '\u00a0';

  // Enable inputs
  document.getElementById('word-input').disabled = false;
  document.getElementById('btn-submit').disabled = false;
  if (gameMode === 'easy') document.getElementById('btn-hint').disabled = false;

  renderPips();
  renderChain();
  updateGameStats();
  updateProgress();
  showMessage('', '');
  setTimeout(() => document.getElementById('word-input').focus(), 100);
}

function setMode(m) {
  gameMode = m;
  document.getElementById('mode-easy').className = 'mode-btn' + (m === 'easy' ? ' active-easy' : '');
  document.getElementById('mode-hard').className = 'mode-btn' + (m === 'hard' ? ' active-hard' : '');
  const hintBtn = document.getElementById('btn-hint');
  const hintStat = document.getElementById('stat-hints-wrap');
  hintBtn.style.display  = m === 'hard' ? 'none' : 'flex';
  hintStat.style.display = m === 'hard' ? 'none' : 'block';
  initGame();
}

// ── Render pips ──────────────────────────────────────────
function renderPips() {
  const c = document.getElementById('wrong-pips');
  c.innerHTML = '';
  for (let i = 0; i < MAX_WRONG; i++) {
    const pip = document.createElement('div');
    pip.className = 'pip' + (i < wrongCount ? ' used' : '');
    c.appendChild(pip);
  }
  ['hpip1','hpip2','hpip3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.className = 'hint-pip' + (i >= hintsLeft ? ' used' : '');
  });
}

// ── Render chain ─────────────────────────────────────────
function renderChain() {
  const chain = document.getElementById('chain');
  chain.innerHTML = '';

  puzzle.words.forEach((entry, i) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'chain-row';

    const tiles = document.createElement('div');
    tiles.className = 'tiles';
    tiles.id = `tiles-${i}`;
    rowDiv.appendChild(tiles);

    const clueLabel = document.createElement('span');
    clueLabel.id = `row-clue-${i}`;
    clueLabel.className = 'row-clue-label ' +
      (gameMode === 'hard' ? 'hidden' : (i === currentRow ? 'active' : 'inactive'));
    clueLabel.textContent = entry.clue;
    rowDiv.appendChild(clueLabel);

    chain.appendChild(rowDiv);

    if (i < puzzle.words.length - 1) {
      const linkRow = document.createElement('div');
      linkRow.className = 'link-row';
      const dots = document.createElement('div');
      dots.className = 'link-col';
      for (let d = 0; d < 3; d++) {
        const dot = document.createElement('div');
        dot.className = 'link-dot';
        dots.appendChild(dot);
      }
      const pairLbl = document.createElement('span');
      pairLbl.className = 'pair-label';
      pairLbl.id = `pair-${i}`;
      linkRow.appendChild(dots);
      linkRow.appendChild(pairLbl);
      chain.appendChild(linkRow);
    }
  });

  puzzle.words.forEach((_, i) => renderTiles(i));
  puzzle.words.forEach((_, i) => updatePairLabel(i));
  updateClueDisplay();
}

function renderTiles(rowIdx) {
  const entry = puzzle.words[rowIdx];
  const state = rowStates[rowIdx];
  const hintsShown = hintedLetters[rowIdx];
  const tilesDiv = document.getElementById(`tiles-${rowIdx}`);
  if (!tilesDiv) return;
  tilesDiv.innerHTML = '';

  for (let i = 0; i < entry.word.length; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    if (state.solved) {
      tile.textContent = entry.word[i];
      tile.classList.add(state.revealed ? 'revealed' : 'correct');
    } else if (i === 0) {
      tile.textContent = entry.word[0];
      tile.classList.add('given');
    } else if (i < hintsShown) {
      tile.textContent = entry.word[i];
      tile.classList.add('hint-tile');
    } else {
      tile.classList.add('empty');
    }
    tilesDiv.appendChild(tile);
  }
}

function updatePairLabel(i) {
  if (i >= puzzle.words.length - 1) return;
  const el = document.getElementById(`pair-${i}`);
  if (!el) return;
  const wA = puzzle.words[i], wB = puzzle.words[i + 1];
  const sA = rowStates[i],    sB = rowStates[i + 1];
  const showA = sA.solved ? wA.word : wA.word[0] + '___';
  const showB = sB.solved ? wB.word : wB.word[0] + '___';
  el.textContent = showA + ' + ' + showB;
  el.className = 'pair-label' + (sA.solved && sB.solved ? ' revealed-pair' : '');
}

function updateClueHighlight() {
  if (gameMode === 'hard') return;
  puzzle.words.forEach((_, i) => {
    const el = document.getElementById(`row-clue-${i}`);
    if (el) el.className = 'row-clue-label ' + (i === currentRow && !gameOver ? 'active' : 'inactive');
  });
}

function updateClueDisplay() {
  const clueEl    = document.getElementById('current-clue');
  const counterEl = document.getElementById('word-counter');
  if (gameOver || currentRow >= puzzle.words.length) {
    clueEl.textContent    = gameOver ? 'game over' : 'chain complete!';
    counterEl.textContent = '';
    return;
  }
  const entry = puzzle.words[currentRow];
  clueEl.textContent    = gameMode === 'easy' ? entry.clue : `word ${currentRow + 1} of ${puzzle.words.length}`;
  counterEl.textContent = gameMode === 'easy' ? `word ${currentRow + 1} of ${puzzle.words.length}` : '';
  document.getElementById('word-input').placeholder =
    entry.word[0] + '_'.repeat(entry.word.length - 1) + ` (${entry.word.length} letters)`;
}

function updateGameStats() {
  document.getElementById('stat-hints').textContent = hintsLeft;
  document.getElementById('stat-score').textContent =
    rowStates.filter(s => s.solved && !s.revealed).length + '/' + puzzle.words.length;
  renderPips();
}

function updateProgress() {
  const solved = rowStates.filter(s => s.solved && !s.revealed).length;
  document.getElementById('progress').style.width = (solved / puzzle.words.length * 100) + '%';
}

// ── Submit guess ─────────────────────────────────────────
function submitGuess() {
  if (gameOver || currentRow >= puzzle.words.length) return;
  const input = document.getElementById('word-input');
  const val   = input.value.trim().toUpperCase();
  const entry = puzzle.words[currentRow];
  input.value = '';

  if (val.length !== entry.word.length) {
    showMessage(`needs ${entry.word.length} letters`, 'error');
    return;
  }

  if (val === entry.word) {
    rowStates[currentRow].solved = true;
    renderTiles(currentRow);
    animateRow(currentRow);
    if (currentRow > 0) updatePairLabel(currentRow - 1);
    updatePairLabel(currentRow);
    currentRow++;
    updateGameStats();
    updateProgress();
    updateClueHighlight();

    if (currentRow >= puzzle.words.length) {
      endGame(true);
    } else {
      showMessage('correct!', 'success');
      updateClueDisplay();
      setTimeout(() => document.getElementById('word-input').focus(), 50);
    }
  } else {
    wrongCount++;
    updateGameStats();
    const tilesDiv = document.getElementById(`tiles-${currentRow}`);
    tilesDiv && tilesDiv.querySelectorAll('.tile').forEach(t => t.classList.add('wrong-flash'));
    setTimeout(() => renderTiles(currentRow), 400);
    if (wrongCount >= MAX_WRONG) {
      setTimeout(() => endGame(false), 450);
    } else {
      showMessage(`wrong — ${MAX_WRONG - wrongCount} guess${MAX_WRONG - wrongCount !== 1 ? 'es' : ''} remaining`, 'error');
      setTimeout(() => document.getElementById('word-input').focus(), 50);
    }
  }
}

// ── Use hint ─────────────────────────────────────────────
function useHint() {
  if (gameMode === 'hard' || hintsLeft <= 0 || gameOver || currentRow >= puzzle.words.length) return;
  const entry  = puzzle.words[currentRow];
  const shown  = hintedLetters[currentRow];
  if (shown >= entry.word.length) { showMessage('all letters shown — just type it!', 'info'); return; }
  hintsLeft--;
  hintedLetters[currentRow]++;
  renderTiles(currentRow);
  updateGameStats();
  showMessage(`next letter: ${entry.word[hintedLetters[currentRow] - 1]}`, 'info');
  setTimeout(() => document.getElementById('word-input').focus(), 50);
}

// ── End game ─────────────────────────────────────────────
function endGame(won) {
  gameOver = true;
  document.getElementById('word-input').disabled = true;
  document.getElementById('btn-submit').disabled = true;
  document.getElementById('btn-hint').disabled   = true;

  puzzle.words.forEach((_, i) => {
    if (!rowStates[i].solved) { rowStates[i].solved = true; rowStates[i].revealed = true; }
  });
  puzzle.words.forEach((_, i) => { renderTiles(i); updatePairLabel(i); });

  // On game over in hard mode, show clues
  if (!won) {
    puzzle.words.forEach((_, i) => {
      const el = document.getElementById(`row-clue-${i}`);
      if (el) { el.className = 'row-clue-label inactive'; }
    });
  }

  updateClueDisplay();
  updateProgress();

  const solvedCount = rowStates.filter(s => !s.revealed).length;
  const hintsUsed   = MAX_HINTS - hintsLeft;

  if (won) {
    showMessage('🎉 Chain complete! ' +
      (hintsUsed === 0 ? 'No hints used — perfect!' : `${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''} used.`), 'win');
  } else {
    showMessage(`Game over! You solved ${solvedCount} of ${puzzle.words.length}. Answers revealed.`, 'gameover');
  }

  // Save to stats
  saveGameResult({
    puzzleId:   puzzle.id,
    theme:      puzzle.theme || 'untitled',
    mode:       gameMode,
    won,
    solved:     solvedCount,
    total:      puzzle.words.length,
    hintsUsed,
    wrongGuesses: wrongCount,
    timestamp:  Date.now()
  });
}

// ── Animate row ──────────────────────────────────────────
function animateRow(rowIdx) {
  const tilesDiv = document.getElementById(`tiles-${rowIdx}`);
  if (!tilesDiv) return;
  tilesDiv.querySelectorAll('.tile').forEach((t, i) => {
    setTimeout(() => { t.className = 'tile correct pop'; }, i * 50);
  });
}

// ── Show message ─────────────────────────────────────────
function showMessage(text, type) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className   = 'message' + (text ? ' show ' + type : '');
}
