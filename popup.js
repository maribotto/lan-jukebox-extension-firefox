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

// Make API call via background script to bypass CORS
async function apiCall(endpoint, serverUrl, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: 'apiCall',
        endpoint,
        serverUrl,
        method,
        body
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      }
    );
  });
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
    const authStatusResult = await apiCall('/api/auth-status', serverUrl);

    // Update serverUrl if HTTPS was used successfully
    if (authStatusResult.updatedServerUrl !== serverUrl) {
      serverUrl = authStatusResult.updatedServerUrl;
      serverUrlInput.value = serverUrl;
      chrome.storage.sync.set({ serverUrl });
      console.log(`Updated to HTTPS: ${serverUrl}`);
    }

    let needsAuth = false;
    let isAuthenticated = false;

    if (authStatusResult.ok) {
      needsAuth = authStatusResult.data.requireLogin;
      isAuthenticated = authStatusResult.data.authenticated;
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
      const loginResult = await apiCall('/api/login', serverUrl, 'POST', { username, password });

      if (!loginResult.ok) {
        showStatus('Login failed! Check your credentials.', 'error');
        addButton.disabled = false;
        return;
      }
    }

    // Now add the video
    const addResult = await apiCall('/api/add', serverUrl, 'POST', {
      videoUrl: currentVideoData.url
    });

    if (addResult.ok && addResult.data.success) {
      showStatus(`Added: ${addResult.data.video.title}`, 'success');

      // Update video title if we got a better one from the server
      if (addResult.data.video.title && addResult.data.video.title !== currentVideoData.title) {
        currentVideoData.title = addResult.data.video.title;
        videoTitle.textContent = addResult.data.video.title;
      }
    } else {
      showStatus(`Error: ${addResult.data.message || 'Unknown error'}`, 'error');
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
