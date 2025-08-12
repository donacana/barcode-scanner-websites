# 📱 바코드 스캐너 웹사이트

HTML, CSS, JavaScript, Python을 사용하여 만든 바코드 인식 웹사이트입니다.

## ✨ 주요 기능

- 📷 실시간 카메라 스트리밍
- 🔍 자동 바코드 인식 (QR코드, 바코드 등)
- 💻 프론트엔드 전용 모드 (ZXing 라이브러리)
- 🐍 Python 백엔드 연동 모드 (고정밀 인식)
- 🎵 성공 시 사운드 알림
- 📱 반응형 디자인 (모바일 친화적)

## 🚀 설치 및 실행

### 1. Python 백엔드 실행 (권장)

```bash
# 프로젝트 디렉토리로 이동
cd barcode-scanner-website

# Python 가상환경 생성 (선택사항)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python app.py
```

### 2. 웹사이트 접속

브라우저에서 `http://localhost:5000`으로 접속하세요.

## 📁 파일 구조

```
barcode-scanner-website/
├── index.html              # 메인 HTML 파일
├── style.css               # CSS 스타일
├── script.js               # 프론트엔드 전용 바코드 스캐너
├── advanced-script.js      # Python 백엔드 연동 스캐너
├── app.py                  # Flask 백엔드 서버
├── requirements.txt        # Python 의존성
└── README.md              # 프로젝트 설명서
```

## 🔧 사용법

### 기본 사용법

1. **카메라 시작**: "📷 카메라 시작" 버튼 클릭
2. **권한 허용**: 브라우저에서 카메라 접근 권한 허용
3. **바코드 스캔**: 바코드를 카메라에 비추기
4. **결과 확인**: 자동으로 인식된 바코드 정보 표시
5. **카메라 중지**: "⏹️ 카메라 중지" 버튼으로 종료

### 고급 기능 (Python 백엔드)

- 더 정확한 바코드 인식
- 바코드 타입 및 위치 정보 제공
- 처리된 이미지 표시
- API 엔드포인트 제공

## 🌐 지원하는 바코드 형식

- **1D 바코드**: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, Interleaved 2 of 5
- **2D 바코드**: QR Code, Data Matrix, PDF417, Aztec
- **기타**: Codabar, ITF, RSS 등

## ⚠️ 주의사항

1. **HTTPS 필요**: 카메라 접근을 위해 HTTPS 환경이 필요합니다 (localhost 제외)
2. **권한 허용**: 카메라 접근 권한을 허용해야 합니다
3. **브라우저 지원**: 최신 브라우저에서 최적의 성능을 제공합니다

## 🛠️ 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: 모던 디자인 및 반응형 레이아웃
- **JavaScript ES6+**: 모듈화된 클래스 기반 구조
- **ZXing**: 클라이언트 사이드 바코드 인식

### 백엔드
- **Python 3.8+**: 서버 사이드 로직
- **Flask**: 웹 프레임워크
- **OpenCV**: 이미지 처리
- **pyzbar**: 바코드 디코딩
- **NumPy**: 수치 계산

## 🔍 문제 해결

### 카메라가 시작되지 않는 경우
1. 브라우저에서 카메라 권한을 허용했는지 확인
2. 다른 앱에서 카메라를 사용 중인지 확인
3. 브라우저를 새로고침하고 다시 시도

### 바코드가 인식되지 않는 경우
1. 바코드가 선명하게 보이는지 확인
2. 조명이 충분한지 확인
3. 카메라와 바코드 사이 거리 조정
4. Python 백엔드 모드로 전환 시도

## 📱 모바일 최적화

- 터치 친화적 UI
- 반응형 디자인
- 후면 카메라 우선 사용
- 모바일 브라우저 최적화

## 🔄 업데이트 및 개선

### 향후 계획
- [ ] 다중 바코드 동시 인식
- [ ] 바코드 생성 기능
- [ ] 스캔 히스토리 저장
- [ ] 다양한 이미지 형식 지원
- [ ] API 문서화

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

---

**즐거운 바코드 스캔 되세요! 🎉** 

## 🚀 배포 방법

### Render 배포 (권장)

1. **Render 계정 생성**
   - [render.com](https://render.com)에서 계정 생성

2. **GitHub 저장소 연결**
   - GitHub에 코드를 푸시
   - Render에서 GitHub 저장소 연결

3. **서비스 생성**
   - Web Service 선택
   - Python 환경 선택
   - 자동으로 `render.yaml` 설정 적용

4. **배포 완료**
   - 제공된 URL로 접속하여 테스트

### 로컬 실행

```bash
# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python app.py
```

브라우저에서 `http://localhost:5000`으로 접속하세요. 