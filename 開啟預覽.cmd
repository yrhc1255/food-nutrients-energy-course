@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "PREVIEW_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%PREVIEW_NODE%" set "PREVIEW_NODE=node"
"%PREVIEW_NODE%" start-preview.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
start "" "http://127.0.0.1:5173/"
endlocal
