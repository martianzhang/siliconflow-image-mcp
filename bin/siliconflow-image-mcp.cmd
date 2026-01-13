@echo off
REM Windows launcher for siliconflow-image-mcp
REM This wrapper is used by npm on Windows systems
setlocal
node "%~dp0..\dist\index.js" %*
