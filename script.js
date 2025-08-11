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
const loadingMsgEl = document.getElementById('loadingMsg');
const categoryInfo = document.getElementById('categoryInfo');
const discussionTimer = document.getElementById('discussionTimer');
const nextRoundBtn = document.getElementById('nextRoundBtn');

let selectedVoteIndex = null;
let discussionCountdown = null;

let totalMrWhite = 1;
let totalUndercover = 1;
let foundMrWhiteCount = 0;
let foundUndercoverCount = 0;

function addPlayer() {
  const input = document.getElementById('playerNameInput');
  const name = input.value.trim();
  if (!name) {
    alert('Please enter player name');
    return;
  }
  if (players.includes(name)) {
    alert('Player name must be unique');
    return;
  }
  players.push(name);
  input.value = '';
  renderPlayerList();
  updateStartButton();
}

function renderPlayerList() {
  playerListEl.innerHTML = '';
  players.forEach((p, idx) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.textContent = p;
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-danger';
    btn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    btn.onclick = () => {
      players.splice(idx, 1);
      renderPlayerList();
      updateStartButton();
    };
    li.appendChild(btn);
    playerListEl.appendChild(li);
  });
}

function updateStartButton() {
  totalMrWhite = Number(document.getElementById('mrWhiteCount').value);
  totalUndercover = Number(document.getElementById('undercoverCount').value);
  startBtn.disabled = players.length < (totalMrWhite + totalUndercover + 1);
}

async function startGame() {
  if (players.length < (totalMrWhite + totalUndercover + 1)) {
    alert('Not enough players for selected roles.');
    return;
  }
  await loadCategories();
  assignRoles();
  chooseWords();
  currentPlayerIndex = 0;
  roundNumber = 1;
  foundMrWhiteCount = 0;
  foundUndercoverCount = 0;
  setupDiv.style.display = 'none';
  gameDiv.style.display = 'block';
  updateRoundInfo();
  speakingOrderBoxes.innerHTML = '';
  discussionSection.classList.add('d-none');
  votingSection.classList.add('d-none');
  resultSection.classList.add('d-none');
  playerRoleEl.textContent = '';
  showRoleBtn.style.display = 'none';
  nextPlayerBtn.style.display = 'inline-block';
  alert('Game started! กด Next Player เพื่อดูชื่อผู้พูดคนแรก');
}

async function loadCategories() {
  loadingMsgEl.textContent = 'Loading categories...';
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Failed to load data.json');
    categoriesData = await res.json();
    loadingMsgEl.textContent = '';
  } catch (err) {
    loadingMsgEl.textContent = 'Failed to load categories.';
    alert('Cannot load categories.json, please add it to your folder.');
    throw err;
  }
}

function assignRoles() {
  roles = [];
  const totalPlayers = players.length;
  for (let i = 0; i < totalMrWhite; i++) roles.push('MR.WHITE');
  for (let i = 0; i < totalUndercover; i++) roles.push('UNDERCOVER');
  for (let i = roles.length; i < totalPlayers; i++) roles.push('CITIZEN');
  for (let i = roles.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
}

function chooseWords() {
  const categories = Object.keys(categoriesData.categories);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  categoryInfo.textContent = `Category: ${randomCategory}`;
  const wordPairs = categoriesData.categories[randomCategory];
  const randomPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
  playerWords = roles.map(role => {
    if (role === 'MR.WHITE') return '??? (ไม่บอกคำ)';
    if (role === 'UNDERCOVER') return randomPair[1];
    return randomPair[0];
  });
}

function updateRoundInfo() {
  roundInfoEl.textContent = `Round ${roundNumber}`;
}

function showNextPlayerName() {
  if (players.length === 0) return alert('No players left.');
  if (currentPlayerIndex >= players.length) {
    nextPlayerBtn.style.display = 'none';
    showRoleBtn.style.display = 'none';
    playerRoleEl.textContent = '';
    discussionSection.classList.remove('d-none');
    startDiscussionCountdown();
    return;
  }
  const name = players[currentPlayerIndex];
  playerRoleEl.innerHTML = `<strong>Player:</strong> ${name}`;
  showRoleBtn.style.display = 'inline-block';
  nextPlayerBtn.style.display = 'none';
}

function showRole() {
  const role = roles[currentPlayerIndex];
  let roleText = '';
  let roleClass = '';
  if (role === 'MR.WHITE') {
    roleText = 'MR.WHITE';
    roleClass = 'role-mrwhite';
  } else if (role === 'UNDERCOVER') {
    roleText = 'UNDERCOVER';
    roleClass = 'role-undercover';
  } else {
    roleText = 'CITIZEN';
    roleClass = 'role-citizen';
  }
  playerRoleEl.innerHTML = `<strong>Role:</strong> <span class="${roleClass}">${roleText}</span><br>
    <strong>Word:</strong> ${playerWords[currentPlayerIndex]}`;
  showRoleBtn.style.display = 'none';
  nextPlayerBtn.style.display = 'inline-block';
  currentPlayerIndex++;
}

function startDiscussionCountdown() {
  let timeLeft = 120;
  discussionTimer.textContent = formatTime(timeLeft);
  discussionCountdown = setInterval(() => {
    timeLeft--;
    discussionTimer.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(discussionCountdown);
      discussionTimer.textContent = '';
      startVote();
    }
  }, 1000);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function startVote() {
  discussionSection.classList.add('d-none');
  votingSection.classList.remove('d-none');
  voteListEl.innerHTML = '';
  selectedVoteIndex = null;
  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = p;
    li.onclick = () => selectVote(i, li);
    voteListEl.appendChild(li);
  });
}

function selectVote(index, liElement) {
  [...voteListEl.children].forEach(li => li.classList.remove('voted'));
  selectedVoteIndex = index;
  liElement.classList.add('voted');
}

function confirmVote() {
  if (selectedVoteIndex === null) {
    alert('Please select one player to vote out.');
    return;
  }
  const voteTarget = document.querySelector('input[name="voteTarget"]:checked').value;
  const votedRole = roles[selectedVoteIndex];
  const votedName = players[selectedVoteIndex];
  let voteCorrect = voteTarget === votedRole;
  let resultHTML = `
    <p><strong>Voted Player:</strong> ${votedName}</p>
    <p><strong>Role:</strong> ${votedRole}</p>
    <p><strong>Vote for role:</strong> ${voteTarget}</p>
  `;
  if (voteCorrect) {
    foundMrWhiteCount += votedRole === 'MR.WHITE' ? 1 : 0;
    foundUndercoverCount += votedRole === 'UNDERCOVER' ? 1 : 0;
    players.splice(selectedVoteIndex, 1);
    roles.splice(selectedVoteIndex, 1);
    playerWords.splice(selectedVoteIndex, 1);
    resultHTML += `<p class="text-success">โหวตถูก! ผู้ถูกโหวตออกจากเกม</p>`;
  } else {
    resultHTML += `<p class="text-danger">โหวตผิด! ผู้โหวตต้องดื่ม 1 แก้ว</p>`;
  }
  voteResultEl.innerHTML = resultHTML;
  votingSection.classList.add('d-none');
  resultSection.classList.remove('d-none');
  nextRoundBtn.style.display = 'inline-block';
  nextPlayerBtn.style.display = 'none';
  showRoleBtn.style.display = 'none';
  checkGameEnd();
}

function nextRound() {
  resultSection.classList.add('d-none');
  playerRoleEl.textContent = '';
  currentPlayerIndex = 0;
  roundNumber++;
  updateRoundInfo();
  nextPlayerBtn.style.display = 'inline-block';
  showRoleBtn.style.display = 'none';
  discussionSection.classList.add('d-none');
  votingSection.classList.add('d-none');
  alert(`เริ่มรอบที่ ${roundNumber} กด Next Player เพื่อเริ่มพูดคนแรก`);
}

function checkGameEnd() {
  if (foundMrWhiteCount >= totalMrWhite && foundUndercoverCount >= totalUndercover) {
    alert('เกมจบ! เจอ MR.WHITE และ UNDERCOVER ครบแล้ว');
    nextRoundBtn.style.display = 'none';
    nextPlayerBtn.style.display = 'none';
    showRoleBtn.style.display = 'none';
  } else if (players.length <= (totalMrWhite + totalUndercover)) {
    alert('จำนวนผู้เล่นน้อยเกินไป เกมจบ');
    nextRoundBtn.style.display = 'none';
    nextPlayerBtn.style.display = 'none';
    showRoleBtn.style.display = 'none';
  }
}

function resetGame() {
  players = [];
  roles = [];
  playerWords = [];
  currentPlayerIndex = 0;
  roundNumber = 1;
  foundMrWhiteCount = 0;
  foundUndercoverCount = 0;
  setupDiv.style.display = 'block';
  gameDiv.style.display = 'none';
  renderPlayerList();
  updateStartButton();
  categoryInfo.textContent = '';
  voteResultEl.innerHTML = '';
  playerRoleEl.textContent = '';
  loadingMsgEl.textContent = '';
  nextRoundBtn.style.display = 'none';
  discussionSection.classList.add('d-none');
  votingSection.classList.add('d-none');
  resultSection.classList.add('d-none');
  nextPlayerBtn.style.display = 'inline-block';
  showRoleBtn.style.display = 'none';
}

document.getElementById('mrWhiteCount').addEventListener('input', updateStartButton);
document.getElementById('undercoverCount').addEventListener('input', updateStartButton);

updateStartButton();
