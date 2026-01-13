@echo off
REM SiliconFlow Image MCP - Windows wrapper script
REM Handles both local development and global installation on Windows

setlocal

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"

REM In production (npm install), dist/index.js is in node_modules/siliconflow-image-mcp/dist/
REM The bin script is in node_modules/siliconflow-image-mcp/bin/
if exist "%SCRIPT_DIR%..\dist\index.js" (
    REM Production mode - run compiled JavaScript
    node "%SCRIPT_DIR%..\dist\index.js" %*
) else if exist "%SCRIPT_DIR%..\..\dist\index.js" (
    REM Alternative production path
    node "%SCRIPT_DIR%..\..\dist\index.js" %*
) else (
    echo Error: Could not find siliconflow-image-mcp dist/index.js
    echo Searched in: %SCRIPT_DIR%..\dist\index.js
    exit /b 1
)
