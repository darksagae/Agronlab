#!/usr/bin/env python3
"""
AGROF Backend - Web Server with Gemini AI Integration
Disease detection using Google Gemini API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import base64
import requests
from datetime import datetime
from advanced_training_api import init_advanced_training
from ai_command_api import setup_ai_command_routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['*'], methods=['GET', 'POST', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization'])

# Gemini API Configuration
GEMINI_API_KEY = "AIzaSyBE2b1nKpQd6LseRIVXfh10O_O3Pm0fvM0"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

def analyze_plant_disease_with_gemini(image_data):
    """
    Analyze plant disease using Gemini AI
    """
    try:
        # Convert image to base64
        if hasattr(image_data, 'read'):
            image_base64 = base64.b64encode(image_data.read()).decode('utf-8')
        else:
            image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Prepare prompt for Gemini
        prompt = """
        Analyze this plant image for disease detection. Provide a detailed analysis including:
        1. Health status (healthy/diseased)
        2. Disease type if any
        3. Severity level (low/medium/high)
        4. Symptoms observed
        5. Treatment recommendations
        6. Prevention strategies
        
        Format your response as JSON with these fields:
        - health_status: "healthy" or "diseased"
        - disease_type: specific disease name or "none"
        - severity_level: "low", "medium", or "high"
        - symptoms: list of observed symptoms
        - recommendations: list of treatment recommendations
        - confidence: confidence score (0.0 to 1.0)
        """
        
        # Prepare Gemini API request
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": image_base64
                        }
                    }
                ]
            }]
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        logger.info("🤖 Calling Gemini API for disease analysis...")
        response = requests.post(GEMINI_API_URL, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                analysis_text = result['candidates'][0]['content']['parts'][0]['text']
                logger.info("✅ Gemini analysis received")
                
                # Parse the JSON response from Gemini
                try:
                    # Extract JSON from the response text
                    import json
                    import re
                    
                    # Find JSON in the response
                    json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
                    if json_match:
                        analysis_json = json.loads(json_match.group())
                        return analysis_json
                    else:
                        # Fallback parsing
                        return {
                            "health_status": "unknown",
                            "disease_type": "analysis_failed",
                            "severity_level": "unknown",
                            "symptoms": ["Unable to parse AI response"],
                            "recommendations": ["Consult agricultural experts"],
                            "confidence": 0.0
                        }
                except Exception as parse_error:
                    logger.error(f"❌ Failed to parse Gemini response: {parse_error}")
                    return {
                        "health_status": "unknown",
                        "disease_type": "parsing_error",
                        "severity_level": "unknown",
                        "symptoms": ["AI response parsing failed"],
                        "recommendations": ["Consult agricultural experts"],
                        "confidence": 0.0
                    }
            else:
                logger.error("❌ No candidates in Gemini response")
                raise Exception("No analysis results from Gemini")
        else:
            logger.error(f"❌ Gemini API error: {response.status_code} - {response.text}")
            raise Exception(f"Gemini API error: {response.status_code}")
            
    except Exception as e:
        logger.error(f"❌ Gemini analysis failed: {e}")
        raise Exception(f"AI analysis failed: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'AGROF Backend is running with Gemini AI',
        'timestamp': datetime.now().isoformat(),
        'ai_status': 'Gemini AI integrated for disease detection'
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """Image analysis endpoint with Gemini AI integration"""
    try:
        logger.info("🔍 Received analysis request with Gemini AI")
        
        # Check if image is provided
        if 'image' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No image provided'
            }), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'No image selected'
            }), 400
        
        logger.info("📸 Processing image with Gemini AI...")
        
        # Analyze with Gemini AI
        try:
            gemini_analysis = analyze_plant_disease_with_gemini(image_file)
            
            # Format response
            response = {
                'status': 'success',
                'message': 'Disease analysis completed using Gemini AI',
                'timestamp': datetime.now().isoformat(),
                'analysis': {
                    'health_status': gemini_analysis.get('health_status', 'unknown'),
                    'disease_type': gemini_analysis.get('disease_type', 'none'),
                    'severity_level': gemini_analysis.get('severity_level', 'unknown'),
                    'symptoms': gemini_analysis.get('symptoms', []),
                    'recommendations': gemini_analysis.get('recommendations', []),
                    'confidence': gemini_analysis.get('confidence', 0.0),
                    'detection_method': 'gemini_ai',
                    'api_source': 'google_gemini'
                },
                'business_insights': {
                    'economic_impact': 'AI analysis provided',
                    'recommendations': gemini_analysis.get('recommendations', []),
                    'market_value': 'Based on AI assessment'
                }
            }
            
            logger.info("✅ Gemini AI analysis completed successfully")
            return jsonify(response)
            
        except Exception as ai_error:
            logger.error(f"❌ Gemini AI analysis failed: {ai_error}")
            return jsonify({
                'status': 'error',
                'message': f'AI analysis failed: {str(ai_error)}'
            }), 500
        
    except Exception as e:
        logger.error(f"❌ Request processing failed: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Request processing failed: {str(e)}'
        }), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint"""
    return jsonify({
        'message': 'AGROF Backend is working!',
        'timestamp': datetime.now().isoformat(),
        'status': 'success',
        'ai_status': 'AI services removed'
    })

@app.route('/api/connection-test', methods=['GET', 'POST', 'OPTIONS'])
def connection_test():
    """Connection test endpoint for frontend"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return response
    
    return jsonify({
        'status': 'success',
        'message': 'Frontend can connect to backend!',
        'timestamp': datetime.now().isoformat(),
        'method': request.method,
        'ai_status': 'AI services removed'
    })

# Initialize advanced training API
advanced_training = init_advanced_training(app)

# Setup AI command routes
setup_ai_command_routes(app)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info("🚀 Starting AGROF Backend with Advanced Training...")
    logger.info(f"   Port: {port}")
    logger.info("   CORS: ENABLED")
    logger.info("   AI Services: ADVANCED TRAINING ENABLED")
    app.run(host='0.0.0.0', port=port, debug=False)
