from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import cv2
import numpy as np
from pyzbar import pyzbar
import base64
import json
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Open Food Facts API에서 제품 정보 가져오기
def get_product_info(barcode):
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

# 정적 파일 서빙을 위한 설정
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/api/scan-barcode', methods=['POST'])
def scan_barcode():
    try:
        # JSON 데이터에서 base64 이미지 받기
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': '이미지 데이터가 없습니다.'}), 400
        
        # base64 이미지 디코딩
        image_data = data['image'].split(',')[1]  # data:image/jpeg;base64, 제거
        image_bytes = base64.b64decode(image_data)
        
        # OpenCV로 이미지 읽기
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({'error': '이미지를 읽을 수 없습니다.'}), 400
        
        # 바코드 스캔
        barcodes = pyzbar.decode(image)
        
        if not barcodes:
            return jsonify({'error': '바코드를 찾을 수 없습니다.'}), 404
        
        # 결과 처리
        results = []
        for barcode in barcodes:
            barcode_data = barcode.data.decode('utf-8')
            barcode_type = barcode.type
            
            # 바코드 영역 표시 (디버깅용)
            (x, y, w, h) = barcode.rect
            cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # 바코드 타입과 데이터 표시
            text = f"{barcode_data} ({barcode_type})"
            cv2.putText(image, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Open Food Facts API에서 제품 정보 가져오기
            product_info = get_product_info(barcode_data)
            
            results.append({
                'data': barcode_data,
                'type': barcode_type,
                'rect': {'x': x, 'y': y, 'width': w, 'height': h},
                'product_info': product_info
            })
        
        # 처리된 이미지를 base64로 인코딩하여 반환
        _, buffer = cv2.imencode('.jpg', image)
        processed_image = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'success': True,
            'barcodes': results,
            'processed_image': f"data:image/jpeg;base64,{processed_image}",
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'바코드 스캔 중 오류가 발생했습니다: {str(e)}'}), 500

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Barcode Scanner API'
    })

if __name__ == '__main__':
    print("🚀 바코드 스캐너 웹사이트가 시작됩니다...")
    print("📱 브라우저에서 http://localhost:5000 으로 접속하세요")
    print("📷 카메라 권한을 허용하고 바코드를 스캔해보세요!")
    
    # Render 환경변수에서 포트 가져오기
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port) 