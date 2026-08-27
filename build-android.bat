@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo  Perler Bead Generator - Android Build
echo ============================================
echo.

REM --- 1. Check Node.js ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install it from https://nodejs.org/
  pause
  exit /b 1
)

REM --- 2. Check Java ---
where java >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Java not found. Install JDK 17+. Android Studio bundles one.
  pause
  exit /b 1
)

REM --- 3. Locate Android SDK ---
set "SDK_DIR=%ANDROID_HOME%"
if "%SDK_DIR%"=="" set "SDK_DIR=%ANDROID_SDK_ROOT%"
if "%SDK_DIR%"=="" if exist "%LOCALAPPDATA%\Android\Sdk" set "SDK_DIR=%LOCALAPPDATA%\Android\Sdk"
if "%SDK_DIR%"=="" (
  echo [ERROR] Android SDK not found. Install Android Studio and download the SDK.
  pause
  exit /b 1
)
set "SDK_FWD=%SDK_DIR:\=/%"
echo Android SDK: %SDK_DIR%
echo.

REM --- 4. npm install ---
if not exist node_modules (
  echo [1/5] Installing npm dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

REM --- 5. Prepare web assets ---
echo [2/5] Preparing web assets in www\ ...
if not exist www mkdir www
copy /y index.html www\ >nul
copy /y palettes.js www\ >nul
copy /y sw.js www\ >nul
copy /y manifest.json www\ >nul
if exist icons (
  if not exist www\icons mkdir www\icons
  copy /y icons\*.png www\icons\ >nul
)

REM --- 6. Add Android platform - first time only ---
if not exist android (
  echo [3/5] Creating Android project - first time only...
  set "ANDROID_HOME=%SDK_DIR%"
  set "ANDROID_SDK_ROOT=%SDK_DIR%"
  call npx cap add android
  if errorlevel 1 (
    echo [ERROR] cap add android failed.
    pause
    exit /b 1
  )
)

REM --- 7. Ensure local.properties points to the SDK ---
if exist android (
  > android\local.properties echo sdk.dir=%SDK_FWD%
)

REM --- 8. Sync web assets ---
echo [4/5] Syncing web assets...
call npx cap sync android
if errorlevel 1 (
  echo [ERROR] cap sync failed.
  pause
  exit /b 1
)

REM --- 9. Build debug APK ---
echo [5/5] Building debug APK - first build downloads Gradle, may take a while...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
  echo [ERROR] Build failed.
  cd ..
  pause
  exit /b 1
)
cd ..

echo.
echo ============================================
echo  BUILD SUCCESS
echo  APK: android\app\build\outputs\apk\debug\app-debug.apk
echo ============================================
pause
