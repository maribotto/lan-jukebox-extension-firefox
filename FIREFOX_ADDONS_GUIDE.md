# Firefox Add-ons Publishing Guide

This guide will help you publish the LAN Jukebox Extension to Firefox Add-ons (AMO - addons.mozilla.org).

## Prerequisites

- [ ] Mozilla account (Firefox Account)
- [ ] No fees required (Firefox Add-ons is FREE!)

## Step 1: Create Mozilla Account

1. Go to [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
2. Sign in or create a Firefox Account
3. Accept the Developer Agreement

## Step 2: Prepare Your Extension Package

### Create the XPI file

```bash
cd lan-jukebox-extension-firefox
zip -r -FS ../lan-jukebox-extension-firefox.xpi * --exclude '*.git*' --exclude 'store-assets/*' --exclude '*.md'
```

Or include everything:
```bash
zip -r -FS ../lan-jukebox-extension-firefox.zip * --exclude '*.git*'
```

## Step 3: Submit to Firefox Add-ons

1. Go to [Submit New Add-on](https://addons.mozilla.org/developers/addon/submit/)
2. Choose "On this site" (for distribution on AMO)
3. Upload your `.zip` or `.xpi` file

## Step 4: Fill Out the Listing

### Basic Information

**Name:**
```
LAN Jukebox - YouTube Adder
```

**Summary (250 characters max):**
```
Add YouTube videos to your LAN Jukebox playlist with one click - perfect for LAN parties and shared music queues!
```

**Description:**
```
Transform your LAN party music experience! Seamlessly add YouTube videos to your shared jukebox queue directly from YouTube.

Features:
• One-click adding from any YouTube video
• Smart server detection with HTTP/HTTPS fallback
• Optional authentication support
• Dark theme UI
• Remembers your settings

Perfect for LAN parties, offices, and any gathering where you want shared music control!

Note: Requires a separate LAN Jukebox server (free and open source).
```

### Categories

- **Primary:** Music
- **Secondary:** Social & Communication

### Tags

```
youtube, jukebox, music, lan-party, playlist, queue
```

### License

```
ISC License (Other/Open Source)
```

### Privacy Policy

```
https://raw.githubusercontent.com/maribotto/lan-jukebox-extension-firefox/main/PRIVACY_POLICY.md
```

Or paste the content directly.

### Support Information

**Support Email:**
```
(your email or leave blank)
```

**Support Website:**
```
https://github.com/maribotto/lan-jukebox-extension-firefox
```

**Homepage:**
```
https://github.com/maribotto/lan-jukebox
```

### Version Notes

**Version 1.0.0:**
```
Initial release:
- One-click YouTube video adding
- HTTP/HTTPS automatic fallback
- Authentication support
- Dark theme UI
- Settings persistence
```

## Step 5: Upload Screenshots

Firefox Add-ons requires at least one screenshot.

Upload the screenshots from `store-assets/screenshots/`:
1. screenshot-1.png (Main interface)
2. screenshot-2.png (Success state)
3. screenshot-3.png (Authentication)

## Step 6: Technical Details

### Extension ID

Already set in manifest.json:
```
lan-jukebox@maribotto.com
```

### Permissions Explanation

Firefox will ask you to explain why you need each permission:

**activeTab:**
```
Required to detect when the user is on a YouTube page and read the video URL and title.
```

**storage:**
```
Required to save the user's jukebox server settings (address, credentials) locally on their device.
```

**Access your data for all websites (host_permissions):**
```
Required to communicate with the user's self-hosted jukebox server, which can be at any IP address on their local network. The extension only communicates with the server address the user configures.
```

## Step 7: Review Process

### Automated Review
- Firefox runs automated scans for security issues
- Usually completes in minutes

### Manual Review
- For new extensions or updates with new permissions
- Usually takes 1-7 days
- Reviewers check for:
  - Security issues
  - Privacy concerns
  - Compliance with policies
  - Code quality

## Step 8: After Approval

Once approved:
- Extension is live on https://addons.mozilla.org
- Users can install with one click
- You'll get an AMO URL like: `https://addons.mozilla.org/firefox/addon/lan-jukebox/`

## Updating the Extension

To publish updates:
1. Update version in `manifest.json`
2. Create new XPI/ZIP package
3. Upload to AMO Developer Hub
4. Fill in version notes
5. Submit for review

## Distribution Options

### On AMO (Recommended)
- Free
- Automatic updates
- Maximum visibility
- Mozilla security review

### Self-Distributed
- Host `.xpi` on your own server
- Users must allow installation
- No automatic updates
- More manual work

## Differences from Chrome

**Advantages:**
- ✅ FREE (no $5 fee)
- ✅ Faster review process
- ✅ More open and developer-friendly
- ✅ Better privacy practices

**Considerations:**
- Smaller user base than Chrome
- Requires extension ID in manifest
- Different review criteria

## Useful Links

- Developer Hub: https://addons.mozilla.org/developers/
- Extension Workshop: https://extensionworkshop.com/
- Policies: https://extensionworkshop.com/documentation/publish/add-on-policies/
- Review Guidelines: https://extensionworkshop.com/documentation/publish/reviewing-and-approving-extension/

## Checklist Before Submission

- [ ] manifest.json has correct version
- [ ] Extension ID is set in browser_specific_settings
- [ ] XPI/ZIP package created
- [ ] Screenshots prepared
- [ ] Privacy policy available
- [ ] Description written
- [ ] Support links provided
- [ ] Tested in Firefox

---

**Good luck with your submission! 🦊**

Firefox Add-ons is generally easier and faster than Chrome Web Store!
