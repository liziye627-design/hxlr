@echo off
echo Starting Miaoda React Admin...
echo.
echo Select startup mode:
echo 1. Normal Start (npm run dev)
echo 2. Clean Start (Clear cache)
echo 3. Debug Start (Verbose output)
echo 4. Preview Build (npm run preview)
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" goto normal
if "%choice%"=="2" goto clean
if "%choice%"=="3" goto debug
if "%choice%"=="4" goto preview
goto normal

:normal
echo Starting in normal mode...
npm run dev
goto end

:clean
echo Starting with cache cleanup...
npm run dev:clean
goto end

:debug
echo Starting in debug mode...
npm run dev:debug
goto end

:preview
echo Starting preview...
npm run preview
goto end

:end
pause
