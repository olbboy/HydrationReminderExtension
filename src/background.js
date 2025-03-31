// Constants
const DEFAULT_SETTINGS = {
  reminderInterval: 60, // in minutes
  dailyTarget: 2000, // in ml
  soundChoice: 'water-drop',
  volume: 0.7,
  darkMode: false,
  notificationsEnabled: true,
  fullScreenPause: true
};

const NOTIFICATION_ID = 'hydration-reminder';
const ALARM_NAME = 'hydration-reminder-alarm';

// Initialize extension data
chrome.runtime.onInstalled.addListener(async () => {
  const { settings } = await chrome.storage.sync.get('settings');
  
  if (!settings) {
    await chrome.storage.sync.set({
      settings: DEFAULT_SETTINGS,
      hydrationData: {
        intakeHistory: [],
        todayIntake: 0,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    });
  }
  
  setupAlarm();
});

// Set up the alarm based on user settings
async function setupAlarm() {
  const { settings } = await chrome.storage.sync.get('settings') || { settings: DEFAULT_SETTINGS };
  
  // Clear existing alarm if any
  await chrome.alarms.clear(ALARM_NAME);
  
  if (settings.notificationsEnabled) {
    // Create a new alarm
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: settings.reminderInterval
    });
  }
}

// Handle alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const shouldNotify = await shouldShowNotification();
    if (shouldNotify) {
      showHydrationNotification();
    }
  }
});

// Store fullscreen state
let isCurrentlyFullscreen = false;

// Listen for fullscreen change messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FULLSCREEN_CHANGE') {
    isCurrentlyFullscreen = message.isFullscreen;
    sendResponse({ success: true });
  } else if (message.type === 'ADD_WATER') {
    logWaterIntake(message.amount);
    sendResponse({ success: true });
  } else if (message.type === 'UPDATE_SETTINGS') {
    updateSettings(message.settings);
    sendResponse({ success: true });
  } else if (message.type === 'GET_DATA') {
    getData().then(data => sendResponse(data));
    return true; // Keep the message channel open for async response
  }
});

// Check if we should show a notification (based on fullscreen status)
async function shouldShowNotification() {
  const { settings } = await chrome.storage.sync.get('settings') || { settings: DEFAULT_SETTINGS };
  
  if (!settings.notificationsEnabled) {
    return false;
  }
  
  if (settings.fullScreenPause && isCurrentlyFullscreen) {
    return false;
  }
  
  return true;
}

// Show the notification
async function showHydrationNotification() {
  const { settings } = await chrome.storage.sync.get('settings') || { settings: DEFAULT_SETTINGS };
  
  const options = {
    type: 'basic',
    iconUrl: '../icons/icon128.png',
    title: 'Hydration Reminder',
    message: 'Time to drink some water! 💧',
    silent: true // We'll handle sound ourselves
  };
  
  // Show the notification
  chrome.notifications.create(NOTIFICATION_ID, options);
  
  // Play the sound
  playNotificationSound(settings.soundChoice, settings.volume);
}

// Play notification sound
function playNotificationSound(sound, volume) {
  const audio = new Audio(chrome.runtime.getURL(`public/sounds/${sound}.mp3`));
  audio.volume = volume;
  audio.play();
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === NOTIFICATION_ID) {
    // Add water intake when notification is clicked
    logWaterIntake(250); // Default to 250ml per click
    chrome.notifications.clear(notificationId);
  }
});

// Log water intake
async function logWaterIntake(amount) {
  const { hydrationData } = await chrome.storage.sync.get('hydrationData');
  const today = new Date().toISOString().split('T')[0];
  
  // Check if we need to reset for a new day
  if (hydrationData.lastUpdated !== today) {
    hydrationData.todayIntake = 0;
    hydrationData.lastUpdated = today;
    
    // Maintain history for the last 30 days
    if (hydrationData.intakeHistory.length >= 30) {
      hydrationData.intakeHistory.shift();
    }
    
    hydrationData.intakeHistory.push({
      date: today,
      intake: 0
    });
  }
  
  // Update today's intake
  hydrationData.todayIntake += amount;
  
  // Update the last entry in history
  if (hydrationData.intakeHistory.length > 0) {
    const lastIndex = hydrationData.intakeHistory.length - 1;
    hydrationData.intakeHistory[lastIndex].intake = hydrationData.todayIntake;
  }
  
  // Save the updated data
  await chrome.storage.sync.set({ hydrationData });
}

// Update settings
async function updateSettings(newSettings) {
  await chrome.storage.sync.set({ settings: newSettings });
  setupAlarm(); // Reconfigure the alarm with new settings
}

// Get all data for the popup
async function getData() {
  const data = await chrome.storage.sync.get(['settings', 'hydrationData']);
  return data;
}

// Reset data for a new day if needed
async function checkAndResetForNewDay() {
  const { hydrationData } = await chrome.storage.sync.get('hydrationData');
  const today = new Date().toISOString().split('T')[0];
  
  if (hydrationData && hydrationData.lastUpdated !== today) {
    await logWaterIntake(0); // This will reset the counter for the new day
  }
}

// Check for day change when Chrome starts
chrome.runtime.onStartup.addListener(() => {
  checkAndResetForNewDay();
  setupAlarm();
}); 