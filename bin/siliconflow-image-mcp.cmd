@echo off
REM SiliconFlow Image MCP - Windows launcher
setlocal
set "SCRIPT_DIR=%~dp0"
node "%SCRIPT_DIR%..\dist\index.js" %*
