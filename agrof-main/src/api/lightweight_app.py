#!/usr/bin/env python3
"""
Lightweight AGROF AI Backend
Optimized for 512MB RAM deployment
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import requests
from datetime import datetime
import base64
from PIL import Image
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['*'], methods=['GET', 'POST', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization'])

# API Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GOOGLE_VISION_API_KEY = os.getenv('GOOGLE_VISION_API_KEY', '')

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'AGROF Lightweight AI Backend is running',
        'timestamp': datetime.now().isoformat(),
        'ai_models': {
            'gemini': 'Active',
            'google_vision': 'Active' if GOOGLE_VISION_API_KEY else 'Inactive'
        },
        'memory_optimized': True
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """Lightweight image analysis using Gemini AI only"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        # Convert image to base64
        image_data = image_file.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Use Gemini AI for analysis
        gemini_response = analyze_with_gemini(image_base64)
        
        return jsonify({
            'success': True,
            'analysis': gemini_response,
            'timestamp': datetime.now().isoformat(),
            'model_used': 'Gemini AI (Lightweight)'
        })
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def analyze_with_gemini(image_base64):
    """Analyze image using Gemini AI"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": "Analyze this agricultural image for plant diseases, crop health, and provide recommendations. Focus on: 1) Plant identification, 2) Disease detection, 3) Health status, 4) Treatment recommendations, 5) Prevention tips."
                }, {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_base64
                    }
                }]
            }]
        }
        
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if 'candidates' in data and len(data['candidates']) > 0:
            content = data['candidates'][0]['content']['parts'][0]['text']
            
            return {
                'health_status': 'Analyzed',
                'disease_detected': 'Check analysis below',
                'recommendations': content,
                'confidence': 0.85,
                'model': 'Gemini AI'
            }
        else:
            return {
                'health_status': 'Analysis failed',
                'disease_detected': 'Unable to analyze',
                'recommendations': 'Please try again with a clearer image',
                'confidence': 0.0,
                'model': 'Gemini AI'
            }
            
    except Exception as e:
        logger.error(f"Gemini analysis error: {str(e)}")
        return {
            'health_status': 'Error',
            'disease_detected': 'Analysis failed',
            'recommendations': f'Error: {str(e)}',
            'confidence': 0.0,
            'model': 'Gemini AI'
        }

@app.route('/api/chatbot/message', methods=['POST'])
def chatbot_message():
    """Lightweight chatbot using Gemini AI"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Use Gemini AI for chatbot
        response = get_chatbot_response(message)
        
        return jsonify({
            'success': True,
            'response': response,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_chatbot_response(message):
    """Get chatbot response using Gemini AI"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"You are AgrofBot, an AI agricultural assistant. Provide helpful, detailed advice for: {message}. Include practical tips, disease prevention, and farming best practices."
                }]
            }]
        }
        
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if 'candidates' in data and len(data['candidates']) > 0:
            return data['candidates'][0]['content']['parts'][0]['text']
        else:
            return "I'm sorry, I couldn't process your request. Please try again."
            
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        return "I'm experiencing technical difficulties. Please try again later."

@app.route('/api/plan/recommend', methods=['POST'])
def plan_recommend():
    """Generate AI-powered crop plan recommendations using Gemini."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'Request body required'}), 400

        crop = data.get('crop', 'Unknown crop')
        area = data.get('area', '1')
        start_date = data.get('startDate', 'Not specified')
        end_date = data.get('endDate', 'Not specified')
        notes = data.get('notes', '')

        prompt = (
            "You are AGRON, an expert agricultural AI assistant for East African (Uganda) smallholder farmers.\n\n"
            f"Provide a detailed farming plan recommendation for:\n"
            f"- Crop: {crop}\n"
            f"- Farm Area: {area} acres\n"
            f"- Planting Date: {start_date}\n"
            f"- Expected Harvest: {end_date}\n"
        )
        if notes:
            prompt += f"- Farmer Notes: {notes}\n"

        prompt += (
            "\nPlease give practical recommendations covering:\n"
            "1. Soil Preparation — what to do before planting\n"
            "2. Planting Tips — spacing, seed treatment, depth\n"
            "3. Fertilizer Schedule — type, timing, application rates per acre\n"
            "4. Irrigation & Water Management — frequency and method\n"
            "5. Pest & Disease Watch — common threats and early warning signs\n"
            "6. Key Growth Milestones — what to expect week by week\n"
            "7. Harvest Indicators — how to know when crop is ready\n"
            "8. Expected Yield — realistic range in kg/acre for Uganda conditions\n\n"
            "Write in plain language a smallholder farmer can act on. Be specific and practical."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)

        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and result['candidates']:
                text = result['candidates'][0]['content']['parts'][0]['text']
                return jsonify({
                    'status': 'success',
                    'recommendation': text,
                    'crop': crop,
                    'timestamp': datetime.now().isoformat()
                })

        logger.error(f"Gemini plan recommend error: {response.status_code}")
        return jsonify({'status': 'error', 'message': 'AI service temporarily unavailable'}), 500

    except Exception as e:
        logger.error(f"Plan recommend error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
