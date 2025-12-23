#!/bin/bash

# Document Picker Fix Verification Script
# This script helps verify that the document picker is properly configured

echo "=========================================="
echo "Document Picker Configuration Checker"
echo "=========================================="
echo ""

# Check if Android manifest has the required permissions
echo "1. Checking AndroidManifest.xml for required permissions..."
MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"

if [ -f "$MANIFEST_FILE" ]; then
    echo "✓ AndroidManifest.xml found"
    
    # Check for queries declaration
    if grep -q "<queries>" "$MANIFEST_FILE"; then
        echo "✓ Queries declaration found"
    else
        echo "✗ Missing queries declaration (required for Android 11+)"
    fi
    
    # Check for READ_MEDIA permissions
    if grep -q "READ_MEDIA" "$MANIFEST_FILE"; then
        echo "✓ READ_MEDIA permissions found (Android 13+)"
    else
        echo "⚠ READ_MEDIA permissions not found (needed for Android 13+)"
    fi
    
    # Check for OPEN_DOCUMENT intent
    if grep -q "OPEN_DOCUMENT" "$MANIFEST_FILE"; then
        echo "✓ OPEN_DOCUMENT intent found"
    else
        echo "✗ Missing OPEN_DOCUMENT intent"
    fi
else
    echo "✗ AndroidManifest.xml not found at $MANIFEST_FILE"
fi

echo ""
echo "2. Checking package.json for document picker dependency..."
if grep -q "@react-native-documents/picker" package.json; then
    echo "✓ @react-native-documents/picker is installed"
    VERSION=$(grep "@react-native-documents/picker" package.json | sed 's/.*: "\(.*\)".*/\1/')
    echo "  Version: $VERSION"
else
    echo "✗ @react-native-documents/picker not found in package.json"
fi

echo ""
echo "3. Checking if node_modules are installed..."
if [ -d "node_modules/@react-native-documents/picker" ]; then
    echo "✓ Document picker module found in node_modules"
else
    echo "✗ Document picker module not found. Run: npm install"
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Clean and rebuild the Android app:"
echo "   cd android && ./gradlew clean && cd .."
echo "   npm run android"
echo ""
echo "2. If the app is already running, stop it and rebuild"
echo ""
echo "3. Grant storage permissions manually:"
echo "   Settings > Apps > vprofile > Permissions > Files and media > Allow"
echo ""
echo "4. Test the document picker by tapping the attachment icon"
echo ""
echo "5. Check logs with: npx react-native log-android"
echo "=========================================="
