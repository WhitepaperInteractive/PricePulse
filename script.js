const priceEl = document.getElementById('price');
const timerEl = document.getElementById('timer');
const higherBtn = document.getElementById('higher');
const lowerBtn = document.getElementById('lower');
const streakEl = document.getElementById('streak');
const highscoreEl = document.getElementById('highscore');
const statusEl = document.getElementById('status');

let currentPrice = 0;
let startPrice = 0;
let timer = 5;
let interval;
let timerInterval;
let guess = null;
let streak = 0;
let highscore = localStorage.getItem('btcBlitzHigh') || 0;
highscoreEl.textContent = highscore;

// Fast, free, reliable BTC price API (no key needed)
const PRICE_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

async function fetchPrice() {
  try {
    const res = await fetch(PRICE_API + '&t=' + Date.now()); // cache buster
    const data = await res.json();
    return data.bitcoin.usd;
  } catch (e) {
    // Fallback mock during rare downtime
    return currentPrice || 95000 + Math.random() * 1000;
  }
}

function formatPrice(p) {
  return '$' + Math.round(p).toLocaleString();
}

function startRound() {
  guess = null;
  higherBtn.disabled = false;
  lowerBtn.disabled = false;
  statusEl.textContent = '';
  timer = 5.0;

  fetchPrice().then(price => {
    startPrice = price;
    currentPrice = price;
    priceEl.textContent = formatPrice(price);
  });

  // Update price every second
  clearInterval(interval);
  interval = setInterval(async () => {
    currentPrice = await fetchPrice();
    priceEl.textContent = formatPrice(currentPrice);
  }, 1000);

  // Countdown
  clearInterval(timerInterval);
  timerEl.textContent = '5.0';
  timerInterval = setInterval(() => {
    timer -= 0.1;
    timerEl.textContent = timer.toFixed(1);

    if (timer <= 0) {
      endRound();
    }
  }, 100);
}

function endRound() {
  clearInterval(interval);
  clearInterval(timerInterval);
  higherBtn.disabled = true;
  lowerBtn.disabled = true;

  fetchPrice().then(finalPrice => {
    const won = guess === 'higher' ? finalPrice > startPrice :
                guess === 'lower' ? finalPrice < startPrice : false;

    if (!guess) {
      statusEl.textContent = '⏰ Too slow! Streak lost.';
      statusEl.style.color = '#ff3366';
      streak = 0;
    } else if (won) {
      streak++;
      if (streak > highscore) {
        highscore = streak;
        localStorage.setItem('btcBlitzHigh', highscore);
        highscoreEl.textContent = highscore;
      }
      statusEl.textContent = `Correct! +${streak} 🔥`;
      statusEl.style.color = '#00cc66';
    } else {
      statusEl.textContent = `Wrong! Was ${(finalPrice - startPrice).toFixed(2)}`;
      statusEl.style.color = '#ff3366';
      streak = 0;
    }

    streakEl.textContent = streak;
    setTimeout(startRound, 2000);
  });
}

// Button clicks
higherBtn.onclick = () => guess = 'higher';
lowerBtn.onclick = () => guess = 'lower';

// Start instantly
startRound();
