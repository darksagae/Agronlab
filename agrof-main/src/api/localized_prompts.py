#!/usr/bin/env python3
"""
Localized AI Prompts for AGROF
Supports Luganda, English, Runyankole, and Kiswahili
"""

def get_disease_detection_prompt(language: str) -> str:
    """Get localized disease detection prompt"""
    prompts = {
        'en': """
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
        """,
        
        'lg': """
        Laba ekifaananyi kino ku bulwadde. Oba eky'okulaba:
        1. Embeera y'omulimi (mulungi/omulwadde)
        2. Ekika ky'obulwadde bwe kiri
        3. Obunene bw'obulwadde (obutono/obukulu/obunene)
        4. Obubonero obulabika
        5. Eby'okukola
        6. Eby'okukola okutwalira awamu
        
        Tandika okuddamu nga JSON n'ebintu bino:
        - health_status: "mulungi" oba "omulwadde"
        - disease_type: erinnya ly'obulwadde oba "tewali"
        - severity_level: "obutono", "obukulu", oba "obunene"
        - symptoms: eby'okulaba
        - recommendations: eby'okukola
        - confidence: obukkiriza (0.0 okutuuka 1.0)
        """,
        
        'rn': """
        Laba ekifaananyi kino ku bulwadde. Oba eky'okulaba:
        1. Embeera y'omulimi (mulungi/omulwadde)
        2. Ekika ky'obulwadde bwe kiri
        3. Obunene bw'obulwadde (obutono/obukulu/obunene)
        4. Obubonero obulabika
        5. Eby'okukola
        6. Eby'okukola okutwalira awamu
        
        Tandika okuddamu nga JSON n'ebintu bino:
        - health_status: "mulungi" oba "omulwadde"
        - disease_type: erinnya ly'obulwadde oba "tewali"
        - severity_level: "obutono", "obukulu", oba "obunene"
        - symptoms: eby'okulaba
        - recommendations: eby'okukola
        - confidence: obukkiriza (0.0 okutuuka 1.0)
        """,
        
        'sw': """
        Chambua picha hii ya mmea ili kugundua magonjwa. Toa uchambuzi wa kina pamoja na:
        1. Hali ya afya (mzuri/mgonjwa)
        2. Aina ya ugonjwa ikiwepo
        3. Kiwango cha ugonjwa (cha chini/cha kati/cha juu)
        4. Dalili zilizozingatiwa
        5. Mapendekezo ya matibabu
        6. Vidokezo vya kuzuia
        
        Jibu kwa umbizo la JSON na sehemu hizi:
        - health_status: "mzuri" au "mgonjwa"
        - disease_type: jina la ugonjwa au "hakuna"
        - severity_level: "cha chini", "cha kati", au "cha juu"
        - symptoms: orodha ya dalili zilizozingatiwa
        - recommendations: orodha ya mapendekezo ya matibabu
        - confidence: kiwango cha kujiamini (0.0 hadi 1.0)
        """
    }
    return prompts.get(language, prompts['en'])

def get_chatbot_prompt(language: str, message: str) -> str:
    """Get localized chatbot prompt"""
    prompts = {
        'en': f"""
        You are AgrofBot, an AI agricultural assistant. Provide helpful, detailed advice for: {message}. 
        Include practical tips, disease prevention, and farming best practices.
        Respond in English and be specific to East African farming conditions.
        """,
        
        'lg': f"""
        Oli AgrofBot, omuyambi wa AI wa bulimi. Waayo obuyambi obw'omulimi ku: {message}.
        Waayo eby'okukola, okuziyiza obulwadde, n'ebikolwa ebirungi mu bulimi.
        Ddamu mu Luganda era beera mu bulimi bwa East Africa.
        """,
        
        'rn': f"""
        Oli AgrofBot, omuyambi wa AI wa bulimi. Waayo obuyambi obw'omulimi ku: {message}.
        Waayo eby'okukola, okuziyiza obulwadde, n'ebikolwa ebirungi mu bulimi.
        Ddamu mu Runyankole era beera mu bulimi bwa East Africa.
        """,
        
        'sw': f"""
        Wewe ni AgrofBot, msaidizi wa AI wa kilimo. Toa ushauri muhimu na wa kina kuhusu: {message}.
        Jumuisha vidokezo vya vitendo, kuzuia magonjwa, na mazoea mazuri ya kilimo.
        Jibu kwa Kiswahili na uzingatie hali ya kilimo cha Afrika Mashariki.
        """
    }
    return prompts.get(language, prompts['en'])

def get_crop_analysis_prompt(language: str) -> str:
    """Get localized crop analysis prompt"""
    prompts = {
        'en': """
        Analyze this agricultural image for crop health, disease detection, and provide recommendations.
        Focus on: 1) Plant identification, 2) Disease detection, 3) Health status, 
        4) Treatment recommendations, 5) Prevention tips.
        """,
        
        'lg': """
        Laba ekifaananyi kino ku bulimi ku bulungi, okulaba obulwadde, n'okwaayo eby'okukola.
        Teekawo: 1) Okulaba omulimi, 2) Okulaba obulwadde, 3) Embeera y'omulimi,
        4) Eby'okukola, 5) Eby'okukola okutwalira awamu.
        """,
        
        'rn': """
        Laba ekifaananyi kino ku bulimi ku bulungi, okulaba obulwadde, n'okwaayo eby'okukola.
        Teekawo: 1) Okulaba omulimi, 2) Okulaba obulwadde, 3) Embeera y'omulimi,
        4) Eby'okukola, 5) Eby'okukola okutwalira awamu.
        """,
        
        'sw': """
        Chambua picha hii ya kilimo ili kugundua afya ya mazao, magonjwa, na kutoa mapendekezo.
        Zingatia: 1) Utambulisho wa mmea, 2) Kugundua magonjwa, 3) Hali ya afya,
        4) Mapendekezo ya matibabu, 5) Vidokezo vya kuzuia.
        """
    }
    return prompts.get(language, prompts['en'])

def get_product_recommendation_prompt(language: str, disease_type: str) -> str:
    """Get localized product recommendation prompt"""
    prompts = {
        'en': f"""
        Based on the detected disease: {disease_type}, recommend appropriate agricultural products.
        Include: 1) Specific product names, 2) Application methods, 3) Dosage instructions,
        4) Safety precautions, 5) Expected results.
        """,
        
        'lg': f"""
        Ku lw'obulwadde obulabidde: {disease_type}, waayo ebintu by'obulimi ebirungi.
        Waayo: 1) Amannya g'ebintu, 2) Enkola z'okukozesa, 3) Eby'okukola,
        4) Eby'okukola okutwalira awamu, 5) Eby'okulindirira.
        """,
        
        'rn': f"""
        Ku lw'obulwadde obulabidde: {disease_type}, waayo ebintu by'obulimi ebirungi.
        Waayo: 1) Amannya g'ebintu, 2) Enkola z'okukozesa, 3) Eby'okukola,
        4) Eby'okukola okutwalira awamu, 5) Eby'okulindirira.
        """,
        
        'sw': f"""
        Kulingana na ugonjwa uliogunduliwa: {disease_type}, pendekeza bidhaa za kilimo zinazofaa.
        Jumuisha: 1) Majina ya bidhaa mahususi, 2) Njia za matumizi, 3) Maagizo ya kipimo,
        4) Tahadhari za usalama, 5) Matokeo yanayotarajiwa.
        """
    }
    return prompts.get(language, prompts['en'])

def get_weather_advice_prompt(language: str) -> str:
    """Get localized weather advice prompt"""
    prompts = {
        'en': """
        Provide weather-based farming advice for East Africa.
        Include: 1) Seasonal planting recommendations, 2) Weather protection measures,
        3) Irrigation advice, 4) Crop rotation suggestions.
        """,
        
        'lg': """
        Waayo eby'obulimi eby'okukozesa embeera y'ebisera mu East Africa.
        Waayo: 1) Eby'okukola mu bisera, 2) Eby'okukola okutwalira awamu,
        3) Eby'okukola okutwalira awamu, 4) Eby'okukola okutwalira awamu.
        """,
        
        'rn': """
        Waayo eby'obulimi eby'okukozesa embeera y'ebisera mu East Africa.
        Waayo: 1) Eby'okukola mu bisera, 2) Eby'okukola okutwalira awamu,
        3) Eby'okukola okutwalira awamu, 4) Eby'okukola okutwalira awamu.
        """,
        
        'sw': """
        Toa ushauri wa kilimo wa msingi wa hali ya hewa kwa Afrika Mashariki.
        Jumuisha: 1) Mapendekezo ya kupanda kwa msimu, 2) Hatua za kulinda hali ya hewa,
        3) Ushauri wa umwagiliaji, 4) Mapendekezo ya mzunguko wa mazao.
        """
    }
    return prompts.get(language, prompts['en'])

# Language-specific response formatting
def format_disease_response(language: str, response_data: dict) -> dict:
    """Format disease detection response for specific language"""
    if language == 'en':
        return response_data
    
    # For other languages, we would translate the response
    # This is a placeholder for actual translation logic
    return response_data

def get_supported_languages() -> list:
    """Get list of supported languages"""
    return ['en', 'lg', 'rn', 'sw']

def is_language_supported(language: str) -> bool:
    """Check if language is supported"""
    return language in get_supported_languages()


