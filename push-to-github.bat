@echo off
title Push ViralClip AI to GitHub
color 0b
echo ========================================================
echo   Pushing ViralClip AI to GitHub Repository
echo   Repo: https://github.com/nischalbhupathi6-alt/viralclip-ai.git
echo ========================================================
echo.
cd /d "%~dp0"
git remote remove origin 2>nul
git remote add origin https://github.com/nischalbhupathi6-alt/viralclip-ai.git
git branch -M main
echo Pushing code to main branch...
echo (If a GitHub sign-in window appears, click "Sign in with your browser")
echo.
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   SUCCESS! All code is pushed to your GitHub repository!
    echo   Check it out: https://github.com/nischalbhupathi6-alt/viralclip-ai
    echo ========================================================
) else (
    echo [ERROR] Push failed or was cancelled. Try running again.
)
echo.
pause
