@echo off
title Smart Inventory & Order Management System - Launcher
setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

cls
echo ===============================================================================
echo        SMART INVENTORY ^& ORDER MANAGEMENT SYSTEM - QUICK LAUNCHER
echo ===============================================================================
echo.
echo  Root Directory: "%ROOT_DIR%"
echo.
echo  Starting services in separate windows:
echo    [1/2] Backend API (Spring Boot 3.3.5 / Java 21) on Port 8080...
echo    [2/2] Frontend UI (React 18 / Vite) on Port 5173...
echo.

:: Launch Backend in its own window
start "Smart Inventory - Backend (Port 8080)" /D "%BACKEND_DIR%" cmd /k "title Backend [Port 8080] && echo Starting Spring Boot... && mvnw.cmd spring-boot:run"

:: Small pause to let backend initialize
timeout /t 3 /nobreak >nul

:: Launch Frontend in its own window
start "Smart Inventory - Frontend (Port 5173)" /D "%FRONTEND_DIR%" cmd /k "title Frontend [Port 5173] && echo Starting Vite Dev Server... && npm run dev"

echo ===============================================================================
echo  SERVICES LAUNCHED!
echo ===============================================================================
echo.
echo   * Frontend Web UI:      http://localhost:5173
echo   * Backend REST API:     http://localhost:8080
echo   * Swagger / OpenAPI:    http://localhost:8080/swagger-ui.html
echo   * Actuator Health:      http://localhost:8080/actuator/health
echo   * H2 DB Console:        http://localhost:8080/h2-console
echo                           (JDBC URL: jdbc:h2:mem:smart_inventory, User: sa, Pass: blank)
echo.
echo -------------------------------------------------------------------------------
echo  DEMO CREDENTIALS:
echo    - System Admin:        admin   / Password@123
echo    - Inventory Manager:   manager / Password@123
echo    - Sales Staff:         sales   / Password@123
echo    - Auditor / Viewer:    viewer  / Password@123
echo -------------------------------------------------------------------------------
echo.
echo  Press any key to open http://localhost:5173 in your default browser...
pause >nul

start http://localhost:5173

echo.
echo  Keep the Backend and Frontend command windows open while working.
echo  To shut down services later, you can close their windows or run stop.bat.
echo.
endlocal
