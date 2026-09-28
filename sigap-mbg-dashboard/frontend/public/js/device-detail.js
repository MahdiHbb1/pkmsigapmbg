// Device Detail Page - Fetch device data and render charts

const API_BASE = '';
const POLL_INTERVAL = 10000; // 10 seconds
const READINGS_LIMIT = 100;

let pollTimer = null;
let gasChart = null;
let envChart = null;

// Fetch latest reading
async function fetchLatestReading() {
  try {
    const response = await fetch(`${API_BASE}/api/devices/${DEVICE_ID}/latest`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const reading = await response.json();
    renderLatestReading(reading);
    
  } catch (error) {
    console.error('Error fetching latest reading:', error);
    showError(`Failed to load latest reading: ${error.message}`);
  }
}

// Fetch reading history
async function fetchReadingHistory() {
  try {
    const response = await fetch(`${API_BASE}/api/devices/${DEVICE_ID}/readings?limit=${READINGS_LIMIT}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const readings = await response.json();
    
    if (readings.length === 0) {
      showError('No readings available for this device');
      hideLoading();
      return;
    }
    
    renderCharts(readings);
    renderTable(readings);
    hideLoading();
    updateLastUpdateTime();
    
  } catch (error) {
    console.error('Error fetching reading history:', error);
    showError(`Failed to load reading history: ${error.message}`);
    hideLoading();
  }
}

// Render latest reading card
function renderLatestReading(reading) {
  document.getElementById('device-location').textContent = reading.location_name || 'Location not set';
  document.getElementById('latest-prediction').textContent = reading.prediction;
  document.getElementById('latest-confidence').textContent = formatConfidence(reading.confidence);
  document.getElementById('latest-temp').textContent = formatValue(reading.temp_mean, '°C');
  document.getElementById('latest-humidity').textContent = formatValue(reading.humidity_mean, '%');
  document.getElementById('latest-mq135').textContent = formatValue(reading.mq135_mean, '');
  document.getElementById('latest-mq136').textContent = formatValue(reading.mq136_mean, '');
  document.getElementById('latest-timestamp').textContent = formatTimestamp(reading.reading_timestamp);
  
  // Update status badge
  const badge = document.getElementById('device-status-badge');
  badge.textContent = reading.prediction;
  badge.className = 'status-badge ' + getStatusClass(reading.prediction);
  
  document.getElementById('latest-reading').style.display = 'block';
}

// Render charts
function renderCharts(readings) {
  // Reverse array for chronological order (oldest first)
  const data = readings.reverse();
  
  const labels = data.map(r => new Date(r.reading_timestamp).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }));
  
  // Gas sensors chart
  const gasCtx = document.getElementById('gas-chart').getContext('2d');
  if (gasChart) gasChart.destroy();
  
  gasChart = new Chart(gasCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'MQ-135 Mean',
          data: data.map(r => r.mq135_mean),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'MQ-136 Mean',
          data: data.map(r => r.mq136_mean),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Sensor Value'
          }
        }
      }
    }
  });
  
  // Environment chart
  const envCtx = document.getElementById('env-chart').getContext('2d');
  if (envChart) envChart.destroy();
  
  envChart = new Chart(envCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: data.map(r => r.temp_mean),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Humidity (%)',
          data: data.map(r => r.humidity_mean),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Temperature (°C)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Humidity (%)'
          },
          grid: {
            drawOnChartArea: false,
          }
        }
      }
    }
  });
  
  document.getElementById('charts-container').style.display = 'grid';
}

// Render table
function renderTable(readings) {
  const tbody = document.getElementById('readings-tbody');
  
  tbody.innerHTML = readings.map(r => `
    <tr>
      <td>${formatTimestamp(r.reading_timestamp)}</td>
      <td><span class="status-badge ${getStatusClass(r.prediction)}">${r.prediction}</span></td>
      <td>${formatConfidence(r.confidence)}</td>
      <td>${formatValue(r.mq135_mean, '')}</td>
      <td>${formatValue(r.mq136_mean, '')}</td>
      <td>${formatValue(r.temp_mean, '°C')}</td>
      <td>${formatValue(r.humidity_mean, '%')}</td>
    </tr>
  `).join('');
  
  document.getElementById('history-container').style.display = 'block';
}

// Helper functions
function getStatusClass(prediction) {
  const classMap = {
    'Layak': 'status-layak',
    'Perlu Diperiksa': 'status-perlu-diperiksa',
    'Tidak Layak': 'status-tidak-layak'
  };
  return classMap[prediction] || '';
}

function formatConfidence(value) {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

function formatValue(value, unit) {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(2)}${unit}`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('id-ID');
}

function updateLastUpdateTime() {
  const elem = document.getElementById('last-update-time');
  if (elem) {
    elem.textContent = new Date().toLocaleTimeString('id-ID');
  }
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

function hideLoading() {
  const loadingDiv = document.getElementById('loading');
  if (loadingDiv) {
    loadingDiv.style.display = 'none';
  }
}

// Start polling
function startPolling() {
  fetchLatestReading();
  fetchReadingHistory();
  pollTimer = setInterval(() => {
    fetchLatestReading();
    fetchReadingHistory();
  }, POLL_INTERVAL);
}

// Cleanup
window.addEventListener('beforeunload', () => {
  if (pollTimer) clearInterval(pollTimer);
  if (gasChart) gasChart.destroy();
  if (envChart) envChart.destroy();
});

// Initialize
document.addEventListener('DOMContentLoaded', startPolling);
