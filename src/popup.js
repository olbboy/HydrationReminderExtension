// Import CSS để Vite biên dịch tệp CSS với Tailwind
import './styles.css';

// DOM Elements - Main Elements
const currentIntakeEl = document.getElementById('current-intake');
const targetIntakeEl = document.getElementById('target-intake');
const progressFillEl = document.getElementById('progress-fill');
const dateDisplayEl = document.getElementById('date-display');
const activityLogEl = document.getElementById('activity-log');
const toastContainerEl = document.getElementById('toast-container');

// DOM Elements - Tab Controls
const tabTriggers = document.querySelectorAll('.tab-trigger');
const tabContents = document.querySelectorAll('[data-tab-content]');

// DOM Elements - Water Adding
const waterButtons = document.querySelectorAll('.water-btn');
const customAmountBtn = document.getElementById('custom-amount');
const customInputContainer = document.getElementById('custom-input');
const customAmountInput = document.getElementById('custom-amount-input');
const addCustomBtn = document.getElementById('add-custom');
const cancelCustomBtn = document.getElementById('cancel-custom');

// DOM Elements - Settings
const reminderIntervalSelect = document.getElementById('reminder-interval');
const dailyTargetInput = document.getElementById('daily-target');
const soundChoiceSelect = document.getElementById('sound-choice');
const testSoundBtn = document.getElementById('test-sound');
const volumeSlider = document.getElementById('volume-slider');
const notificationsEnabledCheckbox = document.getElementById('notifications-enabled');
const fullscreenPauseCheckbox = document.getElementById('fullscreen-pause');
const saveSettingsBtn = document.getElementById('save-settings');
const themeToggleBtn = document.getElementById('theme-toggle');

// DOM Elements - Statistics
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
  displayCurrentDate();
});

// Display current date
function displayCurrentDate() {
  const today = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  dateDisplayEl.textContent = today.toLocaleDateString('en-US', options);
}

// Load data from storage
async function loadData() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    settings = response.settings || {};
    hydrationData = response.hydrationData || { todayIntake: 0, intakeHistory: [] };
    
    // Default values if not set
    settings.reminderInterval = settings.reminderInterval || 60;
    settings.dailyTarget = settings.dailyTarget || 2000;
    settings.soundChoice = settings.soundChoice || 'water-drop';
    settings.volume = settings.volume !== undefined ? settings.volume : 0.7;
    settings.notificationsEnabled = settings.notificationsEnabled !== undefined 
      ? settings.notificationsEnabled : true;
    settings.fullScreenPause = settings.fullScreenPause !== undefined 
      ? settings.fullScreenPause : true;
    settings.darkMode = settings.darkMode !== undefined ? settings.darkMode : false;
    
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('Error loading your data', 'error');
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
  
  // Update checkboxes - we need to update both the checkbox and its UI representation
  notificationsEnabledCheckbox.checked = settings.notificationsEnabled;
  if (settings.notificationsEnabled) {
    notificationsEnabledCheckbox.setAttribute('data-checked', '');
  } else {
    notificationsEnabledCheckbox.removeAttribute('data-checked');
  }
  
  fullscreenPauseCheckbox.checked = settings.fullScreenPause;
  if (settings.fullScreenPause) {
    fullscreenPauseCheckbox.setAttribute('data-checked', '');
  } else {
    fullscreenPauseCheckbox.removeAttribute('data-checked');
  }
  
  // Update activity log
  updateActivityLog();
  
  // Update statistics
  updateStatistics();
}

// Update activity log
function updateActivityLog() {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if we have data for today
  if (!hydrationData.activities || !hydrationData.activities[today] || 
      hydrationData.activities[today].length === 0) {
    activityLogEl.innerHTML = '<div class="text-center text-muted-foreground">No activity yet today</div>';
    return;
  }
  
  // Clear and rebuild the log
  activityLogEl.innerHTML = '';
  
  // Get today's activities and sort by timestamp (descending)
  const todaysActivities = [...hydrationData.activities[today]].sort((a, b) => b.timestamp - a.timestamp);
  
  // Display each activity
  todaysActivities.forEach(activity => {
    const time = new Date(activity.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const entry = document.createElement('div');
    entry.className = 'flex justify-between items-center py-1 border-b border-border last:border-0';
    entry.innerHTML = `
      <span class="text-sm">${time}</span>
      <span class="font-medium text-primary">+${activity.amount} ml</span>
    `;
    
    activityLogEl.appendChild(entry);
  });
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
    chartContainer.innerHTML = '<div class="text-center text-muted-foreground py-12">No data available yet</div>';
    return;
  }
  
  // Create chart container
  const chart = document.createElement('div');
  chart.className = 'h-full flex items-end justify-between gap-1';
  
  // Find max value for scaling
  const maxIntake = Math.max(...lastWeek.map(day => day.intake), 1);
  const target = settings.dailyTarget || 2000;
  
  // Create target line
  const targetPercentage = Math.min((target / maxIntake) * 100, 100);
  
  // Create bars for each day
  lastWeek.forEach(day => {
    const barHeight = (day.intake / maxIntake) * 100;
    const percentage = Math.min(barHeight, 100);
    const isToday = day.date === new Date().toISOString().split('T')[0];
    
    // Format date (extract day of month)
    const date = new Date(day.date);
    const dayOfMonth = date.getDate();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1);
    
    // Create bar container
    const barContainer = document.createElement('div');
    barContainer.className = 'flex flex-col items-center flex-1';
    
    // Container for the bar and target line
    const barWrapper = document.createElement('div');
    barWrapper.className = 'relative w-full h-[140px] flex flex-col justify-end';
    
    // Create target line
    if (day.intake > 0) {
      const targetLine = document.createElement('div');
      targetLine.className = 'absolute w-full border-t border-dashed border-primary/50';
      targetLine.style.bottom = `${targetPercentage}%`;
      barWrapper.appendChild(targetLine);
    }
    
    // Create bar
    const bar = document.createElement('div');
    bar.className = `w-full rounded-t-sm transition-all duration-500 ease-in-out ${
      isToday ? 'bg-primary' : 'bg-primary/60'
    }`;
    bar.style.height = `${percentage}%`;
    
    // Create label
    const label = document.createElement('div');
    label.className = 'text-xs text-center text-muted-foreground mt-1';
    label.innerHTML = `${dayName}<br>${dayOfMonth}`;
    
    // Append elements
    barWrapper.appendChild(bar);
    barContainer.appendChild(barWrapper);
    barContainer.appendChild(label);
    chart.appendChild(barContainer);
  });
  
  chartContainer.appendChild(chart);
}

// Tab functionality
function setupTabs() {
  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const tab = trigger.dataset.tab;
      
      // Update active state on triggers
      tabTriggers.forEach(t => {
        if (t.dataset.tab === tab) {
          t.dataset.state = 'active';
        } else {
          delete t.dataset.state;
        }
      });
      
      // Show/hide tab content
      tabContents.forEach(content => {
        if (content.dataset.tabContent === tab) {
          content.classList.remove('hidden');
          content.dataset.state = 'active';
        } else {
          content.classList.add('hidden');
          delete content.dataset.state;
        }
      });
    });
  });
}

// Attach event listeners to UI elements
function attachEventListeners() {
  // Setup tabs
  setupTabs();
  
  // Add water buttons
  waterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const amount = parseInt(btn.dataset.amount, 10);
      addWaterIntake(amount);
      
      // Create ripple effect
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.className = 'absolute w-0 h-0 rounded-full bg-white/30 animate-ripple';
      
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
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
  
  // Make switches work properly
  notificationsEnabledCheckbox.addEventListener('change', function() {
    if (this.checked) {
      this.setAttribute('data-checked', '');
    } else {
      this.removeAttribute('data-checked');
    }
  });
  
  fullscreenPauseCheckbox.addEventListener('change', function() {
    if (this.checked) {
      this.setAttribute('data-checked', '');
    } else {
      this.removeAttribute('data-checked');
    }
  });
}

// Add water intake
async function addWaterIntake(amount) {
  if (amount <= 0) return;
  
  try {
    // Get the current timestamp
    const timestamp = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    // Initialize activities if needed
    if (!hydrationData.activities) {
      hydrationData.activities = {};
    }
    
    if (!hydrationData.activities[today]) {
      hydrationData.activities[today] = [];
    }
    
    // Add activity to log
    hydrationData.activities[today].push({
      amount,
      timestamp
    });
    
    await chrome.runtime.sendMessage({
      type: 'ADD_WATER',
      amount
    });
    
    // Refresh data
    await loadData();
    updateUI();
    
    // Show success message
    showToast(`Added ${amount}ml of water`, 'success');
  } catch (error) {
    console.error('Error adding water intake:', error);
    showToast('Error adding water intake', 'error');
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
    darkMode: document.documentElement.classList.contains('dark')
  };
  
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: newSettings
    });
    
    settings = newSettings;
    updateUI();
    
    // Show success message
    showToast('Settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings', 'error');
  }
}

// Toggle between light and dark theme
function toggleTheme() {
  const isDarkMode = document.documentElement.classList.toggle('dark');
  
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
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Play notification sound
function playSound(sound, volume) {
  const audio = new Audio(chrome.runtime.getURL(`public/sounds/${sound}.mp3`));
  audio.volume = volume;
  audio.play();
}

// Show toast message
function showToast(message, type = 'success') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'bg-destructive text-destructive-foreground' : ''}`;
  
  // Add content
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      ${type === 'success' 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>' 
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>'}
      <span>${message}</span>
    </div>
    <button class="text-muted-foreground hover:text-foreground">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  `;
  
  // Add to container
  toastContainerEl.appendChild(toast);
  
  // Add click handler to close button
  const closeBtn = toast.querySelector('button');
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'toast-out 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'toast-out 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
} 