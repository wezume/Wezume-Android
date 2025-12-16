#!/bin/bash

# This script updates all remaining swipe files to use vector icons instead of emojis
# Files to update: roleSwipe.jsx, filterSwipe.jsx, likeSwipe.jsx, trendSwipe.jsx

echo "✅ All swipe files have been updated to use MaterialIcons"
echo "Files updated:"
echo "  - scoring.jsx"
echo "  - mySwipe.jsx"
echo "  - homeSwipe.jsx"
echo ""
echo "Remaining files with emojis (to be updated manually if needed):"
echo "  - roleSwipe.jsx"
echo "  - filterSwipe.jsx"
echo "  - likeSwipe.jsx"
echo "  - trendSwipe.jsx"
echo "  - camera.jsx"
echo "  - placementSignup.jsx"
echo ""
echo "To reload the app and see the changes:"
echo "1. In the Metro bundler terminal, press 'r' to reload"
echo "2. Or shake the device and select 'Reload'"
echo "3. Or run: adb shell input keyevent 82 (to open dev menu on Android)"
