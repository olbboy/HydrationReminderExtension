// Constants
const DEFAULT_SETTINGS = {
  reminderInterval: 60, // in minutes
  dailyTarget: 2000, // in ml
  soundChoice: 'water-drop',
  volume: 0.7,
  darkMode: false,
  notificationsEnabled: true,
  fullScreenPause: true,
  colorTheme: 'blue',
  smartGoals: false,
  cloudSync: false,
  aiProvider: 'openai' // Added for Google Gemini API support
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
        lastUpdated: new Date().toISOString().split('T')[0],
        activities: {}
      },
      streakData: {
        count: 0,
        lastDate: null
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

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FULLSCREEN_CHANGE') {
    isCurrentlyFullscreen = message.isFullscreen;
    sendResponse({ success: true });
  } else if (message.type === 'ADD_WATER') {
    logWaterIntake(message.amount, message.drinkType || 'water');
    sendResponse({ success: true });
  } else if (message.type === 'UPDATE_SETTINGS') {
    updateSettings(message.settings);
    sendResponse({ success: true });
  } else if (message.type === 'GET_DATA') {
    getData().then(data => sendResponse(data));
    return true; // Keep the message channel open for async response
  } else if (message.type === 'SET_DATA') {
    setData(message.settings, message.hydrationData, message.streakData).then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }
  
  // Handle API key storage
  if (message.action === 'saveApiKey') {
    chrome.storage.local.set({ apiKey: message.key }, () => {
      sendResponse({ success: true });
    });
    return true; // Indicate async response
  }
  
  // Fetch OpenAI recommendations
  if (message.action === 'generateAIRecommendations') {
    generateRecommendations(message.data, message.apiKey)
      .then(recommendations => {
        sendResponse({ success: true, recommendations });
      })
      .catch(error => {
        console.error('Error generating recommendations:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicate async response
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
  const { settings, hydrationData } = await chrome.storage.sync.get(['settings', 'hydrationData']) || 
    { settings: DEFAULT_SETTINGS, hydrationData: { todayIntake: 0 } };
  
  // Calculate what percentage of the target has been reached
  const targetPercentage = (hydrationData.todayIntake / settings.dailyTarget) * 100;
  let message = 'Time to drink some water! 💧';
  
  // Customize message based on progress
  if (targetPercentage >= 100) {
    message = 'Great job! You\'ve reached your water goal today! 🎉';
  } else if (targetPercentage >= 75) {
    message = 'Almost there! Take another drink to reach your goal. 💦';
  } else if (targetPercentage >= 50) {
    message = 'Halfway to your goal! Keep it up with some water. 💧';
  } else if (targetPercentage >= 25) {
    message = 'Making progress! Time for more hydration. 💧';
  }
  
  const options = {
    type: 'basic',
    iconUrl: '../icons/icon128.png',
    title: 'Hydration Reminder',
    message: message,
    silent: true // We'll handle sound ourselves
  };
  
  // Show the notification
  chrome.notifications.create(NOTIFICATION_ID, options);
  
  // Play the sound
  playNotificationSound(settings.soundChoice, settings.volume);
}

// Play notification sound
function playNotificationSound(sound, volume) {
  try {
    const audio = new Audio(chrome.runtime.getURL(`audio/${sound}.mp3`));
    audio.volume = volume;
    audio.play().catch(err => {
      console.error('Error playing sound:', err);
      // Try fallback to public folder
      const fallbackAudio = new Audio(chrome.runtime.getURL(`public/sounds/${sound}.mp3`));
      fallbackAudio.volume = volume;
      fallbackAudio.play().catch(err => console.error('Fallback sound error:', err));
    });
  } catch (err) {
    console.error('Error initializing audio:', err);
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === NOTIFICATION_ID) {
    // Add water intake when notification is clicked
    logWaterIntake(250, 'water'); // Default to 250ml of water per click
    chrome.notifications.clear(notificationId);
  }
});

// Log water intake
async function logWaterIntake(amount, drinkType = 'water') {
  const { hydrationData, streakData } = await chrome.storage.sync.get(['hydrationData', 'streakData']) || 
    { hydrationData: { intakeHistory: [], todayIntake: 0 }, streakData: { count: 0, lastDate: null } };
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check if we need to reset for a new day
  if (hydrationData.lastUpdated !== today) {
    hydrationData.todayIntake = 0;
    hydrationData.lastUpdated = today;
    
    // Initialize activities for today if needed
    hydrationData.activities = hydrationData.activities || {};
    hydrationData.activities[today] = [];
    
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
  
  // Log the activity
  hydrationData.activities = hydrationData.activities || {};
  hydrationData.activities[today] = hydrationData.activities[today] || [];
  
  hydrationData.activities[today].push({
    amount: amount,
    timestamp: Date.now(),
    type: drinkType
  });
  
  // Update the last entry in history
  if (hydrationData.intakeHistory.length > 0) {
    const lastIndex = hydrationData.intakeHistory.length - 1;
    hydrationData.intakeHistory[lastIndex].intake = hydrationData.todayIntake;
  }
  
  // Update streak data
  if (!streakData.lastDate) {
    // First time drinking water
    streakData.count = 1;
    streakData.lastDate = today;
  } else if (streakData.lastDate !== today) {
    // Check if it's consecutive
    const lastDate = new Date(streakData.lastDate);
    const currentDate = new Date(today);
    
    // Calculate the difference in days
    const diffTime = Math.abs(currentDate - lastDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day, increment streak
      streakData.count += 1;
    } else {
      // Streak broken, start over
      streakData.count = 1;
    }
    
    streakData.lastDate = today;
  }
  
  // Save the updated data
  await chrome.storage.sync.set({ hydrationData, streakData });
}

// Update settings
async function updateSettings(newSettings) {
  await chrome.storage.sync.set({ settings: newSettings });
  setupAlarm(); // Reconfigure the alarm with new settings
}

// Get all data for the popup
async function getData() {
  const data = await chrome.storage.sync.get(['settings', 'hydrationData', 'streakData']);
  return data;
}

// Set all data from popup
async function setData(settings, hydrationData, streakData) {
  await chrome.storage.sync.set({ 
    settings: settings || DEFAULT_SETTINGS, 
    hydrationData: hydrationData || { intakeHistory: [], todayIntake: 0, lastUpdated: new Date().toISOString().split('T')[0], activities: {} },
    streakData: streakData || { count: 0, lastDate: null }
  });
  setupAlarm(); // Reconfigure the alarm with new settings
}

// Reset data for a new day if needed
async function checkAndResetForNewDay() {
  const { hydrationData } = await chrome.storage.sync.get('hydrationData');
  const today = new Date().toISOString().split('T')[0];
  
  if (hydrationData && hydrationData.lastUpdated !== today) {
    await logWaterIntake(0, 'water'); // This will reset the counter for the new day
  }
}

// Check for day change when Chrome starts
chrome.runtime.onStartup.addListener(() => {
  checkAndResetForNewDay();
  setupAlarm();
});

// Generate recommendations via OpenAI or Gemini
async function generateRecommendations(data, apiKey) {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  // Get AI model provider preference
  const { settings } = await chrome.storage.sync.get('settings') || { settings: DEFAULT_SETTINGS };
  const aiProvider = settings.aiProvider || 'openai'; // Default to OpenAI if not set
  
  // Create prompt based on hydration data
  const prompt = `
    As a hydration assistant, analyze this data and provide 3-4 personalized hydration recommendations:
    ${JSON.stringify(data, null, 2)}
    
    Format each recommendation as a separate item in a list. Keep recommendations practical, specific, and actionable.
  `;
  
  try {
    if (aiProvider === 'openai') {
      return await callOpenAI(prompt, apiKey);
    } else if (aiProvider === 'gemini') {
      return await callGemini(prompt, apiKey);
    } else {
      throw new Error('Invalid AI provider specified');
    }
  } catch (error) {
    console.error(`${aiProvider} API error:`, error);
    throw error;
  }
}

// Call OpenAI API
async function callOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a hydration assistant that provides personalized recommendations based on hydration data.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Error calling OpenAI API');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Call Google Gemini API
async function callGemini(prompt, apiKey) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a hydration assistant that provides personalized recommendations based on hydration data. ${prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        topP: 0.8,
        topK: 40
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Error calling Gemini API');
  }
  
  const data = await response.json();
  
  // Extract text from Gemini response format
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error('Unexpected response format from Gemini API');
} 