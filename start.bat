@echo off
title Fund Monitor - Local Dev

:: 设置 uv 路径
set PATH=%USERPROFILE%\.local\bin;%PATH%

echo Starting Fund Monitor...

:: 启动后端
echo [1/2] Starting Backend (port 8000)...
cd /d %~dp0backend
start "Fund Monitor Backend" /min cmd /c ".venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000"

:: 等待后端启动
timeout /t 3 /nobreak > nul

:: 启动前端
echo [2/2] Starting Frontend (port 5173)...
cd /d %~dp0frontend
start "Fund Monitor Frontend" /min cmd /c "npm run dev"

:: 等待前端启动
timeout /t 4 /nobreak > nul

:: 打开浏览器
echo Opening browser...
start http://localhost:5200

echo.
echo ========================================
echo  Fund Monitor is running!
echo  Frontend: http://localhost:5200
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Close this window to keep servers running.
echo To stop: close the "Backend" and "Frontend" windows in taskbar.
pause
