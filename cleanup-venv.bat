@echo off
echo ========================================
echo Cleaning up venv from Git tracking
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Removing venv from Git cache...
git rm -r --cached server/ai_models/chatbot/venv 2>nul
if %errorlevel% equ 0 (
    echo ✓ Removed chatbot venv from Git
) else (
    echo ! chatbot venv not found or already removed
)

echo.
echo Step 2: Adding .gitignore changes...
git add .gitignore

echo.
echo Step 3: Checking status...
git status

echo.
echo ========================================
echo Next steps:
echo 1. Review the changes above
echo 2. Run: git commit -m "Remove venv from Git tracking"
echo 3. Run: git push
echo ========================================
echo.
pause
