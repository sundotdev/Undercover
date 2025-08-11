let players = [];
let roles = [];
let playerWords = [];
let currentPlayerIndex = 0;
let roundNumber = 1;
let categoriesData = null;

const playerListEl = document.getElementById('playerList');
const startBtn = document.getElementById('startBtn');
const setupDiv = document.getElementById('setup');
const gameDiv = document.getElementById('game');
const playerRoleEl = document.getElementById('playerRole');
const roundInfoEl = document.getElementById('roundInfo');
const nextPlayerBtn = document.getElementById('nextPlayerBtn');
const showRoleBtn = document.getElementById('showRoleBtn');
const discussionSection = document.getElementById('discussionSection');
const speakingOrderBoxes = document.getElementById('speakingOrderBoxes');
const votingSection = document.getElementById('votingSection');
const voteListEl = document.getElementById('voteList');
const resultSection = document.getElementById('resultSection');
const voteResultEl = document.getElementById('voteResult');
const loadingMsg = document.getElementById('loadingMsg');
const categoryInfoEl = document.getElementById('categoryInfo');
const discussionTimer = document.getElementById('discussionTimer');
const nextRoundBtn = document.getElementById('nextRoundBtn');

let voteSelections = new Set();
let discussionCountdown = null;

// ตัวแปรเก็บจำนวน MR.WHITE และ UNDERCOVER ที่ตั้งไว้ และจำนวนที่จับได้แล้ว
let totalMrWhite = 0;
let totalUndercover = 0;
let foundMrWhiteCount = 0;
let foundUndercoverCount = 0;

async function loadCategories() {
  loadingMsg.textContent = 'Loading categories...';
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Failed to load data.json');
    const json = await res.json();
    categoriesData = json.categories;
    loadingMsg.textContent = '';
    checkStartButton();
  } catch (e) {
    loadingMsg.textContent = 'Failed to load categories';
    console.error(e);
  }
}

function addPlayer() {
  const input = document.getElementById('playerNameInput');
  const name = input.value.trim();
  if (name === '') return alert('Please enter player name');
  if (players.includes(name)) return alert('Duplicate name, please change');
  players.push(name);
  input.value = '';
  renderPlayerList();
  checkStartButton();
}

function renderPlayerList() {
  playerListEl.innerHTML = '';
  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';

    const span = document.createElement('span');
    span.textContent = p;

    const btnDel = document.createElement('button');
    btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
    btnDel.className = 'btn btn-sm btn-outline-danger';
    btnDel.title = 'Remove player';
    btnDel.onclick = () => {
      players.splice(i, 1);
      renderPlayerList();
      checkStartButton();
    };

    li.appendChild(span);
    li.appendChild(btnDel);
    playerListEl.appendChild(li);
  });
}

function checkStartButton() {
  const mrWhiteCount = parseInt(document.getElementById('mrWhiteCount').value);
  const undercoverCount = parseInt(document.getElementById('undercoverCount').value);
  const totalNeeded = mrWhiteCount + undercoverCount;
  startBtn.disabled = !(players.length >= totalNeeded + 1 && mrWhiteCount >= 1 && undercoverCount >= 1 && categoriesData !== null);
}

document.getElementById('mrWhiteCount').addEventListener('change', checkStartButton);
document.getElementById('undercoverCount').addEventListener('change', checkStartButton);

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function roleName(role) {
  switch (role) {
    case 'MR.WHITE': return 'MR.WHITE';
    case 'UNDERCOVER': return 'UNDERCOVER';
    case 'COMMON PERSON': return 'COMMON PERSON';
    default: return role;
  }
}

function roleClass(role) {
  switch (role) {
    case 'MR.WHITE': return 'role-mrwhite';
    case 'UNDERCOVER': return 'role-undercover';
    case 'COMMON PERSON': return 'role-citizen';
    default: return '';
  }
}

function getRandomCategory() {
  const keys = Object.keys(categoriesData);
  const cat = keys[Math.floor(Math.random() * keys.length)];
  const wordPairs = categoriesData[cat];
  return { category: cat, wordPairs: wordPairs };
}

function assignRoles() {
  roles = [];
  playerWords = [];
  const totalPlayers = players.length;
  totalMrWhite = parseInt(document.getElementById('mrWhiteCount').value);
  totalUndercover = parseInt(document.getElementById('undercoverCount').value);
  foundMrWhiteCount = 0;
  foundUndercoverCount = 0;

  const citizenCount = totalPlayers - totalMrWhite - totalUndercover;
  if (citizenCount < 0) {
    alert('Too many roles for players');
    return false;
  }
  for (let i = 0; i < totalMrWhite; i++) roles.push('MR.WHITE');
  for (let i = 0; i < totalUndercover; i++) roles.push('UNDERCOVER');
  for (let i = 0; i < citizenCount; i++) roles.push('COMMON PERSON');
  roles = shuffleArray(roles);

  while (roles[0] === 'MR.WHITE') {
    roles = shuffleArray(roles);
  }

  const catInfo = getRandomCategory();
  if (!catInfo) {
    alert('No category data found');
    return false;
  }
  const wordPairs = catInfo.wordPairs;
  if (!wordPairs || wordPairs.length === 0) {
    alert('Category has no words');
    return false;
  }

  categoryInfoEl.textContent = `Category: ${catInfo.category}`;

  const chosenPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];

  for (let r of roles) {
    if (r === 'MR.WHITE') {
      playerWords.push('???');
    } else if (r === 'UNDERCOVER') {
      playerWords.push(chosenPair[1]);
    } else {
      playerWords.push(chosenPair[0]);
    }
  }
  return true;
}

function renderSpeakingOrderBoxes() {
  speakingOrderBoxes.innerHTML = '';
  let startIndex = roles.findIndex(r => r !== 'MR.WHITE');
  for (let i = 0; i < players.length; i++) {
    const idx = (startIndex + i) % players.length;
    const box = document.createElement('div');
    box.className = 'speaker-box';
    if (i === 0) box.classList.add('start');
    box.textContent = `${i + 1}. ${players[idx]}`;
    speakingOrderBoxes.appendChild(box);
  }
}

let showingRole = false;

function showNextPlayerName() {
  if (currentPlayerIndex >= players.length) {
    alert('All players have seen their roles');
    nextPlayerBtn.disabled = true;
    discussionSection.classList.remove('d-none');
    showRoleBtn.style.display = 'none';
    playerRoleEl.textContent = '';
    startDiscussionTimer();
    return;
  }
  let startIndex = roles.findIndex(r => r !== 'MR.WHITE');
  const playerPos = (startIndex + currentPlayerIndex) % players.length;
  const player = players[playerPos];
  playerRoleEl.innerHTML = `<div>Next player: <b>${player}</b></div><div>Press "Show Role" to see your role</div>`;
  nextPlayerBtn.disabled = true;
  showRoleBtn.style.display = 'inline-block';
  showingRole = false;
}

function showRole() {
  if (showingRole) return;
  let startIndex = roles.findIndex(r => r !== 'MR.WHITE');
  const playerPos = (startIndex + currentPlayerIndex) % players.length;
  const role = roles[playerPos];
  const word = playerWords[playerPos] || '???';

  playerRoleEl.innerHTML = `<div>Your role is: <b class="${roleClass(role)}">${roleName(role)}</b></div><div>Your word: <b>${word}</b></div>`;

  showingRole = true;
  currentPlayerIndex++;
  nextPlayerBtn.disabled = false;
  showRoleBtn.style.display = 'none';
}

function startDiscussionTimer() {
  let timeLeft = 120;
  discussionTimer.textContent = formatTime(timeLeft);

  if (discussionCountdown) clearInterval(discussionCountdown);

  discussionCountdown = setInterval(() => {
    timeLeft--;
    discussionTimer.textContent = formatTime(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(discussionCountdown);
      discussionTimer.textContent = 'Time Up!';
    }
  }, 1000);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function startVote() {
  if (discussionCountdown) {
    clearInterval(discussionCountdown);
    discussionTimer.textContent = '';
  }
  discussionSection.classList.add('d-none');
  votingSection.classList.remove('d-none');
  voteSelections.clear();
  voteListEl.innerHTML = '';
  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = p;
    li.className = 'list-group-item';
    li.onclick = () => {
      if (voteSelections.has(i)) {
        voteSelections.delete(i);
        li.classList.remove('voted');
      } else {
        voteSelections.add(i);
        li.classList.add('voted');
      }
    };
    voteListEl.appendChild(li);
  });
}

function confirmVote() {
  if (voteSelections.size === 0) {
    alert('Please select player(s) to vote');
    return;
  }

  const voteTarget = document.querySelector('input[name="voteTarget"]:checked').value;

  votingSection.classList.add('d-none');
  resultSection.classList.remove('d-none');

  let foundTarget = false;
  let wrongVotes = [];

  voteSelections.forEach(i => {
    if (roles[i] === voteTarget) {
      foundTarget = true;
      if (roles[i] === 'MR.WHITE') {
        foundMrWhiteCount++;
      }
      if (roles[i] === 'UNDERCOVER') {
        foundUndercoverCount++;
      }
    }
    if (roles[i] !== voteTarget) {
      wrongVotes.push(players[i]);
    }
  });

  let voteText = '';

  if (foundTarget) {
    if (foundMrWhiteCount >= totalMrWhite && foundUndercoverCount >= totalUndercover) {
      voteText += `<p><b>Success! You found all <span class="role-mrwhite">MR.WHITE</span> and <span class="role-undercover">UNDERCOVER</span>. The game ends.</b></p>`;
      nextRoundBtn.textContent = 'Play Again';
      nextRoundBtn.style.display = 'inline-block';
    } else {
      voteText += `<p><b>You found some ${voteTarget}, but need to find all MR.WHITE and UNDERCOVER to end the game. Continue playing.</b></p>`;
      nextRoundBtn.textContent = 'Next Round';
      nextRoundBtn.style.display = 'inline-block';
    }
  } else {
    voteText += `<p><b>Wrong vote! Those who voted wrong must drink 1 shot.</b></p>`;
    voteText += `<p>Players voted wrong: ${wrongVotes.join(', ')}</p>`;
    nextRoundBtn.textContent = 'Next Round';
    nextRoundBtn.style.display = 'inline-block';
  }

  voteText += `<h5>Roles of voted players:</h5><ul>`;
  voteSelections.forEach(i => {
    voteText += `<li>${players[i]} = <span class="${roleClass(roles[i])}">${roleName(roles[i])}</span></li>`;
  });
  voteText += `</ul>`;

  voteResultEl.innerHTML = voteText;
}

nextRoundBtn.onclick = () => {
  if (foundMrWhiteCount >= totalMrWhite && foundUndercoverCount >= totalUndercover) {
    resetGame();
  } else {
    roundNumber++;
    currentPlayerIndex = 0;
    if (!assignRoles()) {
      alert('Cannot start new round');
      resetGame();
      return;
    }
    renderSpeakingOrderBoxes();
    roundInfoEl.textContent = `Round ${roundNumber} / Players: ${players.length}`;
    playerRoleEl.textContent = '';
    nextPlayerBtn.disabled = false;
    showRoleBtn.style.display = 'none';
    discussionSection.classList.add('d-none');
    votingSection.classList.add('d-none');
    resultSection.classList.add('d-none');
    nextRoundBtn.style.display = 'none';
    showNextPlayerName();
  }
};

function resetGame() {
  if (discussionCountdown) clearInterval(discussionCountdown);
  players = [];
  roles = [];
  playerWords = [];
  currentPlayerIndex = 0;
  roundNumber = 1;
  totalMrWhite = 0;
  totalUndercover = 0;
  foundMrWhiteCount = 0;
  foundUndercoverCount = 0;
  setupDiv.style.display = '';
  gameDiv.style.display = 'none';
  playerListEl.innerHTML = '';
  categoryInfoEl.textContent = '';
  playerRoleEl.textContent = '';
  nextPlayerBtn.disabled = false;
  showRoleBtn.style.display = 'none';
  discussionSection.classList.add('d-none');
  votingSection.classList.add('d-none');
  resultSection.classList.add('d-none');
  startBtn.disabled = true;
  voteSelections.clear();
  discussionTimer.textContent = '';
  nextRoundBtn.style.display = 'none';
}

function startGame() {
  if (players.length < 3) {
    alert('At least 3 players are required');
    return;
  }
  if (!assignRoles()) return;
  setupDiv.style.display = 'none';
  gameDiv.style.display = '';
  renderSpeakingOrderBoxes();
  roundInfoEl.textContent = `Round ${roundNumber} / Players: ${players.length}`;
  playerRoleEl.textContent = '';
  currentPlayerIndex = 0;
  nextPlayerBtn.disabled = false;
  showRoleBtn.style.display = 'none';
  discussionSection.classList.add('d-none');
  votingSection.classList.add('d-none');
  resultSection.classList.add('d-none');
  nextRoundBtn.style.display = 'none';
  showNextPlayerName();
}

loadCategories();
