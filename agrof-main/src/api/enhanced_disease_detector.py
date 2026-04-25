#!/usr/bin/env python3
"""
Enhanced Disease Detection AI System for AGROF
Multi-model approach using Gemini, Google Vision, TensorFlow Hub, and PyTorch
"""

import os
import json
import base64
import requests
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DiseaseAnalysis:
    """Disease analysis result"""
    disease_type: str
    severity: str
    confidence: float
    crop_type: str
    symptoms: List[str]
    treatments: List[Dict]
    prevention: List[str]

class AGROFStoreDataLoader:
    """Load and parse AGROF store data for disease treatment recommendations"""
    
    def __init__(self, store_path: str):
        self.store_path = Path(store_path)
        self.products = {}
        self.disease_treatments = {}
        self.load_store_data()
    
    def load_store_data(self):
        """Load all store product data"""
        try:
            # Load fungicides data
            fungicides_path = self.store_path / "FUNGICIDES"
            if fungicides_path.exists():
                for product_dir in fungicides_path.iterdir():
                    if product_dir.is_dir():
                        product_file = product_dir / "product.md"
                        if product_file.exists():
                            product_data = self.parse_product_file(product_file)
                            self.products[product_data['name']] = product_data
                            
                            # Map diseases to treatments
                            if 'target_diseases' in product_data:
                                for disease in product_data['target_diseases']:
                                    if disease not in self.disease_treatments:
                                        self.disease_treatments[disease] = []
                                    self.disease_treatments[disease].append(product_data)
            
            logger.info(f"Loaded {len(self.products)} products and {len(self.disease_treatments)} disease treatments")
            
        except Exception as e:
            logger.error(f"Error loading store data: {e}")
    
    def parse_product_file(self, file_path: Path) -> Dict:
        """Parse product markdown file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            product_data = {
                'name': '',
                'target_diseases': [],
                'price': '',
                'application': '',
                'active_ingredient': '',
                'formulation': ''
            }
            
            lines = content.split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('# '):
                    product_data['name'] = line[2:].strip()
                elif 'Target Diseases:' in line:
                    diseases = line.split('Target Diseases:')[1].strip()
                    product_data['target_diseases'] = [d.strip() for d in diseases.split(',')]
                elif 'Price Information' in line:
                    # Extract price information
                    price_lines = []
                    for i, next_line in enumerate(lines[lines.index(line)+1:], 1):
                        if next_line.startswith('##') or next_line.startswith('#'):
                            break
                        if 'UGX' in next_line:
                            price_lines.append(next_line.strip())
                    product_data['price'] = '; '.join(price_lines)
                elif 'Usage Instructions' in line:
                    # Extract application instructions
                    app_lines = []
                    for i, next_line in enumerate(lines[lines.index(line)+1:], 1):
                        if next_line.startswith('##') or next_line.startswith('#'):
                            break
                        if next_line.strip():
                            app_lines.append(next_line.strip())
                    product_data['application'] = '; '.join(app_lines)
            
            return product_data
            
        except Exception as e:
            logger.error(f"Error parsing product file {file_path}: {e}")
            return {}
    
    def get_treatments_for_disease(self, disease: str) -> List[Dict]:
        """Get AGROF store treatments for a specific disease"""
        treatments = []
        
        # Direct match
        if disease.lower() in self.disease_treatments:
            treatments.extend(self.disease_treatments[disease.lower()])
        
        # Partial match
        for store_disease, products in self.disease_treatments.items():
            if disease.lower() in store_disease.lower() or store_disease.lower() in disease.lower():
                treatments.extend(products)
        
        return treatments

class GoogleVisionAPI:
    """Google Vision API integration for image analysis"""
    
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_VISION_API_KEY', '')
        self.base_url = "https://vision.googleapis.com/v1/images:annotate"
    
    def analyze_image(self, image_data: bytes) -> Dict:
        """Analyze image using Google Vision API"""
        try:
            if not self.api_key:
                logger.warning("Google Vision API key not found")
                return {}
            
            # Encode image
            image_b64 = base64.b64encode(image_data).decode('utf-8')
            
            payload = {
                "requests": [{
                    "image": {"content": image_b64},
                    "features": [
                        {"type": "LABEL_DETECTION", "maxResults": 10},
                        {"type": "OBJECT_LOCALIZATION", "maxResults": 10},
                        {"type": "TEXT_DETECTION", "maxResults": 5}
                    ]
                }]
            }
            
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return self.parse_vision_results(result)
            else:
                logger.error(f"Google Vision API error: {response.status_code}")
                return {}
                
        except Exception as e:
            logger.error(f"Google Vision analysis failed: {e}")
            return {}
    
    def parse_vision_results(self, result: Dict) -> Dict:
        """Parse Google Vision API results"""
        try:
            annotations = result.get('responses', [{}])[0]
            
            # Extract labels
            labels = []
            for label in annotations.get('labelAnnotations', []):
                labels.append({
                    'description': label['description'],
                    'confidence': label['score']
                })
            
            # Extract objects
            objects = []
            for obj in annotations.get('localizedObjectAnnotations', []):
                objects.append({
                    'name': obj['name'],
                    'confidence': obj['score']
                })
            
            # Filter for agricultural context
            agricultural_labels = [l for l in labels if any(keyword in l['description'].lower() 
                                 for keyword in ['plant', 'leaf', 'crop', 'vegetable', 'fruit', 'flower'])]
            
            return {
                'labels': agricultural_labels,
                'objects': objects,
                'confidence': max([l['confidence'] for l in agricultural_labels]) if agricultural_labels else 0
            }
            
        except Exception as e:
            logger.error(f"Error parsing vision results: {e}")
            return {}

class TensorFlowHubAPI:
    """TensorFlow Hub integration for crop classification"""
    
    def __init__(self):
        try:
            import tensorflow_hub as hub
            import tensorflow as tf
            
            self.tf = tf
            self.hub = hub
            
            # Load pre-trained model
            self.model_url = "https://tfhub.dev/google/aiy/vision/classifier/plants_V1/1"
            self.model = hub.load(self.model_url)
            
            # AGROF crop mapping
            self.agrof_crops = {
                0: "Watermelon", 1: "Tomato", 2: "Cabbage", 3: "Eggplant",
                4: "Cucumber", 5: "Barley", 6: "Pumpkin", 7: "Pepper",
                8: "Coriander", 9: "Unknown"
            }
            
        except ImportError:
            logger.warning("TensorFlow Hub not available")
            self.model = None
    
    def analyze_image(self, image_path: str) -> Dict:
        """Analyze image using TensorFlow Hub"""
        try:
            if not self.model:
                return {}
            
            # Load and preprocess image
            image = self.tf.io.read_file(image_path)
            image = self.tf.image.decode_jpeg(image, channels=3)
            image = self.tf.image.resize(image, [224, 224])
            image = self.tf.expand_dims(image, 0)
            image = image / 255.0
            
            # Predict
            predictions = self.model(image)
            predicted_class = self.tf.argmax(predictions[0])
            confidence = self.tf.reduce_max(predictions[0])
            
            return {
                'crop_type': self.agrof_crops.get(predicted_class.numpy(), "Unknown"),
                'confidence': confidence.numpy(),
                'all_predictions': predictions[0].numpy().tolist()
            }
            
        except Exception as e:
            logger.error(f"TensorFlow Hub analysis failed: {e}")
            return {}

class PyTorchVisionAPI:
    """PyTorch Vision integration for disease detection"""
    
    def __init__(self):
        try:
            import torch
            import torchvision.transforms as transforms
            from torchvision import models
            
            self.torch = torch
            self.transforms = transforms
            self.models = models
            
            # Load pre-trained model
            self.model = models.resnet50(pretrained=True)
            self.model.eval()
            
            # Define transforms
            self.transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
            ])
            
            # AGROF disease mapping
            self.agrof_diseases = {
                0: "Healthy", 1: "Early Blight", 2: "Late Blight", 
                3: "Downy Mildew", 4: "Powdery Mildew", 5: "Anthracnose",
                6: "Rust", 7: "Leaf Spot", 8: "Fusarium Wilt", 9: "Unknown"
            }
            
        except ImportError:
            logger.warning("PyTorch not available")
            self.model = None
    
    def analyze_image(self, image_path: str) -> Dict:
        """Analyze image using PyTorch Vision"""
        try:
            if not self.model:
                return {}
            
            from PIL import Image
            
            # Load and preprocess image
            image = Image.open(image_path)
            image_tensor = self.transform(image).unsqueeze(0)
            
            # Predict
            with self.torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = self.torch.nn.functional.softmax(outputs[0], dim=0)
            
            predicted_disease = self.torch.argmax(probabilities)
            confidence = self.torch.max(probabilities)
            
            return {
                'disease': self.agrof_diseases.get(predicted_disease.item(), "Unknown"),
                'confidence': confidence.item(),
                'all_probabilities': probabilities.numpy().tolist()
            }
            
        except Exception as e:
            logger.error(f"PyTorch Vision analysis failed: {e}")
            return {}

class EnhancedDiseaseDetector:
    """Main enhanced disease detection system"""
    
    def __init__(self, store_path: str):
        self.store_loader = AGROFStoreDataLoader(store_path)
        self.google_vision = GoogleVisionAPI()
        self.tensorflow_hub = TensorFlowHubAPI()
        self.pytorch_vision = PyTorchVisionAPI()
        
        # Gemini API configuration
        self.gemini_api_key = os.getenv('GEMINI_API_KEY', '')
        self.gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}"
    
    def analyze_disease(self, image_data: bytes, image_path: str = None, crop_type: str = None) -> DiseaseAnalysis:
        """Comprehensive disease analysis using all models"""
        try:
            logger.info("Starting enhanced disease analysis...")
            
            # 1. Google Vision API analysis
            vision_results = self.google_vision.analyze_image(image_data)
            logger.info(f"Google Vision results: {vision_results}")
            
            # 2. TensorFlow Hub analysis
            tf_results = {}
            if image_path and os.path.exists(image_path):
                tf_results = self.tensorflow_hub.analyze_image(image_path)
                logger.info(f"TensorFlow Hub results: {tf_results}")
            
            # 3. PyTorch Vision analysis
            pytorch_results = {}
            if image_path and os.path.exists(image_path):
                pytorch_results = self.pytorch_vision.analyze_image(image_path)
                logger.info(f"PyTorch Vision results: {pytorch_results}")
            
            # 4. Gemini API analysis with store context
            gemini_results = self.analyze_with_gemini(image_data, crop_type)
            logger.info(f"Gemini results: {gemini_results}")
            
            # 5. Ensemble decision making
            final_diagnosis = self.ensemble_decision({
                'vision': vision_results,
                'tensorflow': tf_results,
                'pytorch': pytorch_results,
                'gemini': gemini_results
            })
            
            # 6. Get AGROF store treatments
            treatments = self.store_loader.get_treatments_for_disease(final_diagnosis['disease_type'])
            
            return DiseaseAnalysis(
                disease_type=final_diagnosis['disease_type'],
                severity=final_diagnosis['severity'],
                confidence=final_diagnosis['confidence'],
                crop_type=final_diagnosis['crop_type'],
                symptoms=final_diagnosis['symptoms'],
                treatments=treatments,
                prevention=final_diagnosis['prevention']
            )
            
        except Exception as e:
            logger.error(f"Enhanced disease analysis failed: {e}")
            return DiseaseAnalysis(
                disease_type="Unknown",
                severity="Unknown",
                confidence=0.0,
                crop_type="Unknown",
                symptoms=[],
                treatments=[],
                prevention=[]
            )
    
    def analyze_with_gemini(self, image_data: bytes, crop_type: str = None) -> Dict:
        """Enhanced Gemini analysis with AGROF store context"""
        try:
            # Convert image to base64
            image_b64 = base64.b64encode(image_data).decode('utf-8')
            
            # Create enhanced prompt with store data
            store_context = self.get_store_context()
            
            prompt = f"""
            Analyze this {crop_type or 'agricultural'} plant image for disease detection using AGROF's comprehensive agricultural database.
            
            Available AGROF treatments:
            {store_context}
            
            Provide detailed analysis including:
            1. Disease identification with confidence score
            2. Severity assessment (low/medium/high)
            3. Specific symptoms observed
            4. Recommended AGROF treatment products with prices
            5. Application instructions
            6. Prevention strategies
            
            Format response as JSON with fields:
            - disease_type: specific disease name
            - severity: low/medium/high
            - confidence: 0.0-1.0
            - crop_type: identified crop
            - symptoms: list of observed symptoms
            - treatments: list of recommended AGROF products
            - prevention: list of prevention strategies
            """
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_b64
                            }
                        }
                    ]
                }]
            }
            
            response = requests.post(self.gemini_url, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    analysis_text = result['candidates'][0]['content']['parts'][0]['text']
                    return self.parse_gemini_response(analysis_text)
            
            return {}
            
        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return {}
    
    def get_store_context(self) -> str:
        """Get AGROF store context for Gemini prompt"""
        context = "AGROF Store Disease Treatments:\n"
        
        for disease, treatments in self.store_loader.disease_treatments.items():
            context += f"\n{disease.upper()}:\n"
            for treatment in treatments[:3]:  # Limit to top 3 treatments
                context += f"- {treatment['name']}: {treatment.get('price', 'Contact for pricing')}\n"
                if treatment.get('application'):
                    context += f"  Application: {treatment['application']}\n"
        
        return context
    
    def parse_gemini_response(self, response_text: str) -> Dict:
        """Parse Gemini API response"""
        try:
            import re
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # Fallback parsing
                return {
                    'disease_type': 'Unknown',
                    'severity': 'Unknown',
                    'confidence': 0.0,
                    'crop_type': 'Unknown',
                    'symptoms': ['Unable to parse AI response'],
                    'treatments': [],
                    'prevention': ['Consult agricultural experts']
                }
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return {}
    
    def ensemble_decision(self, results: Dict) -> Dict:
        """Combine results from all models using weighted voting"""
        weights = {
            'gemini': 0.4,      # Highest weight for comprehensive analysis
            'pytorch': 0.3,     # Good for disease detection
            'tensorflow': 0.2,  # Good for crop classification
            'vision': 0.1       # Supporting evidence
        }
        
        # Extract predictions from each model
        predictions = {}
        
        if 'gemini' in results and results['gemini']:
            predictions['gemini'] = {
                'disease': results['gemini'].get('disease_type', 'Unknown'),
                'crop': results['gemini'].get('crop_type', 'Unknown'),
                'confidence': results['gemini'].get('confidence', 0.0)
            }
        
        if 'pytorch' in results and results['pytorch']:
            predictions['pytorch'] = {
                'disease': results['pytorch'].get('disease', 'Unknown'),
                'confidence': results['pytorch'].get('confidence', 0.0)
            }
        
        if 'tensorflow' in results and results['tensorflow']:
            predictions['tensorflow'] = {
                'crop': results['tensorflow'].get('crop_type', 'Unknown'),
                'confidence': results['tensorflow'].get('confidence', 0.0)
            }
        
        # Weighted voting
        disease_votes = {}
        crop_votes = {}
        total_confidence = 0
        
        for model, prediction in predictions.items():
            weight = weights.get(model, 0.1)
            
            if 'disease' in prediction:
                disease = prediction['disease']
                if disease not in disease_votes:
                    disease_votes[disease] = 0
                disease_votes[disease] += weight
            
            if 'crop' in prediction:
                crop = prediction['crop']
                if crop not in crop_votes:
                    crop_votes[crop] = 0
                crop_votes[crop] += weight
            
            total_confidence += prediction.get('confidence', 0) * weight
        
        # Final decision
        final_disease = max(disease_votes.items(), key=lambda x: x[1])[0] if disease_votes else 'Unknown'
        final_crop = max(crop_votes.items(), key=lambda x: x[1])[0] if crop_votes else 'Unknown'
        final_confidence = min(total_confidence, 1.0)
        
        return {
            'disease_type': final_disease,
            'crop_type': final_crop,
            'confidence': final_confidence,
            'severity': 'medium',  # Default severity
            'symptoms': ['AI analysis completed'],
            'prevention': ['Regular monitoring recommended']
        }

# Example usage
if __name__ == "__main__":
    # Initialize the enhanced disease detector
    store_path = "/home/darksagae/Desktop/saga/agrof1/agrof-main/mobile/app/assets/store"
    detector = EnhancedDiseaseDetector(store_path)
    
    # Example analysis
    print("Enhanced Disease Detection AI System initialized")
    print(f"Loaded {len(detector.store_loader.products)} products")
    print(f"Available disease treatments: {len(detector.store_loader.disease_treatments)}")
