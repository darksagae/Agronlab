"""
AI Product Database System for AGROF
Comprehensive database-driven product matching based on AI disease analysis
"""

import sqlite3
import json
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIProductDatabase:
    def __init__(self, db_path: str = "ai_product_database.db"):
        self.db_path = db_path
        self.init_database()
        self.disease_product_mapping = self.load_disease_mappings()
        self.symptom_keywords = self.load_symptom_keywords()
    
    def init_database(self):
        """Initialize the AI product database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Disease-Symptom-Product mapping table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS disease_product_mapping (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                disease_name TEXT NOT NULL,
                disease_type TEXT NOT NULL,
                symptoms TEXT NOT NULL,
                product_categories TEXT NOT NULL,
                product_names TEXT NOT NULL,
                treatment_priority INTEGER DEFAULT 1,
                effectiveness_score REAL DEFAULT 0.8,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Product intelligence table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS product_intelligence (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                product_name TEXT NOT NULL,
                category TEXT NOT NULL,
                disease_targets TEXT NOT NULL,
                symptom_targets TEXT NOT NULL,
                treatment_type TEXT NOT NULL,
                application_method TEXT NOT NULL,
                effectiveness_keywords TEXT NOT NULL,
                ai_confidence_score REAL DEFAULT 0.8,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # AI command history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ai_commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                disease_analysis TEXT NOT NULL,
                symptoms_detected TEXT NOT NULL,
                ai_command TEXT NOT NULL,
                products_fetched TEXT NOT NULL,
                success_rate REAL DEFAULT 0.0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("AI Product Database initialized")
    
    def load_disease_mappings(self) -> Dict:
        """Load comprehensive disease-to-product mappings"""
        return {
            # Fungal Diseases
            "Fungal Leaf Spot": {
                "symptoms": ["yellow spots", "brown spots", "leaf spots", "circular lesions"],
                "categories": ["fungicides", "organic_chemicals"],
                "products": ["Copper Fungicide", "Mancozeb", "Chlorothalonil", "Organic Fungicide"],
                "treatment_priority": 1,
                "effectiveness": 0.9
            },
            "Powdery Mildew": {
                "symptoms": ["white powder", "powdery coating", "leaf distortion", "stunted growth"],
                "categories": ["fungicides", "organic_chemicals"],
                "products": ["Sulfur Fungicide", "Neem Oil", "Baking Soda Spray", "Copper Spray"],
                "treatment_priority": 1,
                "effectiveness": 0.85
            },
            "Root Rot": {
                "symptoms": ["wilting", "yellow leaves", "stunted growth", "root decay"],
                "categories": ["fungicides", "organic_chemicals"],
                "products": ["Trichoderma", "Benomyl", "Root Treatment", "Soil Fungicide"],
                "treatment_priority": 1,
                "effectiveness": 0.8
            },
            "Anthracnose": {
                "symptoms": ["dark spots", "sunken lesions", "fruit rot", "leaf blight"],
                "categories": ["fungicides", "organic_chemicals"],
                "products": ["Copper Fungicide", "Mancozeb", "Chlorothalonil", "Organic Treatment"],
                "treatment_priority": 1,
                "effectiveness": 0.88
            },
            
            # Bacterial Diseases
            "Bacterial Blight": {
                "symptoms": ["water-soaked spots", "brown lesions", "leaf wilting", "stem cankers"],
                "categories": ["bactericides", "copper_products", "organic_chemicals"],
                "products": ["Copper Bactericide", "Streptomycin", "Copper Hydroxide", "Organic Bactericide"],
                "treatment_priority": 1,
                "effectiveness": 0.82
            },
            "Bacterial Wilt": {
                "symptoms": ["sudden wilting", "yellow leaves", "stem discoloration", "plant death"],
                "categories": ["bactericides", "soil_treatments", "organic_chemicals"],
                "products": ["Copper Treatment", "Soil Bactericide", "Trichoderma", "Organic Soil Treatment"],
                "treatment_priority": 1,
                "effectiveness": 0.75
            },
            
            # Viral Diseases
            "Mosaic Virus": {
                "symptoms": ["mottled leaves", "yellow patterns", "stunted growth", "distorted leaves"],
                "categories": ["virus_control", "organic_chemicals", "plant_boosters"],
                "products": ["Virus Control", "Plant Booster", "Organic Treatment", "Immune System Booster"],
                "treatment_priority": 2,
                "effectiveness": 0.6
            },
            
            # Pest-Related Issues
            "Aphid Infestation": {
                "symptoms": ["sticky leaves", "curled leaves", "honeydew", "ant activity"],
                "categories": ["insecticides", "organic_chemicals", "natural_controls"],
                "products": ["Neem Oil", "Insecticidal Soap", "Pyrethrin", "Ladybug Attractant"],
                "treatment_priority": 1,
                "effectiveness": 0.9
            },
            "Whitefly Infestation": {
                "symptoms": ["white insects", "yellow leaves", "sticky residue", "sooty mold"],
                "categories": ["insecticides", "organic_chemicals", "sticky_traps"],
                "products": ["Whitefly Control", "Neem Oil", "Yellow Sticky Traps", "Organic Insecticide"],
                "treatment_priority": 1,
                "effectiveness": 0.85
            },
            "Spider Mite Infestation": {
                "symptoms": ["fine webbing", "yellow spots", "leaf damage", "dusty appearance"],
                "categories": ["miticides", "organic_chemicals", "natural_controls"],
                "products": ["Spider Mite Control", "Neem Oil", "Predatory Mites", "Organic Miticide"],
                "treatment_priority": 1,
                "effectiveness": 0.88
            },
            
            # Nutrient Deficiencies
            "Nitrogen Deficiency": {
                "symptoms": ["yellow leaves", "stunted growth", "poor development", "leaf drop"],
                "categories": ["fertilizers", "nitrogen_products", "organic_fertilizers"],
                "products": ["Nitrogen Fertilizer", "Urea", "Ammonium Nitrate", "Organic Nitrogen"],
                "treatment_priority": 2,
                "effectiveness": 0.95
            },
            "Phosphorus Deficiency": {
                "symptoms": ["purple leaves", "stunted growth", "poor root development", "delayed maturity"],
                "categories": ["fertilizers", "phosphorus_products", "organic_fertilizers"],
                "products": ["Phosphorus Fertilizer", "Superphosphate", "Bone Meal", "Organic Phosphorus"],
                "treatment_priority": 2,
                "effectiveness": 0.9
            },
            "Potassium Deficiency": {
                "symptoms": ["brown leaf edges", "yellowing", "weak stems", "poor fruit quality"],
                "categories": ["fertilizers", "potassium_products", "organic_fertilizers"],
                "products": ["Potassium Fertilizer", "Potash", "Wood Ash", "Organic Potassium"],
                "treatment_priority": 2,
                "effectiveness": 0.92
            }
        }
    
    def load_symptom_keywords(self) -> Dict:
        """Load symptom keyword mappings for better matching"""
        return {
            "fungal_symptoms": ["spots", "powder", "mold", "rot", "blight", "wilt", "lesions", "discoloration"],
            "bacterial_symptoms": ["water-soaked", "oozing", "cankers", "wilt", "spots", "blight"],
            "viral_symptoms": ["mosaic", "mottled", "distorted", "stunted", "yellowing", "patterns"],
            "pest_symptoms": ["holes", "chewing", "webbing", "sticky", "insects", "tunnels", "galls"],
            "nutrient_symptoms": ["yellowing", "purple", "brown", "stunted", "weak", "poor growth"]
        }
    
    def analyze_disease_and_generate_command(self, disease_analysis: Dict) -> Dict:
        """Analyze disease and generate AI command for product fetching"""
        try:
            disease_type = disease_analysis.get('disease_type', 'Unknown')
            symptoms = disease_analysis.get('symptoms', [])
            severity = disease_analysis.get('severity_level', 'medium')
            crop_type = disease_analysis.get('crop_type', 'Unknown')
            
            logger.info(f"Analyzing disease: {disease_type} with symptoms: {symptoms}")
            
            # Generate AI command based on analysis
            ai_command = self.generate_ai_command(disease_type, symptoms, severity, crop_type)
            
            # Store command in database
            self.store_ai_command(disease_analysis, ai_command)
            
            return {
                "success": True,
                "ai_command": ai_command,
                "disease_type": disease_type,
                "symptoms": symptoms,
                "recommended_products": ai_command.get("products", []),
                "confidence": ai_command.get("confidence", 0.8)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing disease: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "ai_command": self.get_fallback_command()
            }
    
    def generate_ai_command(self, disease_type: str, symptoms: List[str], severity: str, crop_type: str) -> Dict:
        """Generate intelligent AI command for product fetching"""
        
        # Find matching disease in database
        disease_match = self.find_disease_match(disease_type, symptoms)
        
        if disease_match:
            # Generate specific command based on disease
            command = {
                "action": "fetch_products",
                "disease_type": disease_type,
                "symptoms": symptoms,
                "severity": severity,
                "crop_type": crop_type,
                "categories": disease_match["categories"],
                "products": disease_match["products"],
                "treatment_priority": disease_match["treatment_priority"],
                "effectiveness": disease_match["effectiveness"],
                "confidence": 0.9,
                "search_strategy": "disease_specific"
            }
        else:
            # Generate general command based on symptoms
            command = self.generate_symptom_based_command(symptoms, severity, crop_type)
        
        return command
    
    def find_disease_match(self, disease_type: str, symptoms: List[str]) -> Optional[Dict]:
        """Find matching disease in database"""
        disease_lower = disease_type.lower()
        
        # Direct disease name match
        for disease, data in self.disease_product_mapping.items():
            if disease_lower in disease.lower() or disease.lower() in disease_lower:
                return data
        
        # Symptom-based matching
        for disease, data in self.disease_product_mapping.items():
            disease_symptoms = [s.lower() for s in data["symptoms"]]
            user_symptoms = [s.lower() for s in symptoms]
            
            # Check for symptom overlap
            overlap = set(disease_symptoms) & set(user_symptoms)
            if len(overlap) >= 2:  # At least 2 matching symptoms
                return data
        
        return None
    
    def generate_symptom_based_command(self, symptoms: List[str], severity: str, crop_type: str) -> Dict:
        """Generate command based on symptoms when disease is unknown"""
        categories = []
        products = []
        
        # Analyze symptoms to determine treatment type
        symptom_text = " ".join(symptoms).lower()
        
        if any(keyword in symptom_text for keyword in self.symptom_keywords["fungal_symptoms"]):
            categories.extend(["fungicides", "organic_chemicals"])
            products.extend(["Copper Fungicide", "Organic Fungicide", "Sulfur Treatment"])
        
        if any(keyword in symptom_text for keyword in self.symptom_keywords["bacterial_symptoms"]):
            categories.extend(["bactericides", "copper_products"])
            products.extend(["Copper Bactericide", "Streptomycin", "Copper Hydroxide"])
        
        if any(keyword in symptom_text for keyword in self.symptom_keywords["pest_symptoms"]):
            categories.extend(["insecticides", "organic_chemicals"])
            products.extend(["Neem Oil", "Insecticidal Soap", "Pyrethrin"])
        
        if any(keyword in symptom_text for keyword in self.symptom_keywords["nutrient_symptoms"]):
            categories.extend(["fertilizers", "organic_fertilizers"])
            products.extend(["NPK Fertilizer", "Organic Fertilizer", "Plant Booster"])
        
        # Remove duplicates
        categories = list(set(categories))
        products = list(set(products))
        
        return {
            "action": "fetch_products",
            "disease_type": "Unknown",
            "symptoms": symptoms,
            "severity": severity,
            "crop_type": crop_type,
            "categories": categories,
            "products": products,
            "treatment_priority": 2,
            "effectiveness": 0.7,
            "confidence": 0.7,
            "search_strategy": "symptom_based"
        }
    
    def get_fallback_command(self) -> Dict:
        """Get fallback command when analysis fails"""
        return {
            "action": "fetch_products",
            "disease_type": "Unknown",
            "symptoms": [],
            "severity": "medium",
            "crop_type": "Unknown",
            "categories": ["fertilizers", "organic_chemicals"],
            "products": ["General Fertilizer", "Plant Booster", "Organic Treatment"],
            "treatment_priority": 3,
            "effectiveness": 0.5,
            "confidence": 0.5,
            "search_strategy": "fallback"
        }
    
    def store_ai_command(self, disease_analysis: Dict, ai_command: Dict):
        """Store AI command in database for learning"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO ai_commands 
            (disease_analysis, symptoms_detected, ai_command, products_fetched, success_rate)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            json.dumps(disease_analysis),
            json.dumps(ai_command.get("symptoms", [])),
            json.dumps(ai_command),
            json.dumps(ai_command.get("products", [])),
            ai_command.get("confidence", 0.0)
        ))
        
        conn.commit()
        conn.close()
    
    def get_command_history(self, limit: int = 10) -> List[Dict]:
        """Get AI command history for analysis"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM ai_commands 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (limit,))
        
        results = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": row[0],
                "disease_analysis": json.loads(row[1]),
                "symptoms_detected": json.loads(row[2]),
                "ai_command": json.loads(row[3]),
                "products_fetched": json.loads(row[4]),
                "success_rate": row[5],
                "timestamp": row[6]
            }
            for row in results
        ]
    
    def update_effectiveness(self, command_id: int, success_rate: float):
        """Update command effectiveness based on results"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE ai_commands 
            SET success_rate = ? 
            WHERE id = ?
        ''', (success_rate, command_id))
        
        conn.commit()
        conn.close()

# Initialize the AI Product Database
ai_db = AIProductDatabase()
