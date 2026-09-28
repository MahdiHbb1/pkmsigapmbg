// Overview Page - Fetch and display all devices

const API_BASE = '';
const POLL_INTERVAL = 10000; // 10 seconds

let pollTimer = null;
let previousData = null;
let retryCount = 0;
const MAX_RETRIES = 3;

// Fetch and render devices
async function fetchDevices() {
  try {
    showLiveIndicator();
    const response = await fetch(`${API_BASE}/api/devices`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const devices = await response.json();
    
    retryCount = 0;
    updateStats(devices, previousData);
    renderDevices(devices);
    hideLoading();
    hideError();
    updateLastUpdateTime();
    
    if (previousData && devices.length !== previousData.length) {
      showToast('info', 'Update', `Device count changed: ${devices.length}`);
    }
    
    previousData = devices;
    hideLiveIndicator();
    
  } catch (error) {
    console.error('Error fetching devices:', error);
    retryCount++;
    
    if (retryCount >= MAX_RETRIES) {
      showError(`Failed to load devices: ${error.message}`, true);
      stopPolling();
    } else {
      showToast('error', 'Connection Issue', `Retry ${retryCount}/${MAX_RETRIES}...`);
    }
    
    hideLoading();
    hideLiveIndicator();
  }
}

// Update stats summary
function updateStats(devices, previous) {
  const statsSummary = document.getElementById('stats-summary');
  
  if (!statsSummary) return;
  
  const total = devices.length;
  const layak = devices.filter(d => d.prediction === 'Layak').length;
  const perluDiperiksa = devices.filter(d => d.prediction === 'Perlu Diperiksa').length;
  const tidakLayak = devices.filter(d => d.prediction === 'Tidak Layak').length;
  
  animateCounter('stat-total', total);
  animateCounter('stat-layak', layak);
  animateCounter('stat-perlu-diperiksa', perluDiperiksa);
  animateCounter('stat-tidak-layak', tidakLayak);
  
  if (previous && previous.length > 0) {
    const prevTidakLayak = previous.filter(d => d.prediction === 'Tidak Layak').length;
    if (tidakLayak > prevTidakLayak) {
      showToast('error', 'Alert', `Tidak Layak increased: ${prevTidakLayak} → ${tidakLayak}`);
    }
  }
  
  statsSummary.style.display = 'grid';
}

// Animate counter with number transition
function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const currentValue = parseInt(element.textContent) || 0;
  
  if (currentValue === targetValue) return;
  
  // Add counting animation class
  element.classList.add('counting');
  
  // Animate from current to target
  const duration = 400;
  const steps = 20;
  const increment = (targetValue - currentValue) / steps;
  const stepDuration = duration / steps;
  
  let current = currentValue;
  let step = 0;
  
  const timer = setInterval(() => {
    step++;
    current += increment;
    
    if (step >= steps) {
      element.textContent = targetValue;
      clearInterval(timer);
      setTimeout(() => element.classList.remove('counting'), 100);
    } else {
      element.textContent = Math.round(current);
    }
  }, stepDuration);
}

// Render device cards
function renderDevices(devices) {
  const grid = document.getElementById('devices-grid');
  
  if (devices.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        <h3 class="empty-title">No Devices Found</h3>
        <p class="empty-description">No SIGAP MBG devices are registered yet. Add your first device to start monitoring.</p>
        <button class="empty-action" onclick="window.location.reload()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Refresh
        </button>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = devices.map(device => {
    const statusClass = getStatusClass(device.prediction);
    const statusText = device.prediction || 'No Data';
    const hasReading = device.reading_timestamp !== null;
    
    return `
      <div class="device-card" onclick="goToDevice('${device.device_id}')" tabindex="0" onkeypress="handleCardKeypress(event, '${device.device_id}')">
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

// ========================================
// UX Enhancements - Phase 2
// ========================================

// Toast Notification System
function showToast(type, title, message) {
  const container = getOrCreateToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconSvg = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${iconSvg[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="removeToast(this.parentElement)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => removeToast(toast), 5000);
}

function getOrCreateToastContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function removeToast(toast) {
  if (!toast || !toast.parentElement) return;
  toast.classList.add('removing');
  setTimeout(() => toast.remove(), 300);
}

// Skeleton Loading
function showSkeletons() {
  const grid = document.getElementById('devices-grid');
  grid.innerHTML = Array(3).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-badge"></div>
      </div>
      <div class="skeleton-stats">
        <div class="skeleton-line skeleton-stat"></div>
        <div class="skeleton-line skeleton-stat"></div>
        <div class="skeleton-line skeleton-stat"></div>
        <div class="skeleton-line skeleton-stat"></div>
      </div>
    </div>
  `).join('');
}

// Enhanced Error Display
function showError(message, allowRetry = false) {
  const errorDiv = document.getElementById('error');
  if (!errorDiv) return;
  
  if (allowRetry) {
    errorDiv.innerHTML = `
      <div class="error-card">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 class="error-title">Connection Lost</h3>
        <p class="error-description">${message}</p>
        <div class="error-actions">
          <button class="btn btn-primary" onclick="retryConnection()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;margin-right:4px">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Retry Now
          </button>
          <button class="btn btn-secondary" onclick="location.reload()">Reload Page</button>
        </div>
      </div>
    `;
  } else {
    errorDiv.innerHTML = `<div class="error-message">${message}</div>`;
  }
  
  errorDiv.style.display = 'block';
}

function hideError() {
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

function retryConnection() {
  retryCount = 0;
  hideError();
  showSkeletons();
  startPolling();
  showToast('info', 'Reconnecting', 'Attempting to reconnect...');
}

// Live Data Indicator
function showLiveIndicator() {
  let indicator = document.querySelector('.live-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'live-indicator';
    indicator.innerHTML = '<span class="live-dot"></span><span>Live</span>';
    document.querySelector('.stats-summary')?.appendChild(indicator);
  }
  indicator.classList.add('active');
}

function hideLiveIndicator() {
  setTimeout(() => {
    const indicator = document.querySelector('.live-indicator');
    if (indicator) indicator.classList.remove('active');
  }, 1000);
}

// Keyboard Navigation
function handleCardKeypress(event, deviceId) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    goToDevice(deviceId);
  }
}

// Polling Control
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
