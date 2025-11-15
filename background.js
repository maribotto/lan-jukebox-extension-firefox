// Background script for LAN Jukebox extension
// This handles all API calls to bypass CORS restrictions

console.log('LAN Jukebox background script loaded');

// Smart fetch that tries HTTPS if HTTP fails
async function smartFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return { response, finalUrl: url };
  } catch (error) {
    // If HTTP failed and URL starts with http://, try https://
    if (url.startsWith('http://')) {
      const httpsUrl = url.replace('http://', 'https://');
      console.log(`HTTP failed, trying HTTPS: ${httpsUrl}`);

      try {
        const response = await fetch(httpsUrl, options);
        return { response, finalUrl: httpsUrl };
      } catch (httpsError) {
        // Both failed, throw original error
        throw error;
      }
    }

    // Not HTTP or already HTTPS, throw original error
    throw error;
  }
}

// Message handler for popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  if (request.action === 'apiCall') {
    handleApiCall(request).then(sendResponse).catch(error => {
      console.error('Error in handleApiCall:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  }
});

// Handle API calls from popup
async function handleApiCall(request) {
  const { endpoint, method = 'GET', body, serverUrl } = request;

  try {
    const url = `${serverUrl}${endpoint}`;
    console.log(`Making API call to: ${url}`);

    const options = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log('Fetch options:', options);
    const { response, finalUrl } = await smartFetch(url, options);
    console.log('Fetch successful:', finalUrl, 'Status:', response.status);

    // Determine the updated server URL if HTTPS was used
    let updatedServerUrl = serverUrl;
    if (finalUrl !== url) {
      updatedServerUrl = finalUrl.replace(endpoint, '');
    }

    // Read response
    const text = await response.text();
    let data = null;

    try {
      data = JSON.parse(text);
    } catch (e) {
      // Response is not JSON
      data = text;
    }

    return {
      success: true,
      ok: response.ok,
      status: response.status,
      data,
      updatedServerUrl
    };
  } catch (error) {
    console.error('API call error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Normalize server URL by adding http:// if protocol is missing
function normalizeServerUrl(url) {
  url = url.trim();
  if (!url) return url;

  // If it doesn't start with http:// or https://, add http://
  if (!url.match(/^https?:\/\//i)) {
    url = 'http://' + url;
  }

  return url;
}

// Add video to playlist (used by keyboard shortcut)
async function addVideoToPlaylist(videoUrl, videoTitle) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['serverUrl', 'username', 'password'], async (data) => {
      try {
        let serverUrl = normalizeServerUrl(data.serverUrl);

        if (!serverUrl) {
          reject(new Error('Server address not configured. Please open the extension popup to configure.'));
          return;
        }

        // Check if authentication is required
        const authStatusResult = await handleApiCall({
          action: 'apiCall',
          endpoint: '/api/auth-status',
          method: 'GET',
          serverUrl: serverUrl
        });

        if (authStatusResult.updatedServerUrl !== serverUrl) {
          serverUrl = authStatusResult.updatedServerUrl;
          chrome.storage.sync.set({ serverUrl });
          console.log(`Updated to HTTPS: ${serverUrl}`);
        }

        let needsAuth = false;
        let isAuthenticated = false;

        if (authStatusResult.ok && authStatusResult.data) {
          needsAuth = authStatusResult.data.requireLogin;
          isAuthenticated = authStatusResult.data.authenticated;
        }

        // If auth is required and we're not authenticated, try to login
        if (needsAuth && !isAuthenticated) {
          const username = data.username?.trim();
          const password = data.password?.trim();

          if (!username || !password) {
            reject(new Error('Authentication required! Please configure credentials in the extension popup.'));
            return;
          }

          // Try to login
          const loginResult = await handleApiCall({
            action: 'apiCall',
            endpoint: '/api/login',
            method: 'POST',
            body: { username, password },
            serverUrl: serverUrl
          });

          if (!loginResult.ok) {
            reject(new Error('Login failed! Check your credentials in the extension popup.'));
            return;
          }
        }

        // Now add the video
        const addResult = await handleApiCall({
          action: 'apiCall',
          endpoint: '/api/add',
          method: 'POST',
          body: { videoUrl: videoUrl },
          serverUrl: serverUrl
        });

        if (addResult.ok && addResult.data && addResult.data.success) {
          resolve(addResult.data.video.title || videoTitle);
        } else {
          reject(new Error(addResult.data?.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error adding video:', error);
        reject(error);
      }
    });
  });
}

// Listen for keyboard command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'add-to-playlist') {
    try {
      // Get the active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];

      if (!tab || !tab.url) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'LAN Jukebox',
          message: 'No active tab found'
        });
        return;
      }

      // Check if it's a YouTube video page
      const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
      const match = tab.url.match(youtubeRegex);

      if (!match) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'LAN Jukebox',
          message: 'This is not a YouTube video page'
        });
        return;
      }

      // Add the video to playlist
      const videoTitle = await addVideoToPlaylist(tab.url, tab.title);

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'LAN Jukebox',
        message: `Added: ${videoTitle}`
      });
    } catch (error) {
      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'LAN Jukebox Error',
        message: error.message
      });
    }
  }
});
