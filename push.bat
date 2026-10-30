@echo off
title Smart Inventory & Order Management System - Git Sync & Push
setlocal EnableDelayedExpansion

echo ===============================================================================
echo        SMART INVENTORY ^& ORDER MANAGEMENT SYSTEM - GIT AUTO-SYNC
echo ===============================================================================
echo.
echo  Target Repository: https://github.com/atharva1145/Smart-inventory-system
echo  Target Branch:     main
echo.

:: Check git status
git status --porcelain > "%TEMP%\git_status.tmp"
set HAS_CHANGES=0
for %%A in ("%TEMP%\git_status.tmp") do if %%~zA GTR 0 set HAS_CHANGES=1
del "%TEMP%\git_status.tmp" 2>nul

if %HAS_CHANGES% EQU 1 (
    echo [INFO] Detected modified or new files in workspace:
    echo.
    git status -s
    echo.
    set /p "COMMIT_MSG=Enter commit message (or press Enter for auto-message): "
    if "!COMMIT_MSG!"=="" (
        for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
        set "COMMIT_MSG=feat: update and improvements on !datetime:~0,4!-!datetime:~4,2!-!datetime:~6,2! !datetime:~8,2!:!datetime:~10,2!"
    )

    echo.
    echo Staging and committing changes...
    git add .
    git commit -m "!COMMIT_MSG!"
) else (
    echo [INFO] Working tree is clean. Pushing existing local commits...
)

echo.
echo Pushing to GitHub (origin main)...
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo  SUCCESS: All changes and improvements pushed to GitHub!
    echo  Repository: https://github.com/atharva1145/Smart-inventory-system
    echo ===============================================================================
) else (
    echo.
    echo ===============================================================================
    echo  NOTICE: Push did not complete.
    echo  If this is your first push or credentials expired:
    echo  1. Run this script in your terminal: .\push.bat
    echo  2. Complete the browser login prompt that appears.
    echo ===============================================================================
)

echo.
pause
endlocal
