# Document Picker Fix - README

## Problem
The document picker in the Android app was not opening when users tried to select documents (PDF, DOC, DOCX, TXT files).

## Root Causes Identified
1. **Missing Android 11+ Queries Declaration**: Android 11 and above require explicit `<queries>` declarations in the AndroidManifest.xml for apps to interact with document providers.
2. **Missing Android 13+ Permissions**: Android 13 introduced granular media permissions (READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO) that need to be declared.
3. **Insufficient Error Handling**: The code didn't have proper permission checks before opening the document picker.

## Changes Made

### 1. AndroidManifest.xml Updates
**File**: `android/app/src/main/AndroidManifest.xml`

Added the following permissions and queries:

```xml
<!-- Permissions for Android 13+ (API 33+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

<!-- For accessing all files (optional, use with caution) -->
<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />

<!-- Queries for document providers (Android 11+) -->
<queries>
    <intent>
        <action android:name="android.intent.action.OPEN_DOCUMENT" />
        <data android:mimeType="*/*" />
    </intent>
    <intent>
        <action android:name="android.intent.action.GET_CONTENT" />
        <data android:mimeType="*/*" />
    </intent>
</queries>
```

**Why this matters**:
- The `<queries>` block tells Android 11+ that your app needs to interact with document picker apps
- The READ_MEDIA_* permissions are required for Android 13+ to access files
- Without these, the document picker simply won't open or will crash silently

### 2. Profile.jsx Improvements
**File**: `src/template/Profile.jsx`

Enhanced the `pickDocument` function with:
- **Permission checks**: Now explicitly checks for storage permissions before opening the picker
- **Better error handling**: More detailed error messages to help diagnose issues
- **Enhanced logging**: Added comprehensive console logs to track the document selection flow
- **User-friendly alerts**: Clear messages when permissions are missing or errors occur

Key improvements:
```javascript
// Check permissions before opening picker
if (Platform.OS === 'android') {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    Alert.alert('Permission Required', 'Storage permission is required to access documents.');
    return;
  }
}

// Added mode parameter for clarity
const res = await DocumentPicker.pickSingle({
  type: [types.pdf, types.doc, types.docx, types.plainText],
  copyTo: 'cachesDirectory',
  mode: 'open',
});
```

## How to Test

### Step 1: Rebuild the App
Since we modified the AndroidManifest.xml, you need to rebuild the app:

```bash
# Clean the build
cd android && ./gradlew clean && cd ..

# Rebuild and run
npm run android
```

### Step 2: Grant Permissions
When the app launches:
1. Go to your device **Settings**
2. Navigate to **Apps** > **vprofile**
3. Tap on **Permissions**
4. Find **Files and media** (or **Storage**)
5. Select **Allow** or **Allow all files**

### Step 3: Test Document Picker
1. Open the app and navigate to the Profile screen
2. Tap the **attachment icon** (📎) in the input area
3. Select **Document (JD)** from the options
4. The document picker should now open successfully
5. Select a PDF, DOC, DOCX, or TXT file
6. The file should be uploaded and processed

### Step 4: Check Logs (if issues persist)
If you encounter any issues, check the logs:

```bash
# View React Native logs
npx react-native log-android

# Or use adb directly
adb logcat | grep -i "DocumentPicker"
```

Look for these log messages:
- `Opening document picker...` - Picker is being initialized
- `DocumentPicker result:` - File was selected successfully
- `Picked URI:` - File URI is being processed
- `Prepared file for upload:` - File is ready for upload

## Troubleshooting

### Issue: Document picker still doesn't open
**Solution**: 
1. Ensure you've rebuilt the app after the AndroidManifest changes
2. Check that permissions are granted in Settings
3. Try uninstalling and reinstalling the app
4. Check logs for specific error messages

### Issue: "Permission Required" alert appears
**Solution**: 
Grant storage permissions manually:
- Settings > Apps > vprofile > Permissions > Files and media > Allow

### Issue: "No usable URI from document picker"
**Solution**: 
This usually means the file couldn't be copied to the cache directory. Check:
1. App has sufficient storage space
2. Cache directory is accessible
3. Try selecting a different file

### Issue: Upload fails after selecting document
**Solution**: 
This is likely a backend issue. Check:
1. Backend server is running
2. `/api/search/jd` endpoint is accessible
3. Network connectivity
4. File format is supported (PDF, DOC, DOCX, TXT)

## Technical Details

### Supported File Types
- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Plain Text (`.txt`)

### Document Picker Library
- **Package**: `@react-native-documents/picker`
- **Version**: `^11.0.3`
- **Documentation**: https://github.com/react-native-documents/picker

### Android API Levels
- **Minimum SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Special handling for**:
  - Android 11+ (API 30+): Requires `<queries>` declaration
  - Android 13+ (API 33+): Requires granular media permissions

## Additional Notes

### Security Considerations
The `MANAGE_EXTERNAL_STORAGE` permission is a powerful permission that grants access to all files. In production, you may want to:
1. Remove this permission if not needed
2. Request it only when necessary
3. Explain to users why it's needed

### File Handling
The document picker uses `copyTo: 'cachesDirectory'` which:
- Copies the selected file to the app's cache directory
- Ensures reliable access to the file
- Works across different Android versions
- Files are automatically cleaned up by the system when needed

### Performance
- File copying happens in the background
- Large files may take a moment to copy
- The loading indicator shows progress during upload

## Verification Script
A verification script has been created at `check-document-picker.sh` to help verify the configuration:

```bash
chmod +x check-document-picker.sh
./check-document-picker.sh
```

This script checks:
- AndroidManifest.xml has required permissions
- Queries declaration is present
- Document picker package is installed
- Node modules are properly installed

## Summary
The document picker should now work correctly on all Android versions (5.0+) with proper permission handling and error messages. If you encounter any issues, check the logs and ensure permissions are granted.
