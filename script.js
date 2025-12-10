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
let lastKnownPrice = 0;
let timer = 5.0;
let guess = null;
let streak = 0;
let highscore = parseInt(localStorage.getItem('btcBlitzHigh') || '0');
let priceInterval, timerInterval;

globalHighEl.textContent = highscore;
streakEl.textContent = streak;

// Primary: Mempool.Space (CORS-enabled, fresh prices)
const PRIMARY_API = 'https://mempool.space/api/v1/prices';
// Backup: Coinbase (rock-solid fallback)
const BACKUP_API = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';

async function getPrice(retries = 2) {
  const apis = [PRIMARY_API, BACKUP_API]; // Try primary first, then backup
  for (let api of apis) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(api + (api === PRIMARY_API ? '' : '') + '&t=' + Date.now());
        if (!res.ok) throw new Error('API not OK');
        const data = await res.json();
        let price;
        if (api === PRIMARY_API) {
          price = data.USD;
        } else {
          price = parseFloat(data.data.amount);
        }
        lastKnownPrice = price;
        console.log(`API fetch success (${api.includes('mempool') ? 'Mempool' : 'Coinbase'}): $${price.toLocaleString()}`);
        return price;
      } catch (e) {
        console.warn(`Fetch failed for ${api} (attempt ${i+1}):`, e.message);
        if (i === retries - 1) {
          // Move to next API
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }
  // Ultimate fallback
  console.warn('All APIs failed - using last known:', lastKnownPrice);
  return lastKnownPrice || 92500;
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
    lastKnownPrice = price;
    startPriceEl.textContent = format(price);
    livePriceEl.textContent = format(price);
  });

  // Live price every 1 second (now feasible with Mempool)
  clearInterval(priceInterval);
  priceInterval = setInterval(async () => {
    const p = await getPrice();
    livePriceEl.textContent = format(p);
  }, 1000);

  // Countdown
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

    setTimeout(() => {
      if (!won || !guess) {
        showScreen('welcome');
      } else {
        startRound();
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