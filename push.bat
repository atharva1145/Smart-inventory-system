@echo off
title Push to GitHub
setlocal

echo Pushing main branch to https://github.com/atharva1145/Smart-inventory-system ...
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================
    echo  SUCCESS: Code pushed to GitHub successfully!
    echo =======================================================
) else (
    echo.
    echo =======================================================
    echo  If authentication failed, please sign in via browser
    echo  or use a GitHub Personal Access Token (PAT).
    echo =======================================================
)

echo.
pause
endlocal
