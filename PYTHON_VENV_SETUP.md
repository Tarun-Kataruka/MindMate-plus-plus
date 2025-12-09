# Python Virtual Environment Setup Guide

## Problem
Your venv files were accidentally pushed to Git. This guide will help you:
1. Remove venv from Git tracking
2. Set up proper .gitignore
3. Recreate venv properly

## Step-by-Step Solution

### Step 1: Remove venv from Git (Already Tracked Files)

Run these commands in your terminal from the project root:

```bash
# Navigate to project root
cd MindMate-plus-plus

# Remove venv from Git tracking (but keep local files)
git rm -r --cached server/ai_models/chatbot/venv

# If you have other venv folders, remove them too
git rm -r --cached server/ai_models/*/venv

# Commit the removal
git add .gitignore
git commit -m "Remove venv from Git tracking and update .gitignore"

# Push changes
git push
```

### Step 2: Verify .gitignore is Working

```bash
# Check what Git will track
git status

# You should NOT see any venv/ folders listed
```

### Step 3: Recreate Virtual Environment (If Needed)

For each Python project (e.g., chatbot):

```bash
# Navigate to the Python project
cd server/ai_models/chatbot

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Deactivate when done
deactivate
```

### Step 4: Create requirements.txt (If Not Exists)

If you don't have a requirements.txt file:

```bash
# Activate venv first
venv\Scripts\activate

# Generate requirements.txt from installed packages
pip freeze > requirements.txt

# Commit this file (it's small and needed)
git add requirements.txt
git commit -m "Add requirements.txt for Python dependencies"
```

## Best Practices

### ✅ DO Commit:
- `requirements.txt` - List of dependencies
- `.gitignore` - Ignore rules
- Your Python source code (`.py` files)
- Configuration files

### ❌ DON'T Commit:
- `venv/` or `env/` folders
- `__pycache__/` folders
- `*.pyc` files
- `.env` files with secrets

## Project Structure (Recommended)

```
server/
├── ai_models/
│   ├── chatbot/
│   │   ├── venv/              # ❌ NOT in Git
│   │   ├── __pycache__/       # ❌ NOT in Git
│   │   ├── requirements.txt   # ✅ In Git
│   │   ├── app.py            # ✅ In Git
│   │   └── .env              # ❌ NOT in Git
│   └── other_model/
│       └── ...
```

## Troubleshooting

### If venv still shows in git status:

```bash
# Force remove from cache
git rm -rf --cached server/ai_models/chatbot/venv
git commit -m "Force remove venv"
```

### If .gitignore not working:

```bash
# Clear Git cache completely
git rm -r --cached .
git add .
git commit -m "Refresh Git cache with new .gitignore"
```

### Check what's being ignored:

```bash
# Test if a file is ignored
git check-ignore -v server/ai_models/chatbot/venv/Scripts/python.exe
```

## Quick Reference Commands

```bash
# Create venv
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install packages
pip install flask google-generativeai python-dotenv

# Save dependencies
pip freeze > requirements.txt

# Install from requirements
pip install -r requirements.txt

# Deactivate
deactivate
```

## Why This Matters

- **Smaller repo**: venv can be 100+ MB
- **Faster cloning**: Others don't download your packages
- **Cross-platform**: Different OS need different venv builds
- **Security**: Avoid accidentally committing secrets in packages
- **Clean history**: No massive commits with package files

## After Setup

Your Git should now:
- ✅ Ignore all venv folders automatically
- ✅ Only track your source code
- ✅ Be much smaller and cleaner
- ✅ Work across different machines
