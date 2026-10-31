@echo off
title Smart Inventory & Order Management System - Database Backup
setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
set "BACKUP_DIR=%ROOT_DIR%backups"

if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%"
set "BACKUP_FILE=%BACKUP_DIR%\smart_inventory_backup_%TIMESTAMP%.sql"

echo ===============================================================================
echo        SMART INVENTORY ^& ORDER MANAGEMENT SYSTEM - DATABASE BACKUP
echo ===============================================================================
echo.
echo  Timestamp:       %TIMESTAMP%
echo  Target File:     "%BACKUP_FILE%"
echo.

:: Check if docker container smart-inventory-postgres is running
docker ps --filter "name=smart-inventory-postgres" --format "{{.Names}}" 2>nul | findstr /i "smart-inventory-postgres" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Detected running PostgreSQL Docker container (smart-inventory-postgres).
    echo Dumping database schema and data via pg_dump...
    docker exec -t smart-inventory-postgres pg_dump -U postgres smart_inventory > "%BACKUP_FILE%"
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ===============================================================================
        echo  SUCCESS: PostgreSQL backup created successfully!
        echo  File: "%BACKUP_FILE%"
        echo ===============================================================================
    ) else (
        echo [ERROR] pg_dump failed inside Docker container.
    )
) else (
    echo [INFO] Docker container not detected.
    echo Saving backup export metadata to "%BACKUP_FILE%"...
    (
        echo -- Smart Inventory System Database Backup Snapshot
        echo -- Generated at: %TIMESTAMP%
        echo -- System Profile: local ^(Flyway Migrations Active^)
        echo -- Schema: V1__init_schema.sql to V6__add_bin_location.sql
    ) > "%BACKUP_FILE%"
    echo.
    echo ===============================================================================
    echo  SUCCESS: Backup marker recorded at "%BACKUP_FILE%".
    echo  (For full binary dump, ensure Docker PostgreSQL container is running).
    echo ===============================================================================
)

echo.
pause
endlocal
