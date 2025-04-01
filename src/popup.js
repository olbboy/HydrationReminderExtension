// Import CSS for Vite to compile with Tailwind
import './styles.css';

// Tạo một phần tử style trong lúc chạy nếu CSS không được load
document.addEventListener('DOMContentLoaded', () => {
  // Kiểm tra xem CSS đã được load chưa
  const isCssLoaded = Array.from(document.styleSheets).some(sheet => 
    sheet.href && sheet.href.includes('popup.css')
  );
  
  // Nếu CSS chưa được load, inject một fallback style để đảm bảo giao diện hoạt động
  if (!isCssLoaded) {
    console.warn('CSS stylesheet not loaded, applying fallback styles');
    
    // Tạo một phần tử style mới
    const fallbackStyle = document.createElement('style');
    
    // Thêm các style cơ bản
    fallbackStyle.textContent = `
      :root {
        --primary-color: #3b82f6;
        --primary-dark: #2563eb;
        --success-color: #10b981;
        --warning-color: #f59e0b;
        --error-color: #ef4444;
        --text-color: #1f2937;
        --bg-color: #ffffff;
      }
      
      .dark {
        --primary-color: #60a5fa;
        --primary-dark: #3b82f6;
        --text-color: #f3f4f6;
        --bg-color: #1f2937;
      }
      
      body {
        font-family: 'Inter', sans-serif;
        background-color: var(--bg-color);
        color: var(--text-color);
        margin: 0;
        padding: 0;
        min-width: 350px;
        min-height: 400px;
        transition: all 0.3s ease;
      }
    `;
    
    // Thêm style vào head
    document.head.appendChild(fallbackStyle);
  }
});

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
    try {
      // Ensure error is an actual Error object
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const errorKey = `${context}-${errorObj.message}`;
      const now = Date.now();
      
      // Check if this error was recently shown
      if (this.errorLog.has(errorKey)) {
        const lastShown = this.errorLog.get(errorKey);
        if (now - lastShown < 3000) { // Don't show same error within 3 seconds
          return;
        }
      }
      
      // Log error with context
      console.error(`Error in ${context}:`, errorObj);
      
      // Update error log
      this.errorLog.set(errorKey, now);
      
      // Clear existing error toasts before showing a new one
      if (showToastMessage) {
        clearErrorToasts();
      }
      
      // Show user-friendly message if needed
      if (showToastMessage) {
        const friendlyMessage = this.getFriendlyMessage(errorObj, context);
        showToast(friendlyMessage, 'error');
      }
      
      // Try to recover if possible
      this.attemptRecovery(errorObj, context);
    } catch (handlerError) {
      // Prevent errors in the error handler from crashing the app
      console.error('Error in ErrorHandler:', handlerError);
      try {
        showToast('Application encountered an error', 'error');
      } catch (toastError) {
        console.error('Failed to show error toast:', toastError);
      }
    }
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

// === DOM Content Loaded with improved error handling ===
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Application starting...');
    
    // Set global error handler early
    window.addEventListener('error', (event) => {
      console.error('Uncaught error:', event.error);
      
      try {
        // Don't show toast during initialization
        if (window.appInitialized) {
          showToast('An error occurred: ' + (event.error?.message || 'Unknown error'), 'error');
        }
        
        // Try to handle error to keep app functioning
        if (event.error && event.error.message && (
          event.error.message.includes('undefined') || 
          event.error.message.includes('null') ||
          event.error.message.includes('not a function')
        )) {
          // Try to repair inconsistent data
          repairDataInconsistencies();
        }
      } catch (handlerError) {
        console.error('Error in global error handler:', handlerError);
      }
      
      // Prevent default behavior
      event.preventDefault();
    });
    
    // Setup unhandled rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      try {
        // Don't show toast during initialization
        if (window.appInitialized) {
          showToast('Background task error', 'error');
        }
      } catch (handlerError) {
        console.error('Error in promise rejection handler:', handlerError);
      }
      
      // Prevent default behavior
      event.preventDefault();
    });
    
    // Display startup notification
    showToast('Loading data...', 'info');
    
    // Load data with error handling - do this first to populate settings
    loadData();
    
    // Wait a moment to ensure DOM is fully loaded and data is available
    setTimeout(() => {
      try {
        // Check DOM elements and log errors
        checkDOMElements();
        
        // Display current date with error handling
        try {
          displayCurrentDate();
        } catch (dateError) {
          console.error('Date display error:', dateError);
          // Not critical, continue
        }
        
        // Initialize UI components with error handling
        try {
          initializeUI();
        } catch (uiError) {
          console.error('UI initialization error:', uiError);
          showToast('Some UI components could not be initialized', 'warning');
        }
        
        // Add emergency recovery button with delay and error handling
        setTimeout(() => {
          try {
            addEmergencyButton();
          } catch (emergencyError) {
            console.error('Emergency button error:', emergencyError);
            // Not critical, continue
          }
        }, 2000);
        
        // Set app as initialized
        window.appInitialized = true;
        
        // Clear loading notification
        setTimeout(() => {
          clearErrorToasts();
          showToast('Ready!', 'success', 1500);
        }, 500);
      } catch (error) {
        console.error('Initialization error:', error);
        showToast('Error during initialization', 'error');
      }
    }, 300); // Small delay to ensure DOM is ready
    
  } catch (error) {
    console.error('Critical startup error:', error);
    try {
      handleCriticalError(error);
    } catch (handlerError) {
      console.error('Handler failure:', handlerError);
      alert('Failed to initialize application. Please reload.');
    }
  }
});

// Initialize UI components
function initializeUI() {
  console.log('Initializing UI components...');
  
  try {
    // Apply theme based on settings
    applyTheme();
    
    // Initialize water bottle
    initializeWaterBottle();
    
    // Setup tab navigation
    setupTabs();
    
    // Add ripple effects to buttons
    initializeRippleEffects();
    
    // Attach event listeners safely, with retries if needed
    attachEventListenersWithRetry();
    
    // Initialize the freeze detector
    if (window.FreezeDetector) {
      const freezeDetector = new FreezeDetector();
      freezeDetector.start();
      freezeDetector.onFreeze(() => {
        console.warn('UI freeze detected, attempting recovery');
        freezeDetector.attemptRecovery();
      });
    }
    
    // Update UI with current data
    updateUI();
    
  } catch (error) {
    console.error('Error initializing UI:', error);
    showToast('Error setting up interface', 'error');
    throw error; // Re-throw to allow higher level error handling
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

// Enhanced loadData function with improved error recovery
function loadData() {
  console.log('Loading data from storage...');
  
  // Define fallback data
  const getDefaultData = () => {
    return {
      settings: { ...DEFAULT_SETTINGS },
      hydrationData: { ...DEFAULT_HYDRATION_DATA },
      streakData: { ...DEFAULT_STREAK_DATA }
    };
  };
  
  // Initialize with defaults in case of errors
  let fallbackUsed = false;
  
  // Function to apply default data
  const applyDefaultData = (errorContext) => {
    console.warn(`${errorContext} - Using default values`);
    fallbackUsed = true;
    
    // Use default values
    settings = { ...DEFAULT_SETTINGS };
    hydrationData = { ...DEFAULT_HYDRATION_DATA };
    streakData = { ...DEFAULT_STREAK_DATA };
    
    // Still try to update UI with default values
    try {
      updateUI();
      setupTabs();
      attachEventListeners();
    } catch (setupError) {
      console.error('Failed to setup UI with default data:', setupError);
    }
  };
  
  try {
    // Set a timeout to ensure we show UI even if Chrome storage hangs
    const storageTimeout = setTimeout(() => {
      if (!fallbackUsed) {
        console.warn('Storage access timeout - using default data');
        applyDefaultData('Storage timeout');
        showToast('Taking too long to load data. Using defaults.', 'warning');
      }
    }, 5000); // 5 second timeout
    
    chrome.storage.local.get(['settings', 'hydrationData', 'streakData'], (result) => {
      try {
        // Clear the timeout since we got a response
        clearTimeout(storageTimeout);
        
        // Check for Chrome runtime errors
        if (chrome.runtime.lastError) {
          const errorMessage = chrome.runtime.lastError.message || 'Unknown Chrome storage error';
          console.error(`Chrome storage error: ${errorMessage}`);
          applyDefaultData('Chrome storage error');
          showToast('Error loading your data. Using default values.', 'error');
          return;
        }
        
        // Check if the result is valid
        if (!result || typeof result !== 'object') {
          console.error('Invalid storage result:', result);
          applyDefaultData('Invalid storage data');
          showToast('Could not read stored data. Using defaults.', 'error');
          return;
        }
        
        // Process each data type individually to prevent one error from affecting all
        try {
          // Validate and sanitize settings
          settings = validateSettings(result.settings || {});
        } catch (settingsError) {
          console.error('Error processing settings:', settingsError);
          settings = { ...DEFAULT_SETTINGS };
        }
        
        try {
          // Validate and sanitize hydration data
          hydrationData = sanitizeHydrationData(result.hydrationData || {});
        } catch (hydrationError) {
          console.error('Error processing hydration data:', hydrationError);
          hydrationData = { ...DEFAULT_HYDRATION_DATA };
        }
        
        try {
          // Validate streak data
          streakData = validateStreakData(result.streakData || {});
        } catch (streakError) {
          console.error('Error processing streak data:', streakError);
          streakData = { ...DEFAULT_STREAK_DATA };
        }
        
        // Update UI with the data we have
        try {
          updateUI();
          setupTabs();
          attachEventListeners();
          
          console.log('Data loaded and validated successfully');
          showToast('Ready to track your hydration!', 'success');
        } catch (uiError) {
          console.error('Error updating UI with loaded data:', uiError);
          
          // Try to recover UI
          try {
            // Try minimal UI update
            if (currentIntakeEl) currentIntakeEl.textContent = hydrationData.todayIntake || 0;
            if (targetIntakeEl) targetIntakeEl.textContent = settings.dailyTarget || 2000;
          } catch (recoveryError) {
            console.error('UI recovery failed:', recoveryError);
          }
          
          showToast('Some display elements could not be updated.', 'warning');
        }
        
      } catch (processingError) {
        console.error('Error processing loaded data:', processingError);
        applyDefaultData('Data processing error');
        showToast('Error processing your data. Using defaults.', 'error');
      }
    });
  } catch (error) {
    console.error('Critical error accessing storage:', error);
    applyDefaultData('Storage access error');
    showToast('Cannot access storage. Using temporary data.', 'error');
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
    
    // Safety check for null or undefined amount
    if (amount === null || amount === undefined) {
      lastWaterIntakeSuccessful = false;
      throw new Error('Missing water amount');
    }
    
    // Input validation - directly use the number if it's already a number and valid
    const isNumeric = typeof amount === 'number' && !isNaN(amount);
    const validatedAmount = isNumeric && amount > 0 && amount <= 2000 
      ? amount 
      : validateWaterAmount(amount);
    
    // Safety check for drink type
    const validatedType = validateDrinkType(drinkType || 'water');
    
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
    
    // Ensure hydrationData has the proper structure
    if (!hydrationData.dates || typeof hydrationData.dates !== 'object') {
      hydrationData.dates = {};
    }
    
    // Extra safety check for the date entry
    if (!hydrationData.dates[today]) {
      hydrationData.dates[today] = {
        activities: [],
        totalIntake: 0
      };
    }
    
    // Calculate new intake
    const currentIntake = hydrationData.dates[today].totalIntake || 0;
    const newIntake = currentIntake + validatedAmount;
    
    // Update data structures
    updateHydrationData(today, time, validatedAmount, validatedType, newIntake);
    
    // Safely update UI with animation
    try {
      // Animate UI changes
      requestAnimationFrame(() => {
        try {
          animateWaterChanges(currentIntake, newIntake);
        } catch (animationError) {
          console.error('Animation error:', animationError);
          // Continue with UI updates even if animation fails
        }
        
        // Play sound if enabled
        if (settings.sound) {
          playDropSound().catch(soundError => {
            console.warn('Sound error:', soundError);
            // Ignore sound errors
          });
        }
        
        // Update UI and save data
        requestAnimationFrame(() => {
          try {
            updateUIAfterIntake();
            debouncedSave();
          } catch (uiError) {
            console.error('UI update error:', uiError);
            // Try fallback update if the main one fails
            try {
              updateUI();
            } catch (fallbackError) {
              console.error('Fallback UI update failed:', fallbackError);
            }
          }
        });
      });
    } catch (uiError) {
      console.error('UI update process error:', uiError);
      // Try direct UI update as fallback
      updateUI();
    }
    
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
    
    // Try to update the UI anyway to maintain consistency
    try {
      updateUI();
    } catch (uiError) {
      console.error('Failed to update UI after error:', uiError);
    }
    
    return false; // Failure indicator
  }
}

// Improved water amount validation with better error handling
function validateWaterAmount(amount) {
  try {
    // Handle null, undefined or empty values
    if (amount === null || amount === undefined) {
      console.log('Invalid amount: null or undefined');
      return null;
    }
    
    // Convert to proper number for validation
    let valueToValidate;
    
    // If it's already a number, use it directly
    if (typeof amount === 'number') {
      // Check for NaN, Infinity, -Infinity
      if (!isFinite(amount)) {
        console.log(`Invalid amount: ${amount} is not a finite number`);
        return null;
      }
      valueToValidate = amount;
    } 
    // If it's a string, parse it
    else if (typeof amount === 'string') {
      // Handle empty strings
      if (!amount.trim()) {
        console.log('Invalid amount: empty string');
        return null;
      }
      
      // Remove any non-numeric characters first
      const cleanedInput = amount.trim().replace(/[^0-9]/g, '');
      
      // Handle case where all characters were removed
      if (!cleanedInput) {
        console.log('Invalid amount: no numeric characters');
        return null;
      }
      
      valueToValidate = parseInt(cleanedInput, 10);
    } 
    // Otherwise, treat as invalid
    else {
      console.log(`Invalid amount: not a number or string (${typeof amount})`);
      return null;
    }
    
    // Check for parsing errors
    if (isNaN(valueToValidate)) {
      console.log('Invalid amount: parsed to NaN');
      return null;
    }
    
    // Check for negative or zero
    if (valueToValidate <= 0) {
      console.log(`Invalid amount: ${valueToValidate} <= 0`);
      return null;
    }
    
    // Check for too large values
    if (valueToValidate > 2000) {
      console.log(`Invalid amount: ${valueToValidate} > 2000`);
      return null;
    }
    
    // Valid amount
    console.log(`Validated amount: ${valueToValidate}`);
    return valueToValidate;
  } catch (error) {
    console.error('Error in validateWaterAmount:', error);
    return null; // Return null on any exception
  }
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

// Improved UI update function with error recovery
function updateUI() {
  try {
    // Ensure we safely update the UI with animation frame
    const safeUpdate = () => {
      try {
        // Safely update intake elements
        if (currentIntakeEl) {
          try {
            currentIntakeEl.textContent = hydrationData.todayIntake || 0;
          } catch (elementError) {
            console.warn('Failed to update current intake element:', elementError);
          }
        }
        
        if (targetIntakeEl) {
          try {
            targetIntakeEl.textContent = settings.dailyTarget || 2000;
          } catch (elementError) {
            console.warn('Failed to update target intake element:', elementError);
          }
        }
        
        // Calculate progress with bounds checking
        const progressPercentage = calculateProgressPercentage();
        
        // Batch DOM updates in another frame
        requestAnimationFrame(() => {
          try {
            // Safely update progress bar
            if (progressFill) {
              try {
                progressFill.style.width = `${progressPercentage}%`;
              } catch (progressError) {
                console.warn('Failed to update progress bar:', progressError);
              }
            }
            
            // Safely update water fill
            if (waterFill) {
              try {
                waterFill.style.height = `${progressPercentage}%`;
                waterFill.style.transition = 'height 0.5s ease-out';
              } catch (waterError) {
                console.warn('Failed to update water fill:', waterError);
              }
            }
            
            // Update remaining UI elements
            setTimeout(() => {
              try {
                updateRemainingUI();
              } catch (remainingError) {
                console.error('Failed to update remaining UI:', remainingError);
              }
            }, 50); // Small delay to spread out UI updates
          } catch (innerFrameError) {
            console.error('Error in inner animation frame:', innerFrameError);
          }
        });
      } catch (frameError) {
        console.error('Error in animation frame:', frameError);
      }
    };
    
    // Use requestAnimationFrame for UI updates
    requestAnimationFrame(safeUpdate);
  } catch (error) {
    ErrorHandler.handle(error, 'ui-update', false); // Don't show toast for UI updates
    
    // Attempt emergency UI update for critical elements
    try {
      // Critical elements: current intake and target
      if (currentIntakeEl) currentIntakeEl.textContent = hydrationData.todayIntake || 0;
      if (targetIntakeEl) targetIntakeEl.textContent = settings.dailyTarget || 2000;
      if (waterFill) waterFill.style.height = `${calculateProgressPercentage()}%`;
    } catch (emergencyError) {
      console.error('Emergency UI update failed:', emergencyError);
    }
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
  console.log('Updating settings UI...');
  
  // First load latest settings from storage to ensure we have the most recent data
  chrome.storage.local.get(['settings'], function(result) {
    // Only update if we got data back and this isn't a first-time load
    if (result.settings) {
      // Use storage values but don't override the current settings object completely
      console.log('Settings from storage:', result.settings);
      
      // Update our settings object with storage values
      Object.assign(settings, result.settings);
      console.log('Updated settings object:', settings);
    }
    
    // Now update UI with latest settings data
    if (reminderIntervalSelect) reminderIntervalSelect.value = settings.reminderInterval || 60;
    if (dailyTargetInput) dailyTargetInput.value = settings.dailyTarget || 2000;
    if (soundToggleCheckbox) setCheckboxState(soundToggleCheckbox, settings.sound !== false); // default to true
    if (soundSelectEl) soundSelectEl.value = settings.soundChoice || 'water-drop';
    if (volumeSlider) volumeSlider.value = settings.volume !== undefined ? settings.volume : 0.7;
    
    // Update checkboxes with proper fallbacks
    if (notificationsEnabledCheckbox) {
      const notificationsSetting = settings.notificationsEnabled !== undefined ? 
        settings.notificationsEnabled : 
        (settings.notifications !== undefined ? settings.notifications : true);
      setCheckboxState(notificationsEnabledCheckbox, notificationsSetting);
    }
    
    if (fullscreenPauseCheckbox) setCheckboxState(fullscreenPauseCheckbox, settings.fullScreenPause === true);
    
    // Update smart goals checkbox if it exists
    const smartGoalsCheckbox = document.getElementById('smart-goals');
    if (smartGoalsCheckbox) {
      setCheckboxState(smartGoalsCheckbox, settings.smartGoals === true);
    }
    
    // Update cloud sync checkbox if it exists
    const cloudSyncCheckbox = document.getElementById('cloud-sync');
    if (cloudSyncCheckbox) {
      setCheckboxState(cloudSyncCheckbox, settings.cloudSync === true);
    }
    
    // Set color theme if defined
    if (settings.theme) {
      const themeButtons = document.querySelectorAll('[data-theme]');
      themeButtons.forEach(btn => {
        if (btn.dataset.theme === settings.theme) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
    
    // Create or update test notification button
    addTestNotificationButton();
    
    console.log('Settings UI updated with current values');
  });
}

// Add test notification button to settings tab
function addTestNotificationButton() {
  // Check if settings form actions container exists
  const formActions = document.querySelector('.form-actions');
  if (!formActions) return;
  
  // Check if the button already exists to avoid duplicates
  let testNotificationBtn = document.getElementById('test-notification');
  
  if (!testNotificationBtn) {
    // Create the button if it doesn't exist
    testNotificationBtn = document.createElement('button');
    testNotificationBtn.id = 'test-notification';
    testNotificationBtn.className = 'btn-secondary ripple mr-2';
    testNotificationBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>
      Test Notification
    `;
    
    // Add event listener
    testNotificationBtn.addEventListener('click', function(event) {
      event.preventDefault();
      testNotifications();
    });
    
    // Add to DOM before the save button
    const saveBtn = formActions.querySelector('#save-settings');
    if (saveBtn) {
      formActions.insertBefore(testNotificationBtn, saveBtn);
    } else {
      formActions.appendChild(testNotificationBtn);
    }
    
    console.log('Test notification button added');
  }
}

// Function to test notifications
function testNotifications() {
  console.log('Testing notifications...');
  logNotificationStatus('🔍 Starting notification test...');
  
  // First, check browser support
  if (!("Notification" in window)) {
    const message = 'Notifications are not supported in this browser';
    showToast(message, 'error');
    logNotificationStatus('❌ ' + message);
    return;
  }
  
  logNotificationStatus('✓ Browser supports notifications');
  
  // Check if notifications are enabled in settings
  if (!settings.notificationsEnabled) {
    const message = 'Notifications are disabled in settings';
    showToast(message, 'warning');
    logNotificationStatus('⚠️ ' + message);
    return;
  }
  
  logNotificationStatus('✓ Notifications are enabled in settings');
  
  // Check if we have permission already
  if (Notification.permission === "granted") {
    // We have permission, trigger both the local and background notifications
    logNotificationStatus('✓ Notification permission is granted');
    sendTestNotification();
    triggerBackgroundNotificationTest();
    showToast('Test notification sent!', 'success');
  } else if (Notification.permission !== "denied") {
    // We need to request permission first
    logNotificationStatus('⏳ Requesting notification permission...');
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        logNotificationStatus('✓ Notification permission granted');
        showToast('Notification permission granted!', 'success');
        sendTestNotification();
        triggerBackgroundNotificationTest();
      } else {
        const message = 'Notification permission denied. Please enable in browser settings.';
        showToast(message, 'warning');
        logNotificationStatus('❌ ' + message);
      }
    });
  } else {
    // Permission previously denied
    const message = 'Notification permission denied. Please enable in browser settings.';
    showToast(message, 'warning');
    logNotificationStatus('❌ ' + message);
  }
}

// Trigger a test notification from the background script
function triggerBackgroundNotificationTest() {
  chrome.runtime.sendMessage({
    action: 'testNotification',
    test: true
  }, response => {
    if (chrome.runtime.lastError) {
      console.error('Error triggering background notification:', chrome.runtime.lastError);
      showToast('Background notification test failed. See console for details.', 'error');
      logNotificationStatus('❌ Background notification failed: ' + chrome.runtime.lastError.message);
    } else if (response && response.success) {
      console.log('Background notification test triggered');
      logNotificationStatus('✅ Background notification sent');
    } else {
      console.warn('Background notification may have failed', response);
      logNotificationStatus('⚠️ Background notification response uncertain');
    }
  });
}

// Add a status log to debug notification issues
function logNotificationStatus(message) {
  console.log('Notification status:', message);
  
  const notificationLog = document.getElementById('notification-log');
  if (!notificationLog) return;
  
  // Show the log
  notificationLog.classList.remove('hidden');
  
  // Add the log entry
  const timestamp = new Date().toLocaleTimeString();
  const logEntries = notificationLog.querySelector('.log-entries');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <span class="timestamp">${timestamp}</span>
    <span class="message">${message}</span>
  `;
  
  // Add to the beginning
  if (logEntries.firstChild) {
    logEntries.insertBefore(entry, logEntries.firstChild);
  } else {
    logEntries.appendChild(entry);
  }
  
  // Limit log entries
  const entries = logEntries.querySelectorAll('.log-entry');
  if (entries.length > 5) {
    for (let i = 5; i < entries.length; i++) {
      entries[i].remove();
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
  
  // Store current settings values when leaving settings tab
  let currentSettings = { ...settings };
  
  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      try {
        const targetTab = trigger.dataset.tab;
        if (!targetTab) {
          throw new Error('Invalid tab target');
        }
        
        const currentTab = document.querySelector('.tab-trigger[data-state="active"]')?.dataset.tab;
        
        // If leaving settings tab, store current form values to preserve them
        if (currentTab === 'settings') {
          preserveSettingsFormValues();
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
  
  // Helper function to preserve settings form values
  function preserveSettingsFormValues() {
    // Get the current form values before switching tabs
    const dailyTarget = dailyTargetInput?.value || settings.dailyTarget;
    const reminderInterval = reminderIntervalSelect?.value || settings.reminderInterval;
    const notificationsEnabled = notificationsEnabledCheckbox?.checked;
    const soundEnabled = soundToggleCheckbox?.checked;
    const soundChoice = soundSelectEl?.value || settings.soundChoice;
    const volume = volumeSlider?.value !== undefined ? volumeSlider.value : settings.volume;
    const fullScreenPause = fullscreenPauseCheckbox?.checked;
    
    // Update the settings object with the form values to preserve them
    if (dailyTarget) settings.dailyTarget = parseInt(dailyTarget, 10);
    if (reminderInterval) settings.reminderInterval = parseInt(reminderInterval, 10);
    if (notificationsEnabled !== undefined) {
      settings.notificationsEnabled = notificationsEnabled;
      settings.notifications = notificationsEnabled; // For backward compatibility
    }
    if (soundEnabled !== undefined) settings.sound = soundEnabled;
    if (soundChoice) settings.soundChoice = soundChoice;
    if (volume !== undefined) settings.volume = parseFloat(volume);
    if (fullScreenPause !== undefined) settings.fullScreenPause = fullScreenPause;
    
    // Store smart goals and cloud sync if available
    const smartGoalsCheckbox = document.getElementById('smart-goals');
    if (smartGoalsCheckbox) {
      settings.smartGoals = smartGoalsCheckbox.checked;
    }
    
    const cloudSyncCheckbox = document.getElementById('cloud-sync');
    if (cloudSyncCheckbox) {
      settings.cloudSync = cloudSyncCheckbox.checked;
    }
    
    // Save settings to storage when leaving the settings tab
    // This will ensure settings are saved even if the user doesn't click "Save Settings"
    // but we won't show a notification to avoid confusion
    const quietSave = true;
    saveData(quietSave);
    
    console.log('Settings preserved between tab switches:', settings);
  }
}

// Attach event listeners with improved error handling
function attachEventListeners() {
  try {
    // ... existing code ...
    
    // Test notification button
    const testNotificationBtn = document.getElementById('test-notification');
    if (testNotificationBtn) {
      testNotificationBtn.addEventListener('click', function(event) {
        event.preventDefault();
        testNotifications();
      });
    }
    
    // ... existing code ...
  } catch (error) {
    console.error('Error attaching event listeners:', error);
    handleEventListenerError(error);
  }
}

// Improved function to attach event listeners with retry mechanism
function attachEventListenersWithRetry(retryCount = 0, maxRetries = 2) {
  console.log(`Attaching event listeners (attempt ${retryCount + 1})...`);
  
  try {
    // Ensure DOM elements are available before attaching listeners
    if (!checkRequiredElements()) {
      if (retryCount < maxRetries) {
        console.log(`Required elements not found, retrying in 300ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
        setTimeout(() => attachEventListenersWithRetry(retryCount + 1, maxRetries), 300);
        return;
      } else {
        throw new Error('Required elements not found after retries');
      }
    }
    
    // Water controls
    attachWaterControls();
    
    // Settings controls - now with safer handling
    attachSettingsControls();
    
    // Theme controls
    attachThemeControls();
    
    // Custom amount controls
    attachCustomAmountControls();
    
    // Setup sound controls if available
    try {
      setupSoundControls();
    } catch (soundError) {
      console.warn('Sound controls error:', soundError);
      // Non-critical, continue
    }
    
    // Setup data management buttons if available
    try {
      setupDataManagementButtons();
    } catch (dataError) {
      console.warn('Data management buttons error:', dataError);
      // Non-critical, continue
    }
    
    console.log('Event listeners attached successfully');
    
  } catch (error) {
    console.error('Error attaching event listeners:', error);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying attachment in 500ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
      setTimeout(() => attachEventListenersWithRetry(retryCount + 1, maxRetries), 500);
    } else {
      showToast('Error setting up controls', 'error');
      handleEventListenerError(error);
    }
  }
}

// Check that required elements for event listeners are present
function checkRequiredElements() {
  // Check for at least one of each critical element type
  const criticalElements = [
    document.querySelector('.tab-trigger'),
    document.querySelector('[data-tab-content]'),
    document.getElementById('save-settings') 
  ];
  
  // Return true if all critical elements exist
  return criticalElements.every(el => el !== null);
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
  console.log('Attaching settings controls...');
  
  // Get save settings button - check if it exists
  const saveSettingsBtn = document.getElementById('save-settings');
  
  if (!saveSettingsBtn) {
    console.warn('Settings button not found, will retry on settings tab activation');
    
    // Add listener for settings tab click to retry finding the button
    const settingsTab = document.getElementById('settings-tab');
    if (settingsTab) {
      settingsTab.addEventListener('click', () => {
        setTimeout(() => {
          const retrySettingsBtn = document.getElementById('save-settings');
          if (retrySettingsBtn && !retrySettingsBtn.hasEventListener) {
            attachSettingsSaveHandler(retrySettingsBtn);
          }
        }, 300);
      });
    }
  } else {
    attachSettingsSaveHandler(saveSettingsBtn);
  }
  
  // Input validation
  const dailyTargetInput = document.getElementById('daily-target');
  if (dailyTargetInput) {
    dailyTargetInput.addEventListener('input', validateDailyTarget);
  }
  
  const reminderIntervalSelect = document.getElementById('reminder-interval');
  if (reminderIntervalSelect) {
    reminderIntervalSelect.addEventListener('change', validateReminderInterval);
  }
  
  // Attach notification permission request when checkbox is clicked
  const notificationsEnabledCheckbox = document.getElementById('notifications-enabled');
  if (notificationsEnabledCheckbox) {
    notificationsEnabledCheckbox.addEventListener('change', function() {
      if (this.checked) {
        requestNotificationPermission();
      }
    });
  }
  
  // Immediate check for notification permissions status on settings tab
  const settingsTab = document.getElementById('settings-tab');
  if (settingsTab) {
    settingsTab.addEventListener('click', function() {
      // Check notification permission status when settings tab is opened
      if (Notification.permission === "granted") {
        if (notificationsEnabledCheckbox) notificationsEnabledCheckbox.checked = true;
      } else if (Notification.permission === "denied") {
        if (notificationsEnabledCheckbox) {
          notificationsEnabledCheckbox.checked = false;
          // Show info about permissions being denied
          showToast('Notification permission denied. Enable in browser settings.', 'warning');
        }
      }
    });
  }
}

// Extract settings save logic to a separate function, accepting the button parameter
function attachSettingsSaveHandler(saveSettingsBtn) {
  if (!saveSettingsBtn) return;
  
  console.log('Attaching save settings handler');
  
  // Mark as having event listener to prevent duplicate attachments
  saveSettingsBtn.hasEventListener = true;
  
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
  
  // Add visual feedback on hover
  saveSettingsBtn.addEventListener('mouseenter', () => {
    saveSettingsBtn.classList.add('hover');
  });
  
  saveSettingsBtn.addEventListener('mouseleave', () => {
    saveSettingsBtn.classList.remove('hover');
  });
}

// Save settings to storage
function saveSettings() {
  try {
    console.log('Saving settings...');
    
    // Get all form elements first
    const dailyTargetInput = document.getElementById('daily-target');
    const reminderIntervalSelect = document.getElementById('reminder-interval');
    const notificationsEnabledCheckbox = document.getElementById('notifications-enabled');
    const soundToggleCheckbox = document.getElementById('sound-toggle');
    const soundSelectEl = document.getElementById('sound-select');
    const volumeSlider = document.getElementById('volume-slider');
    const fullscreenPauseCheckbox = document.getElementById('fullscreen-pause');
    const saveSettingsBtn = document.getElementById('save-settings');
    
    // Validate inputs if available
    if (dailyTargetInput && !validateDailyTarget()) {
      showToast('Daily target is invalid, please enter a value between 500-5000ml', 'error');
      return;
    }
    
    if (reminderIntervalSelect && !validateReminderInterval()) {
      showToast('Reminder interval is invalid, please enter a value between 15-240 minutes', 'error');
      return;
    }
    
    // Visual feedback - button pulse animation
    if (saveSettingsBtn) {
      saveSettingsBtn.classList.add('pulse');
      setTimeout(() => {
        saveSettingsBtn.classList.remove('pulse');
      }, 500);
    }
    
    // Get values directly from DOM elements to ensure we have the most current values
    // Use nullish coalescing to handle missing elements
    const dailyTarget = parseInt(dailyTargetInput?.value || settings.dailyTarget || DEFAULT_SETTINGS.dailyTarget, 10);
    const reminderInterval = parseInt(reminderIntervalSelect?.value || settings.reminderInterval || DEFAULT_SETTINGS.reminderInterval, 10);
    const notificationsEnabled = notificationsEnabledCheckbox ? notificationsEnabledCheckbox.checked : settings.notificationsEnabled;
    const soundEnabled = soundToggleCheckbox ? soundToggleCheckbox.checked : settings.sound;
    const soundChoice = soundSelectEl?.value || settings.soundChoice || DEFAULT_SETTINGS.soundChoice;
    const volume = parseFloat(volumeSlider?.value || settings.volume || 0.7);
    const fullScreenPause = fullscreenPauseCheckbox ? fullscreenPauseCheckbox.checked : settings.fullScreenPause;
    
    // Update settings object with form values
    settings.dailyTarget = dailyTarget;
    settings.reminderInterval = reminderInterval;
    settings.notifications = notificationsEnabled;
    settings.notificationsEnabled = notificationsEnabled;
    settings.sound = soundEnabled;
    settings.soundChoice = soundChoice;
    settings.volume = volume; 
    settings.fullScreenPause = fullScreenPause;
    
    // Check for new settings elements
    const smartGoalsCheckbox = document.getElementById('smart-goals');
    if (smartGoalsCheckbox) {
      settings.smartGoals = smartGoalsCheckbox.checked;
    }
    
    const cloudSyncCheckbox = document.getElementById('cloud-sync');
    if (cloudSyncCheckbox) {
      settings.cloudSync = cloudSyncCheckbox.checked;
    }
    
    console.log('Settings before save:', JSON.stringify(settings));
    
    // Save to storage
    saveData();
    
    // Update UI to reflect new settings
    updateUI();
    
    // Update notification permissions and registration
    if (settings.notificationsEnabled) {
      requestNotificationPermission();
    }

    // Communicate with background script to update reminder settings
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: settings
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error sending settings to background:', chrome.runtime.lastError);
        showToast('Settings saved but background sync failed', 'warning');
      } else if (response && response.success) {
        console.log('Background script updated with new settings');
      }
    });
    
    // Show confirmation with pulse animation
    showToast('Settings saved successfully!', 'success');
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Failed to save settings. Please try again.', 'error');
  }
}

// Request notification permission
function requestNotificationPermission() {
  try {
    console.log('Requesting notification permission...');
    
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications");
      showToast('Notifications are not supported in this browser', 'warning');
      
      // Update checkbox to reflect actual state
      if (notificationsEnabledCheckbox) {
        notificationsEnabledCheckbox.checked = false;
        settings.notificationsEnabled = false;
      }
      
      return false;
    }
    
    // Check if permission is already granted
    if (Notification.permission === "granted") {
      console.log("Notification permission already granted");
      return true;
    }
    
    // Request permission
    if (Notification.permission !== "denied") {
      console.log("Requesting notification permission from user");
      
      // Show a toast to guide the user
      showToast('Please allow notifications in the popup', 'info');
      
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          console.log("Notification permission granted");
          showToast('Notification permission granted!', 'success');
          
          // Send test notification
          sendTestNotification();
          
          return true;
        } else {
          console.warn("Notification permission denied");
          showToast('Notification permission denied by user', 'warning');
          
          // Update the settings to reflect actual permission state
          settings.notificationsEnabled = false;
          if (notificationsEnabledCheckbox) {
            notificationsEnabledCheckbox.checked = false;
          }
          
          // Save the updated settings
          saveData();
          
          return false;
        }
      }).catch(error => {
        console.error('Error requesting notification permission:', error);
        showToast('Error requesting notification permission', 'error');
        
        // Update UI to reflect failure
        settings.notificationsEnabled = false;
        if (notificationsEnabledCheckbox) {
          notificationsEnabledCheckbox.checked = false;
        }
        
        return false;
      });
    } else {
      showToast('Please enable notifications in your browser settings', 'warning');
      // Update checkbox to reflect actual state
      if (notificationsEnabledCheckbox) {
        notificationsEnabledCheckbox.checked = false;
        settings.notificationsEnabled = false;
      }
      return false;
    }
  } catch (error) {
    console.error('Error in notification permission request:', error);
    return false;
  }
}

// Send test notification
function sendTestNotification() {
  try {
    // Check if notifications are enabled
    if (!settings.notificationsEnabled) {
      return;
    }
    
    // Check if we have permission
    if (Notification.permission !== "granted") {
      return;
    }
    
    // Create and show notification
    const notification = new Notification("Hydration Reminder", {
      body: "Notifications are working! Remember to stay hydrated.",
      icon: chrome.runtime.getURL("icons/water-drop-64.png"),
      silent: false
    });
    
    // Play sound if enabled
    if (settings.sound) {
      playSound(settings.soundChoice, settings.volume);
    }
    
    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
    
    // Click handler
    notification.onclick = function() {
      // Focus the extension popup if possible
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

// Save data to storage
function saveData(quietSave = false) {
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
      if (!quietSave) showToast('Failed to save data', 'error');
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

// Improved toast notification system
function showToast(message, type = 'info', duration = 3000) {
  // Filter toasts based on config
  if (
    (type === 'info' && !toastConfig.showInfoToasts) ||
    (type === 'success' && !toastConfig.showSuccessToasts) ||
    (type === 'warning' && !toastConfig.showWarningToasts) ||
    (type === 'error' && !toastConfig.showErrorToasts) ||
    (message.includes('internal') && !toastConfig.showInternalErrors)
  ) {
    // Just log the message instead of showing toast
    console.log(`[Toast suppressed] ${type}: ${message}`);
    return;
  }
  
  // Check if toast container exists
  if (!toastContainer) {
    console.warn('Toast container not found');
    return;
  }
  
  try {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="toast-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
        break;
      case 'error': 
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="toast-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
        break;
      case 'warning':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="toast-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>';
        break;
      default: // info
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="toast-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
    }
    
    // Set toast content
    toast.innerHTML = `
      ${icon}
      <div class="toast-message">${message}</div>
      <button class="toast-close">&times;</button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('toast-visible');
    }, 10);
    
    // Add close button handler
    const closeButton = toast.querySelector('.toast-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        removeToast(toast);
      });
    }
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(toast);
      }, duration);
    }
    
    // Limit maximum number of toasts
    const maxToasts = 3;
    const toasts = toastContainer.querySelectorAll('.toast');
    if (toasts.length > maxToasts) {
      // Remove oldest toasts first (those without the toast-visible class already)
      for (let i = 0; i < toasts.length - maxToasts; i++) {
        if (!toasts[i].classList.contains('toast-new')) {
          toastContainer.removeChild(toasts[i]);
        }
      }
    }
    
  } catch (error) {
    console.error('Failed to show toast:', error);
  }
  
  // Helper function to remove a toast with animation
  function removeToast(toast) {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hidden');
    setTimeout(() => {
      if (toast.parentNode === toastContainer) {
        toastContainer.removeChild(toast);
      }
    }, 300); // Match the CSS animation duration
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

// Add toast configuration
const toastConfig = {
  showInfoToasts: false,      // Non-critical informational toasts
  showSuccessToasts: true,    // Success toasts
  showWarningToasts: true,    // Warning toasts
  showErrorToasts: true,      // Error toasts
  showInternalErrors: false   // Internal error toasts (for debugging)
};

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
  console.log(`Refreshing content for tab: ${tab}`);
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
    default:
      console.warn(`Unknown tab: ${tab}`);
      break;
  }
}

// Initialize the extension
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Check notification permission on startup
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    
    // Initialize UI components
    initializeUI();
    setupTabs();
    attachEventListeners();
    displayCurrentDate();
    
    // Load and display data
    await loadData();
    updateUI();
    
    // Initialize other features
    initializeRippleEffects();
    setupSoundControls();
    
    // Start freeze detection
    const freezeDetector = new FreezeDetector();
    freezeDetector.start();
    
  } catch (error) {
    console.error('Error initializing extension:', error);
    handleCriticalError(error);
  }
});

