// Background script for LAN Jukebox extension
// This handles all API calls to bypass CORS restrictions

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
  if (request.action === 'apiCall') {
    handleApiCall(request).then(sendResponse);
    return true; // Will respond asynchronously
  }
});

// Handle API calls from popup
async function handleApiCall(request) {
  const { endpoint, method = 'GET', body, serverUrl } = request;

  try {
    const url = `${serverUrl}${endpoint}`;
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

    const { response, finalUrl } = await smartFetch(url, options);

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
