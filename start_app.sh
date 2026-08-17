#!/bin/bash

echo "Starting Miaoda React Admin..."
echo ""
echo "Select startup mode:"
echo "1. Normal Start (npm run dev)"
echo "2. Clean Start (Clear cache)"
echo "3. Debug Start (Verbose output)"
echo "4. Preview Build (npm run preview)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "Starting in normal mode..."
        npm run dev
        ;;
    2)
        echo "Starting with cache cleanup..."
        npm run dev:clean
        ;;
    3)
        echo "Starting in debug mode..."
        npm run dev:debug
        ;;
    4)
        echo "Starting preview..."
        npm run preview
        ;;
    *)
        echo "Invalid choice, defaulting to normal start..."
        npm run dev
        ;;
esac
