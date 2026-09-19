@echo off
title Alexios Guard App Server
echo ===================================================
echo   Starting Guard App local server on port 5173...
echo   Open: http://localhost:5173/
echo ===================================================
powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause
