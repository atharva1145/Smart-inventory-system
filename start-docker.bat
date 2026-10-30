@echo off
title Smart Inventory & Order Management System - Docker Launcher
setlocal

echo ===============================================================================
echo        SMART INVENTORY ^& ORDER MANAGEMENT SYSTEM - DOCKER COMPOSE
echo ===============================================================================
echo.
echo Checking Docker engine status...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running or not installed.
    echo Please start Docker Desktop and run this script again.
    echo.
    pause
    exit /b 1
)

echo.
echo Starting all containers via Docker Compose (Postgres, Backend, Frontend)...
echo.
docker compose up --build

endlocal
