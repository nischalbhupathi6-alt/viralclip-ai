@echo off
echo ========================================================
echo   ViralClip AI - GitHub Push & Cloud Deployment Helper
echo ========================================================
echo.
set /p REPO_URL="Enter your GitHub repository URL (e.g. https://github.com/your-username/viralclip-ai.git): "
if "%REPO_URL%"=="" (
    echo [ERROR] No repository URL entered. Exiting.
    pause
    exit /b 1
)

git init
git add .
git commit -m "Deploy ViralClip AI with SEO, sitemap, and KineMaster Pro Editor"
git branch -M main
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main --force

echo.
echo ========================================================
echo   Repository pushed successfully!
echo   Now go to https://render.com or https://railway.app
echo   and connect your repository to deploy in 1 click!
echo ========================================================
pause
