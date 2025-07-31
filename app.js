let socket;
let candles = [];
let selectedStrategy = null;

const marketSelect = document.getElementById('market-select');
const assetSelect = document.getElementById('asset-select');
const strategySelect = document.getElementById('strategy-select');
const signalText = document.getElementById('signal-text');

function connectWebSocket() {
  if (socket) socket.close();

  const activeId = parseInt(assetSelect.value);
  socket = new WebSocket('wss://ws2.market-qx.trade/socket.io/?EIO=3&transport=websocket');

  socket.onopen = () => {
    console.log('Connected to Quotex WebSocket');
    // সাবস্ক্রাইব ম্যাসেজ: 42["candles/list",{"active_id":activeId,"size":60,"type":"digital-option"}]
    const subMsg = `42["candles/list",{"active_id":${activeId},"size":60,"type":"digital-option"}]`;
    socket.send(subMsg);
  };

  socket.onmessage = (event) => {
    if (event.data.startsWith('42')) {
      const cleaned = event.data.replace(/^42/, '');
      const parsed = JSON.parse(cleaned);
      const [eventType, data] = parsed;

      if (eventType === 'candles/list') {
        // নতুন ক্যান্ডেল আপডেট
        candles = data;
        processSignals(candles);
      }
    }
  };

  socket.onclose = () => {
    console.log('WebSocket closed');
  };

  socket.onerror = (err) => {
    console.error('WebSocket error', err);
  };
}

function processSignals(candles) {
  selectedStrategy = strategySelect.value;

  let signal = null;
  if (selectedStrategy === 'ema') {
    signal = calculateEMASignal(candles);
  } else if (selectedStrategy === 'priceAction') {
    signal = priceActionSignal(candles);
  } else if (selectedStrategy === 'volume') {
    signal = volumeSignal(candles);
  }

  if (signal) {
    showSignal(signal);
  } else {
    signalText.textContent = 'No clear signal';
    signalText.className = '';
  }
}

function showSignal(signal) {
  signalText.textContent = signal;
  if (signal === 'CALL') {
    signalText.className = 'call';
  } else if (signal === 'PUT') {
    signalText.className = 'put';
  } else {
    signalText.className = '';
  }
}

// ইভেন্ট লিসেনার
assetSelect.addEventListener('change', () => {
  connectWebSocket();
});

strategySelect.addEventListener('change', () => {
  if (candles.length) processSignals(candles);
});

// প্রথমে কানেক্ট করুন
connectWebSocket();
