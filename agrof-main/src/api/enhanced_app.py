#!/usr/bin/env python3
"""
Enhanced AGROF Backend with Multi-Model Disease Detection
Integrates Gemini, Google Vision, TensorFlow Hub, and PyTorch Vision
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import base64
from datetime import datetime
from enhanced_disease_detector import EnhancedDiseaseDetector, DiseaseAnalysis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['*'], methods=['GET', 'POST', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization'])

# Initialize enhanced disease detector
store_path = "/home/darksagae/Desktop/saga/agrof1/agrof-main/mobile/app/assets/store"
disease_detector = EnhancedDiseaseDetector(store_path)

@app.route('/health', methods=['GET'])
def health_check():
    """Enhanced health check with AI status"""
    return jsonify({
        'status': 'healthy',
        'message': 'AGROF Enhanced AI Backend is running',
        'timestamp': datetime.now().isoformat(),
        'ai_models': {
            'gemini': 'Active',
            'google_vision': 'Active' if os.getenv('GOOGLE_VISION_API_KEY') else 'Inactive',
            'tensorflow_hub': 'Active',
            'pytorch_vision': 'Active'
        },
        'store_products': len(disease_detector.store_loader.products),
        'disease_treatments': len(disease_detector.store_loader.disease_treatments)
    })

@app.route('/api/analyze-enhanced', methods=['POST'])
def analyze_disease_enhanced():
    """Enhanced disease analysis using all AI models"""
    try:
        logger.info("🔍 Received enhanced analysis request")
        
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
        
        # Get optional parameters
        crop_type = request.form.get('crop_type', '')
        use_models = request.form.get('models', 'all').split(',')
        
        logger.info(f"📸 Processing image with enhanced AI models: {use_models}")
        
        # Read image data
        image_data = image_file.read()
        
        # Save temporary file for TensorFlow and PyTorch
        temp_image_path = None
        try:
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                tmp_file.write(image_data)
                temp_image_path = tmp_file.name
            
            # Perform enhanced analysis
            analysis = disease_detector.analyze_disease(
                image_data=image_data,
                image_path=temp_image_path,
                crop_type=crop_type
            )
            
            # Format response
            response = {
                'status': 'success',
                'message': 'Enhanced disease analysis completed',
                'timestamp': datetime.now().isoformat(),
                'analysis': {
                    'disease_type': analysis.disease_type,
                    'severity_level': analysis.severity,
                    'confidence': analysis.confidence,
                    'crop_type': analysis.crop_type,
                    'symptoms': analysis.symptoms,
                    'prevention': analysis.prevention,
                    'detection_method': 'enhanced_multi_model',
                    'ai_models_used': use_models
                },
                'treatments': {
                    'agrof_products': analysis.treatments,
                    'total_products': len(analysis.treatments),
                    'store_integration': 'AGROF Store products recommended'
                },
                'recommendations': {
                    'immediate_actions': [
                        f"Apply recommended treatment for {analysis.disease_type}",
                        f"Monitor crop for {analysis.severity} severity symptoms",
                        "Follow AGROF store product application instructions"
                    ],
                    'prevention': analysis.prevention,
                    'follow_up': [
                        "Re-analyze in 7-14 days",
                        "Monitor treatment effectiveness",
                        "Adjust treatment if needed"
                    ]
                }
            }
            
            logger.info("✅ Enhanced AI analysis completed successfully")
            return jsonify(response)
            
        finally:
            # Clean up temporary file
            if temp_image_path and os.path.exists(temp_image_path):
                os.unlink(temp_image_path)
        
    except Exception as e:
        logger.error(f"❌ Enhanced analysis failed: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Enhanced analysis failed: {str(e)}'
        }), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_disease_legacy():
    """Legacy disease analysis endpoint (backward compatibility)"""
    try:
        logger.info("🔍 Received legacy analysis request")
        
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
        
        # Use enhanced detector but return legacy format
        image_data = image_file.read()
        analysis = disease_detector.analyze_disease(image_data=image_data)
        
        # Format as legacy response
        response = {
            'status': 'success',
            'message': 'Disease analysis completed using enhanced AI',
            'timestamp': datetime.now().isoformat(),
            'analysis': {
                'health_status': 'diseased' if analysis.disease_type != 'Healthy' else 'healthy',
                'disease_type': analysis.disease_type,
                'severity_level': analysis.severity,
                'symptoms': analysis.symptoms,
                'recommendations': [f"Use {t['name']}" for t in analysis.treatments[:3]],
                'confidence': analysis.confidence,
                'detection_method': 'enhanced_ai',
                'api_source': 'multi_model_ensemble'
            },
            'business_insights': {
                'economic_impact': f'Treatment cost: {sum([float(t.get("price", "0").split("UGX")[1].replace(",", "")) for t in analysis.treatments if "UGX" in t.get("price", "")])} UGX',
                'recommendations': [f"Purchase {t['name']} from AGROF store" for t in analysis.treatments[:3]],
                'market_value': 'Based on AGROF store analysis'
            }
        }
        
        logger.info("✅ Legacy analysis completed successfully")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"❌ Legacy analysis failed: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Analysis failed: {str(e)}'
        }), 500

@app.route('/api/store-products', methods=['GET'])
def get_store_products():
    """Get AGROF store products for disease treatment"""
    try:
        disease = request.args.get('disease', '')
        
        if disease:
            treatments = disease_detector.store_loader.get_treatments_for_disease(disease)
        else:
            treatments = list(disease_detector.store_loader.products.values())
        
        return jsonify({
            'status': 'success',
            'products': treatments,
            'total': len(treatments),
            'disease': disease
        })
        
    except Exception as e:
        logger.error(f"Error getting store products: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to get store products: {str(e)}'
        }), 500

@app.route('/api/disease-treatments', methods=['GET'])
def get_disease_treatments():
    """Get available disease treatments from AGROF store"""
    try:
        return jsonify({
            'status': 'success',
            'disease_treatments': disease_detector.store_loader.disease_treatments,
            'total_diseases': len(disease_detector.store_loader.disease_treatments)
        })
        
    except Exception as e:
        logger.error(f"Error getting disease treatments: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to get disease treatments: {str(e)}'
        }), 500

@app.route('/api/ai-models', methods=['GET'])
def get_ai_models_status():
    """Get status of all AI models"""
    try:
        return jsonify({
            'status': 'success',
            'models': {
                'gemini': {
                    'status': 'active',
                    'api_key': 'configured' if disease_detector.gemini_api_key else 'missing'
                },
                'google_vision': {
                    'status': 'active' if os.getenv('GOOGLE_VISION_API_KEY') else 'inactive',
                    'api_key': 'configured' if os.getenv('GOOGLE_VISION_API_KEY') else 'missing'
                },
                'tensorflow_hub': {
                    'status': 'active' if disease_detector.tensorflow_hub.model else 'inactive',
                    'model_loaded': disease_detector.tensorflow_hub.model is not None
                },
                'pytorch_vision': {
                    'status': 'active' if disease_detector.pytorch_vision.model else 'inactive',
                    'model_loaded': disease_detector.pytorch_vision.model is not None
                }
            },
            'store_data': {
                'products_loaded': len(disease_detector.store_loader.products),
                'disease_treatments': len(disease_detector.store_loader.disease_treatments)
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting AI models status: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to get AI models status: {str(e)}'
        }), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint with enhanced AI status"""
    return jsonify({
        'message': 'AGROF Enhanced AI Backend is working!',
        'timestamp': datetime.now().isoformat(),
        'status': 'success',
        'ai_status': 'Enhanced multi-model AI active',
        'models': ['Gemini', 'Google Vision', 'TensorFlow Hub', 'PyTorch Vision'],
        'store_integration': 'AGROF Store products available'
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
        'message': 'Frontend can connect to enhanced AI backend!',
        'timestamp': datetime.now().isoformat(),
        'method': request.method,
        'ai_status': 'Enhanced multi-model AI active',
        'available_endpoints': [
            '/api/analyze-enhanced',
            '/api/analyze',
            '/api/store-products',
            '/api/disease-treatments',
            '/api/ai-models'
        ]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info("🚀 Starting AGROF Enhanced AI Backend...")
    logger.info(f"   Port: {port}")
    logger.info("   CORS: ENABLED")
    logger.info("   AI Models: Gemini, Google Vision, TensorFlow Hub, PyTorch Vision")
    logger.info(f"   Store Products: {len(disease_detector.store_loader.products)}")
    logger.info(f"   Disease Treatments: {len(disease_detector.store_loader.disease_treatments)}")
    app.run(host='0.0.0.0', port=port, debug=False)
