"""
API schemas for request/response validation.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class PredictionRequest:
    """Schema for prediction request."""
    image: bytes
    filename: str
    language: str = "en"
    
    def validate(self) -> List[str]:
        """Validate request data."""
        errors = []
        
        if not self.image:
            errors.append("Image file is required")
        
        if not self.filename:
            errors.append("Filename is required")
        
        if self.language not in ["en", "lg", "rn", "sw"]:
            errors.append("Language must be one of: en, lg, rn, sw")
        
        return errors

@dataclass
class PredictionResponse:
    """Schema for prediction response."""
    success: bool
    prediction: Dict[str, Any]
    treatment: Dict[str, Any]
    processing_time: str
    error: Optional[str] = None
    message: Optional[str] = None

@dataclass
class ModelInfoResponse:
    """Schema for model info response."""
    success: bool
    model_info: Dict[str, Any]
    error: Optional[str] = None
    message: Optional[str] = None

@dataclass
class HealthResponse:
    """Schema for health check response."""
    status: str
    model_loaded: bool
    timestamp: str

@dataclass
class ErrorResponse:
    """Schema for error response."""
    error: str
    message: str
    timestamp: str

# API Response templates
PREDICTION_RESPONSE_TEMPLATE = {
    "success": True,
    "prediction": {
        "disease": "string",
        "confidence": 0.0,
        "probabilities": {
            "disease1": 0.0,
            "disease2": 0.0
        }
    },
    "treatment": {
        "disease": "string",
        "disease_name": "string",
        "confidence": 0.0,
        "severity_level": "string",
        "recommended_actions": ["string"],
        "prevention_tips": ["string"],
        "references": ["string"],
        "description": "string"
    },
    "processing_time": "string"
}

ERROR_RESPONSE_TEMPLATE = {
    "error": "string",
    "message": "string",
    "timestamp": "string"
}

HEALTH_RESPONSE_TEMPLATE = {
    "status": "healthy",
    "model_loaded": True,
    "timestamp": "string"
}

MODEL_INFO_RESPONSE_TEMPLATE = {
    "success": True,
    "model_info": {
        "model_type": "string",
        "num_classes": 0,
        "classes": ["string"],
        "device": "string",
        "checkpoint_path": "string"
    }
}

# Validation functions
def validate_image_file(filename: str, allowed_extensions: set) -> bool:
    """Validate image file extension."""
    if not filename or '.' not in filename:
        return False
    
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in allowed_extensions

def validate_language(language: str) -> bool:
    """Validate language code."""
    return language in ["en", "lg", "rn", "sw"]

def validate_confidence(confidence: float) -> bool:
    """Validate confidence value."""
    return 0.0 <= confidence <= 1.0

def validate_disease(disease: str, valid_diseases: List[str]) -> bool:
    """Validate disease name."""
    return disease in valid_diseases

# Response formatting functions
def format_prediction_response(
    disease: str,
    confidence: float,
    probabilities: Dict[str, float],
    treatment: Dict[str, Any]
) -> Dict[str, Any]:
    """Format prediction response."""
    return {
        "success": True,
        "prediction": {
            "disease": disease,
            "confidence": confidence,
            "probabilities": probabilities
        },
        "treatment": treatment,
        "processing_time": datetime.now().isoformat()
    }

def format_error_response(error: str, message: str) -> Dict[str, Any]:
    """Format error response."""
    return {
        "error": error,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }

def format_health_response(model_loaded: bool) -> Dict[str, Any]:
    """Format health check response."""
    return {
        "status": "healthy",
        "model_loaded": model_loaded,
        "timestamp": datetime.now().isoformat()
    }

def format_model_info_response(model_info: Dict[str, Any]) -> Dict[str, Any]:
    """Format model info response."""
    return {
        "success": True,
        "model_info": model_info
    }
