// Track fullscreen status changes
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
  const isFullscreen = Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
  
  // Send the fullscreen status to the background script
  chrome.runtime.sendMessage({
    type: 'FULLSCREEN_CHANGE',
    isFullscreen
  });
}

// Check if the current page is in fullscreen mode
function checkFullscreenStatus() {
  const isFullscreen = document.fullscreenElement !== null;
  
  // Notify the background script about fullscreen status
  chrome.runtime.sendMessage({
    type: 'FULLSCREEN_CHANGE',
    isFullscreen
  });
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', checkFullscreenStatus);

// Initial check
checkFullscreenStatus();

// Export for Vite
export {}; 