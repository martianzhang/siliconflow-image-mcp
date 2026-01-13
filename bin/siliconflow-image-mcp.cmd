@echo off
REM SiliconFlow Image MCP - Windows wrapper script
REM Handles both local development and global installation on Windows

setlocal

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"

REM Check if we're in a development environment (source files exist)
if exist "%SCRIPT_DIR%..\src\index.ts" (
    REM Development mode - run TypeScript source directly
    npx tsx "%SCRIPT_DIR%..\src\index.ts" %*
) else if exist "%SCRIPT_DIR%..\dist\index.js" (
    REM Production mode - run compiled JavaScript
    node "%SCRIPT_DIR%..\dist\index.js" %*
) else (
    echo ❌ Error: Could not find siliconflow-image-mcp source files
    echo Searched in: %SCRIPT_DIR%..\src\index.ts and %SCRIPT_DIR%..\dist\index.js
    exit /b 1
)
