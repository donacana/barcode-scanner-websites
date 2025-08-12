@echo off
echo ========================================
echo    📱 바코드 스캐너 웹사이트
echo ========================================
echo.
echo 🚀 Python 서버를 시작합니다...
echo.
echo 📋 필요한 패키지를 설치합니다...
pip install -r requirements.txt
echo.
echo 🌐 서버를 시작합니다...
echo 📱 브라우저에서 http://localhost:5000 으로 접속하세요
echo.
echo ⏹️  서버를 중지하려면 Ctrl+C를 누르세요
echo.
python app.py
pause 