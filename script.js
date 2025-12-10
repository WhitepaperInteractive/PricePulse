// Elements
const welcomeScreen = document.getElementById('welcome');
const gameScreen    = document.getElementById('game');
const startBtn      = document.getElementById('startBtn');

const startPriceEl  = document.getElementById('startPrice');
const livePriceEl   = document.getElementById('livePrice');
const timerEl       = document.getElementById('timer');
const higherBtn     = document.getElementById('higher');
const lowerBtn      = document.getElementById('lower');
const streakEl      = document.getElementById('streak');
const statusEl      = document.getElementById('status');
const globalHighEl  = document.getElementById('globalHigh');

// Game state
let startPrice = 0;
let timer = 5.0;
let guess = null;
let streak = 0;
let highscore = parseInt(localStorage.getItem('btcBlitzHigh') || '0');
let priceInterval, timerInterval;

globalHighEl.textContent = highscore;
streakEl.textContent = streak;

// Free, fast, no-key API
const API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

async function getPrice() {
  try {
    const res = await fetch(API + '&t=' + Date.now());
    const data = await res.json();
    return data.bitcoin.usd;
  } catch (e) {
    return 95000 + Math.random() * 2000; // fallback
  }
}

function format(price) {
  return '$' + Math.round(price).toLocaleString();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startGame() {
  streak = 0;
  streakEl.textContent = streak;
  showScreen('game');
  startRound();
}

function startRound() {
  guess = null;
  statusEl.textContent = '';
  higherBtn.disabled = false;
  lowerBtn.disabled = false;
  timer = 5.0;
  timerEl.textContent = '5.0';

  getPrice().then(price => {
    startPrice = price;
    startPriceEl.textContent = format(price);
    livePriceEl.textContent = format(price);
  });

  // Live price every second
  clearInterval(priceInterval);
  priceInterval = setInterval(async () => {
    const p = await getPrice();
    livePriceEl.textContent = format(p);
  }, 1000);

  // countdown
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer -= 0.1;
    timerEl.textContent = timer.toFixed(1);

    if (timer <= 0) {
      timer = 0;
      timerEl.textContent = '0.0';
      clearInterval(timerInterval);
      endRound();
    }
  }, 100);
}

function endRound() {
  clearInterval(priceInterval);
  clearInterval(timerInterval);
  higherBtn.disabled = true;
  lowerBtn.disabled = true;

  getPrice().then(finalPrice => {
    const won = guess === 'higher' ? finalPrice > startPrice :
                guess === 'lower'  ? finalPrice < startPrice : false;

    if (!guess) {
      statusEl.textContent = 'Too slow! No guess.';
      statusEl.style.color = '#ff3366';
    } else if (won) {
      streak++;
      statusEl.textContent = `CORRECT! Streak: ${streak} 🔥`;
      statusEl.style.color = '#00cc66';

      if (streak > highscore) {
        highscore = streak;
        localStorage.setItem('btcBlitzHigh', highscore);
        globalHighEl.textContent = highscore;
      }
    } else {
      statusEl.textContent = `Wrong → final was ${format(finalPrice)}`;
      statusEl.style.color = '#ff3366';
    }

    streakEl.textContent = streak;

    // Any loss → back to welcome after 3 seconds
    setTimeout(() => {
      if (!won || !guess) {
        showScreen('welcome');
      } else {
        startRound(); // keep playing on win
      }
    }, won && guess ? 1500 : 3000);
  });
}

// Button handlers
higherBtn.onclick = () => guess = 'higher';
lowerBtn.onclick  = () => guess = 'lower';
startBtn.onclick   = startGame;

// Start on load → show welcome
showScreen('welcome');