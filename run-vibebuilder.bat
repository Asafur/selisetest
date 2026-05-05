@echo off
setlocal

title VibeBuilder - SELISE Blocks

cd /d "%~dp0"

set "APP_URL=http://localhost:3000/vibe-builder"
set "ADMIN_SCRIPT=%~dp0scripts\make-asafur-admin.ps1"
set "ADMIN_BROWSER_SCRIPT=%~dp0scripts\capture-selise-admin-token.mjs"
set "ADMIN_TOKEN_SCRIPT=%~dp0scripts\run-admin-with-token.ps1"

echo.
echo ==========================================
echo   VibeBuilder - SELISE Blocks
echo ==========================================
echo.

if /I "%~1"=="admin" goto make_admin
if /I "%~1"=="admin-browser" goto make_admin_browser
if /I "%~1"=="admin-token" goto make_admin_token
if /I "%~1"=="setup" goto setup

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Install Node.js first, then run this file again.
  echo.
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo Dev server already appears to be running on port 3000.
  echo Opening %APP_URL%
  start "" "%APP_URL%"
  echo.
  pause
  exit /b 0
)

if not exist "node_modules\" (
  echo node_modules was not found. Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Check the output above.
    pause
    exit /b 1
  )
)

echo Starting Vite dev server on http://localhost:3000
echo A browser window will open after the server starts.
echo If you are not logged in, SELISE Construct will open login first and return to VibeBuilder after authentication.
echo.
echo Maintenance:
echo   run-vibebuilder.bat setup   installs dependencies, lints, and builds
echo   run-vibebuilder.bat admin   assigns asafur.rahman@northsouth.edu to Admin when SELISE_ACCESS_TOKEN is set
echo   run-vibebuilder.bat admin-token   prompts for a SELISE token/PAT and assigns Admin without saving it
echo   run-vibebuilder.bat admin-browser   opens Edge, captures an admin token locally, and assigns Admin
echo.

start "VibeBuilder Dev Server" cmd /k "cd /d ""%~dp0"" && npm run dev"

timeout /t 5 /nobreak >nul
start "" "%APP_URL%"

echo.
echo Keep the VibeBuilder Dev Server window open while testing.
pause
exit /b 0

:make_admin_token
if not exist "%ADMIN_TOKEN_SCRIPT%" (
  echo Token prompt helper was not found at %ADMIN_TOKEN_SCRIPT%
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%ADMIN_TOKEN_SCRIPT%"
set "ADMIN_TOKEN_EXIT=%ERRORLEVEL%"
echo.
if not "%ADMIN_TOKEN_EXIT%"=="0" (
  echo Token-based admin assignment did not complete.
  pause
  exit /b %ADMIN_TOKEN_EXIT%
)
pause
exit /b 0

:make_admin_browser
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js first, then run this file again.
  pause
  exit /b 1
)
if not exist "%ADMIN_BROWSER_SCRIPT%" (
  echo Browser admin helper was not found at %ADMIN_BROWSER_SCRIPT%
  pause
  exit /b 1
)
node "%ADMIN_BROWSER_SCRIPT%"
set "ADMIN_BROWSER_EXIT=%ERRORLEVEL%"
echo.
if not "%ADMIN_BROWSER_EXIT%"=="0" (
  echo Browser-based admin assignment did not complete.
  pause
  exit /b %ADMIN_BROWSER_EXIT%
)
pause
exit /b 0

:setup
where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Install Node.js first, then run this file again.
  pause
  exit /b 1
)
echo Installing/updating dependencies...
call npm install
if errorlevel 1 goto setup_failed
echo Running lint...
call npm run lint
if errorlevel 1 goto setup_failed
echo Running production build...
call npm run build
if errorlevel 1 goto setup_failed
echo.
echo Setup checks passed.
pause
exit /b 0

:setup_failed
echo.
echo Setup failed. Check the output above.
pause
exit /b 1

:make_admin
if not exist "%ADMIN_SCRIPT%" (
  echo Admin helper was not found at %ADMIN_SCRIPT%
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%ADMIN_SCRIPT%"
set "ADMIN_EXIT=%ERRORLEVEL%"
echo.
if not "%ADMIN_EXIT%"=="0" (
  echo Admin assignment did not complete.
  pause
  exit /b %ADMIN_EXIT%
)
pause
exit /b 0
