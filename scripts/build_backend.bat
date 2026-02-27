@echo off
REM Build backend exe with PyInstaller (Windows)
pyinstaller --onefile run_server.py --name run_server





echo Backend exe generated in dist\run_server.exe)  exit /b %ERRORLEVEL%  echo PyInstaller failednif %ERRORLEVEL% NEQ 0 (