// ตัวแปรหลัก
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

let selectedVoteIndex = null;
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
  } catch (e) {
    loadingMsg.textContent = 'Failed to load categories';
    console.error(e);
  }
}
loadCategories();

// เพิ่มผู้เล่น
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

// แสดงผู้เล่นใน list
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

// เช็คปุ่มเริ่มเกม
function updateStartButton() {
  const mrWhiteCount = parseInt(document.getElementById('mrWhiteCount').value);
  const undercoverCount = parseInt(document.getElementById('undercoverCount').value);
  const totalNeeded = mrWhiteCount + undercoverCount + 1;
  startBtn.disabled = !(players.length >= totalNeeded && mrWhiteCount >= 1 && undercoverCount >= 1 && categoriesData !== null);
}

// สุ่มแจกบทบาท
function shuffleArray(arr) {
  for (let i = arr.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// แปลงชื่อ role เป็น class css
function roleClass(role) {
  if (role === 'MR.WHITE') return 'role-mrwhite';
  if (role === 'UNDERCOVER') return 'role-undercover';
  if (role === 'COMMON PERSON') return 'role-citizen';
  return '';
}

// แปลงชื่อ role เป็นชื่อโชว์
function roleName(role) {
  return role; // ตรงๆ
}

// ดึงหมวดหมู่ random
function getRandomCategory() {
  const keys = Object.keys(categoriesData);
  if (keys.length === 0) return null;
  const cat = keys[Math.floor(Math.random() * keys.length)];
  const wordPairs = categoriesData[cat];
  return { category: cat, wordPairs };
}

// แจกบทบาทและคำ
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

  // สร้าง array roles
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

  const chosenPair = catInfo.wordPairs[Math.floor(Math.random() * catInfo.wordPairs.length)];
  categoryInfoEl.textContent = `Category: ${catInfo.category}`;

  for (let r of roles) {
    if (r === 'MR.WHITE') playerWords.push('???');
    else if (r === 'UNDERCOVER') playerWords.push(chosenPair[1]);
    else playerWords.push(chosenPair[0]);
  }

  return true;
}

// เรียงกล่องลำดับผู้พูด (เริ่มจากคนแรกที่ไม่ใช่ MR.WHITE)
function renderSpeakingOrderBoxes() {
  speakingOrderBoxes.innerHTML = '';
  let startIndex = roles.findIndex(r => r !== 'MR.WHITE');
  if (startIndex === -1) startIndex = 0;

  for (let i = 0; i < players.length; i++) {
    const idx = (startIndex + i) % players.length;
    const box = document.createElement('div');
    box.className = 'speaker-box';
    if (i === 0) box.classList.add('start');
    box.textContent = `${i+1}. ${players[idx]}`;
    speakingOrderBoxes.appendChild(box);
  }
}

// แสดงผู้เล่นรอบถัดไปที่ต้องพูด
let showingRole = false;
function showNextPlayerName() {
  if (currentPlayerIndex >= players.length) {
    // พูดครบแล้ว ไป Discussion
    nextPlayerBtn.disabled = true;
    showRoleBtn.style.display = 'none';
    playerRoleEl.textContent = '';
    discussionSection.classList.remove('d-none');
    startDiscussionTimer();
    return;
  }
  let startIndex = roles.findIndex(r => r !== 'MR.WHITE');
  if (startIndex === -1) startIndex = 0;
  const playerPos = (startIndex + currentPlayerIndex) % players.length;
  const player = players[playerPos];
  playerRoleEl.innerHTML = `<div>Next player: <b>${player}</b></div><div>Press "Show Role" to see your role</div>`;
  nextPlayerBtn.disabled = true;
  showRoleBtn.style.display = 'inline-block';
  showingRole = false;
}

// แสดงบทบาทและคำของผู้เล่นที่พูด
function showRole() {
  if (showingRole) return;
  let startIndex = roles.findIndex(r => r !== 'MR.WHITE');
  if (startIndex === -1) startIndex = 0;
  const playerPos = (startIndex + currentPlayerIndex) % players.length;
  const role = roles[playerPos];
  const word = playerWords[playerPos] || '???';

  playerRoleEl.innerHTML = `<div>Your role is: <b class="${roleClass(role)}">${roleName(role)}</b></div><div>Your word: <b>${word}</b></div>`;

  showingRole = true;
  currentPlayerIndex++;
  nextPlayerBtn.disabled = false;
  showRoleBtn.style.display = 'none';
}

// ตั้งเวลาถกเถียง 2 นาที
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
  const m = Math.floor(sec / 60).toString().padStart(2,'0');
  const s = (sec % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

// เริ่มโหวต
function startVote() {
  if (discussionCountdown) {
    clearInterval(discussionCountdown);
    discussionTimer.textContent = '';
  }
  discussionSection.classList.add('d-none');
  votingSection.classList.remove('d-none');
  voteListEl.innerHTML = '';
  selectedVoteIndex = null;

  players.forEach((p,i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = p;
    li.onclick = () => selectVote(i, li);
    voteListEl.appendChild(li);
  });
}

function selectVote(index, liEl) {
  // เลือกได้ครั้งละ 1 คนเท่านั้น
  if (selectedVoteIndex !== null) {
    // เอาออก class ของตัวเก่า
    const prevLi = voteListEl.children[selectedVoteIndex];
    if (prevLi) prevLi.classList.remove('voted');
  }
  if (selectedVoteIndex === index) {
    selectedVoteIndex = null; // ยกเลิกเลือก
    liEl.classList.remove('voted');
  } else {
    selectedVoteIndex = index;
    liEl.classList.add('voted');
  }
}

// ยืนยันโหวต
function confirmVote() {
  if (selectedVoteIndex === null) {
    alert('Please select one player to vote out');
    return;
  }
  const voteTarget = document.querySelector('input[name="voteTarget"]:checked').value;

  votingSection.classList.add('d-none');
  resultSection.classList.remove('d-none');

  // ตรวจสอบว่าผู้ถูกโหวตตรงกับบทบาทหรือไม่
  const votedRole = roles[selectedVoteIndex];
  let resultHTML = '';

  if (votedRole === voteTarget) {
    // โหวตถูก
    if (votedRole === 'MR.WHITE') foundMrWhiteCount++;
    else if (votedRole === 'UNDERCOVER') foundUndercoverCount++;

    resultHTML += `<p class="text-success"><b>${players[selectedVoteIndex]}</b> is <span class="${roleClass(votedRole)}">${votedRole}</span>. Vote Correct! They are out of the game.</p>`;

    // ลบผู้เล่นและบทบาทนั้นออก
    players.splice(selectedVoteIndex,1);
    roles.splice(selectedVoteIndex,1);
    playerWords.splice(selectedVoteIndex,1);
  } else {
    // โหวตผิด คนโหวตดื่ม 1 แก้ว
    resultHTML += `<p class="text-danger">Vote Incorrect! You must drink 1 glass.</p>`;
  }

  // แสดงผลโหวต
  voteResultEl.innerHTML = resultHTML;

  // แสดงลำดับพูดใหม่ ถ้ายังไม่จบเกม
  if (players.length === 0) {
    voteResultEl.innerHTML += '<p><b>Game Over</b></p>';
    nextRoundBtn.style.display = 'none';
    nextPlayerBtn.style.display = 'none';
    showRoleBtn.style.display = 'none';
    return;
  }

  renderSpeakingOrderBoxes();
  currentPlayerIndex = 0;
  roundNumber++;
  roundInfoEl.textContent = `Round ${roundNumber}`;

  nextRoundBtn.style.display = 'inline-block';
  nextPlayerBtn.style.display = 'none';
  showRoleBtn.style.display = 'none';
  playerRoleEl.textContent = '';
}

// ปุ่ม Next Round
function nextRound() {
  // เช็คเกมจบหรือยัง (เจอ MR.WHITE และ UNDERCOVER ครบแล้ว)
  if (foundMrWhiteCount >= totalMrWhite && foundUndercoverCount >= totalUndercover) {
    voteResultEl.innerHTML += '<p><b>All MR.WHITE and UNDERCOVER found! Game End.</b></p>';
    nextRoundBtn.style.display = 'none';
    nextPlayerBtn.style.display = 'none';
    showRoleBtn.style.display = 'none';
    return;
  }

  // ซ่อนปุ่มผลลัพธ์และแสดงปุ่มเล่นต่อ
  resultSection.classList.add('d-none');
  nextRoundBtn.style.display = 'none';
  nextPlayerBtn.style.display = 'inline-block';
  showRoleBtn.style.display = 'none';
  playerRoleEl.textContent = '';
  discussionSection.classList.add('d-none');
  votingSection.classList.add('d-none');

  showNextPlayerName();
}

// เริ่มเกม
function startGame() {
  if (!assignRoles()) return;

  setupDiv.style.display = 'none';
  gameDiv.style.display = 'block';

  currentPlayerIndex = 0;
  roundNumber = 1;
  roundInfoEl.textContent = `Round ${roundNumber}`;

  renderSpeakingOrderBoxes();

  nextPlayerBtn.style.display = 'inline-block';
  showRoleBtn.style.display = 'none';
  discussionSection.classList.add('d-none');
  votingSection.classList.add('d-none');
  resultSection.classList.add('d-none');

  playerRoleEl.textContent = '';
  showNextPlayerName();
}

// อัปเดตสถานะปุ่มเมื่อเปลี่ยนค่า input MR.WHITE และ UNDERCOVER
document.getElementById('mrWhiteCount').addEventListener('input', updateStartButton);
document.getElementById('undercoverCount').addEventListener('input', updateStartButton);
document.getElementById('playerNameInput').addEventListener('keyup', e => {
  if (e.key === 'Enter') addPlayer();
});
