#!/usr/bin/env pwsh
# PowerShell wrapper for Windows
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$distPath = Join-Path $PSScriptRoot "..\dist\index.js"
& node $distPath $args
