// DOM Elements
const currentIntakeEl = document.getElementById('current-intake');
const targetIntakeEl = document.getElementById('target-intake');
const progressFillEl = document.getElementById('progress-fill');
const waterButtons = document.querySelectorAll('.water-btn');
const customAmountBtn = document.getElementById('custom-amount');
const customInputContainer = document.getElementById('custom-input');
const customAmountInput = document.getElementById('custom-amount-input');
const addCustomBtn = document.getElementById('add-custom');
const cancelCustomBtn = document.getElementById('cancel-custom');
const reminderIntervalSelect = document.getElementById('reminder-interval');
const dailyTargetInput = document.getElementById('daily-target');
const soundChoiceSelect = document.getElementById('sound-choice');
const testSoundBtn = document.getElementById('test-sound');
const volumeSlider = document.getElementById('volume-slider');
const notificationsEnabledCheckbox = document.getElementById('notifications-enabled');
const fullscreenPauseCheckbox = document.getElementById('fullscreen-pause');
const saveSettingsBtn = document.getElementById('save-settings');
const themeToggleBtn = document.getElementById('theme-toggle');
const todayStatEl = document.getElementById('today-stat');
const yesterdayStatEl = document.getElementById('yesterday-stat');
const weeklyAvgStatEl = document.getElementById('weekly-avg-stat');
const chartContainer = document.getElementById('chart-container');

// State
let settings = {};
let hydrationData = {};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  updateUI();
  attachEventListeners();
  applyTheme();
});

// Load data from storage
async function loadData() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    settings = response.settings || {};
    hydrationData = response.hydrationData || { todayIntake: 0, intakeHistory: [] };
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Update UI elements with current data
function updateUI() {
  // Update progress display
  currentIntakeEl.textContent = hydrationData.todayIntake || 0;
  targetIntakeEl.textContent = settings.dailyTarget || 2000;
  
  const progressPercentage = Math.min(
    ((hydrationData.todayIntake || 0) / (settings.dailyTarget || 2000)) * 100,
    100
  );
  progressFillEl.style.width = `${progressPercentage}%`;
  
  // Update settings inputs
  reminderIntervalSelect.value = settings.reminderInterval || 60;
  dailyTargetInput.value = settings.dailyTarget || 2000;
  soundChoiceSelect.value = settings.soundChoice || 'water-drop';
  volumeSlider.value = settings.volume !== undefined ? settings.volume : 0.7;
  notificationsEnabledCheckbox.checked = 
    settings.notificationsEnabled !== undefined ? settings.notificationsEnabled : true;
  fullscreenPauseCheckbox.checked = 
    settings.fullScreenPause !== undefined ? settings.fullScreenPause : true;
  
  // Update statistics
  updateStatistics();
}

// Generate statistics and chart from hydration data
function updateStatistics() {
  const history = hydrationData.intakeHistory || [];
  
  // Update today's stat
  todayStatEl.textContent = `${hydrationData.todayIntake || 0} ml`;
  
  // Calculate yesterday's intake
  let yesterdayIntake = 0;
  if (history.length >= 2) {
    yesterdayIntake = history[history.length - 2].intake;
  }
  yesterdayStatEl.textContent = `${yesterdayIntake} ml`;
  
  // Calculate 7-day average
  let weeklyTotal = 0;
  let daysCount = 0;
  
  for (let i = Math.max(0, history.length - 7); i < history.length; i++) {
    weeklyTotal += history[i].intake;
    daysCount++;
  }
  
  const weeklyAvg = daysCount > 0 ? Math.round(weeklyTotal / daysCount) : 0;
  weeklyAvgStatEl.textContent = `${weeklyAvg} ml`;
  
  // Generate simple chart
  generateChart(history);
}

// Generate a simple bar chart using the last 7 days of data
function generateChart(history) {
  chartContainer.innerHTML = '';
  
  // Get the last 7 days (or fewer if not available)
  const lastWeek = history.slice(-7);
  
  if (lastWeek.length === 0) {
    chartContainer.innerHTML = '<p class="no-data">No data available yet</p>';
    return;
  }
  
  // Create chart container
  const chart = document.createElement('div');
  chart.className = 'chart';
  
  // Find max value for scaling
  const maxIntake = Math.max(...lastWeek.map(day => day.intake), 1);
  
  // Create bars for each day
  lastWeek.forEach(day => {
    const barHeight = (day.intake / maxIntake) * 100;
    const percentage = Math.min(barHeight, 100);
    
    // Format date (extract day of month)
    const date = new Date(day.date);
    const dayOfMonth = date.getDate();
    
    // Create bar container
    const barContainer = document.createElement('div');
    barContainer.className = 'chart-bar-container';
    
    // Create bar
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = `${percentage}%`;
    
    // Create label
    const label = document.createElement('div');
    label.className = 'chart-label';
    label.textContent = dayOfMonth;
    
    // Append elements
    barContainer.appendChild(bar);
    barContainer.appendChild(label);
    chart.appendChild(barContainer);
  });
  
  chartContainer.appendChild(chart);
}

// Attach event listeners to UI elements
function attachEventListeners() {
  // Add water buttons
  waterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount, 10);
      addWaterIntake(amount);
    });
  });
  
  // Custom amount input
  customAmountBtn.addEventListener('click', () => {
    customInputContainer.classList.remove('hidden');
    customAmountInput.focus();
  });
  
  addCustomBtn.addEventListener('click', () => {
    const amount = parseInt(customAmountInput.value, 10);
    if (amount > 0) {
      addWaterIntake(amount);
      customAmountInput.value = '';
      customInputContainer.classList.add('hidden');
    }
  });
  
  cancelCustomBtn.addEventListener('click', () => {
    customAmountInput.value = '';
    customInputContainer.classList.add('hidden');
  });
  
  // Test sound button
  testSoundBtn.addEventListener('click', () => {
    const sound = soundChoiceSelect.value;
    const volume = parseFloat(volumeSlider.value);
    playSound(sound, volume);
  });
  
  // Save settings button
  saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Theme toggle
  themeToggleBtn.addEventListener('click', toggleTheme);
}

// Add water intake
async function addWaterIntake(amount) {
  if (amount <= 0) return;
  
  try {
    await chrome.runtime.sendMessage({
      type: 'ADD_WATER',
      amount
    });
    
    // Refresh data
    await loadData();
    updateUI();
  } catch (error) {
    console.error('Error adding water intake:', error);
  }
}

// Save settings
async function saveSettings() {
  const newSettings = {
    reminderInterval: parseInt(reminderIntervalSelect.value, 10),
    dailyTarget: parseInt(dailyTargetInput.value, 10),
    soundChoice: soundChoiceSelect.value,
    volume: parseFloat(volumeSlider.value),
    notificationsEnabled: notificationsEnabledCheckbox.checked,
    fullScreenPause: fullscreenPauseCheckbox.checked,
    darkMode: document.body.classList.contains('dark-theme')
  };
  
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: newSettings
    });
    
    settings = newSettings;
    
    // Show success message
    showMessage('Settings saved successfully!');
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('Error saving settings. Please try again.', true);
  }
}

// Toggle between light and dark theme
function toggleTheme() {
  const isDarkMode = document.body.classList.toggle('dark-theme');
  themeToggleBtn.textContent = isDarkMode ? '☀️' : '🌙';

  // Save theme preference
  settings.darkMode = isDarkMode;
  chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    settings
  });
}

// Apply theme based on saved preference
function applyTheme() {
  if (settings.darkMode) {
    document.body.classList.add('dark-theme');
    themeToggleBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-theme');
    themeToggleBtn.textContent = '🌙';
  }
}

// Play notification sound
function playSound(sound, volume) {
  const audio = new Audio(chrome.runtime.getURL(`public/sounds/${sound}.mp3`));
  audio.volume = volume;
  audio.play();
}

// Show temporary message
function showMessage(message, isError = false) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${isError ? 'error' : 'success'}`;
  messageEl.textContent = message;
  
  document.body.appendChild(messageEl);
  
  // Remove after 3 seconds
  setTimeout(() => {
    messageEl.classList.add('fade-out');
    setTimeout(() => {
      messageEl.remove();
    }, 500);
  }, 3000);
} 