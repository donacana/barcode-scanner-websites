from http.server import BaseHTTPRequestHandler
import json
import cv2
import numpy as np
from pyzbar import pyzbar
import base64
import requests
from datetime import datetime
import os

def get_product_info(barcode):
    """Open Food Facts API에서 제품 정보 가져오기"""
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('status') == 1 and data.get('product'):
                product = data['product']
                
                # 제품 정보 추출
                product_info = {
                    'name': product.get('product_name', '알 수 없음'),
                    'brand': product.get('brands', '알 수 없음'),
                    'ingredients': product.get('ingredients_text', '알 수 없음'),
                    'calories': product.get('nutriments', {}).get('energy-kcal_100g', '알 수 없음'),
                    'carbohydrates': product.get('nutriments', {}).get('carbohydrates_100g', '알 수 없음'),
                    'protein': product.get('nutriments', {}).get('proteins_100g', '알 수 없음'),
                    'fat': product.get('nutriments', {}).get('fat_100g', '알 수 없음'),
                    'sugars': product.get('nutriments', {}).get('sugars_100g', '알 수 없음'),
                    'sodium': product.get('nutriments', {}).get('sodium_100g', '알 수 없음'),
                    'image_url': product.get('image_front_url', ''),
                    'barcode': barcode
                }
                
                return product_info
            else:
                return None
        else:
            return None
            
    except Exception as e:
        print(f"API 호출 중 오류: {str(e)}")
        return None

def scan_barcode_from_image(image_data):
    """이미지에서 바코드 스캔 (최적화된 버전)"""
    try:
        # base64 이미지 디코딩
        image_data = image_data.split(',')[1]  # data:image/jpeg;base64, 제거
        image_bytes = base64.b64decode(image_data)
        
        # OpenCV로 이미지 읽기 (최적화)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)  # 그레이스케일로 읽기 (메모리 절약)
        
        if image is None:
            return {'error': '이미지를 읽을 수 없습니다.'}, 400
        
        # 이미지 크기 줄이기 (메모리 절약)
        height, width = image.shape
        if width > 800:  # 너무 큰 이미지는 리사이즈
            scale = 800 / width
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height))
        
        # 바코드 스캔
        barcodes = pyzbar.decode(image)
        
        if not barcodes:
            return {'error': '바코드를 찾을 수 없습니다.'}, 404
        
        # 결과 처리 (이미지 처리 제거하여 메모리 절약)
        results = []
        for barcode in barcodes:
            barcode_data = barcode.data.decode('utf-8')
            barcode_type = barcode.type
            
            # Open Food Facts API에서 제품 정보 가져오기
            product_info = get_product_info(barcode_data)
            
            results.append({
                'data': barcode_data,
                'type': barcode_type,
                'product_info': product_info
            })
        
        return {
            'success': True,
            'barcodes': results,
            'timestamp': datetime.now().isoformat()
        }, 200
        
    except Exception as e:
        return {'error': f'바코드 스캔 중 오류가 발생했습니다: {str(e)}'}, 500

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/scan-barcode':
            try:
                # 요청 본문 읽기
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                # JSON 데이터 파싱
                data = json.loads(post_data.decode('utf-8'))
                
                if not data or 'image' not in data:
                    self.send_error_response(400, '이미지 데이터가 없습니다.')
                    return
                
                # 바코드 스캔 실행
                result, status_code = scan_barcode_from_image(data['image'])
                
                # 응답 전송
                self.send_response(status_code)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
                
            except Exception as e:
                self.send_error_response(500, f'서버 오류: {str(e)}')
        else:
            self.send_error_response(404, 'API 엔드포인트를 찾을 수 없습니다.')
    
    def do_OPTIONS(self):
        """CORS preflight 요청 처리"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_error_response(self, status_code, message):
        """에러 응답 전송"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        error_response = {
            'error': message,
            'status_code': status_code
        }
        
        self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
