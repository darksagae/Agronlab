"""
AI Command API for AGROF System
Handles AI analysis and generates commands for JavaScript product fetching
"""

from flask import Flask, request, jsonify
import json
import logging
from datetime import datetime
from ai_product_database import ai_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_ai_command_routes(app):
    """Setup AI command routes"""
    
    @app.route('/api/ai-analyze-disease', methods=['POST'])
    def ai_analyze_disease():
        """AI analyzes disease and generates command for product fetching"""
        try:
            data = request.get_json()
            disease_analysis = data.get('disease_analysis', {})
            
            logger.info(f"AI analyzing disease: {disease_analysis.get('disease_type', 'Unknown')}")
            
            # Use AI database to analyze disease and generate command
            result = ai_db.analyze_disease_and_generate_command(disease_analysis)
            
            if result['success']:
                logger.info(f"AI command generated successfully: {result['ai_command']['action']}")
                return jsonify({
                    'success': True,
                    'ai_command': result['ai_command'],
                    'disease_type': result['disease_type'],
                    'symptoms': result['symptoms'],
                    'recommended_products': result['recommended_products'],
                    'confidence': result['confidence'],
                    'timestamp': datetime.now().isoformat()
                })
            else:
                logger.error(f"AI analysis failed: {result.get('error', 'Unknown error')}")
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'AI analysis failed'),
                    'ai_command': result.get('ai_command', {}),
                    'timestamp': datetime.now().isoformat()
                }), 500
                
        except Exception as e:
            logger.error(f"AI analysis error: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'AI analysis failed: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/ai-command-history', methods=['GET'])
    def get_ai_command_history():
        """Get AI command history"""
        try:
            limit = request.args.get('limit', 10, type=int)
            history = ai_db.get_command_history(limit)
            
            return jsonify({
                'success': True,
                'command_history': history,
                'total_commands': len(history),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to get command history: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Failed to get command history: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/ai-update-effectiveness', methods=['POST'])
    def update_ai_effectiveness():
        """Update AI command effectiveness based on results"""
        try:
            data = request.get_json()
            command_id = data.get('command_id')
            success_rate = data.get('success_rate', 0.0)
            
            if not command_id:
                return jsonify({
                    'success': False,
                    'error': 'Command ID is required'
                }), 400
            
            ai_db.update_effectiveness(command_id, success_rate)
            
            return jsonify({
                'success': True,
                'message': 'Effectiveness updated successfully',
                'command_id': command_id,
                'success_rate': success_rate,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to update effectiveness: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Failed to update effectiveness: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/ai-disease-database', methods=['GET'])
    def get_disease_database():
        """Get disease database information"""
        try:
            return jsonify({
                'success': True,
                'disease_mappings': ai_db.disease_product_mapping,
                'symptom_keywords': ai_db.symptom_keywords,
                'total_diseases': len(ai_db.disease_product_mapping),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to get disease database: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Failed to get disease database: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/ai-train-model', methods=['POST'])
    def train_ai_model():
        """Train AI model with new data"""
        try:
            data = request.get_json()
            training_data = data.get('training_data', [])
            
            logger.info(f"Training AI model with {len(training_data)} samples")
            
            # Process training data
            trained_samples = 0
            for sample in training_data:
                try:
                    # Analyze and generate command for each sample
                    result = ai_db.analyze_disease_and_generate_command(sample)
                    if result['success']:
                        trained_samples += 1
                except Exception as e:
                    logger.warn(f"Failed to train sample: {str(e)}")
                    continue
            
            return jsonify({
                'success': True,
                'message': 'AI model training completed',
                'trained_samples': trained_samples,
                'total_samples': len(training_data),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"AI model training failed: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'AI model training failed: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
