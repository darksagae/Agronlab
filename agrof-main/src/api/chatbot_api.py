#!/usr/bin/env python3
"""
Chatbot API for AGROF
Uses dedicated Gemini API key for conversational AI
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import requests
from datetime import datetime
import os as _os
if not _os.environ.get('STORE_DB_PATH'):
    _os.environ['STORE_DB_PATH'] = _os.path.abspath(
        _os.path.join(_os.path.dirname(__file__), '../../../../store-backend/store.db')
    )

from agron_context import build_system_prompt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['*'], methods=['GET', 'POST', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization'])

# Chatbot API Configuration
CHATBOT_API_KEY = os.environ.get('GEMINI_API_KEY', '')
CHATBOT_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={CHATBOT_API_KEY}"

@app.route('/api/chatbot/health', methods=['GET'])
def chatbot_health():
    """Chatbot API health check"""
    return jsonify({
        'status': 'healthy',
        'message': 'AGROF Chatbot API is running',
        'timestamp': datetime.now().isoformat(),
        'api_key': 'Configured' if CHATBOT_API_KEY else 'Missing',
        'service': 'Gemini Chatbot API'
    })

@app.route('/api/chatbot/message', methods=['POST'])
def send_chatbot_message():
    """Send message to chatbot and get response"""
    try:
        logger.info("🤖 Received chatbot message request")
        
        # Get request data
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Message is required'
            }), 400
        
        message = data['message']
        context = data.get('context', '')
        user_id = data.get('user_id', 'anonymous')
        
        logger.info(f"📝 Processing message from user {user_id}: {message[:50]}...")
        
        # Create enhanced prompt with agricultural context
        enhanced_prompt = create_enhanced_prompt(message, context)
        
        # Call Gemini API
        response = call_gemini_chatbot(enhanced_prompt)
        
        if response['success']:
            logger.info("✅ Chatbot response generated successfully")
            return jsonify({
                'status': 'success',
                'message': response['response'],
                'timestamp': datetime.now().isoformat(),
                'user_id': user_id,
                'api_used': 'Gemini Chatbot API'
            })
        else:
            logger.error(f"❌ Chatbot API error: {response['error']}")
            return jsonify({
                'status': 'error',
                'message': 'Failed to get chatbot response',
                'error': response['error']
            }), 500
            
    except Exception as e:
        logger.error(f"❌ Chatbot message processing failed: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Chatbot processing failed: {str(e)}'
        }), 500

@app.route('/api/chatbot/test', methods=['GET'])
def test_chatbot():
    """Test chatbot API connection"""
    try:
        test_message = "Hello, are you working? Please respond with a short greeting."
        enhanced_prompt = create_enhanced_prompt(test_message, 'test')
        
        response = call_gemini_chatbot(enhanced_prompt)
        
        if response['success']:
            return jsonify({
                'status': 'success',
                'message': 'Chatbot API is working!',
                'test_response': response['response'],
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Chatbot API test failed',
                'error': response['error']
            }), 500
            
    except Exception as e:
        logger.error(f"❌ Chatbot test failed: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Chatbot test failed: {str(e)}'
        }), 500

def create_enhanced_prompt(message, context):
    """Build AGRON-aware chatbot prompt with live store data injected."""
    system = build_system_prompt(task="chatbot")
    extra = f"\nAdditional context from user session: {context}" if context and context != 'test' else ""
    return f"{system}{extra}\n\nUser: {message}"

def call_gemini_chatbot(prompt):
    """Call Gemini API for chatbot response using system_instruction for proper context."""
    try:
        # Split system context from user message (separated by "\n\nUser: ")
        if "\n\nUser: " in prompt:
            system_part, user_part = prompt.rsplit("\n\nUser: ", 1)
        else:
            system_part, user_part = "", prompt

        payload = {
            "system_instruction": {
                "parts": [{"text": system_part}]
            },
            "contents": [{
                "parts": [{"text": user_part}]
            }]
        }

        response = requests.post(
            CHATBOT_API_URL,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                bot_response = result['candidates'][0]['content']['parts'][0]['text']
                return {
                    'success': True,
                    'response': bot_response
                }
            else:
                return {
                    'success': False,
                    'error': 'No response from Gemini API'
                }
        else:
            return {
                'success': False,
                'error': f'Gemini API error: {response.status_code}'
            }
            
    except Exception as e:
        logger.error(f"❌ Gemini API call failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    logger.info("🤖 Starting AGROF Chatbot API...")
    logger.info(f"   Port: {port}")
    logger.info(f"   API Key: {CHATBOT_API_KEY[:10]}...")
    logger.info("   Service: Gemini Chatbot API")
    app.run(host='0.0.0.0', port=port, debug=False)
