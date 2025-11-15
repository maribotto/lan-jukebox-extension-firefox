// DOM elements
const serverUrlInput = document.getElementById('serverUrl');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const addButton = document.getElementById('addButton');
const saveButton = document.getElementById('saveButton');
const statusMessage = document.getElementById('statusMessage');
const videoSection = document.getElementById('videoSection');
const notYouTube = document.getElementById('notYouTube');
const videoTitle = document.getElementById('videoTitle');
const videoUrl = document.getElementById('videoUrl');
const authSection = document.getElementById('authSection');

let currentVideoData = null;

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

// Load saved settings
chrome.storage.sync.get(['serverUrl', 'username', 'password', 'showAuth'], (data) => {
  if (data.serverUrl) {
    serverUrlInput.value = data.serverUrl;
  }
  if (data.username) {
    usernameInput.value = data.username;
  }
  if (data.password) {
    passwordInput.value = data.password;
  }
  if (data.showAuth) {
    authSection.style.display = 'block';
  }
});

// Get current tab info
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const tab = tabs[0];

  if (!tab || !tab.url) {
    showNotYouTube();
    return;
  }

  // Check if it's a YouTube video page
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
  const match = tab.url.match(youtubeRegex);

  if (match) {
    // It's a YouTube video!
    currentVideoData = {
      url: tab.url,
      title: tab.title || 'YouTube Video'
    };

    videoTitle.textContent = currentVideoData.title;
    videoUrl.textContent = currentVideoData.url;
    videoSection.style.display = 'block';

    // Enable add button if server URL is set
    if (serverUrlInput.value.trim()) {
      addButton.disabled = false;
    }
  } else {
    showNotYouTube();
  }
});

// Show not YouTube message
function showNotYouTube() {
  notYouTube.style.display = 'block';
  videoSection.style.display = 'none';
  addButton.disabled = true;
}

// Show status message
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`;

  // Auto-hide after 3 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusMessage.className = 'status';
    }, 3000);
  }
}

// Save settings
saveButton.addEventListener('click', () => {
  let serverUrl = normalizeServerUrl(serverUrlInput.value);
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!serverUrl) {
    showStatus('Please enter server address!', 'error');
    return;
  }

  // Validate URL format
  try {
    new URL(serverUrl);
  } catch (e) {
    showStatus('Invalid URL format!', 'error');
    return;
  }

  chrome.storage.sync.set({
    serverUrl,
    username,
    password,
    showAuth: username || password ? true : false
  }, () => {
    showStatus('Settings saved!', 'success');

    // Update the input field with the normalized URL
    serverUrlInput.value = serverUrl;

    // Enable add button if we have a video
    if (currentVideoData) {
      addButton.disabled = false;
    }

    // Show/hide auth section based on whether credentials were provided
    if (username || password) {
      authSection.style.display = 'block';
    }
  });
});

// Add video to jukebox
addButton.addEventListener('click', async () => {
  let serverUrl = normalizeServerUrl(serverUrlInput.value);

  if (!serverUrl) {
    showStatus('Please save server address first!', 'error');
    return;
  }

  if (!currentVideoData) {
    showStatus('No video to add!', 'error');
    return;
  }

  addButton.disabled = true;
  showStatus('Adding video...', 'info');

  try {
    // Check if authentication is required
    const { response: authStatusResponse, finalUrl: authUrl } = await smartFetch(`${serverUrl}/api/auth-status`, {
      credentials: 'include'
    });

    // Update serverUrl if HTTPS was used successfully
    if (authUrl !== `${serverUrl}/api/auth-status`) {
      serverUrl = authUrl.replace('/api/auth-status', '');
      serverUrlInput.value = serverUrl;
      chrome.storage.sync.set({ serverUrl });
      console.log(`Updated to HTTPS: ${serverUrl}`);
    }

    let needsAuth = false;
    let isAuthenticated = false;

    if (authStatusResponse.ok) {
      const authStatus = await authStatusResponse.json();
      needsAuth = authStatus.requireLogin;
      isAuthenticated = authStatus.authenticated;
    }

    // If auth is required and we're not authenticated, try to login
    if (needsAuth && !isAuthenticated) {
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (!username || !password) {
        showStatus('Authentication required! Please enter username and password.', 'error');
        authSection.style.display = 'block';
        addButton.disabled = false;
        return;
      }

      // Try to login
      const { response: loginResponse } = await smartFetch(`${serverUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      if (!loginResponse.ok) {
        showStatus('Login failed! Check your credentials.', 'error');
        addButton.disabled = false;
        return;
      }
    }

    // Now add the video
    const { response } = await smartFetch(`${serverUrl}/api/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        videoUrl: currentVideoData.url
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showStatus(`Added: ${result.video.title}`, 'success');

      // Update video title if we got a better one from the server
      if (result.video.title && result.video.title !== currentVideoData.title) {
        currentVideoData.title = result.video.title;
        videoTitle.textContent = result.video.title;
      }
    } else {
      showStatus(`Error: ${result.message || 'Unknown error'}`, 'error');
      addButton.disabled = false;
    }
  } catch (error) {
    console.error('Error adding video:', error);
    showStatus(`Connection error: ${error.message}`, 'error');
    addButton.disabled = false;
  }
});

// Enable add button when server URL is entered
serverUrlInput.addEventListener('input', () => {
  if (serverUrlInput.value.trim() && currentVideoData) {
    addButton.disabled = false;
  } else {
    addButton.disabled = true;
  }
});

// Show auth section when username/password is focused
usernameInput.addEventListener('focus', () => {
  authSection.style.display = 'block';
});

passwordInput.addEventListener('focus', () => {
  authSection.style.display = 'block';
});
