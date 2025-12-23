#!/bin/bash

echo "=========================================="
echo "Document Picker Diagnostic Tool"
echo "=========================================="
echo ""

# Check if emulator is running
echo "1. Checking if emulator is running..."
EMULATOR_STATUS=$(adb devices | grep -v "List" | grep "emulator")
if [ -z "$EMULATOR_STATUS" ]; then
    echo "✗ No emulator detected. Please start your emulator first."
    exit 1
else
    echo "✓ Emulator is running"
    echo "  $EMULATOR_STATUS"
fi

echo ""
echo "2. Checking if app is installed..."
APP_INSTALLED=$(adb shell pm list packages | grep "com.vprofile")
if [ -z "$APP_INSTALLED" ]; then
    echo "✗ App is not installed"
    echo "  Run: npm run android"
    exit 1
else
    echo "✓ App is installed: $APP_INSTALLED"
fi

echo ""
echo "3. Checking app permissions..."
adb shell dumpsys package com.vprofile | grep -A 10 "granted=true"

echo ""
echo "4. Checking for document provider apps..."
echo "Looking for apps that can handle document opening..."
adb shell pm list packages | grep -E "(documents|files|downloads)"

echo ""
echo "5. Checking if Files app is available..."
FILES_APP=$(adb shell pm list packages | grep "com.android.documentsui")
if [ -z "$FILES_APP" ]; then
    echo "⚠ DocumentsUI (Files app) not found on emulator"
    echo "  This is likely the issue! The emulator needs a document provider."
else
    echo "✓ DocumentsUI found: $FILES_APP"
fi

echo ""
echo "6. Attempting to launch document picker intent..."
echo "Testing if the OPEN_DOCUMENT intent works..."
adb shell am start -a android.intent.action.OPEN_DOCUMENT -t "*/*" 2>&1 | head -5

echo ""
echo "=========================================="
echo "Diagnostic Summary"
echo "=========================================="
echo ""
echo "If DocumentsUI is NOT found, the emulator doesn't have"
echo "a document picker app installed. This is common in some"
echo "Android emulator images."
echo ""
echo "SOLUTIONS:"
echo "=========================================="
echo ""
echo "Option 1: Use a different emulator image"
echo "  - Create a new AVD with Google Play Services"
echo "  - Google Play images include the Files app"
echo ""
echo "Option 2: Install Files app on current emulator"
echo "  - Download Google Files APK"
echo "  - Install: adb install files.apk"
echo ""
echo "Option 3: Test on a physical device"
echo "  - Physical devices always have document providers"
echo "  - Connect via USB and enable USB debugging"
echo ""
echo "Option 4: Use alternative file picker"
echo "  - We can modify the code to use a simpler approach"
echo "  - Or use react-native-image-picker for files"
echo ""
echo "=========================================="
echo ""
echo "Now checking React Native logs..."
echo "Press Ctrl+C to stop"
echo ""
sleep 2
npx react-native log-android | grep -i "document"
