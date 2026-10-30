@echo off
title Smart Inventory & Order Management System - Stop Services
setlocal

echo ===============================================================================
echo        SMART INVENTORY ^& ORDER MANAGEMENT SYSTEM - STOP SERVICES
echo ===============================================================================
echo.
echo Stopping local development servers (Port 8080 and Port 5173)...
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 " ^| findstr LISTENING') do (
    echo Stopping Backend on Port 8080 [PID %%a]...
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr LISTENING') do (
    echo Stopping Frontend on Port 5173 [PID %%a]...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo All services stopped successfully.
echo ===============================================================================
echo.
pause
endlocal
