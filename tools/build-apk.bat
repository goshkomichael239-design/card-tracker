@echo off
rem ============================================================================
rem  Card Tracker: builds a debug APK you can install on a phone.
rem  Needs two things installed once (see ANDROID.md):
rem    1) Node.js LTS            https://nodejs.org
rem    2) Android Studio         https://developer.android.com/studio
rem       (its first start downloads the Android SDK; the JDK comes with it)
rem  Run by double click. The first run downloads a lot (10-20 minutes);
rem  the next ones take a couple of minutes.
rem  Result: Card-Tracker.apk in the project folder.
rem ============================================================================
setlocal EnableExtensions
cd /d "%~dp0.."
echo.
echo === Card Tracker: building the Android APK ===
echo Project folder: %CD%
echo.

rem ---- Node.js ---------------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js was not found. Install Node.js LTS from https://nodejs.org
  echo     then close this window and run build-apk.bat again.
  goto :fail
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [!] npm was not found. Reinstall Node.js LTS from https://nodejs.org
  goto :fail
)
for /f "delims=" %%V in ('node --version') do echo Node.js %%V

rem ---- Android SDK -------------------------------------------------------------
set "SDK="
if defined ANDROID_HOME if exist "%ANDROID_HOME%\platforms" set "SDK=%ANDROID_HOME%"
if not defined SDK if defined ANDROID_SDK_ROOT if exist "%ANDROID_SDK_ROOT%\platforms" set "SDK=%ANDROID_SDK_ROOT%"
if not defined SDK if exist "%LOCALAPPDATA%\Android\Sdk\platforms" set "SDK=%LOCALAPPDATA%\Android\Sdk"
if not defined SDK if exist "D:\Android\Sdk\platforms" set "SDK=D:\Android\Sdk"
if not defined SDK if exist "E:\Android\Sdk\platforms" set "SDK=E:\Android\Sdk"
if not defined SDK (
  echo [!] The Android SDK was not found. Install Android Studio, start it once and
  echo     let its setup wizard download the SDK ^(Standard install^).
  echo     If you put the SDK in another folder, set the ANDROID_HOME variable to it.
  goto :fail
)
echo Android SDK: %SDK%

rem ---- JDK: Gradle for Android wants JDK 21 (Android Studio's own JDK is 25: too new) ----
set "JDK="
for /d %%D in ("%ProgramFiles%\Eclipse Adoptium\jdk-21*" "%ProgramFiles%\Java\jdk-21*" "%ProgramFiles%\Microsoft\jdk-21*" "%ProgramFiles%\Zulu\zulu-21*" "D:\Eclipse Adoptium\jdk-21*" "D:\Java\jdk-21*") do (
  if not defined JDK if exist "%%~D\bin\java.exe" set "JDK=%%~D"
)
if not defined JDK (
  echo [!] JDK 21 was not found. Install "Temurin 21 JDK" ^(x64, .msi^) from
  echo     https://adoptium.net/temurin/releases/?version=21 with the default folder,
  echo     then run this file again.
  echo     ^(Android Studio's own JDK 25 may not work: Gradle does not know it yet.^)
  goto :fail
)
set "JAVA_HOME=%JDK%"
set "PATH=%JDK%\bin;%PATH%"
echo JDK: %JDK%
echo.
rem ---- Packages -----------------------------------------------------------------
echo [1/6] Installing packages...
call npm install
if errorlevel 1 goto :fail
if not exist node_modules\@capacitor\android (
  echo      Adding Capacitor ^(the Android wrapper^)...
  call npm install @capacitor/core @capacitor/android
  if errorlevel 1 goto :fail
  call npm install -D @capacitor/cli
  if errorlevel 1 goto :fail
)
if not exist capacitor.config.json (
  node -e "require('fs').writeFileSync('capacitor.config.json', JSON.stringify({appId:'app.cardtracker',appName:'Card Tracker',webDir:'dist'},null,2)+'\n')"
)

rem ---- The web part --------------------------------------------------------------
echo.
echo [2/6] Building the app...
call npm run build
if errorlevel 1 goto :fail

rem ---- The Android project ------------------------------------------------------------
echo.
echo [3/6] Preparing the Android project...
if not exist android\app (
  call npx cap add android
  if errorlevel 1 goto :fail
)
rem The launcher icon of the app (instead of the default one).
xcopy /e /y /i /q "tools\android-icons\res" "android\app\src\main\res" >nul
call npx cap sync android
if errorlevel 1 goto :fail
> android\local.properties echo sdk.dir=%SDK:\=\\%

rem ---- Licences (once) ------------------------------------------------------------------
echo.
echo [4/6] Accepting Android licences...
if exist "%SDK%\cmdline-tools\latest\bin\sdkmanager.bat" (
  (for /l %%i in (1,1,40) do @echo y) | call "%SDK%\cmdline-tools\latest\bin\sdkmanager.bat" --licenses >nul 2>nul
) else (
  echo      cmdline-tools are not installed: if the build below stops on licences, open
  echo      Android Studio ^> More Actions ^> SDK Manager ^> SDK Tools ^> tick
  echo      "Android SDK Command-line Tools", Apply, and run this file again.
)

rem ---- The signing key (made once, kept OUTSIDE the project) ----------------------------
set "KEYDIR=%CARD_TRACKER_SIGNING_DIR%"
if not defined KEYDIR set "KEYDIR=%USERPROFILE%\card-tracker-signing"
set "KEYSTORE=%KEYDIR%\card-tracker-release.jks"
set "KEYPASS=%KEYDIR%\card-tracker-release.pass"
set "SIGN=0"
if exist "%KEYSTORE%" if exist "%KEYPASS%" set "SIGN=1"
if "%SIGN%"=="1" (
  echo Signing key: %KEYSTORE%
) else (
  echo [!] No signing key in %KEYDIR%: the APK will be a DEBUG one, which Android
  echo     distrusts more and which cannot be updated over a release one.
)

rem ---- The APK ------------------------------------------------------------------------------
echo.
echo [5/6] Building the APK ^(the first time Gradle downloads a lot^)...
pushd android
if "%SIGN%"=="1" (
  call .\gradlew.bat assembleRelease --no-daemon
) else (
  call .\gradlew.bat assembleDebug --no-daemon
)
if errorlevel 1 (
  popd
  goto :fail
)
popd

echo.
echo [6/6] Done.
if "%SIGN%"=="1" goto :sign
set "APK=android\app\build\outputs\apk\debug\app-debug.apk"
if not exist "%APK%" (
  echo [!] The APK was not found where expected: %APK%
  goto :fail
)
copy /y "%APK%" "%CD%\Card-Tracker.apk" >nul
goto :finished

:sign
set "UNSIGNED=android\app\build\outputs\apk\release\app-release-unsigned.apk"
if not exist "%UNSIGNED%" (
  echo [!] The release APK was not found where expected: %UNSIGNED%
  goto :fail
)
set "BT="
for /d %%B in ("%SDK%\build-tools\*") do set "BT=%%B"
if not defined BT (
  echo [!] The Android build-tools were not found in %SDK%\build-tools.
  echo     Android Studio ^> SDK Manager ^> SDK Tools ^> tick "Android SDK Build-Tools", Apply.
  goto :fail
)
echo Signing with build-tools %BT%
"%BT%\zipalign.exe" -f -p 4 "%UNSIGNED%" "android\app\build\outputs\apk\release\aligned.apk"
if errorlevel 1 goto :fail
call "%BT%\apksigner.bat" sign --ks "%KEYSTORE%" --ks-key-alias card-tracker --ks-pass file:"%KEYPASS%" --out "%CD%\Card-Tracker.apk" "android\app\build\outputs\apk\release\aligned.apk"
if errorlevel 1 goto :fail
echo.
echo Certificate of the signed APK ^(should be the same every time^):
call "%BT%\apksigner.bat" verify --print-certs "%CD%\Card-Tracker.apk" | findstr /i "SHA-256 Verifies"

:finished
echo.
echo  APK: %CD%\Card-Tracker.apk
echo  Copy it to the phone ^(cable, Telegram, Drive^) and open it there.
echo  The phone will ask to allow installing from this source: allow once.
echo.
explorer /select,"%CD%\Card-Tracker.apk"
pause
exit /b 0

:fail
echo.
echo Something went wrong ^(see the lines above^). Send them to Claude.
pause
exit /b 1
