// Overview Page - Fetch and display all devices

const API_BASE = '';
const POLL_INTERVAL = 10000; // 10 seconds

let pollTimer = null;

// Fetch and render devices
async function fetchDevices() {
  try {
    const response = await fetch(`${API_BASE}/api/devices`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const devices = await response.json();
    
    renderDevices(devices);
    hideLoading();
    updateLastUpdateTime();
    
  } catch (error) {
    console.error('Error fetching devices:', error);
    showError(`Failed to load devices: ${error.message}`);
    hideLoading();
  }
}

// Render device cards
function renderDevices(devices) {
  const grid = document.getElementById('devices-grid');
  
  if (devices.length === 0) {
    grid.innerHTML = '<div class="no-data"><p>Belum ada device terdaftar.</p></div>';
    return;
  }
  
  grid.innerHTML = devices.map(device => {
    const statusClass = getStatusClass(device.prediction);
    const statusText = device.prediction || 'No Data';
    const hasReading = device.reading_timestamp !== null;
    
    return `
      <div class="device-card" onclick="goToDevice('${device.device_id}')">
        <div class="device-card-header">
          <div>
            <div class="device-id">${device.device_id}</div>
            <div class="device-location">${device.location_name || 'Location not set'}</div>
          </div>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        
        ${hasReading ? `
          <div class="device-stats">
            <div class="stat-item">
              <span class="stat-label">Confidence</span>
              <span class="stat-value">${formatConfidence(device.confidence)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Temperature</span>
              <span class="stat-value">${formatTemp(device.temp_mean)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Humidity</span>
              <span class="stat-value">${formatHumidity(device.humidity_mean)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Last Update</span>
              <span class="stat-value">${formatTimestamp(device.reading_timestamp)}</span>
            </div>
          </div>
        ` : `
          <div class="no-data"><p>No readings yet</p></div>
        `}
      </div>
    `;
  }).join('');
}

// Navigate to device detail page
function goToDevice(deviceId) {
  window.location.href = `/device/${deviceId}`;
}

// Get status CSS class
function getStatusClass(prediction) {
  if (!prediction) return 'status-badge';
  
  const classMap = {
    'Layak': 'status-layak',
    'Perlu Diperiksa': 'status-perlu-diperiksa',
    'Tidak Layak': 'status-tidak-layak'
  };
  
  return classMap[prediction] || 'status-badge';
}

// Format helpers
function formatConfidence(value) {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

function formatTemp(value) {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}°C`;
}

function formatHumidity(value) {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
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
  fetchDevices(); // Initial fetch
  pollTimer = setInterval(fetchDevices, POLL_INTERVAL);
}

// Stop polling when page unloads
window.addEventListener('beforeunload', () => {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', startPolling);
