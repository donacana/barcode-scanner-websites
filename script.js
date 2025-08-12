class BarcodeScanner {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.resultDiv = document.getElementById('result');
        this.productInfoDiv = document.getElementById('productInfo');
        
        this.stream = null;
        this.codeReader = null;
        this.isScanning = false;
        
        this.initialize();
    }
    
    initialize() {
        // ZXing 라이브러리 초기화
        if (typeof ZXing !== 'undefined') {
            this.codeReader = new ZXing.BrowserMultiFormatReader();
            this.setupEventListeners();
        } else {
            this.resultDiv.textContent = 'ZXing 라이브러리를 불러올 수 없습니다.';
            this.startButton.disabled = true;
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
                    facingMode: 'environment', // 후면 카메라 우선
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            this.video.srcObject = this.stream;
            this.video.play();
            
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
    
    async startScanning() {
        if (this.isScanning) return;
        
        this.isScanning = true;
        
        try {
            // ZXing을 사용한 바코드 스캔
            const result = await this.codeReader.decodeFromVideoDevice(
                null, // 기본 카메라
                this.video,
                (result, error) => {
                    if (result) {
                        this.handleScanResult(result.text);
                    }
                    if (error && error.name !== 'NotFoundException') {
                        console.error('스캔 오류:', error);
                    }
                }
            );
        } catch (error) {
            console.error('스캔 시작 오류:', error);
            this.resultDiv.textContent = '스캔을 시작할 수 없습니다.';
        }
    }
    
    handleScanResult(barcodeText) {
        this.resultDiv.innerHTML = `
            <div style="color: #28a745; font-weight: bold; margin-bottom: 10px;">
                ✅ 바코드 인식 성공!
            </div>
            <div style="font-size: 1.2rem; word-break: break-all;">
                ${barcodeText}
            </div>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #6c757d;">
                스캔 시간: ${new Date().toLocaleTimeString()}
            </div>
        `;
        
        // 성공 사운드 재생 (선택사항)
        this.playSuccessSound();
        
        // 제품 정보 가져오기
        this.fetchProductInfo(barcodeText);
        
        // 자동으로 스캔 중지 (선택사항)
        // setTimeout(() => this.stopCamera(), 3000);
    }
    
    async fetchProductInfo(barcode) {
        try {
            this.resultDiv.innerHTML += `
                <div style="margin-top: 15px; color: #007bff; font-weight: bold;">
                    🔍 제품 정보를 가져오는 중...
                </div>
            `;
            
            // 현재 비디오 프레임을 캡처하여 서버로 전송
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = this.video.videoWidth;
            canvas.height = this.video.videoHeight;
            context.drawImage(this.video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            const response = await fetch('/api/scan-barcode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayProductInfo(data.barcodes[0]);
            } else {
                this.resultDiv.innerHTML += `
                    <div style="margin-top: 15px; color: #dc3545; font-weight: bold;">
                        ❌ 제품 정보를 가져올 수 없습니다: ${data.error}
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('제품 정보 가져오기 오류:', error);
            this.resultDiv.innerHTML += `
                <div style="margin-top: 15px; color: #dc3545; font-weight: bold;">
                    ❌ 제품 정보를 가져오는 중 오류가 발생했습니다.
                </div>
            `;
        }
    }
    
    displayProductInfo(barcodeData) {
        const productInfo = barcodeData.product_info;
        
        if (!productInfo) {
            this.resultDiv.innerHTML += `
                <div style="margin-top: 15px; color: #ffc107; font-weight: bold;">
                    ⚠️ 이 바코드에 대한 제품 정보를 찾을 수 없습니다.
                </div>
            `;
            return;
        }
        
        // 제품 정보 표시
        document.getElementById('productName').textContent = productInfo.name;
        document.getElementById('productBrand').querySelector('span').textContent = productInfo.brand;
        document.getElementById('productIngredients').querySelector('span').textContent = productInfo.ingredients;
        
        // 영양 정보 표시
        document.getElementById('calories').textContent = this.formatNutritionValue(productInfo.calories);
        document.getElementById('carbohydrates').textContent = this.formatNutritionValue(productInfo.carbohydrates);
        document.getElementById('protein').textContent = this.formatNutritionValue(productInfo.protein);
        document.getElementById('fat').textContent = this.formatNutritionValue(productInfo.fat);
        document.getElementById('sugars').textContent = this.formatNutritionValue(productInfo.sugars);
        document.getElementById('sodium').textContent = this.formatNutritionValue(productInfo.sodium);
        
        // 제품 이미지 표시
        const productImage = document.getElementById('productImage');
        if (productInfo.image_url) {
            productImage.src = productInfo.image_url;
            productImage.style.display = 'block';
        } else {
            productImage.style.display = 'none';
        }
        
        // 제품 정보 컨테이너 표시
        this.productInfoDiv.style.display = 'block';
        
        // 결과에 성공 메시지 추가
        this.resultDiv.innerHTML += `
            <div style="margin-top: 15px; color: #28a745; font-weight: bold;">
                🎉 제품 정보를 성공적으로 가져왔습니다!
            </div>
        `;
    }
    
    formatNutritionValue(value) {
        if (value === '알 수 없음' || value === null || value === undefined) {
            return '-';
        }
        
        // 숫자인 경우 소수점 1자리까지 표시
        if (typeof value === 'number') {
            return value.toFixed(1);
        }
        
        return value;
    }
    
    playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('사운드 재생을 지원하지 않습니다.');
        }
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.codeReader) {
            this.codeReader.reset();
        }
        
        this.video.srcObject = null;
        this.isScanning = false;
        
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
        this.resultDiv.textContent = '카메라가 중지되었습니다.';
    }
}

// 페이지 로드 시 바코드 스캐너 초기화
document.addEventListener('DOMContentLoaded', () => {
    new BarcodeScanner();
});

// 페이지 떠날 때 카메라 정리
window.addEventListener('beforeunload', () => {
    if (window.barcodeScanner) {
        window.barcodeScanner.stopCamera();
    }
}); 