class AdvancedBarcodeScanner {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.resultDiv = document.getElementById('result');
        
        this.stream = null;
        this.isScanning = false;
        this.scanInterval = null;
        this.apiUrl = 'http://localhost:5000/api/scan-barcode';
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.checkBackendHealth();
    }
    
    async checkBackendHealth() {
        try {
            const response = await fetch('http://localhost:5000/api/health');
            if (response.ok) {
                console.log('백엔드 서버가 정상적으로 실행 중입니다.');
            }
        } catch (error) {
            console.warn('백엔드 서버에 연결할 수 없습니다. 프론트엔드만 사용합니다.');
            this.resultDiv.innerHTML = `
                <div style="color: #ffc107; margin-bottom: 10px;">
                    ⚠️ 백엔드 서버가 실행되지 않았습니다.
                </div>
                <div style="font-size: 0.9rem; color: #6c757d;">
                    Python 서버를 시작하려면: python app.py
                </div>
            `;
        }
    }
    
    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startCamera());
        this.stopButton.addEventListener('click', () => this.stopCamera());
    }
    
    async startCamera() {
        try {
            this.resultDiv.textContent = '카메라를 시작하는 중...';
            this.startButton.disabled = true;
            
            // 카메라 스트림 시작
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            this.video.srcObject = this.stream;
            await this.video.play();
            
            // 바코드 스캔 시작
            this.startScanning();
            
            this.stopButton.disabled = false;
            this.resultDiv.textContent = '바코드를 카메라에 비추세요...';
            
        } catch (error) {
            console.error('카메라 시작 오류:', error);
            this.resultDiv.textContent = `카메라를 시작할 수 없습니다: ${error.message}`;
            this.startButton.disabled = false;
        }
    }
    
    startScanning() {
        if (this.isScanning) return;
        
        this.isScanning = true;
        
        // 주기적으로 프레임을 캡처하여 바코드 스캔
        this.scanInterval = setInterval(() => {
            this.captureAndScan();
        }, 1000); // 1초마다 스캔
    }
    
    async captureAndScan() {
        try {
            // 비디오 프레임을 캔버스에 그리기
            const context = this.canvas.getContext('2d');
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            context.drawImage(this.video, 0, 0);
            
            // 캔버스를 base64 이미지로 변환
            const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
            
            // 백엔드 API로 이미지 전송
            await this.sendImageToBackend(imageData);
            
        } catch (error) {
            console.error('이미지 캡처 오류:', error);
        }
    }
    
    async sendImageToBackend(imageData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.handleScanResult(result);
            } else {
                const error = await response.json();
                if (error.error !== '바코드를 찾을 수 없습니다.') {
                    console.log('스캔 결과:', error.error);
                }
            }
            
        } catch (error) {
            console.error('백엔드 통신 오류:', error);
        }
    }
    
    handleScanResult(result) {
        if (result.success && result.barcodes.length > 0) {
            // 스캔 중지
            this.stopCamera();
            
            const barcode = result.barcodes[0]; // 첫 번째 바코드 결과
            
            this.resultDiv.innerHTML = `
                <div style="color: #28a745; font-weight: bold; margin-bottom: 15px;">
                    ✅ 바코드 인식 성공!
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">
                        📊 바코드 정보
                    </div>
                    <div style="font-family: 'Courier New', monospace; font-size: 1.1rem; word-break: break-all;">
                        <strong>데이터:</strong> ${barcode.data}
                    </div>
                    <div style="margin-top: 8px; color: #6c757d;">
                        <strong>타입:</strong> ${barcode.type}
                    </div>
                    <div style="margin-top: 8px; color: #6c757d;">
                        <strong>위치:</strong> (${barcode.rect.x}, ${barcode.rect.y})
                    </div>
                </div>
                <div style="margin-top: 10px; font-size: 0.9rem; color: #6c757d;">
                    스캔 시간: ${new Date(result.timestamp).toLocaleString()}
                </div>
                <div style="margin-top: 15px;">
                    <button onclick="location.reload()" class="btn btn-primary">
                        🔄 새로 스캔하기
                    </button>
                </div>
            `;
            
            // 성공 사운드 재생
            this.playSuccessSound();
            
        } else if (result.error) {
            console.log('스캔 오류:', result.error);
        }
    }
    
    playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 성공음을 위한 멜로디
            const frequencies = [800, 1000, 1200, 1000, 800];
            const duration = 0.1;
            
            frequencies.forEach((freq, index) => {
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * duration);
            });
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + frequencies.length * duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + frequencies.length * duration);
            
        } catch (error) {
            console.log('사운드 재생을 지원하지 않습니다.');
        }
    }
    
    stopCamera() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.srcObject = null;
        this.isScanning = false;
        
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
    }
}

// 페이지 로드 시 고급 바코드 스캐너 초기화
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedBarcodeScanner();
});

// 페이지 떠날 때 카메라 정리
window.addEventListener('beforeunload', () => {
    if (window.advancedBarcodeScanner) {
        window.advancedBarcodeScanner.stopCamera();
    }
}); 