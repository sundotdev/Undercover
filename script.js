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

let voteSelection = null;
let discussionCountdown = null;

let totalMrWhite = 0;
let totalUndercover = 0;
let foundMrWhiteCount = 0;
let foundUndercoverCount = 0;

// โหลด categories จากไฟล์ data.json
async function loadCategories() {
  loadingMsg.textContent = 'Loading categories...';
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Failed to load data.json');
    const json = await res.json();
    categoriesData = json.categories;
    loadingMsg.textContent = '';
    updateStartButton();
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
  updateStartButton();
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
      updateStartButton();
    };

    li.appendChild(span);
    li.appendChild(btnDel);
    playerListEl.appendChild(li);
  });
}

function updateStartButton() {
  const mrWhiteCount = parseInt(document.getElementById('mrWhiteCount').value);
  const undercoverCount = parseInt(document.getElementById('undercoverCount').value);
  const totalNeeded = mrWhiteCount + undercoverCount;
  startBtn.disabled = !(players.length >= totalNeeded + 1 && mrWhiteCount >= 1 && undercoverCount >= 1 && categoriesData !== null);
}

document.getElementById('mrWhiteCount').addEventListener('input', updateStartButton);
document.getElementById('undercoverCount').addEventListener('input', updateStartButton);
document.getElementById('playerNameInput').addEventListener('keyup', e => {
  if (e.key === 'Enter') addPlayer();
});

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

  // MR.WHITE ไม่ควรเริ่มแจกก่อนใคร
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
    // แจกบทบาทครบทุกคนแล้ว ให้เริ่มรอบ Discussion
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
  playerRoleEl.innerHTML = `<div>Your role: <span class="${roleClass(role)}">${roleName(role)}</span></div><div>Word: <b>${word}</b></div>`;
  currentPlayerIndex++;
  nextPlayerBtn.disabled = false;
  showRoleBtn.style.display = 'none';
  showingRole = true;
}

let discussionTime = 120; // seconds

function startDiscussionTimer() {
  discussionTime = 120;
  discussionTimer.textContent = formatTime(discussionTime);
  discussionCountdown = setInterval(() => {
    discussionTime--;
    discussionTimer.textContent = formatTime(discussionTime);
    if (discussionTime <= 0) {
      clearInterval(discussionCountdown);
      discussionSection.classList.add('d-none');
      startVoteSection();
    }
  }, 1000);
}

function formatTime(sec) {
  let m = Math.floor(sec / 60);
  let s = sec % 60;
  return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function startVote() {
  clearInterval(discussionCountdown);
  discussionSection.classList.add('d-none');
  startVoteSection();
}

function startVoteSection() {
  votingSection.classList.remove('d-none');
  voteListEl.innerHTML = '';
  // รายชื่อที่ยังเล่นอยู่ (ยังไม่ถูกโหวตออก)
  for (let i = 0; i < players.length; i++) {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = players[i];
    li.dataset.index = i;
    li.onclick = () => {
      // เลือกทีละคน
      if (voteSelection !== null) {
        voteListEl.children[voteSelection].classList.remove('voted');
      }
      voteSelection = i;
      li.classList.add('voted');
    };
    voteListEl.appendChild(li);
  }
  voteSelection = null;
}

function confirmVote() {
  if (voteSelection === null) {
    alert('Please select a player to vote.');
    return;
  }

  const voteTargetRole = document.querySelector('input[name="voteTarget"]:checked').value;
  const votedPlayerName = players[voteSelection];
  const votedPlayerRole = roles[voteSelection];

  votingSection.classList.add('d-none');

  if (votedPlayerRole === voteTargetRole) {
    // โหวตถูก ตัดคนนั้นออก
    voteResultEl.innerHTML = `<div><strong>${votedPlayerName}</strong> ถูกโหวตออกในบทบาท <span class="${roleClass(votedPlayerRole)}">${roleName(votedPlayerRole)}</span> 🎉</div>`;
    removePlayer(voteSelection);

    if (votedPlayerRole === 'MR.WHITE') foundMrWhiteCount++;
    if (votedPlayerRole === 'UNDERCOVER') foundUndercoverCount++;

    checkEndGame();
  } else {
    // โหวตผิด ให้ดื่ม 1 แก้ว
    voteResultEl.innerHTML = `<div>โหวตผิด! ผู้โหวตดื่ม 1 แก้ว 🥤</div>`;
    nextRoundBtn.style.display = 'inline-block';
  }

  resultSection.classList.remove('d-none');
  nextPlayerBtn.disabled = true;
  showRoleBtn.style.display = 'none';
}

function removePlayer(index) {
  players.splice(index, 1);
  roles.splice(index, 1);
  playerWords.splice(index, 1);
}

function checkEndGame() {
  // เช็คว่าพบครบ MR.WHITE และ UNDERCOVER หรือยัง
  if (foundMrWhiteCount >= totalMrWhite && foundUndercoverCount >= totalUndercover) {
    voteResultEl.innerHTML += '<div class="mt-3 fw-bold fs-5 text-success">พบ MR.WHITE และ UNDERCOVER ครบแล้ว! เกมจบ.</div>';
    nextRoundBtn.style.display = 'none';
  } else {
    // ถ้าไม่ครบ เปิดรอบใหม่ทันที (ไม่ต้องกด NEXT)
    roundNumber++;
    roundInfoEl.textContent = `Round ${roundNumber}`;
    currentPlayerIndex = 0;
    renderSpeakingOrderBoxes();
    showNextPlayerName();

    resultSection.classList.add('d-none');
  }
}

function nextRound() {
  resultSection.classList.add('d-none');
  roundInfoEl.textContent = `Round ${roundNumber}`;
  currentPlayerIndex = 0;
  renderSpeakingOrderBoxes();
  showNextPlayerName();
  nextRoundBtn.style.display = 'none';
  voteResultEl.innerHTML = '';
  votingSection.classList.add('d-none');
  discussionSection.classList.remove('d-none');
  startDiscussionTimer();
}

function resetGame() {
  // รีเซ็ตทุกอย่างกลับไปที่หน้าตั้งค่า
  players = [];
  roles = [];
  playerWords = [];
  currentPlayerIndex = 0;
  roundNumber = 1;
  totalMrWhite = 0;
  totalUndercover = 0;
  foundMrWhiteCount = 0;
  foundUndercoverCount = 0;
  voteSelection = null;

  setupDiv.style.display = 'block';
  gameDiv.style.display = 'none';
  resultSection.classList.add('d-none');
  votingSection.classList.add('d-none');
  discussionSection.classList.add('d-none');
  playerRoleEl.textContent = '';
  speakingOrderBoxes.innerHTML = '';
  playerListEl.innerHTML = '';
  updateStartButton();
  loadingMsg.textContent = '';
  categoryInfoEl.textContent = '';
}

function startGame() {
  if (!assignRoles()) return;

  setupDiv.style.display = 'none';
  gameDiv.style.display = 'block';
  roundInfoEl.textContent = `Round ${roundNumber}`;

  renderSpeakingOrderBoxes();
  currentPlayerIndex = 0;
  showNextPlayerName();
}

loadCategories();
