# Quick Fix Guide - Document Picker Not Opening

## The Problem
Your emulator doesn't have storage permissions granted to the app, which prevents the document picker from opening.

## The Solution
I've updated the code to properly request storage permissions. Now you need to:

### Step 1: Reload the App
Since we modified the JavaScript code, you can just reload:

**Option A: Fast Refresh (Recommended)**
- Press `R` twice in the Metro bundler terminal
- Or shake the device and select "Reload"

**Option B: Full Rebuild (if Fast Refresh doesn't work)**
```bash
npm run android
```

### Step 2: Test the Document Picker
1. Open the app
2. Navigate to the Profile screen (chat interface)
3. Tap the **attachment icon** (📎)
4. Select **"Document (JD)"**
5. **A permission dialog should appear** - Tap "Allow" or "While using the app"
6. The document picker should now open!

### Step 3: If Permission Dialog Doesn't Appear
Manually grant permissions:
1. Go to your emulator's **Settings**
2. Navigate to **Apps** > **vprofile**
3. Tap **Permissions**
4. Find **Files and media** (or **Storage**)
5. Select **Allow**

Then try the document picker again.

## What Changed

### 1. New Permission Function
Added `requestStoragePermissions()` that:
- Detects Android version
- Requests READ_MEDIA_* permissions on Android 13+
- Requests READ_EXTERNAL_STORAGE on Android 12 and below
- Shows helpful error messages if permissions are denied

### 2. Improved Document Picker
- Changed from `pickSingle` to `pick` for better compatibility
- Removed unsupported `mode` parameter
- Added comprehensive logging
- Better error handling

### 3. Updated AndroidManifest.xml
Added all necessary permissions and queries for Android 11+

## Troubleshooting

### Issue: Permission dialog doesn't show
**Solution**: Grant permissions manually in Settings (see Step 3 above)

### Issue: "No apps can perform this action"
**Solution**: Your emulator might not have a document provider app. Try:
1. Use an emulator with Google Play Services
2. Or test on a physical device
3. Or I can create an alternative file input method

### Issue: App crashes when opening picker
**Solution**: Check the logs:
```bash
npx react-native log-android
```
Look for errors and share them with me.

## Testing Checklist
- [ ] App reloaded/rebuilt
- [ ] Permission dialog appeared and you tapped "Allow"
- [ ] Document picker opens successfully
- [ ] You can select a PDF/DOC/DOCX/TXT file
- [ ] File uploads and processes correctly

## Next Steps
After you reload the app and test, let me know:
1. Did the permission dialog appear?
2. Did you grant the permission?
3. Does the document picker open now?
4. Any error messages?

I'm here to help if you encounter any issues!
