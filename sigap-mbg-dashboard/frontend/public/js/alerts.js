// Alerts Page - Fetch and display critical alerts

const API_BASE = '';
const POLL_INTERVAL = 10000; // 10 seconds

let pollTimer = null;

// Fetch alerts
async function fetchAlerts() {
  try {
    const status = document.getElementById('status-filter').value;
    const limit = document.getElementById('limit-filter').value;
    
    let url = `${API_BASE}/api/alerts?limit=${limit}`;
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const alerts = await response.json();
    
    renderAlerts(alerts);
    hideLoading();
    updateLastUpdateTime();
    
  } catch (error) {
    console.error('Error fetching alerts:', error);
    showError(`Failed to load alerts: ${error.message}`);
    hideLoading();
  }
}

// Render alerts
function renderAlerts(alerts) {
  const container = document.getElementById('alerts-container');
  const noAlerts = document.getElementById('no-alerts');
  
  if (alerts.length === 0) {
    container.style.display = 'none';
    noAlerts.style.display = 'block';
    return;
  }
  
  noAlerts.style.display = 'none';
  container.style.display = 'flex';
  
  container.innerHTML = alerts.map(alert => {
    const alertClass = alert.prediction === 'Tidak Layak' ? 'alert-tidak-layak' : 'alert-perlu-diperiksa';
    const icon = alert.prediction === 'Tidak Layak' ? '🔴' : '⚠️';
    
    return `
      <div class="alert-item ${alertClass}" onclick="goToDevice('${alert.device_id}')">
        <div class="alert-icon">${icon}</div>
        
        <div class="alert-content">
          <div class="alert-device">
            <strong>${alert.device_id}</strong>
            ${alert.location_name ? ` - ${alert.location_name}` : ''}
          </div>
          
          <div class="alert-details">
            <span class="status-badge ${getStatusClass(alert.prediction)}">${alert.prediction}</span>
            <span style="margin: 0 0.5rem;">•</span>
            Confidence: ${formatConfidence(alert.confidence)}
            <span style="margin: 0 0.5rem;">•</span>
            Temp: ${formatValue(alert.temp_mean, '°C')}
            <span style="margin: 0 0.5rem;">•</span>
            Humidity: ${formatValue(alert.humidity_mean, '%')}
          </div>
          
          <div class="alert-details" style="margin-top: 0.5rem;">
            MQ-135: ${formatValue(alert.mq135_mean, '')} 
            <span style="margin: 0 0.5rem;">•</span>
            MQ-136: ${formatValue(alert.mq136_mean, '')}
          </div>
        </div>
        
        <div class="alert-timestamp">
          ${formatTimestamp(alert.reading_timestamp)}
        </div>
      </div>
    `;
  }).join('');
}

// Navigate to device detail
function goToDevice(deviceId) {
  window.location.href = `/device/${deviceId}`;
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
  return `${value.toFixed(1)}${unit}`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
  
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
  fetchAlerts(); // Initial fetch
  pollTimer = setInterval(fetchAlerts, POLL_INTERVAL);
}

// Filter change handlers
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('status-filter').addEventListener('change', fetchAlerts);
  document.getElementById('limit-filter').addEventListener('change', fetchAlerts);
  
  startPolling();
});

// Cleanup
window.addEventListener('beforeunload', () => {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});
