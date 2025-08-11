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

async function loadCategories() {
  loadingMsg.textContent = 'กำลังโหลดข้อมูลหมวดหมู่คำ...';
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('โหลดไฟล์ data.json ไม่สำเร็จ');
    const json = await res.json();
    categoriesData = json.categories;
    loadingMsg.textContent = '';
    checkStartButton();
  } catch (e) {
    loadingMsg.textContent = 'โหลดข้อมูลหมวดหมู่คำล้มเหลว';
    console.error(e);
  }
}

function addPlayer() {
  const input = document.getElementById('playerNameInput');
  const name = input.value.trim();
  if (name === '') return alert('กรุณาใส่ชื่อผู้เล่น');
  if (players.includes(name)) return alert('ชื่อซ้ำ กรุณาเปลี่ยนชื่อ');
  players.push(name);
  input.value = '';
  renderPlayerList();
  checkStartButton();
}

function renderPlayerList() {
  playerListEl.innerHTML = '';
  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center mb-1';
    li.textContent = p;

    const btnDel = document.createElement('button');
    btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
    btnDel.className = 'text-red-600 hover:text-red-800 ml-2';
    btnDel.title = 'ลบผู้เล่น';
    btnDel.onclick = () => {
      players.splice(i, 1);
      renderPlayerList();
      checkStartButton();
    };

    li.appendChild(btnDel);
    playerListEl.appendChild(li);
  });
}

function checkStartButton() {
  const mrWhiteCount = parseInt(document.getElementById('mrWhiteCount').value);
  const undercoverCount = parseInt(document.getElementById('undercoverCount').value);
  const totalNeeded = mrWhiteCount + undercoverCount;
  if (
    players.length >= totalNeeded + 1 &&
    mrWhiteCount >= 1 &&
    undercoverCount >= 1 &&
    categoriesData !== null
  ) {
    startBtn.disabled = false;
  } else {
    startBtn.disabled = true;
  }
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
    case 'มิสเตอร์ไวท์':
      return 'ไอขาว';
    case 'สายลับ':
      return 'สายลับ';
    case 'พลเมือง':
      return 'คนแสนดี';
    default:
      return role;
  }
}

function getRandomCategory() {
  if (!categoriesData) return null;
  const keys = Object.keys(categoriesData);
  const cat = keys[Math.floor(Math.random() * keys.length)];
  return { category: cat, wordPairs: categoriesData[cat] };
}

function assignRoles() {
  roles = [];
  playerWords = [];
  const totalPlayers = players.length;
  const mrWhiteCount = parseInt(document.getElementById('mrWhiteCount').value);
  const undercoverCount = parseInt(document.getElementById('undercoverCount').value);
  const citizenCount = totalPlayers - mrWhiteCount - undercoverCount;
  if (citizenCount < 0) {
    alert('จำนวนบทบาทเกินจำนวนผู้เล่น');
    return false;
  }
  for (let i = 0; i < mrWhiteCount; i++) roles.push('มิสเตอร์ไวท์');
  for (let i = 0; i < undercoverCount; i++) roles.push('สายลับ');
  for (let i = 0; i < citizenCount; i++) roles.push('พลเมือง');
  roles = shuffleArray(roles);

  // คนเริ่มพูดไม่ใช่ Mr.White
  while (roles[0] === 'มิสเตอร์ไวท์') {
    roles = shuffleArray(roles);
  }

  const catInfo = getRandomCategory();
  if (!catInfo) {
    alert('ไม่พบข้อมูลหมวดหมู่คำ');
    return false;
  }
  const wordPairs = catInfo.wordPairs;
  if (!wordPairs || wordPairs.length === 0) {
    alert('หมวดคำนี้ไม่มีคำให้เล่น');
    return false;
  }

  categoryInfoEl.textContent = `หมวดคำ: ${catInfo.category}`;

  // เลือกคู่คำเดียวกัน 1 คู่ เพื่อแจกทุกคน
  const chosenPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];

  // แจกคำตามบทบาท
  for (let r of roles) {
    if (r === 'มิสเตอร์ไวท์') {
      playerWords.push('??? ไม่มีคำ');
    } else if (r === 'สายลับ') {
      playerWords.push(chosenPair[1]);
    } else {
      playerWords.push(chosenPair[0]);
    }
  }
  return true;
}

function renderSpeakingOrderBoxes() {
  speakingOrderBoxes.innerHTML = '';
  let startIndex = roles.findIndex((r) => r !== 'มิสเตอร์ไวท์');
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
    alert('ดูบทบาทครบทุกคนแล้ว');
    nextPlayerBtn.disabled = true;
    discussionSection.classList.remove('hidden');
    showRoleBtn.classList.add('hidden');
    playerRoleEl.textContent = '';
    return;
  }
  let startIndex = roles.findIndex((r) => r !== 'มิสเตอร์ไวท์');
  const playerPos = (startIndex + currentPlayerIndex) % players.length;
  const player = players[playerPos];
  playerRoleEl.innerHTML = `<div>คนถัดไปคือ: <b>${player}</b></div><div>กดปุ่ม "ดูบทบาท" เพื่อดูบทบาทของคุณ</div>`;
  nextPlayerBtn.disabled = true;
  showRoleBtn.classList.remove('hidden');
  showingRole = false;
}

function showRole() {
  if (showingRole) return;
  let startIndex = roles.findIndex((r) => r !== 'มิสเตอร์ไวท์');
  const playerPos = (startIndex + currentPlayerIndex) % players.length;
  const role = roles[playerPos];
  const word = playerWords[playerPos] || '???';

  playerRoleEl.innerHTML = `<div>บทบาทของคุณคือ: <b>${roleName(role)}</b></div><div>คำที่ได้: <b>${word}</b></div>`;

  showingRole = true;
  currentPlayerIndex++;
  nextPlayerBtn.disabled = false;
  showRoleBtn.classList.add('hidden');
}

let voteSelections = new Set();

function startVote() {
  discussionSection.classList.add('hidden');
  votingSection.classList.remove('hidden');
  voteSelections.clear();
  voteListEl.innerHTML = '';
  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = p;
    li.className = 'cursor-pointer p-1 hover:bg-gray-200 rounded';
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
    alert('กรุณาเลือกผู้เล่นที่ต้องการโหวต');
    return;
  }
  votingSection.classList.add('hidden');
  resultSection.classList.remove('hidden');

  const voteTarget = document.querySelector('input[name="voteTarget"]:checked').value;

  let found = false;
  let wrongVotes = [];

  voteSelections.forEach((i) => {
    if (
      (voteTarget === 'mrWhite' && roles[i] === 'มิสเตอร์ไวท์') ||
      (voteTarget === 'undercover' && roles[i] === 'สายลับ')
    ) {
      found = true;
    } else {
      wrongVotes.push(players[i]);
    }
  });

  let voteText = '';

  if (found) {
    voteText += `<p class="font-bold text-green-700">ผลโหวตเจอ ${
      voteTarget === 'mrWhite' ? 'ไอขาว (Mr.White)' : 'สายลับ (Undercover)'
    }! เกมจบ</p>`;
  } else {
    voteText += `<p class="font-bold text-red-700">โหวตผิด! ผู้เล่นที่โหวตผิดต้องดื่ม 1 ดริ้ง</p>`;
    voteText += `<p>ผู้เล่นที่โหวตผิด: ${wrongVotes.join(', ')}</p>`;
  }

  voteText += `<h5 class="mt-4 font-semibold">บทบาทของผู้เล่น:</h5><ul class="list-disc list-inside">`;
  players.forEach((p, i) => {
    voteText += `<li>${p} = ${roleName(roles[i])}</li>`;
  });
  voteText += `</ul>`;

  voteResultEl.innerHTML = voteText;
}

function nextRound() {
  roundNumber++;
  currentPlayerIndex = 0;
  if (!assignRoles()) {
    alert('ไม่สามารถเริ่มรอบใหม่ได้');
    resetGame();
    return;
  }
  renderSpeakingOrderBoxes();
  roundInfoEl.textContent = `รอบที่ ${roundNumber} / ผู้เล่น ${players.length} คน`;
  playerRoleEl.textContent = '';
  nextPlayerBtn.disabled = false;
  showRoleBtn.classList.add('hidden');
  discussionSection.classList.add('hidden');
  votingSection.classList.add('hidden');
  resultSection.classList.add('hidden');
  showNextPlayerName();
}

function resetGame() {
  players = [];
  roles = [];
  playerWords = [];
  currentPlayerIndex = 0;
  roundNumber = 1;
  setupDiv.classList.remove('hidden');
  gameDiv.classList.add('hidden');
  playerListEl.innerHTML = '';
  categoryInfoEl.textContent = '';
  playerRoleEl.textContent = '';
  nextPlayerBtn.disabled = false;
  showRoleBtn.classList.add('hidden');
  discussionSection.classList.add('hidden');
  votingSection.classList.add('hidden');
  resultSection.classList.add('hidden');
  startBtn.disabled = true;
}

function startGame() {
  if (players.length < 3) {
    alert('ผู้เล่นต้องมากกว่า 2 คนขึ้นไป');
    return;
  }
  if (!assignRoles()) return;
  setupDiv.classList.add('hidden');
  gameDiv.classList.remove('hidden');
  renderSpeakingOrderBoxes();
  roundInfoEl.textContent = `รอบที่ ${roundNumber} / ผู้เล่น ${players.length} คน`;
  playerRoleEl.textContent = '';
  currentPlayerIndex = 0;
  nextPlayerBtn.disabled = false;
  showRoleBtn.classList.add('hidden');
  discussionSection.classList.add('hidden');
  votingSection.classList.add('hidden');
  resultSection.classList.add('hidden');
  showNextPlayerName();
}

loadCategories();
