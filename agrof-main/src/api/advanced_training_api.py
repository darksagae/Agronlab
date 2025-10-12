"""
Advanced Training API for AGROF System
Handles JavaScript-Python integration for advanced product training and recommendations
"""

from flask import Flask, request, jsonify
import json
import logging
from datetime import datetime
import sqlite3
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedTrainingAPI:
    def __init__(self, app):
        self.app = app
        self.training_models = {}
        self.product_database = None
        self.setup_routes()
    
    def setup_routes(self):
        """Setup API routes for advanced training"""
        
        @self.app.route('/api/train-advanced', methods=['POST'])
        def train_advanced():
            """Train advanced model with product data from JavaScript"""
            try:
                data = request.get_json()
                disease_type = data.get('disease_type', '')
                products = data.get('products', [])
                training_mode = data.get('training_mode', 'advanced')
                
                logger.info(f"Starting advanced training for {disease_type} with {len(products)} products")
                
                # Process training data
                training_result = self.process_training_data(disease_type, products)
                
                if training_result['success']:
                    # Store training model
                    training_id = f"training_{disease_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    self.training_models[training_id] = {
                        'disease_type': disease_type,
                        'products': products,
                        'model_data': training_result['model_data'],
                        'created_at': datetime.now().isoformat(),
                        'status': 'trained'
                    }
                    
                    return jsonify({
                        'success': True,
                        'training_id': training_id,
                        'disease_type': disease_type,
                        'products_processed': len(products),
                        'model_accuracy': training_result.get('accuracy', 0.85),
                        'message': 'Advanced training completed successfully'
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': training_result.get('error', 'Training failed')
                    }), 500
                    
            except Exception as e:
                logger.error(f"Training error: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': f'Training failed: {str(e)}'
                }), 500
        
        @self.app.route('/api/recommend-enhanced', methods=['POST'])
        def recommend_enhanced():
            """Get enhanced product recommendations using trained models"""
            try:
                data = request.get_json()
                disease_type = data.get('disease_type', '')
                symptoms = data.get('symptoms', [])
                products = data.get('products', [])
                model_type = data.get('model_type', 'advanced_trained')
                
                logger.info(f"Getting enhanced recommendations for {disease_type}")
                
                # Find best matching training model
                best_model = self.find_best_model(disease_type)
                
                if best_model:
                    # Use trained model for recommendations
                    recommendations = self.get_model_recommendations(
                        best_model, disease_type, symptoms, products
                    )
                else:
                    # Fallback to basic recommendations
                    recommendations = self.get_basic_recommendations(
                        disease_type, symptoms, products
                    )
                
                return jsonify({
                    'success': True,
                    'recommendations': recommendations,
                    'disease_type': disease_type,
                    'symptoms': symptoms,
                    'model_used': best_model['training_id'] if best_model else 'basic',
                    'confidence': best_model.get('model_data', {}).get('accuracy', 0.7) if best_model else 0.6
                })
                
            except Exception as e:
                logger.error(f"Recommendation error: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': f'Recommendation failed: {str(e)}'
                }), 500
        
        @self.app.route('/api/training-status', methods=['GET'])
        def training_status():
            """Get training status and history"""
            try:
                return jsonify({
                    'success': True,
                    'training_models': len(self.training_models),
                    'models': list(self.training_models.keys()),
                    'status': 'active'
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
    
    def process_training_data(self, disease_type, products):
        """Process training data and create model"""
        try:
            # Calculate product relevance scores
            scored_products = []
            for product in products:
                score = self.calculate_product_score(product, disease_type)
                scored_products.append({
                    **product,
                    'relevance_score': score
                })
            
            # Sort by relevance
            scored_products.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            # Create model data
            model_data = {
                'disease_type': disease_type,
                'top_products': scored_products[:10],  # Top 10 most relevant
                'product_categories': self.extract_categories(scored_products),
                'keywords': self.extract_keywords(scored_products),
                'accuracy': 0.85  # Simulated accuracy
            }
            
            return {
                'success': True,
                'model_data': model_data,
                'accuracy': 0.85
            }
            
        except Exception as e:
            logger.error(f"Processing error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def calculate_product_score(self, product, disease_type):
        """Calculate relevance score for a product"""
        score = 0
        product_text = f"{product.get('name', '')} {product.get('description', '')} {product.get('features', '')}".lower()
        disease_lower = disease_type.lower()
        
        # Disease name match in product name (highest priority)
        if disease_lower in product.get('name', '').lower():
            score += 20
        
        # Disease name match in description
        if disease_lower in product.get('description', '').lower():
            score += 15
        
        # Disease name match in features
        if disease_lower in product.get('features', '').lower():
            score += 10
        
        # Treatment-related keywords
        treatment_keywords = [
            'fungicide', 'herbicide', 'pesticide', 'treatment', 'control', 'prevent', 'cure',
            'disease', 'infection', 'bacterial', 'fungal', 'viral', 'pest', 'insect'
        ]
        
        for keyword in treatment_keywords:
            if keyword in product_text:
                score += 3
        
        # Category-based scoring
        category_scores = {
            'fungicides': 15,
            'herbicides': 12,
            'organic_chemicals': 10,
            'fertilizers': 8,
            'pesticides': 15
        }
        
        category = product.get('category_name', '')
        if category in category_scores:
            score += category_scores[category]
        
        return score
    
    def extract_categories(self, products):
        """Extract unique categories from products"""
        categories = set()
        for product in products:
            if product.get('category_name'):
                categories.add(product['category_name'])
        return list(categories)
    
    def extract_keywords(self, products):
        """Extract relevant keywords from products"""
        keywords = set()
        for product in products:
            # Extract keywords from name and description
            text = f"{product.get('name', '')} {product.get('description', '')}"
            words = text.lower().split()
            for word in words:
                if len(word) > 3 and word.isalpha():
                    keywords.add(word)
        return list(keywords)[:20]  # Top 20 keywords
    
    def find_best_model(self, disease_type):
        """Find the best matching training model"""
        best_model = None
        best_score = 0
        
        for model_id, model in self.training_models.items():
            if model['disease_type'].lower() == disease_type.lower():
                return model
            
            # Calculate similarity score
            similarity = self.calculate_similarity(disease_type, model['disease_type'])
            if similarity > best_score:
                best_score = similarity
                best_model = model
        
        return best_model if best_score > 0.5 else None
    
    def calculate_similarity(self, disease1, disease2):
        """Calculate similarity between two disease names"""
        # Simple similarity calculation
        disease1_words = set(disease1.lower().split())
        disease2_words = set(disease2.lower().split())
        
        if not disease1_words or not disease2_words:
            return 0
        
        intersection = disease1_words.intersection(disease2_words)
        union = disease1_words.union(disease2_words)
        
        return len(intersection) / len(union) if union else 0
    
    def get_model_recommendations(self, model, disease_type, symptoms, products):
        """Get recommendations using trained model"""
        try:
            model_data = model['model_data']
            top_products = model_data.get('top_products', [])
            
            # Filter and rank products
            recommendations = []
            for product in products:
                # Check if product is in top products
                is_top_product = any(
                    p.get('id') == product.get('id') 
                    for p in top_products
                )
                
                if is_top_product:
                    # Get relevance score from model
                    model_product = next(
                        (p for p in top_products if p.get('id') == product.get('id')), 
                        product
                    )
                    product['model_score'] = model_product.get('relevance_score', 0)
                    recommendations.append(product)
            
            # Sort by model score
            recommendations.sort(key=lambda x: x.get('model_score', 0), reverse=True)
            
            return recommendations[:6]  # Top 6 recommendations
            
        except Exception as e:
            logger.error(f"Model recommendation error: {str(e)}")
            return self.get_basic_recommendations(disease_type, symptoms, products)
    
    def get_basic_recommendations(self, disease_type, symptoms, products):
        """Get basic recommendations without trained model"""
        try:
            # Calculate scores for all products
            scored_products = []
            for product in products:
                score = self.calculate_product_score(product, disease_type)
                scored_products.append({
                    **product,
                    'basic_score': score
                })
            
            # Sort by score
            scored_products.sort(key=lambda x: x['basic_score'], reverse=True)
            
            return scored_products[:6]  # Top 6 recommendations
            
        except Exception as e:
            logger.error(f"Basic recommendation error: {str(e)}")
            return []

# Initialize the advanced training API
def init_advanced_training(app):
    """Initialize advanced training API"""
    return AdvancedTrainingAPI(app)
