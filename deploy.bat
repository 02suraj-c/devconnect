@echo off
echo ===================================================
echo   DevConnect - Push to GitHub (02suraj-c)
echo ===================================================
echo.
echo Checking git remote...
git remote remove origin 2>nul
git remote add origin https://github.com/02suraj-c/devconnect.git
echo.
echo Pushing code to https://github.com/02suraj-c/devconnect ...
git branch -M main
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] DevConnect successfully pushed to https://github.com/02suraj-c/devconnect !
) else (
    echo [NOTICE] If the repository does not exist yet:
    echo 1. Open https://github.com/new in your browser
    echo 2. Name repository: devconnect
    echo 3. Click 'Create repository'
    echo 4. Run this script again!
)
pause
