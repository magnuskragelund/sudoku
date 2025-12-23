# App Store API Integration

This directory contains app store copy in multiple languages and scripts to push them to the app stores via API.

## 📁 Files Structure

### Locale Files
- `locales/{locale}.json` - App store copy for each language (e.g., `locales/en-us.json`, `locales/de-de.json`)
- Each file contains: `appName`, `subtitle`, `description`, `keywords`, `whatsNew`, `promotionalText`

### Scripts
- `listLocales.js` - List all available locale files
- `verifyLocales.js` - **NEW!** Verify all locale files are valid before upload
- `generateLocales.js` - **NEW!** Generate translations from en-us.json using AI or prompts
- `pushToAppStore.js` - Push single locale to Apple App Store
- `pushToPlayStore.js` - Push single locale to Google Play Store
- `pushToBoth.js` - Push single locale to both stores
- `pushAllToAppStore.js` - Push **all** locales to Apple App Store
- `pushAllToPlayStore.js` - Push **all** locales to Google Play Store
- `pushAllToBoth.js` - Push **all** locales to both stores
- `addLocaleToLiveApp.js` - Special script for adding locales to live apps

## Setup

### Prerequisites

Install required dependencies:

```bash
npm install jsonwebtoken axios googleapis --save-dev
```

### Apple App Store Connect API Setup

1. **Generate API Key:**
   - Log in to [App Store Connect](https://appstoreconnect.apple.com/)
   - Navigate to "Users and Access" → "Keys" tab
   - Click "+" to create a new key
   - Set access level to "App Manager"
   - Download the `.p8` key file
   - Note the **Key ID** and **Issuer ID**

2. **Store Credentials:**
   - Place the `.p8` key file in `admin/app stores/credentials/` (add to .gitignore)
   - Or set as environment variables

3. **Configure:**
   Create `admin/app stores/config.json`:
   ```json
   {
     "apple": {
       "keyId": "YOUR_KEY_ID",
       "issuerId": "YOUR_ISSUER_ID",
       "keyPath": "./credentials/AuthKey_XXXXXXXXXX.p8",
       "appId": "YOUR_APP_ID"
     }
   }
   ```

### Google Play Developer API Setup

1. **Create Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Google Play Android Developer API"
   - Create service account credentials
   - Download JSON credentials file

2. **Grant API Access:**
   - Go to [Google Play Console](https://play.google.com/console/)
   - Settings → API access
   - Link the service account
   - Grant "Release manager" permissions

3. **Store Credentials:**
   - Place credentials JSON in `admin/app stores/credentials/` (add to .gitignore)

4. **Configure:**
   Add to `admin/app stores/config.json`:
   ```json
   {
     "google": {
       "keyPath": "./credentials/google-play-service-account.json",
       "packageName": "com.yourcompany.sudoku"
     }
   }
   ```

## 🚀 Usage

### Verify Locale Files (Recommended First Step!)

Before uploading, verify all locale files are valid:

```bash
node admin/app\ stores/verifyLocales.js
```

This checks:
- ✅ All required fields are present
- ✅ Field lengths are within limits
- ✅ No typos or common errors
- ✅ Keywords are optimized

### List Available Locales

See what locale files you have:

```bash
node admin/app\ stores/listLocales.js
```

### Push Single Locale

Push one specific language to a store:

```bash
# Apple App Store
node admin/app\ stores/pushToAppStore.js en-us
node admin/app\ stores/pushToAppStore.js de-de

# Google Play Store
node admin/app\ stores/pushToPlayStore.js en-us
node admin/app\ stores/pushToPlayStore.js de-de

# Both stores at once
node admin/app\ stores/pushToBoth.js en-us
```

### Push All Locales (Recommended!)

The scripts automatically detect all `{locale}.json` files and push them all:

```bash
# Push all locales to Apple App Store
node admin/app\ stores/pushAllToAppStore.js

# Push all locales to Google Play Store
node admin/app\ stores/pushAllToPlayStore.js

# Push all locales to BOTH stores
node admin/app\ stores/pushAllToBoth.js
```

This is the easiest way to update all your app store listings at once! 🎉

### Add New Locale

To add a new language:

1. Create a new JSON file in `locales/`: `{language}-{country}.json` (e.g., `locales/fr-fr.json`, `locales/es-es.json`)
2. Copy the structure from an existing locale file
3. Translate the content
4. Run `node admin/app\ stores/pushAllToAppStore.js` (or push individually)

**Example for French:**

Create `locales/fr-fr.json`:

```json
{
  "appName": "Sudoku Face Off",
  "subtitle": "Sudoku, pas de publicités",
  "description": "Jouez au Sudoku comme il se doit...",
  "keywords": "sudoku, puzzle, sans pub..."
}
```

The script will automatically find and push it!

### Generate Translations

Use `generateLocales.js` to automatically generate translations from `en-us.json`:

**Generate prompt for manual translation:**
```bash
# Generate a prompt file for a single locale
node admin/app\ stores/generateLocales.js --prompt fr-fr

# Generate prompts for all missing locales
node admin/app\ stores/generateLocales.js --all
```

This creates a `{locale}-prompt.txt` file that you can use with any AI assistant (like Cursor, ChatGPT, Claude, etc.) to get translations.

**Use AI API directly (requires API keys):**
```bash
# Using OpenAI (requires OPENAI_API_KEY env var)
export OPENAI_API_KEY=your-key-here
node admin/app\ stores/generateLocales.js --api openai fr-fr

# Using Anthropic (requires ANTHROPIC_API_KEY env var)
export ANTHROPIC_API_KEY=your-key-here
node admin/app\ stores/generateLocales.js --api anthropic de-de
```

The script uses guidelines from `locales/locale-generation-prompt.json` to ensure high-quality, culturally appropriate translations.

**Workflow:**
1. Update `locales/en-us.json` with your latest copy
2. Generate translations: `node generateLocales.js --all` (or use API)
3. Review generated locale files
4. Verify: `node verifyLocales.js`
5. Push to stores: `node pushAllToBoth.js`

## ⚠️ API Limitations

### Support URL

**Apple does not allow setting the Support URL via API.** You must set it manually:

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app → **App Information** tab
3. Scroll to **"Support URL"**
4. Enter: `https://sudokufaceoff.com`
5. Click **"Save"**

This only needs to be done **once** and applies to all versions and locales.

The `supportUrl` field in locale JSON files is kept for documentation purposes but is not pushed via API.

### What the API CAN Update

✅ Description (per locale)  
✅ Keywords (per locale)  
✅ What's New / Release Notes (per locale)  
✅ Promotional Text (per locale)  
✅ Subtitle (per locale)  
✅ Screenshots (via separate endpoints)  
❌ Support URL (manual only)  
❌ Privacy Policy URL (manual only)

## Security Notes

- **Never commit** `.p8` files or service account JSON files to git
- Add `admin/app stores/credentials/` and `admin/app stores/config.json` to `.gitignore`
- Use environment variables for CI/CD pipelines
- Rotate API keys periodically

## 🌍 Locale Codes

Both stores use the same locale format: `language-COUNTRY`

### Common Locales

| Language | Locale Code | File Name |
|----------|-------------|-----------|
| English (US) | en-US | `locales/en-us.json` |
| English (UK) | en-GB | `locales/en-gb.json` |
| German | de-DE | `locales/de-de.json` |
| French | fr-FR | `locales/fr-fr.json` |
| Spanish | es-ES | `locales/es-es.json` |
| Italian | it-IT | `locales/it-it.json` |
| Portuguese (Brazil) | pt-BR | `locales/pt-br.json` |
| Japanese | ja-JP | `locales/ja-jp.json` |
| Korean | ko-KR | `locales/ko-kr.json` |
| Chinese (Simplified) | zh-CN | `locales/zh-cn.json` |
| Chinese (Traditional) | zh-TW | `locales/zh-tw.json` |

**Note:** All locale files live in the `locales/` directory. File names use lowercase (e.g., `en-us.json`), but the scripts automatically format them correctly for the APIs (`en-US`).

## 📝 Locale File Format

Each locale file must follow this structure:

```json
{
  "appName": "Your App Name",
  "subtitle": "Short subtitle (max 30 chars for App Store)",
  "description": "Full description with sections separated by \\n\\n",
  "keywords": "keyword1, keyword2, keyword3 (max 100 chars for App Store)",
  "whatsNew": "What's new in this version (optional)",
  "promotionalText": "Promotional text shown above description (optional, max 170 chars)"
}
```

### Tips:
- **App Name**: Usually stays the same across locales
- **Subtitle**: Keep under 30 characters for Apple App Store
- **Description**: Use `\n\n` for paragraph breaks, include section headers
- **Keywords**: Comma-separated, max 100 characters for Apple

## 🔄 Workflow Examples

### Update All Locales After Content Change

```bash
# Edit your locale files (locales/en-us.json, locales/de-de.json, etc.)
# Then push all at once:
node admin/app\ stores/pushAllToBoth.js
```

### Add a New Language

```bash
# 1. Create new locale file
cp admin/app\ stores/locales/en-us.json admin/app\ stores/locales/fr-fr.json

# 2. Edit the French content
# (edit locales/fr-fr.json)

# 3. Push everything
node admin/app\ stores/pushAllToBoth.js
```

### Test Single Locale Before Full Push

```bash
# 1. Verify all files first
node admin/app\ stores/verifyLocales.js

# 2. Test new German copy
node admin/app\ stores/pushToAppStore.js de-de

# 3. If it works, push everything
node admin/app\ stores/pushAllToBoth.js
```

## 📋 Quick Reference

**Before uploading, always verify:**
```bash
node admin/app\ stores/verifyLocales.js
```

**See what will be uploaded:**
```bash
node admin/app\ stores/listLocales.js
```

**Upload all locales:**
```bash
node admin/app\ stores/pushAllToAppStore.js
```

**For detailed upload status, see:** `UPLOAD_READY.md`

