// ─────────────────────────────────────────────────────────
//  GAME LOGIC
// ─────────────────────────────────────────────────────────

const MAX_WRONG = 5;
const MAX_HINTS = 3;

// Game state
let puzzle, currentRow, hintsLeft, wrongCount, rowStates, hintedLetters;
let gameOver, gameMode, typedLetters, cursorPos;
let isArchiveMode = false; // true when playing from the archive tab
gameMode = 'easy';

// ── Daily puzzle selection ────────────────────────────────
// Returns the puzzle for today based on calendar date
function getTodaysPuzzle() {
  const epoch = new Date('2025-01-01').getTime();
  const today = new Date();
  today.setHours(0,0,0,0);
  const dayNum = Math.floor((today.getTime() - epoch) / 86400000);
  const idx = dayNum % DAILY_PUZZLES.length;
  return DAILY_PUZZLES[idx];
}

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
}

// ── Init game ─────────────────────────────────────────────
function initGame(puzzleOverride, archiveMode) {
  isArchiveMode = archiveMode || false;
  puzzle = puzzleOverride || getTodaysPuzzle();
  currentRow   = 0;
  hintsLeft    = MAX_HINTS;
  wrongCount   = 0;
  gameOver     = false;
  rowStates    = puzzle.words.map(() => ({ solved: false, revealed: false }));
  hintedLetters = puzzle.words.map(() => 1);
  typedLetters  = puzzle.words.map(w => new Array(w.word.length).fill(null));
  cursorPos     = 1;

  document.getElementById('btn-hint').disabled = false;

  // Show archive badge if in archive mode
  const badge = document.getElementById('archive-badge');
  if (badge) badge.style.display = isArchiveMode ? 'flex' : 'none';

  renderPips();
  renderChain();
  updateGameStats();
  updateProgress();
  showMessage('', '');
  focusTile(currentRow);
}

function setMode(m) {
  gameMode = m;
  document.getElementById('mode-easy').className = 'mode-btn' + (m === 'easy' ? ' active-easy' : '');
  document.getElementById('mode-hard').className = 'mode-btn' + (m === 'hard' ? ' active-hard' : '');
  // Re-init with same puzzle/mode
  initGame(puzzle, isArchiveMode);
}

// easy: ALL words show clue; hard: ONLY word 0 shows clue
function shouldShowClue(rowIdx) {
  if (gameMode === 'easy') return true;
  return rowIdx === 0;
}

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
    clueLabel.textContent = entry.clue;
    clueLabel.className = 'row-clue-label ' +
      (!shouldShowClue(i) ? 'hidden' : (i === currentRow ? 'active' : 'inactive'));
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
  puzzle.words.forEach((_, i) => { renderTiles(i); updatePairLabel(i); });
  updateClueDisplay();
}

function renderTiles(rowIdx) {
  const entry    = puzzle.words[rowIdx];
  const state    = rowStates[rowIdx];
  const locked   = hintedLetters[rowIdx];
  const typed    = typedLetters[rowIdx];
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
    } else if (i < locked) {
      tile.textContent = entry.word[i];
      tile.classList.add('hint-tile');
    } else if (rowIdx === currentRow) {
      tile.classList.add('active-word');
      if (typed[i]) tile.textContent = typed[i];
      else tile.classList.add('empty');
      if (i === cursorPos) tile.classList.add('cursor-tile', 'focused');
      const col = i;
      tile.addEventListener('click', () => {
        if (!gameOver) { cursorPos = col; renderTiles(rowIdx); focusHiddenInput(); }
      });
    } else {
      tile.classList.add('empty');
    }
    tilesDiv.appendChild(tile);
  }
}

function focusTile(rowIdx) {
  cursorPos = hintedLetters[rowIdx];
  if (cursorPos >= puzzle.words[rowIdx].word.length) cursorPos = puzzle.words[rowIdx].word.length - 1;
  renderTiles(rowIdx);
  focusHiddenInput();
}

function focusHiddenInput() {
  const inp = document.getElementById('hidden-input');
  inp.value = '';
  inp.focus();
}

function buildGuess(rowIdx) {
  const entry  = puzzle.words[rowIdx];
  const locked = hintedLetters[rowIdx];
  const typed  = typedLetters[rowIdx];
  let result = '';
  for (let i = 0; i < entry.word.length; i++) {
    result += i < locked ? entry.word[i] : (typed[i] || '');
  }
  return result;
}

function isComplete(rowIdx) {
  const locked = hintedLetters[rowIdx];
  const typed  = typedLetters[rowIdx];
  for (let i = locked; i < puzzle.words[rowIdx].word.length; i++) {
    if (!typed[i]) return false;
  }
  return true;
}

function submitGuess() {
  if (gameOver || currentRow >= puzzle.words.length) return;
  const entry = puzzle.words[currentRow];
  if (!isComplete(currentRow)) {
    showMessage(`fill all ${entry.word.length} letters first`, 'error');
    return;
  }
  const val = buildGuess(currentRow);

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
      setTimeout(() => focusTile(currentRow), 100);
    }
  } else {
    wrongCount++;
    updateGameStats();
    const tilesDiv = document.getElementById(`tiles-${currentRow}`);
    if (tilesDiv) tilesDiv.querySelectorAll('.tile').forEach(t => t.classList.add('wrong-flash'));
    if (wrongCount >= MAX_WRONG) {
      setTimeout(() => endGame(false), 450);
    } else {
      showMessage(`wrong — ${MAX_WRONG - wrongCount} guess${MAX_WRONG - wrongCount !== 1 ? 'es' : ''} remaining`, 'error');
      setTimeout(() => {
        const locked = hintedLetters[currentRow];
        for (let i = locked; i < typedLetters[currentRow].length; i++) typedLetters[currentRow][i] = null;
        cursorPos = locked;
        renderTiles(currentRow);
        focusHiddenInput();
      }, 400);
    }
  }
}

function useHint() {
  if (hintsLeft <= 0 || gameOver || currentRow >= puzzle.words.length) return;
  const entry = puzzle.words[currentRow];
  const shown = hintedLetters[currentRow];
  if (shown >= entry.word.length) { showMessage('all letters shown!', 'info'); return; }
  hintsLeft--;
  hintedLetters[currentRow]++;
  typedLetters[currentRow][shown] = entry.word[shown];
  cursorPos = Math.min(hintedLetters[currentRow], entry.word.length - 1);
  renderTiles(currentRow);
  updateGameStats();
  showMessage(`letter ${shown + 1}: ${entry.word[shown]}`, 'info');
  focusHiddenInput();
}

function updateClueHighlight() {
  puzzle.words.forEach((_, i) => {
    const el = document.getElementById(`row-clue-${i}`);
    if (!el) return;
    if (!shouldShowClue(i)) { el.className = 'row-clue-label hidden'; return; }
    el.className = 'row-clue-label ' + (i === currentRow && !gameOver ? 'active' : 'inactive');
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
  clueEl.textContent    = puzzle.words[currentRow].clue;
  counterEl.textContent = `word ${currentRow + 1} of ${puzzle.words.length}`;
}

function updatePairLabel(i) {
  if (i >= puzzle.words.length - 1) return;
  const el = document.getElementById(`pair-${i}`);
  if (!el) return;
  const wA = puzzle.words[i], wB = puzzle.words[i + 1];
  const sA = rowStates[i],    sB = rowStates[i + 1];
  el.textContent = (sA.solved ? wA.word : wA.word[0] + '___') + ' + ' + (sB.solved ? wB.word : wB.word[0] + '___');
  el.className   = 'pair-label' + (sA.solved && sB.solved ? ' revealed-pair' : '');
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

function endGame(won) {
  gameOver = true;
  document.getElementById('btn-hint').disabled = true;

  puzzle.words.forEach((_, i) => {
    if (!rowStates[i].solved) { rowStates[i].solved = true; rowStates[i].revealed = true; }
  });
  puzzle.words.forEach((_, i) => { renderTiles(i); updatePairLabel(i); });
  updateClueDisplay();
  updateProgress();

  const hintsUsed   = MAX_HINTS - hintsLeft;
  const solvedCount = rowStates.filter(s => !s.revealed).length;

  if (won) {
    showMessage('🎉 Chain complete! ' +
      (hintsUsed === 0 ? 'No hints — perfect!' : `${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''} used.`), 'win');
  } else {
    showMessage(`Game over! You solved ${solvedCount} of ${puzzle.words.length}. Answers revealed.`, 'gameover');
  }

  // Only save to stats if it's today's daily puzzle (not archive)
  if (!isArchiveMode) {
    // Mark today's puzzle as played in localStorage
    localStorage.setItem('lastPlayedDate', getTodayKey());
    localStorage.setItem('lastPlayedResult', JSON.stringify({ won, solvedCount, hintsUsed, wrongCount }));

    saveGameResult({
      puzzleId:     puzzle.id,
      theme:        puzzle.theme || 'untitled',
      mode:         gameMode,
      won,
      solved:       solvedCount,
      total:        puzzle.words.length,
      hintsUsed,
      wrongGuesses: wrongCount,
      timestamp:    Date.now()
    });
  }
}

function animateRow(rowIdx) {
  const tilesDiv = document.getElementById(`tiles-${rowIdx}`);
  if (!tilesDiv) return;
  tilesDiv.querySelectorAll('.tile').forEach((t, i) => {
    setTimeout(() => { t.className = 'tile correct pop'; }, i * 50);
  });
}

function showMessage(text, type) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className   = 'message' + (text ? ' show ' + type : '');
}
