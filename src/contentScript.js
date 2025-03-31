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