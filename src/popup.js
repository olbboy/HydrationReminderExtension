// Import CSS để Vite biên dịch tệp CSS với Tailwind
import './styles.css';

// DOM Elements - Main Elements
const currentIntakeEl = document.getElementById('current-intake');
const targetIntakeEl = document.getElementById('target-intake');
const progressFillEl = document.getElementById('progress-fill');
const dateDisplayEl = document.getElementById('date-display');
const activityLogEl = document.getElementById('activity-log');
const toastContainerEl = document.getElementById('toast-container');
const waterFillEl = document.getElementById('water-fill');
const hydrationFeedbackEl = document.getElementById('hydration-feedback');
const remainingIntakeEl = document.getElementById('remaining-intake');
const drinkCountEl = document.getElementById('drink-count');
const hydrationScoreEl = document.getElementById('hydration-score');
const streakCountEl = document.getElementById('streak-count');

// DOM Elements - AI Assistant
const aiAssistantBtn = document.getElementById('ai-assistant');
const aiAssistantDialog = document.getElementById('ai-assistant-dialog');
const closeAssistantBtn = document.getElementById('close-assistant');
const generateRecommendationBtn = document.getElementById('generate-recommendation');
const exportInsightsBtn = document.getElementById('export-insights');
const aiAvgIntakeEl = document.getElementById('ai-avg-intake');
const aiOptimalTimesEl = document.getElementById('ai-optimal-times');
const aiIntakeAssessmentEl = document.getElementById('ai-intake-assessment');
const aiRecommendationsEl = document.getElementById('ai-recommendations');
const aiInsightEl = document.getElementById('ai-insight');

// DOM Elements - Insights
const weeklyProgressCircleEl = document.getElementById('weekly-progress-circle');
const weeklyCompletionEl = document.getElementById('weekly-completion');
const weeklyAvgMlEl = document.getElementById('weekly-avg-ml');
const weeklyAvgProgressEl = document.getElementById('weekly-avg-progress');
const consistencyPercentEl = document.getElementById('consistency-percent');
const consistencyProgressEl = document.getElementById('consistency-progress');
const timingPercentEl = document.getElementById('timing-percent');
const timingProgressEl = document.getElementById('timing-progress');
const bestDayEl = document.getElementById('best-day');
const bestAmountEl = document.getElementById('best-amount');

// DOM Elements - Drink Types
const drinkTypeButtons = document.querySelectorAll('[data-drink-type]');

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
let currentDrinkType = 'water'; // Default drink type
let streakData = {
  count: 0,
  lastDate: null
};
let insightsData = {
  weeklyCompletion: 0,
  weeklyAvgMl: 0,
  consistency: 0,
  optimalTiming: 0,
  bestDay: 'N/A',
  bestAmount: 0
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  updateUI();
  attachEventListeners();
  applyTheme();
  displayCurrentDate();
  
  // Check for new elements and initialize if needed
  initializeWaterBottle();
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
    streakData = response.streakData || { count: 0, lastDate: null };
    
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
    settings.colorTheme = settings.colorTheme || 'blue';
    settings.smartGoals = settings.smartGoals !== undefined ? settings.smartGoals : false;
    settings.cloudSync = settings.cloudSync !== undefined ? settings.cloudSync : false;
    
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
  
  // Update water bottle fill
  waterFillEl.style.height = `${progressPercentage}%`;
  
  // Update hydration detail cards
  const remainingAmount = Math.max((settings.dailyTarget || 2000) - (hydrationData.todayIntake || 0), 0);
  remainingIntakeEl.textContent = remainingAmount;
  
  // Count drinks for today
  const today = new Date().toISOString().split('T')[0];
  const todayActivities = (hydrationData.activities && hydrationData.activities[today]) || [];
  drinkCountEl.textContent = todayActivities.length;
  
  // Calculate hydration score (0-100)
  const hydrationScore = Math.min(Math.round(progressPercentage), 100);
  hydrationScoreEl.textContent = hydrationScore;
  
  // Update hydration feedback message
  updateHydrationFeedback(progressPercentage);
  
  // Display streak
  streakCountEl.textContent = streakData.count || 0;
  
  // Update settings inputs
  reminderIntervalSelect.value = settings.reminderInterval || 60;
  dailyTargetInput.value = settings.dailyTarget || 2000;
  soundChoiceSelect.value = settings.soundChoice || 'water-drop';
  volumeSlider.value = settings.volume !== undefined ? settings.volume : 0.7;
  
  // Update checkboxes - we need to update both the checkbox and its UI representation
  setCheckboxState(notificationsEnabledCheckbox, settings.notificationsEnabled);
  setCheckboxState(fullscreenPauseCheckbox, settings.fullScreenPause);
  
  // Update smart goals checkbox if it exists
  const smartGoalsCheckbox = document.getElementById('smart-goals');
  if (smartGoalsCheckbox) {
    setCheckboxState(smartGoalsCheckbox, settings.smartGoals || false);
  }
  
  // Update cloud sync checkbox if it exists
  const cloudSyncCheckbox = document.getElementById('cloud-sync');
  if (cloudSyncCheckbox) {
    setCheckboxState(cloudSyncCheckbox, settings.cloudSync || false);
  }
  
  // Update activity log
  updateActivityLog();
  
  // Update insights
  updateInsights();
}

// Helper to set checkbox state
function setCheckboxState(checkbox, state) {
  if (!checkbox) return;
  
  checkbox.checked = state;
  if (state) {
    checkbox.setAttribute('data-checked', '');
  } else {
    checkbox.removeAttribute('data-checked');
  }
}

// Update hydration feedback message
function updateHydrationFeedback(progressPercentage) {
  if (!hydrationFeedbackEl) return;
  
  if (progressPercentage === 0) {
    hydrationFeedbackEl.textContent = "Add your first drink to start tracking!";
  } else if (progressPercentage < 25) {
    hydrationFeedbackEl.textContent = "You're just getting started. Keep drinking!";
  } else if (progressPercentage < 50) {
    hydrationFeedbackEl.textContent = "Good progress, but still need more water.";
  } else if (progressPercentage < 75) {
    hydrationFeedbackEl.textContent = "You're over halfway there. Keep it up!";
  } else if (progressPercentage < 100) {
    hydrationFeedbackEl.textContent = "Almost at your goal! Just a bit more.";
  } else {
    hydrationFeedbackEl.textContent = "Congratulations! You've reached your daily goal.";
  }
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
  // Tab navigation
  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      // Remove active state from all tabs
      tabTriggers.forEach(t => {
        t.removeAttribute('data-state');
      });
      
      // Hide all tab content
      tabContents.forEach(content => {
        content.classList.add('hidden');
        content.removeAttribute('data-state');
      });
      
      // Set active state for clicked tab
      trigger.setAttribute('data-state', 'active');
      
      // Show corresponding content
      const tabId = trigger.getAttribute('data-tab');
      const tabContent = document.querySelector(`[data-tab-content="${tabId}"]`);
      
      if (tabContent) {
        tabContent.classList.remove('hidden');
        tabContent.setAttribute('data-state', 'active');
      }
    });
  });
  
  // Water buttons
  waterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.getAttribute('data-amount'), 10);
      addWaterIntake(amount, currentDrinkType);
      
      // Add ripple effect
      createRipple(btn);
    });
  });
  
  // Drink type selection
  if (drinkTypeButtons) {
    drinkTypeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        drinkTypeButtons.forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Update current drink type
        currentDrinkType = btn.getAttribute('data-drink-type') || 'water';
      });
    });
  }
  
  // Custom amount functionality
  customAmountBtn.addEventListener('click', () => {
    customInputContainer.classList.remove('hidden');
    customAmountInput.focus();
  });
  
  addCustomBtn.addEventListener('click', () => {
    const amount = parseInt(customAmountInput.value, 10);
    if (amount > 0) {
      addWaterIntake(amount, currentDrinkType);
      customAmountInput.value = '';
      customInputContainer.classList.add('hidden');
    } else {
      showToast('Please enter a valid amount', 'error');
    }
  });
  
  cancelCustomBtn.addEventListener('click', () => {
    customAmountInput.value = '';
    customInputContainer.classList.add('hidden');
  });
  
  // Settings save
  saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Test sound
  testSoundBtn.addEventListener('click', playNotificationSound);
  
  // Theme toggle
  themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Color theme buttons
  const themeButtons = document.querySelectorAll('[data-theme]');
  if (themeButtons.length > 0) {
    themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Get theme
        const theme = btn.getAttribute('data-theme');
        
        // Update active button
        themeButtons.forEach(b => b.removeAttribute('data-active'));
        btn.setAttribute('data-active', 'true');
        
        // Save theme preference
        settings.colorTheme = theme;
        saveSettings();
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);
      });
    });
    
    // Set initial theme
    const currentTheme = settings.colorTheme || 'blue';
    document.documentElement.setAttribute('data-theme', currentTheme);
    const activeThemeBtn = document.querySelector(`[data-theme="${currentTheme}"]`);
    if (activeThemeBtn) {
      themeButtons.forEach(b => b.removeAttribute('data-active'));
      activeThemeBtn.setAttribute('data-active', 'true');
    }
  }
  
  // AI Assistant
  if (aiAssistantBtn && aiAssistantDialog && closeAssistantBtn) {
    aiAssistantBtn.addEventListener('click', () => {
      aiAssistantDialog.style.display = 'flex';
      updateAIAssistantData();
    });
    
    closeAssistantBtn.addEventListener('click', () => {
      aiAssistantDialog.style.display = 'none';
    });
  }
  
  // Generate AI recommendation
  if (generateRecommendationBtn) {
    generateRecommendationBtn.addEventListener('click', () => {
      generateAIRecommendation();
    });
  }
  
  // Export insights
  if (exportInsightsBtn) {
    exportInsightsBtn.addEventListener('click', () => {
      exportHydrationInsights();
    });
  }
  
  // Data management buttons
  const exportDataBtn = document.getElementById('export-data');
  const importDataBtn = document.getElementById('import-data');
  const resetDataBtn = document.getElementById('reset-data');
  
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportData);
  }
  
  if (importDataBtn) {
    importDataBtn.addEventListener('click', importData);
  }
  
  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', confirmResetData);
  }
}

// Create ripple effect on button click
function createRipple(button) {
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.classList.add('ripple');
  
  button.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600); // Match the CSS animation duration
}

// Add water intake for the current day
function addWaterIntake(amount, drinkType = 'water') {
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize today's intake if needed
  hydrationData.todayIntake = hydrationData.todayIntake || 0;
  
  // Initialize activities if needed
  hydrationData.activities = hydrationData.activities || {};
  hydrationData.activities[today] = hydrationData.activities[today] || [];
  
  // Add the amount to today's total
  hydrationData.todayIntake += amount;
  
  // Record the activity
  hydrationData.activities[today].push({
    amount: amount,
    timestamp: Date.now(),
    type: drinkType
  });
  
  // Update intake history
  if (!hydrationData.intakeHistory) {
    hydrationData.intakeHistory = [];
  }
  
  let todayRecord = hydrationData.intakeHistory.find(record => record.date === today);
  
  if (todayRecord) {
    todayRecord.intake = hydrationData.todayIntake;
  } else {
    hydrationData.intakeHistory.push({
      date: today,
      intake: hydrationData.todayIntake
    });
  }
  
  // Update streak data
  updateStreak(today);
  
  // Save data
  saveData();
  
  // Update UI
  updateUI();
  
  // Show feedback
  showToast(`Added ${amount}ml of ${getDrinkTypeName(drinkType)}!`, 'success');
  
  // Play sound effect
  playDropSound();
}

// Get display name for drink type
function getDrinkTypeName(type) {
  const types = {
    'water': 'water',
    'coffee': 'coffee',
    'tea': 'tea'
  };
  return types[type] || 'water';
}

// Update streak counter
function updateStreak(today) {
  // Initialize streak data if needed
  streakData = streakData || { count: 0, lastDate: null };
  
  // No previous streak
  if (!streakData.lastDate) {
    streakData.count = 1;
    streakData.lastDate = today;
    return;
  }
  
  // Calculate days between
  const lastDate = new Date(streakData.lastDate);
  const currentDate = new Date(today);
  const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    // Same day, no change
    return;
  } else if (daysDiff === 1) {
    // Consecutive day, increment streak
    streakData.count += 1;
    streakData.lastDate = today;
  } else {
    // Streak broken
    streakData.count = 1;
    streakData.lastDate = today;
  }
}

// Save settings to storage
function saveSettings() {
  // Gather values from UI
  settings.reminderInterval = parseInt(reminderIntervalSelect.value, 10);
  settings.dailyTarget = parseInt(dailyTargetInput.value, 10);
  settings.soundChoice = soundChoiceSelect.value;
  settings.volume = parseFloat(volumeSlider.value);
  settings.notificationsEnabled = notificationsEnabledCheckbox.checked;
  settings.fullScreenPause = fullscreenPauseCheckbox.checked;
  
  // Check for new settings elements
  const smartGoalsCheckbox = document.getElementById('smart-goals');
  if (smartGoalsCheckbox) {
    settings.smartGoals = smartGoalsCheckbox.checked;
  }
  
  const cloudSyncCheckbox = document.getElementById('cloud-sync');
  if (cloudSyncCheckbox) {
    settings.cloudSync = cloudSyncCheckbox.checked;
  }
  
  // Save to storage
  saveData();
  
  // Update UI
  updateUI();
  
  // Show confirmation
  showToast('Settings saved successfully!', 'success');
}

// Save data to storage
function saveData() {
  chrome.runtime.sendMessage({
    type: 'SET_DATA',
    settings: settings,
    hydrationData: hydrationData,
    streakData: streakData
  });
}

// Toggle between light and dark theme
function toggleTheme() {
  settings.darkMode = !settings.darkMode;
  applyTheme();
  saveSettings();
}

// Apply theme based on settings
function applyTheme() {
  if (settings.darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Apply color theme if set
  if (settings.colorTheme) {
    document.documentElement.setAttribute('data-theme', settings.colorTheme);
  }
}

// Play water drop sound effect
function playDropSound() {
  const audio = new Audio(chrome.runtime.getURL('audio/drop.mp3'));
  audio.volume = settings.volume !== undefined ? settings.volume : 0.7;
  audio.play().catch(err => console.error('Error playing sound:', err));
}

// Play notification sound
function playNotificationSound() {
  const soundMap = {
    'water-drop': 'drop.mp3',
    'bell': 'bell.mp3',
    'chime': 'chime.mp3',
    'birds': 'birds.mp3',
    'stream': 'stream.mp3'
  };
  
  const soundFile = soundMap[settings.soundChoice] || 'drop.mp3';
  const audio = new Audio(chrome.runtime.getURL(`audio/${soundFile}`));
  audio.volume = settings.volume !== undefined ? settings.volume : 0.7;
  audio.play().catch(err => console.error('Error playing sound:', err));
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add to container
  toastContainerEl.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove after timeout
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toastContainerEl.removeChild(toast);
    }, 300);
  }, 3000);
}

// Initialize water bottle fill animation
function initializeWaterBottle() {
  if (!waterFillEl) return;
  
  // Get progress percentage
  const progressPercentage = Math.min(
    ((hydrationData.todayIntake || 0) / (settings.dailyTarget || 2000)) * 100,
    100
  );
  
  // Initially set to 0 height
  waterFillEl.style.height = '0%';
  
  // After a short delay, animate to actual height
  setTimeout(() => {
    waterFillEl.style.transition = 'height 1s ease-in-out';
    waterFillEl.style.height = `${progressPercentage}%`;
  }, 300);
}

// Update insights tab
function updateInsights() {
  // Skip if we don't have the necessary elements
  if (!weeklyCompletionEl || !weeklyProgressCircleEl) return;
  
  const history = hydrationData.intakeHistory || [];
  
  // Calculate weekly completion percentage
  let weeklyTotal = 0;
  let daysCount = 0;
  let totalPossible = 0;
  
  for (let i = Math.max(0, history.length - 7); i < history.length; i++) {
    weeklyTotal += history[i].intake;
    totalPossible += settings.dailyTarget;
    daysCount++;
  }
  
  const weeklyCompletion = daysCount > 0 ? Math.round((weeklyTotal / totalPossible) * 100) : 0;
  const weeklyAvg = daysCount > 0 ? Math.round(weeklyTotal / daysCount) : 0;
  
  // Weekly average percentage of daily target
  const weeklyAvgPercentage = Math.min((weeklyAvg / settings.dailyTarget) * 100, 100);
  
  // Update circular progress
  weeklyCompletionEl.textContent = `${weeklyCompletion}%`;
  const circumference = 2 * Math.PI * 40; // r = 40 from the SVG
  const offset = circumference - (weeklyCompletion / 100) * circumference;
  weeklyProgressCircleEl.style.strokeDashoffset = offset;
  
  // Update weekly average
  weeklyAvgMlEl.textContent = `${weeklyAvg} ml`;
  weeklyAvgProgressEl.style.width = `${weeklyAvgPercentage}%`;
  
  // Calculate consistency (how many days user drank water)
  let daysWithWater = 0;
  for (let i = Math.max(0, history.length - 7); i < history.length; i++) {
    if (history[i].intake > 0) daysWithWater++;
  }
  
  const consistency = daysCount > 0 ? Math.round((daysWithWater / daysCount) * 100) : 0;
  consistencyPercentEl.textContent = `${consistency}%`;
  consistencyProgressEl.style.width = `${consistency}%`;
  
  // Estimate optimal timing (70% for now as placeholder)
  const optimalTiming = 70;
  timingPercentEl.textContent = `${optimalTiming}%`;
  timingProgressEl.style.width = `${optimalTiming}%`;
  
  // Find best day
  let bestDayData = { date: 'N/A', intake: 0 };
  for (let i = Math.max(0, history.length - 7); i < history.length; i++) {
    if (history[i].intake > bestDayData.intake) {
      bestDayData = history[i];
    }
  }
  
  if (bestDayData.date !== 'N/A') {
    const date = new Date(bestDayData.date);
    bestDayEl.textContent = date.toLocaleDateString('en-US', { weekday: 'short' });
    bestAmountEl.textContent = `${bestDayData.intake} ml`;
  } else {
    bestDayEl.textContent = 'N/A';
    bestAmountEl.textContent = '0 ml';
  }
  
  // Update AI insight (basic placeholder for now)
  if (aiInsightEl) {
    if (weeklyAvg === 0) {
      aiInsightEl.textContent = "Your hydration data is being analyzed. Keep drinking water to receive personalized insights!";
    } else if (weeklyAvg < settings.dailyTarget * 0.5) {
      aiInsightEl.textContent = "Your weekly average is below 50% of your target. Consider setting reminders to drink more regularly.";
    } else if (weeklyAvg < settings.dailyTarget * 0.8) {
      aiInsightEl.textContent = "You're making good progress! Try to maintain consistency throughout the day for better hydration.";
    } else {
      aiInsightEl.textContent = "Excellent hydration habits! You're consistently meeting your daily goals.";
    }
  }
  
  // Update chart
  generateInsightsChart(history);
}

// Generate a chart for the insights tab
function generateInsightsChart(history) {
  if (!chartContainer) return;
  
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
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3);
    
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
    label.textContent = `${dayName}`;
    
    // Assemble the bar
    barWrapper.appendChild(bar);
    barContainer.appendChild(barWrapper);
    barContainer.appendChild(label);
    chart.appendChild(barContainer);
  });
  
  chartContainer.appendChild(chart);
}

// Update AI Assistant data
function updateAIAssistantData() {
  if (!aiAvgIntakeEl || !aiOptimalTimesEl || !aiIntakeAssessmentEl) return;
  
  const history = hydrationData.intakeHistory || [];
  
  // Calculate average intake
  let total = 0;
  let count = 0;
  
  for (let i = Math.max(0, history.length - 7); i < history.length; i++) {
    total += history[i].intake;
    count++;
  }
  
  const avgIntake = count > 0 ? Math.round(total / count) : 0;
  aiAvgIntakeEl.textContent = `${avgIntake}ml`;
  
  // Get optimal times (placeholder - would need more detailed data)
  const optimalTime = "morning";
  aiOptimalTimesEl.textContent = optimalTime;
  
  // Assessment of current intake vs target
  const todayIntake = hydrationData.todayIntake || 0;
  const targetIntake = settings.dailyTarget || 2000;
  let assessment = "below";
  
  if (todayIntake >= targetIntake) {
    assessment = "meeting";
  } else if (todayIntake >= targetIntake * 0.8) {
    assessment = "close to meeting";
  } else if (todayIntake >= targetIntake * 0.5) {
    assessment = "making progress towards";
  } else {
    assessment = "well below";
  }
  
  aiIntakeAssessmentEl.textContent = assessment;
}

// Generate AI recommendation
function generateAIRecommendation() {
  if (!aiRecommendationsEl) return;
  
  // Get progress percentage
  const todayIntake = hydrationData.todayIntake || 0;
  const targetIntake = settings.dailyTarget || 2000;
  const progressPercentage = (todayIntake / targetIntake) * 100;
  
  // Create recommendations based on progress
  const recommendations = [];
  
  if (progressPercentage < 25) {
    recommendations.push("Start with 250ml of water right away");
    recommendations.push("Set hourly reminders during your active hours");
    recommendations.push("Keep a water bottle visible at your desk");
  } else if (progressPercentage < 50) {
    recommendations.push("Aim to drink 200ml every hour for the next few hours");
    recommendations.push("Try setting a 90-minute reminder interval");
    recommendations.push("Consider drinking a full glass before each meal");
  } else if (progressPercentage < 75) {
    recommendations.push("Add another 500ml in the next 2 hours");
    recommendations.push("Try herbal tea as an alternative to plain water");
    recommendations.push("Remember to drink water after physical activity");
  } else {
    recommendations.push("You're doing great! Just 1-2 more glasses to reach your goal");
    recommendations.push("Maintain your current pattern tomorrow");
    recommendations.push("Consider increasing your goal if this feels easy");
  }
  
  // Update the recommendations list
  aiRecommendationsEl.innerHTML = '';
  recommendations.forEach(rec => {
    const li = document.createElement('li');
    li.textContent = rec;
    aiRecommendationsEl.appendChild(li);
  });
  
  showToast('New recommendations generated!', 'success');
}

// Export hydration insights
function exportHydrationInsights() {
  // Create insights text
  const insights = [
    "HYDRATION INSIGHTS REPORT",
    "========================",
    "",
    `Date: ${new Date().toLocaleDateString()}`,
    `Current Streak: ${streakData.count} days`,
    "",
    "7-DAY SUMMARY",
    "-------------",
    `Weekly Goal Completion: ${insightsData.weeklyCompletion || 0}%`,
    `Weekly Average: ${insightsData.weeklyAvgMl || 0}ml`,
    `Consistency: ${insightsData.consistency || 0}%`,
    `Best Day: ${insightsData.bestDay} (${insightsData.bestAmount}ml)`,
    "",
    "AI RECOMMENDATIONS",
    "------------------"
  ];
  
  // Add recommendations
  const recItems = aiRecommendationsEl.querySelectorAll('li');
  recItems.forEach(item => {
    insights.push(`- ${item.textContent}`);
  });
  
  // Create blob and download
  const blob = new Blob([insights.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `hydration-insights-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Insights exported successfully!', 'success');
}

// Export all hydration data
function exportData() {
  const exportData = {
    settings: settings,
    hydrationData: hydrationData,
    streakData: streakData,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `hydration-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Data exported successfully!', 'success');
}

// Import data from file
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Validate data structure
        if (data.settings && data.hydrationData) {
          settings = data.settings;
          hydrationData = data.hydrationData;
          streakData = data.streakData || { count: 0, lastDate: null };
          
          // Save to storage
          saveAllData();
          
          // Update UI
          updateUI();
          
          showToast('Data imported successfully!', 'success');
        } else {
          showToast('Invalid data format', 'error');
        }
      } catch (error) {
        console.error('Import error:', error);
        showToast('Error importing data', 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// Confirm data reset
function confirmResetData() {
  if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
    // Reset data to defaults
    settings = {
      reminderInterval: 60,
      dailyTarget: 2000,
      soundChoice: 'water-drop',
      volume: 0.7,
      notificationsEnabled: true,
      fullScreenPause: true,
      darkMode: false,
      colorTheme: 'blue',
      smartGoals: false,
      cloudSync: false
    };
    
    hydrationData = {
      todayIntake: 0,
      intakeHistory: [],
      activities: {}
    };
    
    streakData = {
      count: 0,
      lastDate: null
    };
    
    // Save to storage
    saveAllData();
    
    // Update UI
    updateUI();
    
    showToast('All data has been reset', 'info');
  }
}

// Save all data to storage
function saveAllData() {
  chrome.runtime.sendMessage({
    type: 'SET_DATA',
    settings: settings,
    hydrationData: hydrationData,
    streakData: streakData
  });
} 