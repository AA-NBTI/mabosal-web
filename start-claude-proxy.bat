@echo off
title Claude Code - Google AI Studio Gemini Proxy
echo ========================================================
echo  Claude Code ^<--^> Google AI Studio (Gemini) Proxy
echo  포트: 4000
echo  모델 매핑: Claude 3.5 / 3.7 Sonnet -^> Gemini 3.8 Flash
echo ========================================================
python "%~dp0scratch\run_litellm_proxy.py"
pause
