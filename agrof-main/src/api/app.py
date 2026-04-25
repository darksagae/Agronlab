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

# Point agron_context at the store DB — resolve path relative to this file
import os as _os
if not _os.environ.get('STORE_DB_PATH'):
    _os.environ['STORE_DB_PATH'] = _os.path.abspath(
        _os.path.join(_os.path.dirname(__file__), '../../../../store-backend/store.db')
    )

from agron_context import build_system_prompt
from diagnosis_kb import save_premium_diagnosis, find_kb_match, increment_free_served, get_kb_stats

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['*'], methods=['GET', 'POST', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization'])

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

def analyze_plant_disease_with_gemini(image_data, user_context=None):
    """
    Analyze plant disease using Gemini AI.
    user_context: optional plain-text personal farmer context injected before the image.
    """
    try:
        # Convert image to base64
        if hasattr(image_data, 'read'):
            image_base64 = base64.b64encode(image_data.read()).decode('utf-8')
        else:
            image_base64 = base64.b64encode(image_data).decode('utf-8')

        # Build AGRON-aware prompt (fetches live store data)
        base_prompt = build_system_prompt(task="disease_detection")

        # Prepend personal farmer context so the AI reasons from personal data first
        if user_context and user_context.strip():
            prompt = (
                f"{user_context.strip()}\n\n"
                f"Use the farmer context above as your PRIMARY reference when analysing the image. "
                f"If the farmer grows maize, treat the crop as maize unless the image clearly shows otherwise. "
                f"Be consistent with past diagnoses listed above.\n\n"
                f"{base_prompt}"
            )
            logger.info("🧠 Personalized context injected into Gemini prompt")
        else:
            prompt = base_prompt

        # Prepare Gemini API request with system prompt + image
        payload = {
            "system_instruction": {
                "parts": [{"text": prompt}]
            },
            "contents": [{
                "parts": [
                    {"text": "Analyze this crop image and return a JSON diagnosis."},
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
    """
    Image analysis endpoint.

    Premium subscribers  → full Gemini AI analysis → result saved to knowledge base
    Free users          → check knowledge base first → if match found, serve it
                          (free user gets real diagnosis from community learning)
                          if no match → basic result + upgrade prompt
    """
    try:
        if 'image' not in request.files:
            return jsonify({'status': 'error', 'message': 'No image provided'}), 400

        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'status': 'error', 'message': 'No image selected'}), 400

        # Read subscription tier from request (mobile app sends this)
        is_premium = request.form.get('is_premium', 'false').lower() in ('true', '1', 'yes')
        crop_hint = request.form.get('crop_type', '').strip()
        user_context = request.form.get('user_context', '').strip()
        logger.info(f"📸 Analysis request — premium={is_premium}, crop_hint={crop_hint or 'none'}, has_context={bool(user_context)}")

        # ── PREMIUM PATH ──────────────────────────────────────────────────────
        if is_premium:
            try:
                gemini_analysis = analyze_plant_disease_with_gemini(image_file, user_context=user_context)

                # Save to knowledge base so free users benefit later
                saved = save_premium_diagnosis(gemini_analysis)
                logger.info(f"💾 KB save: {'✅' if saved else '⏭ skipped (low confidence or healthy)'}")

                return jsonify({
                    'status': 'success',
                    'source': 'gemini_ai',
                    'message': 'Full AI diagnosis completed',
                    'timestamp': datetime.now().isoformat(),
                    'analysis': {
                        **gemini_analysis,
                        'detection_method': 'gemini_premium',
                        'kb_contribution': saved,  # tells the app "your scan helped the community"
                    }
                })
            except Exception as ai_error:
                logger.error(f"❌ Gemini AI failed for premium user: {ai_error}")
                return jsonify({'status': 'error', 'message': f'AI analysis failed: {str(ai_error)}'}), 500

        # ── FREE PATH: check knowledge base ───────────────────────────────────
        # Run a lightweight Gemini call (text only, no image) to identify the crop
        # from any hint the user gave, then look up the KB
        kb_result = find_kb_match(crop_type=crop_hint)

        if kb_result:
            increment_free_served()
            stats = get_kb_stats()
            logger.info(f"📚 Serving KB match to free user: {kb_result['crop_type']} / {kb_result['disease_type']}")
            return jsonify({
                'status': 'success',
                'source': 'community_knowledge',
                'message': (
                    f"This diagnosis comes from AGRON's community knowledge base — "
                    f"learned from {kb_result['times_confirmed']} real premium subscriber scan(s). "
                    f"Upgrade to Premium for a live AI scan of your exact plant."
                ),
                'timestamp': datetime.now().isoformat(),
                'analysis': {
                    **kb_result,
                    'detection_method': 'community_kb',
                    'kb_stats': {
                        'diseases_in_database': stats.get('diseases_in_kb', 0),
                        'crops_in_database': stats.get('crops_in_kb', 0),
                    }
                }
            })

        # No KB match — return basic result with upgrade prompt
        logger.info("ℹ️ No KB match for free user — returning basic result")
        kb_stats = get_kb_stats()
        return jsonify({
            'status': 'success',
            'source': 'basic_free',
            'message': 'Basic analysis only. Upgrade to Premium for full AI diagnosis.',
            'timestamp': datetime.now().isoformat(),
            'analysis': {
                'health_status': 'unknown',
                'disease_type': 'Inspection Required',
                'severity_level': 'unknown',
                'confidence': 0,
                'symptoms': [],
                'recommendations': [
                    'Check leaves for spots, yellowing, or wilting',
                    'Look under leaves for pests or eggs',
                    'Check stems for lesions or unusual discolouration',
                    'Ensure soil is not waterlogged or too dry',
                    'Apply a general preventive fungicide if spots are present',
                ],
                'products_to_use': [],
                'prevention': 'Maintain good field hygiene and monitor crops weekly.',
                'detection_method': 'basic_free',
                'upgrade_prompt': {
                    'title': 'Get a precise AI diagnosis',
                    'body': (
                        f"AGRON Premium gives you instant Gemini AI analysis for your exact plant. "
                        f"Our community knowledge base already has {kb_stats.get('diseases_in_kb', 0)} diseases "
                        f"across {kb_stats.get('crops_in_kb', 0)} crops — your scan will add to it too."
                    ),
                    'price': 'UGX 37,000/year (~$10)',
                }
            }
        })
    except Exception as e:
        logger.error(f"❌ Unexpected error in analyze_image: {e}")
        return jsonify({'status': 'error', 'message': f'Internal server error: {str(e)}'}), 500

@app.route('/api/kb/stats', methods=['GET'])
def kb_stats():
    """Return knowledge base stats — used by app to show community learning progress."""
    stats = get_kb_stats()
    return jsonify({'status': 'success', 'kb': stats, 'timestamp': datetime.now().isoformat()})

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint"""
    stats = get_kb_stats()
    return jsonify({
        'message': 'AGRON AI Backend is running',
        'timestamp': datetime.now().isoformat(),
        'status': 'success',
        'knowledge_base': stats,
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
