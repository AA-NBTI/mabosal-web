@echo off
title Claude Code - Fast Fix Mode (단일 파일 및 빠른 버그 픽스)
echo ========================================================
echo  Claude Code [Fast Mode] 시작 중
echo  용도: 가볍고 빠른 버그 픽스, 단일 파일 수정, 실시간 검수
echo ========================================================

:: 1. 중계 프록시(포트 4000) 동작 여부 확인 및 무소음 백그라운드 자동 실행
netstat -ano | findstr ":4000" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    echo [1/2] 중계 프록시 서버를 백그라운드에서 자동 실행합니다...
    wscript.exe "%~dp0scratch\launch_proxy_background.vbs"
    timeout /t 3 /nobreak >nul
) else (
    echo [1/2] 중계 프록시 서버가 이미 정상 작동 중입니다.
)

:: 2. Claude Code 환경변수 설정
set ANTHROPIC_BASE_URL=http://127.0.0.1:4000
set ANTHROPIC_API_KEY=sk-ant-free-gemini-proxy

echo [2/2] 클로드 코드(Fast Mode)를 실행합니다!
echo ========================================================
echo.

"%USERPROFILE%\.antigravity\extensions\anthropic.claude-code-2.1.201-win32-x64\resources\native-binary\claude.exe"
pause
