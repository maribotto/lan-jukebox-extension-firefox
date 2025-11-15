# Privacy Policy for LAN Jukebox Extension

**Last Updated: November 15, 2025**

## Overview

LAN Jukebox Extension ("the Extension") is committed to protecting your privacy. This privacy policy explains what data is collected and how it is used.

## Data Collection

**The Extension does NOT collect, store, or transmit any personal data to external servers.**

### Local Storage Only

The Extension uses Chrome's local storage (`chrome.storage.sync`) to store:
- Jukebox server address (IP and port)
- Username (if authentication is enabled)
- Password (if authentication is enabled)

**All data is stored locally on your device and synced only through your Chrome/Brave browser's built-in sync functionality (if you have Chrome Sync enabled).**

### Data Sent to Your Jukebox Server

When you add a video, the Extension sends:
- YouTube video URL
- Your authentication credentials (if configured)

**This data is sent only to the server address YOU configure.** The Extension developers have no access to this data.

## Permissions

The Extension requires the following permissions:

### activeTab
- **Purpose:** To detect when you're on a YouTube page and read the video URL
- **Data Access:** Current tab URL and title (only on YouTube.com)
- **Usage:** Used only to extract the YouTube video URL to send to your jukebox

### storage
- **Purpose:** To save your jukebox server settings
- **Data Access:** Server address, username, and password
- **Usage:** Stored locally to remember your settings between uses

### host_permissions (http://*/* and https://*/*)
- **Purpose:** To communicate with your jukebox server
- **Data Access:** Ability to make HTTP/HTTPS requests
- **Usage:** Only used to send requests to the server address you configure

## Third-Party Services

The Extension does NOT use any third-party analytics, tracking, or advertising services.

## Data Sharing

**We do not share, sell, or transfer any user data to third parties** because we don't collect any data in the first place.

## Security

- Passwords are stored in Chrome's encrypted storage
- All communication with your jukebox server uses the protocol (HTTP/HTTPS) you configure
- No data is transmitted to any servers operated by the Extension developers

## Changes to This Policy

If this privacy policy changes, the "Last Updated" date will be revised. Continued use of the Extension after changes indicates acceptance of the updated policy.

## Contact

For questions about this privacy policy, please open an issue on the GitHub repository:

**Extension:** https://github.com/maribotto/lan-jukebox-extension
**Server:** https://github.com/maribotto/lan-jukebox

## Open Source

This Extension is open source. You can review the complete source code to verify these privacy claims:

**Extension source:** https://github.com/maribotto/lan-jukebox-extension
**Server source:** https://github.com/maribotto/lan-jukebox

---

**Summary:** This Extension stores settings locally on your device and only communicates with the jukebox server YOU configure. No data is collected by the developers.
