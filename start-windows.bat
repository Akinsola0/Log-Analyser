@echo off
REM Double-click launcher for Windows.
REM Sets up a virtual environment on first run, then starts the web app.
setlocal
cd /d "%~dp0"
title Log Analyser

REM The 'py' launcher is more reliable than 'python' on Windows, because a
REM bare 'python' can hit the Microsoft Store stub instead of a real install.
where py >nul 2>&1
if %errorlevel%==0 (set "PY=py") else (set "PY=python")

if not exist ".venv\Scripts\python.exe" (
  echo Setting up for first use. This takes a minute...
  echo.
  %PY% -m venv .venv
  if errorlevel 1 goto :nopython
)

set "VENV_PY=.venv\Scripts\python.exe"

REM Only install when something is actually missing, so restarts are instant.
"%VENV_PY%" -c "import flask, yaml" >nul 2>&1
if errorlevel 1 (
  echo Installing dependencies...
  "%VENV_PY%" -m pip install --quiet --disable-pip-version-check -r requirements.txt
  if errorlevel 1 goto :nodeps
)

echo.
echo   Starting Log Analyser. Your browser should open automatically.
echo   If it does not, go to:  http://127.0.0.1:5000
echo.
echo   Leave this window open while you use it. Press Ctrl+C to stop.
echo.
start "" http://127.0.0.1:5000
"%VENV_PY%" run.py
goto :end

:nopython
echo.
echo   Python was not found on this PC.
echo.
echo   Install it from https://www.python.org/downloads/
echo   IMPORTANT: tick "Add Python to PATH" on the first screen of the installer.
echo.
pause
goto :end

:nodeps
echo.
echo   Could not install the dependencies (Flask and PyYAML).
echo   If you are behind a corporate proxy or firewall, that is the usual cause.
echo.
pause

:end
endlocal
