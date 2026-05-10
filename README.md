# Matter Code Vault HA (v3.2.1)

> Matter Device Management & QR Code Backup/Restore Tool (v3.2.1)

Matter Code Vault is a powerful Home Assistant add-on designed for seamless Matter device management. Securely back up complex pairing codes and QR codes, and manage them intelligently using AI-driven features.

---

## 🚀 Installation

To install this add-on, add the following URL to your Home Assistant **Add-on Store** > **Repositories**:

```text
https://github.com/dicapriokim/Matter-Code-Vault-Pcroom.git
```

1. Navigate to **Settings** > **Add-ons** > **Add-on Store** in Home Assistant.
2. Click the **Menu** (3 dots) in the top right corner and select **Repositories**.
3. Paste the URL above and click **Add**.
4. Find **Matter Code Vault** in the list and click **Install**.

---

## ✨ Key Features (v3.0.5 Update)

- **Local AI Engine (Ollama)**: Transitioned from Google Gemini to local LLM integration for enhanced privacy and offline support.
- **Intelligent Data Cleaning**: Automatically corrects OCR typos (e.g., 0 to 8) and infers device brands using the `antigravity-model`.
- **Modular Architecture**: Re-engineered core logic into a modular structure (`state.js`, `ui.js`, `ai.js`, `scanner.js`) for better maintainability.
- **Dual Storage Vault**: Implemented a redundant saving system using both HA Backend API (SSOT) and Browser `localStorage` (Cache).
- **Smart Registration**: Scan via webcam, upload photos, or use manual input with AI-powered name recommendations.
- **Dynamic UI**: Automatically hides empty locations and supports drag-and-drop sorting.
- **Creator Mode (🛡️)**: Precisely masks sensitive QR/pairing codes for safe screen sharing.
- **Label Ready**: Generate and download high-quality QR images optimized for label printers.

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

---

## ⚙️ Configuration

To enable AI features, ensure your **Ollama** server is running:
1. Default URL: `http://192.168.0.32:11434` (configurable in `state.js`).
2. Required Models: `moondream` (Vision), `antigravity-model:3b` (Reasoning).

> **Note**: Core features (registration, backup, etc.) function perfectly even without an AI server.

---

## ⚠️ Important Notes

- **Data Safety**: Data is stored at `/data/matter_data.json`. Always export a JSON backup before deleting the add-on to prevent data loss.
- **Camera Access**: Requires **HTTPS** or **localhost** due to browser security policies. For HTTP access, use the 'Photo Upload' feature.
- **Integrity Check**: Unauthorized modification of core files will trigger a security alert, disabling the app.

---

**Designed by 돼지지렁이**
