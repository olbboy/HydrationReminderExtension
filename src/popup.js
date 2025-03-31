// Import CSS for Vite to compile with Tailwind
import './styles.css';

// DOM Elements - with error handling and logging
function getElement(id, required = true) {
  const element = document.getElementById(id);
  if (!element && required) {
    console.error(`Required element not found: ${id}`);
    showToast(`Missing UI element: ${id}`, 'error');
  }
  return element;
}

// Main Navigation
const dashboardTab = getElement('dashboard-tab');
const statsTab = getElement('stats-tab');
const insightsTab = getElement('insights-tab');
const settingsTab = getElement('settings-tab');

// Tab Content
const dashboardContent = getElement('dashboard-content');
const statsContent = getElement('stats-content');
const insightsContent = getElement('insights-content');
const settingsContent = getElement('settings-content');

// Water Bottle
const waterBottle = getElement('water-bottle');
const waterFill = getElement('water-fill');
const waterWave = getElement('water-wave', false);

// Progress and Stats
const progressFill = getElement('progress-fill');
const currentIntakeEl = getElement('current-intake');
const targetIntakeEl = getElement('target-intake');
const remainingIntakeEl = getElement('remaining-intake');
const drinkCountEl = getElement('drink-count');
const hydrationScoreEl = getElement('hydration-score');
const hydrationFeedbackEl = getElement('hydration-feedback');

// Date and Activity
const dateDisplayEl = getElement('date-display');
const streakCountEl = getElement('streak-count');
const activityLogEl = getElement('activity-log');

// Water Controls
const waterButtons = document.querySelectorAll('.water-btn');
const drinkTypeButtons = document.querySelectorAll('[data-drink-type]');
const customAmountBtn = getElement('custom-amount');
const customInputContainer = getElement('custom-input');
const customAmountInput = getElement('custom-amount-input');
const addCustomBtn = getElement('add-custom');
const cancelCustomBtn = getElement('cancel-custom');

// Settings Controls
const dailyTargetInput = getElement('daily-target');
const reminderIntervalSelect = getElement('reminder-interval');
const notificationsEnabledCheckbox = getElement('notifications-enabled');
const fullscreenPauseCheckbox = getElement('fullscreen-pause');
const soundToggleCheckbox = getElement('sound-toggle');
const soundSelectEl = getElement('sound-select');
const themeButtons = document.querySelectorAll('[data-theme]');

// Data Management
const saveSettingsBtn = getElement('save-settings');
const exportDataBtn = getElement('export-data', false);
const clearDataBtn = getElement('clear-data', false);

// Charts and Analytics
const chartContainer = getElement('chart-container', false);
const weeklyCompletionEl = getElement('weekly-completion', false);
const weeklyProgressCircleEl = getElement('weekly-progress-circle', false);
const weeklyAvgMlEl = getElement('weekly-avg-ml', false);
const weeklyAvgProgressEl = getElement('weekly-avg-progress', false);
const aiInsightEl = getElement('ai-insight', false);

// Toast
const toastContainer = getElement('toast-container');

// Constants with validation
const DEFAULT_SETTINGS = {
  dailyTarget: 2000,
  reminderInterval: 60,
  notifications: true,
  sound: true,
  soundChoice: 'water-drop',
  theme: 'light'
};

const DEFAULT_HYDRATION_DATA = {
  todayIntake: 0,
  dates: {},
  intakeHistory: []
};

const DEFAULT_STREAK_DATA = {
  count: 0,
  lastDate: null
};

// State variables with type safety
let settings = { ...DEFAULT_SETTINGS };
let hydrationData = { ...DEFAULT_HYDRATION_DATA };
let streakData = { ...DEFAULT_STREAK_DATA };
let activeTab = 'dashboard';

// Improved error handling utility
const ErrorHandler = {
  // Track error frequency to prevent spam
  errorLog: new Map(),
  
  // Clear old errors periodically
  cleanupInterval: setInterval(() => {
    const now = Date.now();
    ErrorHandler.errorLog.forEach((timestamp, key) => {
      if (now - timestamp > 5000) { // Clear after 5 seconds
        ErrorHandler.errorLog.delete(key);
      }
    });
  }, 5000),

  // Handle errors with rate limiting and grouping
  handle(error, context, showToastMessage = true) {
    const errorKey = `${context}-${error.message}`;
    const now = Date.now();
    
    // Check if this error was recently shown
    if (this.errorLog.has(errorKey)) {
      const lastShown = this.errorLog.get(errorKey);
      if (now - lastShown < 3000) { // Don't show same error within 3 seconds
        return;
      }
    }
    
    // Log error with context
    console.error(`Error in ${context}:`, error);
    
    // Update error log
    this.errorLog.set(errorKey, now);
    
    // Clear existing error toasts before showing a new one
    if (showToastMessage) {
      clearErrorToasts();
    }
    
    // Show user-friendly message if needed
    if (showToastMessage) {
      const friendlyMessage = this.getFriendlyMessage(error, context);
      showToast(friendlyMessage, 'error');
    }
    
    // Try to recover if possible
    this.attemptRecovery(error, context);
  },

  // Get user-friendly error message
  getFriendlyMessage(error, context) {
    // Default messages for common contexts
    const contextMessages = {
      'water-intake': 'Unable to add water intake. Please try a different amount.',
      'tab-switch': 'Tab switch interrupted. Please try again.',
      'settings-save': 'Settings could not be saved. Please check your inputs.',
      'data-load': 'Some data could not be loaded. Using cached values.',
      'ui-update': 'Display update delayed. Will retry automatically.'
    };
    
    // Return context-specific message or generic one
    return contextMessages[context] || error.message || 'Action could not be completed. Please try again.';
  },

  // Attempt to recover from error
  attemptRecovery(error, context) {
    switch (context) {
      case 'water-intake':
        // Reset water intake form
        if (customAmountInput) customAmountInput.value = '';
        if (customInputContainer) customInputContainer.classList.add('hidden');
        break;
        
      case 'tab-switch':
        // Reset tab state
        const defaultTab = document.querySelector('.tab-trigger')?.dataset.tab;
        if (defaultTab) {
          updateTabStates(
            document.querySelectorAll('.tab-trigger'),
            document.querySelectorAll('[data-tab-content]'),
            defaultTab
          );
        }
        break;
        
      case 'settings-save':
        // Revert to last known good settings
        loadData();
        break;
        
      case 'ui-update':
        // Queue a delayed UI update
        setTimeout(updateUI, 1000);
        break;
    }
  }
};

// === DOM Content Loaded ===
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Application starting...');
    
    // Check DOM elements and log errors
    checkDOMElements();
    
    // Display startup notification
    showToast('Loading data...', 'info');
    
    // Display current date 
    displayCurrentDate();
    
    // Load data with error handling
    loadData();
    
    // Initialize UI components
    initializeUI();
  } catch (error) {
    console.error('Application startup error:', error);
    showToast('Error during startup. Please reload.', 'error');
    handleCriticalError(error);
  }
});

// Initialize UI components
function initializeUI() {
  try {
    // Setup tabs
    setupTabs();
    
    // Attach event listeners
    attachEventListeners();
    
    // Initialize water bottle
    initializeWaterBottle();
    
    // Initialize ripple effects
    initializeRippleEffects();
    
    // Apply current theme
    applyTheme();
    
    // Update UI with current data
    updateUI();
    
    console.log('UI initialized successfully');
  } catch (error) {
    console.error('UI initialization error:', error);
    showToast('Error initializing UI', 'error');
  }
}

// Handle critical errors
function handleCriticalError(error) {
  console.error('Critical error:', error);
  
  // Try to save current state
  try {
    saveData();
  } catch (saveError) {
    console.error('Could not save state during error recovery:', saveError);
  }
  
  // Show error UI
  const errorContainer = document.createElement('div');
  errorContainer.className = 'error-container';
  errorContainer.innerHTML = `
    <div class="error-message">
      <h2>An error occurred</h2>
      <p>${error.message}</p>
      <button onclick="location.reload()">Reload App</button>
    </div>
  `;
  
  document.body.appendChild(errorContainer);
}

// Kiểm tra các phần tử DOM quan trọng và ghi log cảnh báo
function checkDOMElements() {
  console.log('Checking critical DOM elements...');
  
  const criticalElements = [
    { id: 'dashboard-tab', name: 'Dashboard Tab' },
    { id: 'settings-tab', name: 'Settings Tab' },
    { id: 'stats-tab', name: 'Stats Tab' },
    { id: 'dashboard-content', name: 'Dashboard Content' },
    { id: 'water-bottle', name: 'Water Bottle' },
    { id: 'water-fill', name: 'Water Fill' },
    { id: 'progress-fill', name: 'Progress Fill' },
    { id: 'current-intake', name: 'Current Intake' },
    { id: 'target-intake', name: 'Target Intake' }
  ];
  
  let missingElements = [];
  
  criticalElements.forEach(element => {
    const el = document.getElementById(element.id);
    if (!el) {
      console.warn(`⚠️ Critical element not found: ${element.name} (ID: ${element.id})`);
      missingElements.push(element.name);
    }
  });
  
  if (missingElements.length > 0) {
    console.error(`⛔ ${missingElements.length} critical elements not found:`, missingElements);
    showToast(`Some critical UI elements are missing. The app may not function correctly.`, 'error');
  } else {
    console.log('✅ All critical elements found');
  }
}

// Add data validation
function validateSettings(settings) {
  const validatedSettings = { ...DEFAULT_SETTINGS };
  
  if (typeof settings.dailyTarget === 'number' && settings.dailyTarget > 0) {
    validatedSettings.dailyTarget = Math.min(Math.max(settings.dailyTarget, 500), 5000);
  }
  
  if (typeof settings.reminderInterval === 'number') {
    validatedSettings.reminderInterval = Math.min(Math.max(settings.reminderInterval, 15), 240);
  }
  
  validatedSettings.notifications = Boolean(settings.notifications);
  validatedSettings.sound = Boolean(settings.sound);
  validatedSettings.theme = ['light', 'dark'].includes(settings.theme) ? settings.theme : 'light';
  validatedSettings.soundChoice = ['water-drop', 'bell', 'chime'].includes(settings.soundChoice) 
    ? settings.soundChoice 
    : 'water-drop';
  
  return validatedSettings;
}

// Add data sanitization
function sanitizeHydrationData(data) {
  const sanitized = { ...DEFAULT_HYDRATION_DATA };
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Validate and sanitize dates
    if (data.dates && typeof data.dates === 'object') {
      sanitized.dates = {};
      Object.entries(data.dates).forEach(([date, dayData]) => {
        if (isValidDateString(date)) {
          sanitized.dates[date] = {
            activities: Array.isArray(dayData.activities) 
              ? dayData.activities
                .filter(activity => isValidActivity(activity))
                .map(sanitizeActivity)
              : [],
            totalIntake: typeof dayData.totalIntake === 'number' && dayData.totalIntake >= 0
              ? dayData.totalIntake
              : 0
          };
        }
      });
    }
    
    // Ensure today's data exists
    if (!sanitized.dates[today]) {
      sanitized.dates[today] = {
        activities: [],
        totalIntake: 0
      };
    }
    
    // Validate and sanitize intake history
    if (Array.isArray(data.intakeHistory)) {
      sanitized.intakeHistory = data.intakeHistory
        .filter(entry => isValidHistoryEntry(entry))
        .map(entry => ({
          date: entry.date,
          intake: typeof entry.intake === 'number' ? Math.max(0, entry.intake) : 0
        }));
    }
    
    // Set today's intake
    sanitized.todayIntake = sanitized.dates[today]?.totalIntake || 0;
    
  } catch (error) {
    console.error('Error sanitizing hydration data:', error);
    // Return default data if sanitization fails
    return { ...DEFAULT_HYDRATION_DATA };
  }
  
  return sanitized;
}

// Validation helpers
function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
}

function isValidActivity(activity) {
  return activity 
    && typeof activity.amount === 'number' 
    && activity.amount > 0
    && typeof activity.time === 'string'
    && activity.time.match(/^\d{2}:\d{2}$/);
}

function sanitizeActivity(activity) {
  return {
    amount: Math.max(0, parseInt(activity.amount) || 0),
    time: activity.time,
    type: ['water', 'coffee', 'tea'].includes(activity.type) ? activity.type : 'water'
  };
}

function isValidHistoryEntry(entry) {
  return entry 
    && typeof entry.date === 'string' 
    && isValidDateString(entry.date)
    && typeof entry.intake === 'number'
    && entry.intake >= 0;
}

// Update loadData function to use validation
function loadData() {
  console.log('Loading data from storage...');
  
  try {
    chrome.storage.local.get(['settings', 'hydrationData', 'streakData'], (result) => {
      try {
        if (chrome.runtime.lastError) {
          throw new Error(`Chrome storage error: ${chrome.runtime.lastError.message}`);
        }
        
        // Validate and sanitize settings
        settings = validateSettings(result.settings || {});
        
        // Validate and sanitize hydration data
        hydrationData = sanitizeHydrationData(result.hydrationData || {});
        
        // Validate streak data
        streakData = validateStreakData(result.streakData || {});
        
        // Update UI with validated data
        updateUI();
        setupTabs();
        attachEventListeners();
        
        console.log('Data loaded and validated successfully');
        showToast('Ready to track your hydration!', 'success');
        
      } catch (error) {
        console.error('Error processing loaded data:', error);
        showToast('Error loading data. Using default values.', 'error');
        
        // Use default values
        settings = { ...DEFAULT_SETTINGS };
        hydrationData = { ...DEFAULT_HYDRATION_DATA };
        streakData = { ...DEFAULT_STREAK_DATA };
        
        // Still try to update UI with default values
        updateUI();
        setupTabs();
        attachEventListeners();
      }
    });
  } catch (error) {
    console.error('Critical error accessing storage:', error);
    showToast('Cannot access storage. Using temporary data.', 'error');
    
    // Use default values
    settings = { ...DEFAULT_SETTINGS };
    hydrationData = { ...DEFAULT_HYDRATION_DATA };
    streakData = { ...DEFAULT_STREAK_DATA };
    
    // Still try to update UI with default values
    updateUI();
    setupTabs();
    attachEventListeners();
  }
}

// Add performance optimization for animations
const animationFrame = {
  id: null,
  clear() {
    if (this.id) {
      cancelAnimationFrame(this.id);
      this.id = null;
    }
  }
};

// Optimize water fill animation
function animateWaterFill(fromPercent, toPercent) {
  if (!waterFill) return;
  
  // Clear any existing animation
  animationFrame.clear();
  
  const duration = 500; // ms
  const startTime = performance.now();
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Use easeOutQuad for smooth animation
    const easing = 1 - (1 - progress) * (1 - progress);
    const currentPercent = fromPercent + (toPercent - fromPercent) * easing;
    
    waterFill.style.height = `${currentPercent}%`;
    
    if (progress < 1) {
      animationFrame.id = requestAnimationFrame(animate);
    }
  }
  
  animationFrame.id = requestAnimationFrame(animate);
}

// Add debounced save function
const debouncedSave = debounce(() => {
  saveData();
}, 1000);

// Add a flag to track successful water intake to prevent error messages
let lastWaterIntakeSuccessful = false;
// Add a flag to explicitly track custom amount actions
let isExplicitCustomAmountAction = false;

// Improved addWaterIntake function with better error handling
function addWaterIntake(amount, drinkType = 'water') {
  try {
    // Clear any previous error toasts before starting
    clearErrorToasts();
    
    // Input validation - directly use the number if it's already a number and valid
    const isNumeric = typeof amount === 'number' && !isNaN(amount);
    const validatedAmount = isNumeric && amount > 0 && amount <= 2000 
      ? amount 
      : validateWaterAmount(amount);
    
    const validatedType = validateDrinkType(drinkType);
    
    if (!validatedAmount) {
      lastWaterIntakeSuccessful = false;
      throw new Error('Invalid water amount');
    }
    
    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].slice(0, 5);
    
    // Initialize today's data if needed
    ensureTodayData(today);
    
    // Calculate new intake
    const currentIntake = hydrationData.dates[today].totalIntake || 0;
    const newIntake = currentIntake + validatedAmount;
    
    // Update data structures
    updateHydrationData(today, time, validatedAmount, validatedType, newIntake);
    
    // Animate UI changes
    requestAnimationFrame(() => {
      animateWaterChanges(currentIntake, newIntake);
    });
    
    // Play sound if enabled
    if (settings.sound) {
      playDropSound().catch(() => {/* Ignore sound errors */});
    }
    
    // Update UI and save data
    requestAnimationFrame(() => {
      updateUIAfterIntake();
      debouncedSave();
    });
    
    // Set success flag BEFORE showing toast
    lastWaterIntakeSuccessful = true;
    
    // Show success message
    showToast(`Added ${validatedAmount}ml ${getDrinkTypeName(validatedType)}!`, 'success');
    
    // Reset any custom amount action flags since we had a successful addition
    isExplicitCustomAmountAction = false;
    
    return true; // Success indicator
  } catch (error) {
    lastWaterIntakeSuccessful = false;
    ErrorHandler.handle(error, 'water-intake');
    return false; // Failure indicator
  }
}

// Validate water amount
function validateWaterAmount(amount) {
  // Convert to proper number for validation
  let valueToValidate;
  
  // If it's already a number, use it directly
  if (typeof amount === 'number' && !isNaN(amount)) {
    valueToValidate = amount;
  } 
  // If it's a string, parse it
  else if (typeof amount === 'string') {
    // Remove any non-numeric characters first
    const cleanedInput = amount.trim().replace(/[^0-9]/g, '');
    valueToValidate = parseInt(cleanedInput, 10);
  } 
  // Otherwise, treat as invalid
  else {
    console.log('Invalid amount: not a number or string');
    return null;
  }
  
  // Check for valid range
  if (isNaN(valueToValidate)) {
    console.log('Invalid amount: parsed to NaN');
    return null;
  }
  
  if (valueToValidate <= 0) {
    console.log(`Invalid amount: ${valueToValidate} <= 0`);
    return null;
  }
  
  if (valueToValidate > 2000) {
    console.log(`Invalid amount: ${valueToValidate} > 2000`);
    return null;
  }
  
  // Valid amount
  console.log(`Validated amount: ${valueToValidate}`);
  return valueToValidate;
}

// Validate drink type
function validateDrinkType(type) {
  const validTypes = ['water', 'coffee', 'tea'];
  return validTypes.includes(type) ? type : 'water';
}

// Ensure today's data exists
function ensureTodayData(today) {
  if (!hydrationData.dates) {
    hydrationData.dates = {};
  }
  
  if (!hydrationData.dates[today]) {
    hydrationData.dates[today] = {
      activities: [],
      totalIntake: 0
    };
  }
}

// Update hydration data structures
function updateHydrationData(today, time, amount, type, newTotal) {
  // Add activity
  hydrationData.dates[today].activities.push({
    time,
    amount,
    type
  });
  
  // Update totals
  hydrationData.dates[today].totalIntake = newTotal;
  hydrationData.todayIntake = newTotal;
  
  // Update streak
  updateStreak(today);
}

// Animate water changes
function animateWaterChanges(currentIntake, newIntake) {
  const currentPercentage = (currentIntake / settings.dailyTarget) * 100;
  const newPercentage = (newIntake / settings.dailyTarget) * 100;
  
  // Animate water bottle fill
  if (waterFill) {
    animateWaterFill(currentPercentage, newPercentage);
  }
  
  // Animate progress bar
  if (progressFill) {
    progressFill.style.width = `${newPercentage}%`;
  }
}

// Update UI after intake
function updateUIAfterIntake() {
  // Update intake display
  if (currentIntakeEl) {
    currentIntakeEl.textContent = hydrationData.todayIntake;
  }
  
  // Update remaining amount
  const remaining = Math.max(settings.dailyTarget - hydrationData.todayIntake, 0);
  if (remainingIntakeEl) {
    remainingIntakeEl.textContent = remaining;
  }
  
  // Update drink count
  const today = new Date().toISOString().split('T')[0];
  const drinkCount = hydrationData.dates[today]?.activities.length || 0;
  if (drinkCountEl) {
    drinkCountEl.textContent = drinkCount;
  }
  
  // Update hydration score
  const percentage = (hydrationData.todayIntake / settings.dailyTarget) * 100;
  const score = Math.min(Math.round(percentage), 100);
  if (hydrationScoreEl) {
    hydrationScoreEl.textContent = score;
  }
  
  // Update feedback message
  updateHydrationFeedback(percentage);
  
  // Update activity log
  updateActivityLog();
}

// Handle water intake errors
function handleWaterIntakeError(error) {
  // Log error details
  console.error('Water intake error details:', {
    error,
    currentState: {
      todayIntake: hydrationData.todayIntake,
      settings: { ...settings },
      date: new Date().toISOString()
    }
  });
  
  // Try to repair data
  repairDataInconsistencies();
  
  // Update UI to ensure consistency
  updateUI();
}

// Attach water button events with improved error handling
function attachWaterButtonEvents() {
  const buttons = document.querySelectorAll('.water-btn');
  if (!buttons.length) {
    console.warn('No water buttons found');
    return;
  }
  
  buttons.forEach(button => {
    // Remove existing listeners
    const newButton = button.cloneNode(true);
    button.parentNode?.replaceChild(newButton, button);
    
    // Add new listener
    newButton.addEventListener('click', (event) => {
      event.preventDefault();
      
      try {
        // Clear any previous error toasts
        clearErrorToasts();
        
        // Get amount from button
        const amount = parseInt(newButton.dataset.amount, 10);
        if (!amount) {
          throw new Error('Invalid amount on button');
        }
        
        // Get current drink type using the same selector as in handleCustomAmount
        const activeType = document.querySelector('[data-drink-type].active');
        const drinkType = activeType?.dataset.drinkType || 'water';
        
        console.log(`Adding ${amount}ml of ${drinkType}`); // Debug log
        
        // Set flag before adding water
        lastWaterIntakeSuccessful = true;
        
        // Add water - pass the amount directly as a number to avoid validation issues
        // Add water - pass the amount directly as a number to avoid validation issues
        addWaterIntake(amount, drinkType);
        
      } catch (error) {
        console.error('Error handling water button click:', error);
        showToast('Failed to add water. Please try again.', 'error');
      }
    });
  });
}

// Improved UI update function
function updateUI() {
  try {
    requestAnimationFrame(() => {
      // Update progress display
      if (currentIntakeEl) currentIntakeEl.textContent = hydrationData.todayIntake || 0;
      if (targetIntakeEl) targetIntakeEl.textContent = settings.dailyTarget || 2000;
      
      const progressPercentage = calculateProgressPercentage();
      
      // Batch DOM updates
      requestAnimationFrame(() => {
        if (progressFill) progressFill.style.width = `${progressPercentage}%`;
        if (waterFill) {
          waterFill.style.height = `${progressPercentage}%`;
          waterFill.style.transition = 'height 0.5s ease-out';
        }
        
        // Update remaining UI elements
        updateRemainingUI();
      });
    });
  } catch (error) {
    ErrorHandler.handle(error, 'ui-update', false); // Don't show toast for UI updates
  }
}

// Helper function to update remaining UI elements
function updateRemainingUI() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Update hydration details
    const remainingAmount = Math.max(settings.dailyTarget - hydrationData.todayIntake, 0);
    if (remainingIntakeEl) remainingIntakeEl.textContent = remainingAmount;
    
    const todayActivities = hydrationData.dates[today]?.activities || [];
    if (drinkCountEl) drinkCountEl.textContent = todayActivities.length;
    
    const progressPercentage = (hydrationData.todayIntake / settings.dailyTarget) * 100;
    const hydrationScore = Math.min(Math.round(progressPercentage), 100);
    if (hydrationScoreEl) hydrationScoreEl.textContent = hydrationScore;
    
    // Update feedback and other UI elements
    updateHydrationFeedback(progressPercentage);
    if (streakCountEl) streakCountEl.textContent = streakData.count || 0;
    
    // Update settings and activity log in next frame
    requestAnimationFrame(() => {
      updateSettingsUI();
      updateActivityLog();
      updateInsights();
      applyTheme();
    });
    
  } catch (error) {
    ErrorHandler.handle(error, 'ui-update-remaining', false);
  }
}

// Update settings UI
function updateSettingsUI() {
  if (reminderIntervalSelect) reminderIntervalSelect.value = settings.reminderInterval || 60;
  if (dailyTargetInput) dailyTargetInput.value = settings.dailyTarget || 2000;
  if (soundSelectEl) soundSelectEl.value = settings.soundChoice || 'water-drop';
  if (volumeSlider) volumeSlider.value = settings.volume !== undefined ? settings.volume : 0.7;
  
  // Update checkboxes - we need to update both the checkbox and its UI representation
  if (notificationsEnabledCheckbox) setCheckboxState(notificationsEnabledCheckbox, settings.notificationsEnabled);
  if (fullscreenPauseCheckbox) setCheckboxState(fullscreenPauseCheckbox, settings.fullScreenPause);
  
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
  
  // Set color theme if defined
  if (settings.colorTheme) {
    const themeButtons = document.querySelectorAll('[data-theme]');
    if (themeButtons.length > 0) {
      themeButtons.forEach(btn => btn.removeAttribute('data-active'));
      const activeThemeBtn = document.querySelector(`[data-theme="${settings.colorTheme}"]`);
      if (activeThemeBtn) {
        activeThemeBtn.setAttribute('data-active', 'true');
      }
    }
  }
}

// Helper to set checkbox state
function setCheckboxState(checkbox, state) {
  if (!checkbox) return;
  
  checkbox.checked = state;
  
  // Find the next sibling element that contains the indicator
  const indicator = checkbox.nextElementSibling?.querySelector('[data-checked]');
  if (indicator) {
    if (state) {
      indicator.dataset.checked = 'true';
      indicator.classList.add('translate-x-4');
      indicator.classList.remove('translate-x-0.5');
    } else {
      delete indicator.dataset.checked;
      indicator.classList.remove('translate-x-4');
      indicator.classList.add('translate-x-0.5');
    }
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
  if (!activityLogEl) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check if we have data for today
  const activities = hydrationData.dates[today]?.activities || [];
  if (activities.length === 0) {
    activityLogEl.innerHTML = '<div class="text-center text-muted-foreground">No activity yet today</div>';
    return;
  }
  
  // Clear and rebuild the log
  activityLogEl.innerHTML = '';
  
  // Get today's activities and sort by time (descending)
  const todaysActivities = [...activities].sort((a, b) => {
    // Chuyển định dạng time về timestamp để so sánh
    const timeA = a.time.split(':').map(Number);
    const timeB = b.time.split(':').map(Number);
    return (timeB[0] * 60 + timeB[1]) - (timeA[0] * 60 + timeA[1]);
  });
  
  // Display each activity
  todaysActivities.forEach(activity => {
    const timeStr = activity.time || '00:00';
    
    const entry = document.createElement('div');
    entry.className = 'flex justify-between items-center py-1 border-b border-border last:border-0';
    
    const typeIcon = getTypeIcon(activity.type || 'water');
    
    entry.innerHTML = `
      <span class="text-sm">${timeStr}</span>
      <div class="flex items-center">
        <span class="mr-1">${typeIcon}</span>
        <span class="font-medium text-primary">+${activity.amount} ml</span>
      </div>
    `;
    
    activityLogEl.appendChild(entry);
  });
}

// Get icon for drink type
function getTypeIcon(type) {
  const icons = {
    water: '💧',
    coffee: '☕',
    tea: '🍵',
    juice: '🧃',
    soda: '🥤'
  };
  return icons[type] || '💧';
}

// Update insights tab with improved chart
function updateInsights() {
  if (!chartContainer) return;
  
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
  
  // Update circular progress if elements exist
  if (weeklyCompletionEl && weeklyProgressCircleEl) {
    weeklyCompletionEl.textContent = `${weeklyCompletion}%`;
    const circumference = 2 * Math.PI * 40; // r = 40 from the SVG
    const offset = circumference - (weeklyCompletion / 100) * circumference;
    weeklyProgressCircleEl.style.strokeDasharray = `${circumference}`;
    weeklyProgressCircleEl.style.strokeDashoffset = `${offset}`;
  }
  
  // Update weekly average
  if (weeklyAvgMlEl) weeklyAvgMlEl.textContent = `${weeklyAvg} ml`;
  if (weeklyAvgProgressEl) weeklyAvgProgressEl.style.width = `${weeklyAvgPercentage}%`;
  
  // Calculate consistency (how many days user drank water)
  let daysWithWater = 0;
  for (let i = Math.max(0, history.length - 7); i < history.length; i++) {
    if (history[i].intake > 0) daysWithWater++;
  }
  
  const consistency = daysCount > 0 ? Math.round((daysWithWater / daysCount) * 100) : 0;
  if (consistencyPercentEl) consistencyPercentEl.textContent = `${consistency}%`;
  if (consistencyProgressEl) consistencyProgressEl.style.width = `${consistency}%`;
  
  // Estimate optimal timing based on activities
  let optimalTiming = calculateOptimalTiming();
  if (timingPercentEl) timingPercentEl.textContent = `${optimalTiming}%`;
  if (timingProgressEl) timingProgressEl.style.width = `${optimalTiming}%`;
  
  // Find best day
  let bestDayData = { date: 'N/A', intake: 0 };
  for (let i = Math.max(0, history.length - 7); i < history.length; i++) {
    if (history[i].intake > bestDayData.intake) {
      bestDayData = history[i];
    }
  }
  
  if (bestDayEl && bestDayData.date !== 'N/A') {
    const date = new Date(bestDayData.date);
    bestDayEl.textContent = date.toLocaleDateString('en-US', { weekday: 'short' });
    if (bestAmountEl) bestAmountEl.textContent = `${bestDayData.intake} ml`;
  } else if (bestDayEl) {
    bestDayEl.textContent = 'N/A';
    if (bestAmountEl) bestAmountEl.textContent = '0 ml';
  }
  
  // Store insights data for later use
  insightsData = {
    weeklyCompletion,
    weeklyAvgMl: weeklyAvg,
    consistency,
    optimalTiming,
    bestDay: bestDayEl ? bestDayEl.textContent : 'N/A',
    bestAmount: bestDayData.intake
  };
  
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
  
  // Update chart with improved labels and visualization
  generateInsightsChart(history);
}

// Calculate optimal timing for drinking water
function calculateOptimalTiming() {
  // Default value if we can't calculate
  let defaultValue = 70;
  
  // Get all activities from the past week
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toISOString().split('T')[0];
  
  let allActivities = [];
  
  // Gather activities from the past 7 days
  for (const date in hydrationData.dates) {
    if (date >= startDate) {
      const dayActivities = hydrationData.dates[date]?.activities || [];
      allActivities = [...allActivities, ...dayActivities.map(a => ({
        ...a,
        date
      }))];
    }
  }
  
  if (allActivities.length < 3) {
    return defaultValue; // Not enough data
  }
  
  // Analyze the timing of water intake
  const morningCount = allActivities.filter(a => {
    const hour = parseInt(a.time.split(':')[0], 10);
    return hour >= 6 && hour < 12;
  }).length;
  
  const afternoonCount = allActivities.filter(a => {
    const hour = parseInt(a.time.split(':')[0], 10);
    return hour >= 12 && hour < 18;
  }).length;
  
  const eveningCount = allActivities.filter(a => {
    const hour = parseInt(a.time.split(':')[0], 10);
    return hour >= 18 || hour < 6;
  }).length;
  
  // Check if the distribution is good: should have water throughout the day
  const total = morningCount + afternoonCount + eveningCount;
  const idealDistribution = total / 3;
  
  // Calculate how close we are to the ideal distribution
  const morningDev = Math.abs(morningCount - idealDistribution) / idealDistribution;
  const afternoonDev = Math.abs(afternoonCount - idealDistribution) / idealDistribution;
  const eveningDev = Math.abs(eveningCount - idealDistribution) / idealDistribution;
  
  const avgDeviation = (morningDev + afternoonDev + eveningDev) / 3;
  
  // Convert to a percentage (100% = perfect distribution)
  return Math.round(100 * (1 - avgDeviation));
}

// Generate a chart for the insights tab with improved display
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
  
  // Find max value for scaling (at least the daily target)
  const maxIntake = Math.max(...lastWeek.map(day => day.intake), settings.dailyTarget);
  const target = settings.dailyTarget || 2000;
  
  // Create bars for each day
  lastWeek.forEach(day => {
    const barHeight = day.intake > 0 ? (day.intake / maxIntake) * 100 : 0;
    const percentage = Math.min(barHeight, 100);
    const isToday = day.date === new Date().toISOString().split('T')[0];
    const isAtTarget = day.intake >= target;
    
    // Format date
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3);
    
    // Create bar container
    const barContainer = document.createElement('div');
    barContainer.className = 'flex flex-col items-center flex-1';
    
    // Container for the bar and target line
    const barWrapper = document.createElement('div');
    barWrapper.className = 'relative w-full h-[140px] flex flex-col justify-end';
    
    // Create target line for all days 
    const targetLine = document.createElement('div');
    targetLine.className = 'absolute w-full border-t border-dashed border-primary/50';
    targetLine.style.bottom = `${(target / maxIntake) * 100}%`;
    barWrapper.appendChild(targetLine);
    
    // Target line label (only on first bar)
    if (lastWeek.indexOf(day) === 0) {
      const targetLabel = document.createElement('div');
      targetLabel.className = 'absolute -left-12 text-xs text-muted-foreground';
      targetLabel.style.bottom = `${(target / maxIntake) * 100}%`;
      targetLabel.style.transform = 'translateY(50%)';
      targetLabel.textContent = 'Goal';
      barWrapper.appendChild(targetLabel);
    }
    
    // Create bar (with animation)
    const bar = document.createElement('div');
    bar.className = `w-full rounded-t-sm transition-all duration-700 ease-out ${
      isAtTarget ? 'bg-green-500' : isToday ? 'bg-primary' : 'bg-primary/60'
    }`;
    bar.style.height = '0%'; // Start at 0
    barWrapper.appendChild(bar);
    
    // Create label
    const label = document.createElement('div');
    label.className = `text-xs text-center ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'} mt-1`;
    label.textContent = dayName;
    
    // Value label
    const valueLabel = document.createElement('div');
    valueLabel.className = 'text-xs font-medium w-full text-center';
    valueLabel.textContent = day.intake > 0 ? `${day.intake}ml` : '-';
    
    // Assemble the bar
    barContainer.appendChild(barWrapper);
    barContainer.appendChild(label);
    barContainer.appendChild(valueLabel);
    chart.appendChild(barContainer);
    
    // Animate bar height after a small delay
    setTimeout(() => {
      bar.style.height = `${percentage}%`;
    }, 100 + lastWeek.indexOf(day) * 100); // Stagger animation
  });
  
  chartContainer.appendChild(chart);
}

// Improved tab switching
function setupTabs() {
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  const tabContents = document.querySelectorAll('[data-tab-content]');
  
  if (!tabTriggers.length || !tabContents.length) {
    ErrorHandler.handle(new Error('Tab elements missing'), 'tab-setup');
    return;
  }
  
  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      try {
        const targetTab = trigger.dataset.tab;
        if (!targetTab) {
          throw new Error('Invalid tab target');
        }
        
        // Update UI in animation frame
        requestAnimationFrame(() => {
          updateTabStates(tabTriggers, tabContents, targetTab);
          refreshTabContent(targetTab);
        });
        
      } catch (error) {
        ErrorHandler.handle(error, 'tab-switch');
      }
    });
  });
  
  // Initialize first tab
  try {
    const defaultTab = tabTriggers[0]?.dataset.tab;
    if (defaultTab) {
      requestAnimationFrame(() => {
        updateTabStates(tabTriggers, tabContents, defaultTab);
        refreshTabContent(defaultTab);
      });
    }
  } catch (error) {
    ErrorHandler.handle(error, 'tab-init');
  }
}

// Update tab states
function updateTabStates(triggers, contents, activeTab) {
  // Update triggers
  triggers.forEach(trigger => {
    if (trigger.dataset.tab === activeTab) {
      trigger.setAttribute('data-state', 'active');
      trigger.setAttribute('aria-selected', 'true');
    } else {
      trigger.removeAttribute('data-state');
      trigger.setAttribute('aria-selected', 'false');
    }
  });
  
  // Update content panels
  contents.forEach(content => {
    if (content.dataset.tabContent === activeTab) {
      content.classList.remove('hidden');
      content.setAttribute('data-state', 'active');
      content.setAttribute('aria-hidden', 'false');
    } else {
      content.classList.add('hidden');
      content.removeAttribute('data-state');
      content.setAttribute('aria-hidden', 'true');
    }
  });
}

// Refresh tab content
function refreshTabContent(tab) {
  switch (tab) {
    case 'dashboard':
      updateUI();
      break;
    case 'stats':
      updateStats();
      break;
    case 'insights':
      updateInsights();
      break;
    case 'settings':
      updateSettingsUI();
      break;
  }
}

// Attach event listeners with improved error handling
function attachEventListeners() {
  try {
    console.log('Attaching event listeners...');
    
    // Water controls
    attachWaterControls();
    
    // Settings controls
    attachSettingsControls();
    
    // Theme controls
    attachThemeControls();
    
    // Custom amount controls
    attachCustomAmountControls();
    
    console.log('Event listeners attached successfully');
    
  } catch (error) {
    console.error('Error attaching event listeners:', error);
    showToast('Error setting up controls', 'error');
    handleEventListenerError(error);
  }
}

// Attach water control events
function attachWaterControls() {
  // Water buttons
  attachWaterButtonEvents();
  
  // Drink type buttons
  attachDrinkTypeEvents();
}

// Attach settings control events
function attachSettingsControls() {
  if (!saveSettingsBtn) {
    console.warn('Settings button not found');
    return;
  }
  
  // Settings save
  saveSettingsBtn.addEventListener('click', (event) => {
    event.preventDefault();
    try {
      saveSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    }
  });
  
  // Input validation
  if (dailyTargetInput) {
    dailyTargetInput.addEventListener('input', validateDailyTarget);
  }
  
  if (reminderIntervalSelect) {
    reminderIntervalSelect.addEventListener('change', validateReminderInterval);
  }
}

// Attach theme control events
function attachThemeControls() {
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      try {
        const theme = btn.dataset.theme;
        if (!theme) return;
        
        settings.theme = theme;
        applyTheme();
        debouncedSave();
        
      } catch (error) {
        console.error('Error changing theme:', error);
        showToast('Failed to change theme', 'error');
      }
    });
  });
}

// Attach custom amount control events
function attachCustomAmountControls() {
  if (!customAmountBtn || !customInputContainer || !customAmountInput || !addCustomBtn || !cancelCustomBtn) {
    console.warn('Custom amount controls not found');
    return;
  }
  
  // Add data attributes to make identification more reliable
  addCustomBtn.setAttribute('data-action', 'add-custom-amount');
  customAmountInput.setAttribute('data-action', 'custom-amount-input');
  
  // Show custom input
  customAmountBtn.addEventListener('click', (event) => {
    event.preventDefault();
    
    // Reset the water intake success flag when opening custom input
    lastWaterIntakeSuccessful = false;
    
    // Clear any previous error toasts before showing input
    clearErrorToasts();
    
    // Update button text to reflect current drink type
    const activeType = document.querySelector('[data-drink-type].active');
    const drinkType = activeType?.dataset.drinkType || 'water';
    customAmountBtn.textContent = `Custom ${getDrinkTypeName(drinkType)}`;
    
    // Show input and focus
    customInputContainer.classList.remove('hidden');
    customAmountInput.value = '';
    customAmountInput.classList.remove('valid', 'invalid');
    customAmountInput.focus();
  });
  
  // Add custom amount
  addCustomBtn.addEventListener('click', (event) => {
    event.preventDefault();
    // Reset flag to ensure validation runs
    lastWaterIntakeSuccessful = false;
    // Set explicit custom amount action flag
    isExplicitCustomAmountAction = true;
    // Add class to identify this as a custom amount action
    addCustomBtn.classList.add('custom-amount-action');
    handleCustomAmount();
    // Remove the class after handling
    setTimeout(() => {
      addCustomBtn.classList.remove('custom-amount-action');
      isExplicitCustomAmountAction = false;
    }, 100);
  });
  
  // Cancel custom amount
  cancelCustomBtn.addEventListener('click', (event) => {
    event.preventDefault();
    hideCustomAmount();
  });
  
  // Input validation - force numeric values only
  customAmountInput.addEventListener('input', () => {
    // Reset success flag when user is editing input
    lastWaterIntakeSuccessful = false;
    
    // Remove non-numeric characters
    customAmountInput.value = customAmountInput.value.replace(/[^0-9]/g, '');
    
    // Add visual feedback
    if (customAmountInput.value) {
      const amount = parseInt(customAmountInput.value, 10);
      if (amount > 0 && amount <= 2000) {
        customAmountInput.classList.remove('invalid');
        customAmountInput.classList.add('valid');
      } else {
        customAmountInput.classList.remove('valid');
        customAmountInput.classList.add('invalid');
      }
    } else {
      customAmountInput.classList.remove('valid', 'invalid');
    }
  });
  
  // Handle enter key
  customAmountInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Reset flag to ensure validation runs
      lastWaterIntakeSuccessful = false;
      
      // Set explicit custom amount action flag
      isExplicitCustomAmountAction = true;
      
      // Set focus to the input itself to ensure it's detected as the active element
      customAmountInput.focus();
      
      // We don't need to add/remove the class since we now directly check for the element in handleCustomAmount
      handleCustomAmount();
      
      // Reset the flag after handling
      setTimeout(() => {
        isExplicitCustomAmountAction = false;
      }, 100);
    }
  });
}

// Handle custom amount submission with improved error handling
function handleCustomAmount() {
  try {
    // If the last water intake was successful and this is triggered
    // by the system (not user input), ignore validation
    if (lastWaterIntakeSuccessful) {
      console.log('Skipping validation due to successful water intake');
      lastWaterIntakeSuccessful = false;
      return;
    }
    
    // Clear any previous error toasts
    clearErrorToasts();
    
    // Get and validate the amount
    const inputValue = customAmountInput.value.trim();
    
    // If a drink was just added (detected by checking if custom input is now hidden),
    // don't show any errors - this prevents "Please enter an amount" errors after adding coffee/tea
    if (customInputContainer.classList.contains('hidden')) {
      console.log('Custom input is hidden, skipping validation');
      return;
    }
    
    // Debug the active element
    console.log('Active element in handleCustomAmount:', 
                document.activeElement.tagName,
                document.activeElement.id,
                document.activeElement.classList?.value || '');
    
    // Determine if this is an explicit custom amount action - use multiple reliable checks
    const isExplicitAction = isExplicitCustomAmountAction;
    const isAddButton = document.activeElement === addCustomBtn || 
                         document.activeElement.id === 'add-custom';
    const isInputField = document.activeElement === customAmountInput;
    const hasCustomClass = document.activeElement.classList?.contains('custom-amount-action');
    const hasDataAttr = document.activeElement.getAttribute('data-action') === 'add-custom-amount' ||
                        document.activeElement.getAttribute('data-action') === 'custom-amount-input';
    
    // Only consider it a custom amount action if one of these is true
    const isCustomAmountAction = isExplicitAction || isAddButton || isInputField || hasCustomClass || hasDataAttr;
    
    console.log('Custom amount action detection:', {
      isExplicitAction,
      isAddButton,
      isInputField,
      hasCustomClass,
      hasDataAttr,
      isCustomAmountAction
    });
    
    // If custom input field is visible, it's likely a custom amount action
    const isCustomInputShown = !customInputContainer.classList.contains('hidden');
    
    // If input is empty but not specifically trying to add a custom amount, ignore
    if (!inputValue && !isCustomAmountAction && !isCustomInputShown) {
      console.log('Empty input but not from custom amount action - ignoring');
      return;
    }
    
    // Only show the "please enter an amount" error if:
    // 1. The input is empty
    // 2. The user is actually trying to add a custom amount
    // 3. The custom input container is visible
    // 4. The last water intake was NOT successful
    if (!inputValue && isCustomAmountAction && isCustomInputShown && !lastWaterIntakeSuccessful) {
      showToast('Please enter an amount', 'error');
      return;
    }
    
    const amount = validateWaterAmount(inputValue);
    if (!amount) {
      showToast('Please enter a valid amount between 1 and 2000ml', 'error');
      return;
    }
    
    // Get active drink type - multiple fallback mechanisms
    let drinkType;
    
    // First check for active button
    const activeType = document.querySelector('[data-drink-type].active');
    if (activeType && activeType.dataset.drinkType) {
      drinkType = activeType.dataset.drinkType;
    } 
    // Then check the stored value in body dataset
    else if (document.body.dataset.currentDrinkType) {
      drinkType = document.body.dataset.currentDrinkType;
    } 
    // Default to water if all else fails
    else {
      drinkType = 'water';
    }
    
    console.log(`Adding custom amount: ${amount}ml of ${drinkType}`); // Debug log
    
    // Only hide input and clear value if addWaterIntake succeeds
    if (addWaterIntake(amount, drinkType)) {
      hideCustomAmount();
    }
    
  } catch (error) {
    console.error('Error adding custom amount:', error);
    showToast('Failed to add custom amount', 'error');
  }
}

// Hide custom amount input
function hideCustomAmount() {
  if (customInputContainer && customAmountInput) {
    customAmountInput.value = '';
    customInputContainer.classList.add('hidden');
  }
}

// Handle event listener errors
function handleEventListenerError(error) {
  // Log error details
  console.error('Event listener error details:', {
    error,
    currentState: {
      activeTab: document.querySelector('[data-state="active"]')?.dataset.tab,
      settings: { ...settings },
      date: new Date().toISOString()
    }
  });
  
  // Try to repair UI state
  try {
    // Reset tab state
    const defaultTab = document.querySelector('.tab-trigger')?.dataset.tab;
    if (defaultTab) {
      updateTabStates(
        document.querySelectorAll('.tab-trigger'),
        document.querySelectorAll('[data-tab-content]'),
        defaultTab
      );
    }
    
    // Hide any open modals or overlays
    hideCustomAmount();
    
    // Update UI
    updateUI();
    
  } catch (repairError) {
    console.error('Failed to repair UI state:', repairError);
    showToast('Please reload the application', 'error');
  }
}

// Initialize water bottle fill animation
function initializeWaterBottle() {
  console.log('Initializing water bottle');
  
  // Check for required elements
  const waterFill = document.getElementById('water-fill');
  if (!waterFill) {
    console.error('Water fill element not found');
    return;
  }
  
  // Add wave animation
  const waterWave = waterFill.querySelector('.water-wave');
  if (waterWave) {
    waterWave.style.animation = 'wave 3s infinite linear';
  } else {
    console.warn('Water wave element not found');
  }
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
  settings.soundChoice = soundSelectEl.value;
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
  // Make sure hydrationData has proper structure before saving
  ensureDataStructure();
  
  // Update today's data in intakeHistory
  updateTodayInHistory();
  
  // Save all data to Chrome storage
  chrome.storage.local.set({
    settings,
    hydrationData,
    streakData,
    apiKey,
    aiProvider
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving data:', chrome.runtime.lastError);
      showToast('Failed to save data', 'error');
    } else {
      console.log('Data saved successfully');
    }
  });
}

// Make sure data structure is consistent
function ensureDataStructure() {
  // Ensure hydrationData has all required properties
  if (!hydrationData.dates) hydrationData.dates = {};
  if (!hydrationData.intakeHistory) hydrationData.intakeHistory = [];
  
  // Ensure today's data exists
  const today = new Date().toISOString().split('T')[0];
  if (!hydrationData.dates[today]) {
    hydrationData.dates[today] = {
      activities: [],
      totalIntake: 0
    };
  }
  
  // Sync todayIntake with dates structure
  hydrationData.todayIntake = hydrationData.dates[today].totalIntake || 0;
  
  // Ensure streakData has required properties
  if (!streakData.currentStreak) streakData.currentStreak = 0;
  if (!streakData.longestStreak) streakData.longestStreak = 0;
  if (!streakData.lastActive) streakData.lastActive = today;
}

// Update today's intake in the history array
function updateTodayInHistory() {
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = hydrationData.intakeHistory.findIndex(entry => entry.date === today);
  
  if (todayIndex >= 0) {
    // Update existing entry
    hydrationData.intakeHistory[todayIndex].intake = hydrationData.todayIntake;
  } else {
    // Add new entry for today
    hydrationData.intakeHistory.push({
      date: today,
      intake: hydrationData.todayIntake
    });
  }
  
  // Sort history by date
  hydrationData.intakeHistory.sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
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
  try {
    const isDark = settings.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    
    // Update theme buttons
    themeButtons.forEach(btn => {
      const theme = btn.getAttribute('data-theme');
      btn.classList.toggle('active', theme === settings.theme);
    });
  } catch (error) {
    console.error('Error applying theme:', error);
  }
}

// Play water drop sound effect
function playDropSound() {
  return playSound(settings.soundChoice || 'water-drop', settings.volume !== undefined ? settings.volume : 0.7);
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
function showToast(message, type = 'info', duration = 3000) {
  try {
    // Prevent duplicate toasts within a short timeframe
    const toastKey = `${message}-${type}`;
    if (window.lastToasts && window.lastToasts[toastKey]) {
      const timeSince = Date.now() - window.lastToasts[toastKey];
      if (timeSince < 3000) {
        // Don't show duplicate toast within 3 seconds
        console.log(`Prevented duplicate toast: ${message}`);
        return;
      }
    }
    
    // Track this toast
    if (!window.lastToasts) window.lastToasts = {};
    window.lastToasts[toastKey] = Date.now();
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Get container
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      console.error('Toast container not found');
      return;
    }
    
    // Special handling for success messages - remove all error messages
    if (type === 'success') {
      // Remove any error toasts since we have a success
      const errorToasts = toastContainer.querySelectorAll('.toast-error');
      errorToasts.forEach(errorToast => {
        errorToast.remove();
      });
    }
    
    // Special handling for error messages - don't show if a success message is active
    if (type === 'error') {
      // Check if a success message is present
      const successToasts = toastContainer.querySelectorAll('.toast-success');
      if (successToasts.length > 0) {
        // If the last water intake was successful, don't show this error
        if (lastWaterIntakeSuccessful) {
          console.log('Suppressing error toast due to successful water intake');
          return;
        }
      }
    }
    
    // Remove existing toasts with the same message if any
    const existingToasts = toastContainer.querySelectorAll('.toast');
    existingToasts.forEach(existingToast => {
      if (existingToast.textContent === message) {
        existingToast.remove();
      }
    });
    
    // Maximum number of toasts to display at once
    const maxToasts = 2;
    
    // If we already have too many toasts, remove the oldest one
    const currentToasts = toastContainer.querySelectorAll('.toast');
    if (currentToasts.length >= maxToasts) {
      toastContainer.removeChild(currentToasts[0]);
    }
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Remove after timeout
    setTimeout(() => {
      if (toast.classList) {
        toast.classList.remove('show');
      }
      
      setTimeout(() => {
        if (toast.parentNode === toastContainer) {
          toastContainer.removeChild(toast);
        }
      }, 300);
    }, duration);
  } catch (error) {
    // Fallback to console if toast fails
    console.error('Error displaying toast:', error);
    console.log(`TOAST (${type}): ${message}`);
  }
}

// Function to check and repair data inconsistencies
function repairDataInconsistencies() {
  try {
    console.log('Checking and repairing data...');
    
    // Check if hydrationData exists
    if (!hydrationData) {
      console.warn('hydrationData does not exist, initializing new data');
      hydrationData = {...DEFAULT_HYDRATION_DATA};
    }
    
    // Check if dates exists
    if (!hydrationData.dates) {
      console.warn('hydrationData.dates does not exist, initializing new data');
      hydrationData.dates = {};
    }
    
    // Check if intakeHistory exists
    if (!hydrationData.intakeHistory) {
      console.warn('hydrationData.intakeHistory does not exist, initializing new data');
      hydrationData.intakeHistory = [];
    }
    
    // Check if settings exists
    if (!settings) {
      console.warn('settings does not exist, initializing new data');
      settings = {...DEFAULT_SETTINGS};
    }
    
    // Check if streakData exists
    if (!streakData) {
      console.warn('streakData does not exist, initializing new data');
      streakData = {...DEFAULT_STREAK_DATA};
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Ensure today's data exists
    if (!hydrationData.dates[today]) {
      console.warn(`Data for date ${today} does not exist, initializing new data`);
      hydrationData.dates[today] = {
        activities: [],
        totalIntake: 0
      };
    }
    
    // Ensure hydrationData.todayIntake is correct
    hydrationData.todayIntake = hydrationData.dates[today].totalIntake || 0;
    
    // Save repaired data
    saveData();
    
    console.log('Data repaired successfully');
    return true;
  } catch (error) {
    console.error('Error repairing data:', error);
    return false;
  }
}

// Emergency recovery function for critical errors
function emergencyRecovery() {
  try {
    console.log('Performing emergency recovery...');
    
    // 1. Reset all state variables to default values
    settings = {...DEFAULT_SETTINGS};
    hydrationData = {...DEFAULT_HYDRATION_DATA};
    streakData = {...DEFAULT_STREAK_DATA};
    
    // 2. Remove all event listeners by cloning nodes
    const cloneNodeAndReplace = (nodeId) => {
      const node = document.getElementById(nodeId);
      if (node && node.parentNode) {
        const clone = node.cloneNode(true);
        node.parentNode.replaceChild(clone, node);
      }
    };
    
    // Clone main nodes
    ['dashboard-tab', 'settings-tab', 'stats-tab', 'insights-tab'].forEach(cloneNodeAndReplace);
    
    // 3. Initialize today's data
    const today = new Date().toISOString().split('T')[0];
    hydrationData.dates[today] = {
      activities: [],
      totalIntake: 0
    };
    
    // 4. Save default state
    saveData();
    
    // 5. Try to update UI
    try {
      displayCurrentDate();
      updateUI();
      setupTabs();
      attachEventListeners();
    } catch (uiError) {
      console.error('Could not recover UI:', uiError);
    }
    
    showToast('Emergency recovery performed. Please reload.', 'warning');
    console.log('Emergency recovery completed.');
    
  } catch (error) {
    console.error('Could not perform emergency recovery:', error);
    
    // Display critical error message
    const errorMessage = document.createElement('div');
    errorMessage.style.position = 'fixed';
    errorMessage.style.top = '0';
    errorMessage.style.left = '0';
    errorMessage.style.width = '100%';
    errorMessage.style.padding = '20px';
    errorMessage.style.backgroundColor = 'red';
    errorMessage.style.color = 'white';
    errorMessage.style.textAlign = 'center';
    errorMessage.style.zIndex = '9999';
    errorMessage.innerHTML = 'A critical error has occurred. Please reload the application.';
    
    document.body.appendChild(errorMessage);
  }
}

// Add emergency recovery button to UI
function addEmergencyButton() {
  try {
    const emergencyBtn = document.createElement('button');
    emergencyBtn.id = 'emergency-recovery';
    emergencyBtn.className = 'fixed bottom-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded shadow';
    emergencyBtn.textContent = 'Recovery';
    emergencyBtn.title = 'Emergency recovery when app encounters errors';
    emergencyBtn.style.zIndex = '9999';
    
    emergencyBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (confirm('Are you sure you want to perform recovery? All unsaved data will be lost.')) {
        emergencyRecovery();
      }
    });
    
    document.body.appendChild(emergencyBtn);
  } catch (error) {
    console.error('Could not add emergency recovery button:', error);
  }
}

// Initialize ripple effects for buttons
function initializeRippleEffects() {
  document.querySelectorAll('.ripple').forEach(button => {
    button.addEventListener('click', function(e) {
      createRipple(this, e);
    });
  });
}

// Create ripple effect on button click
function createRipple(button, event) {
  if (!button || !event) return;
  
  try {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple-effect');
    
    // Remove old ripple effects
    const oldRipples = button.querySelectorAll('.ripple-effect');
    oldRipples.forEach(oldRipple => {
      if (oldRipple.parentNode === button) {
        button.removeChild(oldRipple);
      }
    });
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode === button) {
        button.removeChild(ripple);
      }
    }, 600); // Match the CSS animation duration
  } catch (error) {
    console.error('Error creating ripple effect:', error);
  }
}

// Display current date
function displayCurrentDate() {
  if (!dateDisplayEl) return;
  
  const today = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  dateDisplayEl.textContent = today.toLocaleDateString('en-US', options);
}

// Cải thiện hiệu năng bằng cách giới hạn số lần gọi hàm
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Phát hiện và xử lý khi trình duyệt bị đứng
class FreezeDetector {
  constructor() {
    this.lastTickTime = Date.now();
    this.frozen = false;
    this.freezeThreshold = 5000; // 5 seconds
    this.checkInterval = 1000; // Check every second
    this.intervalId = null;
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    this.listeners = [];
  }
  
  start() {
    if (this.intervalId) return;
    
    console.log('Starting app freeze detection');
    
    // Set first tick
    this.tick();
    
    // Start periodic checks
    this.intervalId = setInterval(() => this.checkFreeze(), this.checkInterval);
    
    // Add event listener to detect when tab is inactive
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Reset time when tab is visible again
        this.lastTickTime = Date.now();
        this.frozen = false;
      }
    });
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  tick() {
    this.lastTickTime = Date.now();
    
    if (this.frozen) {
      console.log('App is responsive again');
      this.frozen = false;
      this.recoveryAttempts = 0;
      this.notifyListeners(false);
    }
    
    // Schedule next tick while app is running
    requestAnimationFrame(() => this.tick());
  }
  
  checkFreeze() {
    const now = Date.now();
    const timeSinceLastTick = now - this.lastTickTime;
    
    if (timeSinceLastTick > this.freezeThreshold && !this.frozen) {
      this.frozen = true;
      this.recoveryAttempts++;
      console.warn(`Freeze detected! Time since last tick: ${timeSinceLastTick}ms`);
      this.notifyListeners(true);
      
      // Try automatic recovery
      if (this.recoveryAttempts <= this.maxRecoveryAttempts) {
        console.log(`Attempting auto-recovery (Attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`);
        this.attemptRecovery();
      } else {
        console.error('Exceeded maximum auto-recovery attempts');
        this.showFreezeOverlay();
      }
    }
  }
  
  attemptRecovery() {
    // Perform incremental recovery steps based on number of attempts
    try {
      if (this.recoveryAttempts === 1) {
        // First attempt: Try to repair data
        repairDataInconsistencies();
      } else if (this.recoveryAttempts === 2) {
        // Second attempt: Stop all animations and effects
        this.stopAllAnimations();
      } else {
        // Third attempt: Perform emergency recovery
        emergencyRecovery();
      }
    } catch (error) {
      console.error('Error during auto-recovery attempt:', error);
    }
  }
  
  stopAllAnimations() {
    try {
      // Stop all animations
      document.querySelectorAll('*').forEach(element => {
        if (element.style && element.style.animation) {
          element.style.animation = 'none';
        }
        if (element.style && element.style.transition) {
          element.style.transition = 'none';
        }
      });
      
      // Clear all timeouts and intervals
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }
      
      const highestIntervalId = setInterval(() => {}, 0);
      for (let i = 0; i < highestIntervalId; i++) {
        clearInterval(i);
      }
      
      console.log('Stopped all animations and timers');
    } catch (error) {
      console.error('Could not stop animations:', error);
    }
  }
  
  showFreezeOverlay() {
    try {
      // Create freeze notification overlay
      const overlay = document.createElement('div');
      overlay.className = 'app-frozen-overlay';
      overlay.innerHTML = `
        <h2>App has frozen</h2>
        <p>The application seems to be experiencing issues. Please try again.</p>
        <button id="manual-recovery">Manual Recovery</button>
      `;
      
      document.body.appendChild(overlay);
      
      // Attach event to recovery button
      document.getElementById('manual-recovery').addEventListener('click', () => {
        emergencyRecovery();
        if (overlay.parentNode === document.body) {
          document.body.removeChild(overlay);
        }
      });
    } catch (error) {
      console.error('Could not display overlay:', error);
    }
  }
  
  onFreeze(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
    return this;
  }
  
  notifyListeners(isFrozen) {
    this.listeners.forEach(listener => {
      try {
        listener(isFrozen);
      } catch (error) {
        console.error('Error calling listener:', error);
      }
    });
  }
}

// Khởi tạo bộ phát hiện đứng hình
const freezeDetector = new FreezeDetector();

// Add the window load event listener
window.addEventListener('load', () => {
  setTimeout(addEmergencyButton, 2000);
  
  // Add global error handling
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    showToast('An error occurred: ' + (event.error?.message || 'Unknown error'), 'error');
    
    // Try to handle error to keep app functioning
    if (event.error && event.error.message && (
      event.error.message.includes('undefined') || 
      event.error.message.includes('null') ||
      event.error.message.includes('not a function')
    )) {
      // Try to repair inconsistent data
      repairDataInconsistencies();
    }
    
    // Prevent default behavior
    event.preventDefault();
  });
  
  // Initialize freeze detector
  setTimeout(() => {
    // Start freeze detection
    freezeDetector.start();
    
    // Register callback
    freezeDetector.onFreeze(isFrozen => {
      if (isFrozen) {
        showToast('App performance issue detected', 'warning');
      } else {
        showToast('App is responsive again', 'success');
      }
    });
    
    console.log('Freeze detection started');
  }, 3000);
});

// Add missing calculateProgressPercentage function
function calculateProgressPercentage() {
  if (!settings || typeof settings.dailyTarget !== 'number' || settings.dailyTarget <= 0) {
    return 0;
  }
  
  const intake = hydrationData?.todayIntake || 0;
  const target = settings.dailyTarget;
  
  // Calculate percentage with boundary check
  const percentage = Math.min(Math.round((intake / target) * 100), 100);
  return Math.max(percentage, 0); // Ensure non-negative
}

// Validate and sanitize streak data
function validateStreakData(data) {
  const validated = { ...DEFAULT_STREAK_DATA };
  
  if (data && typeof data === 'object') {
    // Count should be a non-negative integer
    if (typeof data.count === 'number' && !isNaN(data.count) && data.count >= 0) {
      validated.count = Math.floor(data.count);
    }
    
    // Last date should be a valid date string
    if (typeof data.lastDate === 'string' && isValidDateString(data.lastDate)) {
      validated.lastDate = data.lastDate;
    }
  }
  
  return validated;
}

// Add getDrinkTypeName function
function getDrinkTypeName(type) {
  const drinkNames = {
    'water': 'water',
    'coffee': 'coffee',
    'tea': 'tea',
    'juice': 'juice',
    'soda': 'soda'
  };
  
  return drinkNames[type] || 'water';
}

// Add attachDrinkTypeEvents function
function attachDrinkTypeEvents() {
  const drinkTypeButtons = document.querySelectorAll('[data-drink-type]');
  
  if (!drinkTypeButtons || drinkTypeButtons.length === 0) {
    console.warn('No drink type buttons found');
    return;
  }
  
  // Store references to the new buttons for later use
  const newButtons = [];
  
  drinkTypeButtons.forEach(button => {
    // Remove existing listeners
    const newButton = button.cloneNode(true);
    if (button.parentNode) {
      button.parentNode.replaceChild(newButton, button);
    }
    
    // Add to our collection of new buttons
    newButtons.push(newButton);
    
    // Add new listener
    newButton.addEventListener('click', () => {
      try {
        // Remove active class from all buttons
        newButtons.forEach(btn => {
          if (btn && btn.classList) {
            btn.classList.remove('active');
          }
        });
        
        // Add active class to the clicked button
        newButton.classList.add('active');
        
        // Update custom amount button text
        const drinkType = newButton.dataset.drinkType || 'water';
        if (customAmountBtn) {
          customAmountBtn.textContent = `Custom ${getDrinkTypeName(drinkType)}`;
        }
        
        // Store the selected drink type in a data attribute for easier access
        document.body.dataset.currentDrinkType = drinkType;
        
        // Visual indicator to user
        showToast(`Switched to ${getDrinkTypeName(drinkType)}`, 'info', 1000);
      } catch (error) {
        ErrorHandler.handle(error, 'drink-type-selection');
      }
    });
  });
  
  // Make sure one button is active by default
  if (newButtons.length > 0) {
    // Check if any button is already active
    const activeButton = newButtons.find(btn => btn.classList.contains('active'));
    
    if (!activeButton) {
      // Set water as default if no button is active
      const waterButton = newButtons.find(btn => btn.dataset.drinkType === 'water');
      if (waterButton) {
        waterButton.classList.add('active');
        document.body.dataset.currentDrinkType = 'water';
      } else {
        // If no water button, just activate the first one
        newButtons[0].classList.add('active');
        document.body.dataset.currentDrinkType = newButtons[0].dataset.drinkType || 'water';
      }
    } else {
      // Store the current active type
      document.body.dataset.currentDrinkType = activeButton.dataset.drinkType || 'water';
    }
  }
}

// Add missing updateStats function
function updateStats() {
  try {
    // This function updates the statistics tab
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's data
    const todayData = hydrationData.dates[today] || { activities: [], totalIntake: 0 };
    
    // Calculate stats
    const totalActivities = todayData.activities.length;
    const averageIntake = totalActivities > 0 
      ? Math.round(todayData.totalIntake / totalActivities) 
      : 0;
    
    // Update UI elements if they exist
    if (document.getElementById('total-activities')) {
      document.getElementById('total-activities').textContent = totalActivities;
    }
    
    if (document.getElementById('average-intake')) {
      document.getElementById('average-intake').textContent = `${averageIntake} ml`;
    }
    
    if (document.getElementById('completion-percentage')) {
      const percentage = calculateProgressPercentage();
      document.getElementById('completion-percentage').textContent = `${percentage}%`;
    }
    
    // Calculate best time to drink water
    const timeDistribution = analyzeTimeDistribution(todayData.activities);
    if (document.getElementById('best-time')) {
      document.getElementById('best-time').textContent = timeDistribution.bestTime || 'N/A';
    }
    
    // Calculate drink type distribution
    updateDrinkTypeDistribution(todayData.activities);
    
  } catch (error) {
    ErrorHandler.handle(error, 'stats-update', false);
  }
}

// Helper for time distribution analysis
function analyzeTimeDistribution(activities) {
  if (!activities || activities.length === 0) {
    return { bestTime: 'N/A', distribution: {} };
  }
  
  // Group activities by hour
  const hourDistribution = {};
  
  activities.forEach(activity => {
    if (activity.time) {
      const hour = parseInt(activity.time.split(':')[0], 10);
      if (!isNaN(hour)) {
        hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
      }
    }
  });
  
  // Find the hour with the most activities
  let maxCount = 0;
  let bestHour = null;
  
  Object.entries(hourDistribution).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      bestHour = parseInt(hour, 10);
    }
  });
  
  // Format the best time
  let bestTime = 'N/A';
  if (bestHour !== null) {
    const period = bestHour >= 12 ? 'PM' : 'AM';
    const hour12 = bestHour % 12 || 12;
    bestTime = `${hour12} ${period}`;
  }
  
  return { bestTime, distribution: hourDistribution };
}

// Helper for drink type distribution
function updateDrinkTypeDistribution(activities) {
  if (!activities || activities.length === 0) {
    return;
  }
  
  // Group activities by drink type
  const typeDistribution = {};
  
  activities.forEach(activity => {
    const type = activity.type || 'water';
    typeDistribution[type] = (typeDistribution[type] || 0) + 1;
  });
  
  // Update UI if chart container exists
  const typeChartContainer = document.getElementById('drink-type-chart');
  if (!typeChartContainer) return;
  
  typeChartContainer.innerHTML = '';
  
  // Create a simple bar chart
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'flex items-end h-20 gap-2 mt-2';
  
  Object.entries(typeDistribution).forEach(([type, count]) => {
    const totalActivities = activities.length;
    const percentage = Math.round((count / totalActivities) * 100);
    
    const bar = document.createElement('div');
    bar.className = 'flex flex-col items-center';
    bar.innerHTML = `
      <div class="text-xs font-medium">${percentage}%</div>
      <div class="w-8 bg-primary rounded-t" style="height: ${percentage}%"></div>
      <div class="text-xs mt-1">${getDrinkTypeName(type)}</div>
    `;
    
    chartWrapper.appendChild(bar);
  });
  
  typeChartContainer.appendChild(chartWrapper);
}

// Fix: Add missing variables
let volumeSlider = document.getElementById('volume-slider');
let testSoundBtn = document.getElementById('test-sound');
let consistencyPercentEl = document.getElementById('consistency-percent');
let consistencyProgressEl = document.getElementById('consistency-progress');
let timingPercentEl = document.getElementById('timing-percent');
let timingProgressEl = document.getElementById('timing-progress');
let bestDayEl = document.getElementById('best-day');
let bestAmountEl = document.getElementById('best-amount');
let insightsData = {};
let apiKey = '';
let aiProvider = 'openai';

// Add a event listener for test sound button
function setupSoundControls() {
  if (testSoundBtn) {
    testSoundBtn.addEventListener('click', () => {
      try {
        // Get selected sound choice
        const selectedSound = soundSelectEl ? soundSelectEl.value : 'water-drop';
        const volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.7;
        
        // Play the selected sound
        playSound(selectedSound, volume);
        
        showToast(`Testing sound: ${selectedSound}`, 'info');
      } catch (error) {
        ErrorHandler.handle(error, 'sound-test');
      }
    });
  }
  
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      settings.volume = parseFloat(volumeSlider.value);
      debouncedSave();
    });
  }
}

// Play specified sound effect
function playSound(soundType, volume = 0.7) {
  const soundMap = {
    'water-drop': 'drop.mp3',
    'bell': 'bell.mp3',
    'chime': 'chime.mp3',
    'birds': 'birds.mp3',
    'stream': 'stream.mp3'
  };
  
  const soundFile = soundMap[soundType] || 'drop.mp3';
  const audio = new Audio(chrome.runtime.getURL(`audio/${soundFile}`));
  audio.volume = volume;
  
  return audio.play();
}

// Modify updateUI to avoid redundancy
function updateHydrationDisplay() {
  // Update intake value elements
  if (currentIntakeEl) currentIntakeEl.textContent = hydrationData.todayIntake || 0;
  if (targetIntakeEl) targetIntakeEl.textContent = settings.dailyTarget || 2000;
  
  // Calculate progress
  const progressPercentage = calculateProgressPercentage();
  
  // Update progress elements
  if (progressFill) progressFill.style.width = `${progressPercentage}%`;
  
  // Update water bottle visual
  if (waterFill) {
    waterFill.style.height = `${progressPercentage}%`;
    waterFill.style.transition = 'height 0.5s ease-out';
  }
}

// Attach all event listeners
function attachAllEventListeners() {
  try {
    console.log('Attaching all event listeners...');
    
    // Water controls
    attachWaterControls();
    
    // Settings controls
    attachSettingsControls();
    
    // Theme controls
    attachThemeControls();
    
    // Custom amount controls
    attachCustomAmountControls();
    
    // Sound controls
    setupSoundControls();
    
    // Data management buttons
    setupDataManagementButtons();
    
    console.log('All event listeners attached successfully');
  } catch (error) {
    ErrorHandler.handle(error, 'event-listeners');
  }
}

// Setup data management buttons
function setupDataManagementButtons() {
  // Export data button
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      try {
        exportData();
      } catch (error) {
        ErrorHandler.handle(error, 'data-export');
      }
    });
  }
  
  // Clear data button
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
      try {
        if (confirm('Are you sure you want to clear all your hydration data? This cannot be undone.')) {
          clearAllData();
        }
      } catch (error) {
        ErrorHandler.handle(error, 'data-clear');
      }
    });
  }
}

// Export data function
function exportData() {
  const dataToExport = {
    settings,
    hydrationData,
    streakData,
    exportDate: new Date().toISOString()
  };
  
  const jsonString = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `hydration-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  
  showToast('Data exported successfully!', 'success');
}

// Clear all data function
function clearAllData() {
  // Reset to defaults
  settings = { ...DEFAULT_SETTINGS };
  hydrationData = { ...DEFAULT_HYDRATION_DATA };
  streakData = { ...DEFAULT_STREAK_DATA };
  
  // Save to storage
  saveData();
  
  // Update UI
  updateUI();
  
  showToast('All data has been cleared', 'success');
}

// Validate daily target input
function validateDailyTarget() {
  if (!dailyTargetInput) return;
  
  const value = parseInt(dailyTargetInput.value, 10);
  
  if (isNaN(value) || value < 500) {
    dailyTargetInput.classList.add('invalid');
    return false;
  } else if (value > 5000) {
    dailyTargetInput.classList.add('invalid');
    return false;
  } else {
    dailyTargetInput.classList.remove('invalid');
    return true;
  }
}

// Validate reminder interval
function validateReminderInterval() {
  if (!reminderIntervalSelect) return;
  
  const value = parseInt(reminderIntervalSelect.value, 10);
  
  if (isNaN(value) || value < 15 || value > 240) {
    reminderIntervalSelect.classList.add('invalid');
    return false;
  } else {
    reminderIntervalSelect.classList.remove('invalid');
    return true;
  }
}

// Update attachEventListeners to use the new function
// All event listeners are attached in attachAllEventListeners function above
// All event listeners are attached in attachAllEventListeners function above

// Helper function to clear error toasts
function clearErrorToasts() {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;
  
  const errorToasts = toastContainer.querySelectorAll('.toast-error');
  errorToasts.forEach(toast => {
    toast.remove();
  });
}

