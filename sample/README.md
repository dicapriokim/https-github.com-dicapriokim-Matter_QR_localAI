# Matter Code Vault

> Matter Device Management & QR Code Backup/Restore Tool (v2.22.7)

Matter Code Vault is a powerful Home Assistant add-on designed for seamless Matter device management. Securely back up complex pairing codes and QR codes, and manage them intelligently using AI-driven features.

---

## 🚀 Installation

To install this add-on, add the following URL to your Home Assistant **Add-on Store** > **Repositories**:

```text
https://github.com/dicapriokim/Matter-Code-Vault
```

1. Navigate to **Settings** > **Add-ons** > **Add-on Store** in Home Assistant.
2. Click the **Menu** (3 dots) in the top right corner and select **Repositories**.
3. Paste the URL above and click **Add**.
4. Find **Matter Code Vault** in the list and click **Install**.

---

## ✨ Key Features

- **Smart Registration**: Scan via webcam, upload photos, or use manual input with AI-powered name recommendations via Google Gemini.
- **Dynamic UI**: Automatically hides empty locations and supports drag-and-drop sorting for a customized workspace.
- **VID Management**: Automatically identifies and learns Manufacturer Vendor IDs (VID) from QR payloads.
- **Creator Mode (🛡️)**: Precisely masks sensitive QR/pairing codes for safe screen sharing or streaming.
- **Label Ready**: Generate and download high-quality QR images optimized for label printers.
- **Backup & Restore**: Export or import your entire device database as a JSON file.

---

## 📖 Quick Start Guide

### 1. Initial Setup
Before adding devices, define your ecosystem in the **[Settings ⚙️]** menu to ensure data consistency:
- **Locations**: Living Room, Bedroom, Entrance, etc.
- **Manufacturers**: Aqara, Eve, Nanoleaf, etc.
- **Platforms**: Apple Home, SmartThings, Home Assistant, etc.

### 2. Adding a Device
Click the **[+]** button. You can use your camera or upload a photo from your gallery.
- **AI Suggestion**: Click the 'Magic Wand' icon to receive a recommended name based on device type and location.
- **Manual Entry**: Pairing codes must be entered as an 11-digit number without hyphens or spaces.

---

## ⚙️ Configuration

To enable AI features, you must provide a **Google Gemini API Key**:
1. Go to the **Configuration** tab of the add-on in Home Assistant.
2. Enter your key in the `api_key` field.

> **Note**: Core features (registration, backup, etc.) function perfectly even without an API key.

---

## ⚠️ Important Notes

- **Data Safety**: Data is stored at `/data/matter_data.json`. Always export a JSON backup before deleting the add-on to prevent data loss.
- **Camera Access**: Requires **HTTPS** or **localhost** due to browser security policies. For HTTP access, use the 'Photo Upload' feature.
- **Integrity Check**: Unauthorized modification of core files will trigger a security alert, disabling the app.

---

**Designed by 돼지지렁이**

---

## 📄 라이선스 (License)

이 프로젝트는 MIT 라이선스 하에 배포됩니다.  
Copyright (c) 2026 **돼지지렁이**. All rights reserved.

---

### 👑 Contributor
- **돼지지렁이** (Antigravity Developer)
