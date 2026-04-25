/**
 * Proper Image Analysis Service - JavaScript-based AI image processing
 * Handles real image analysis using Gemini AI with proper image conversion
 */

import { Platform } from 'react-native';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Convert image to base64 using React Native's built-in capabilities
 * @param {string} imageUri - Image URI
 * @returns {Promise<string>} Base64 encoded image
 */
const convertImageToBase64 = async (imageUri) => {
  try {
    console.log('🔄 Converting real image to base64...');
    console.log('📸 Image URI:', imageUri);
    
    // For React Native, we'll use fetch to get the image
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    // Convert to blob first
    const blob = await response.blob();
    console.log('📊 Blob size:', blob.size, 'bytes');
    
    // Convert blob to base64 using FileReader
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Extract base64 string (remove data:image/jpeg;base64, prefix)
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    console.log('✅ Image converted to base64');
    console.log('📊 Base64 length:', base64.length);
    
    return base64;
  } catch (error) {
    console.error('❌ Error converting image to base64:', error);
    throw new Error(`Image conversion failed: ${error.message}`);
  }
};

/**
 * Analyze image using Gemini AI with proper image data
 * @param {string} imageUri - Image URI
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeImageWithProperMethod = async (imageUri) => {
  try {
    console.log('🤖 Starting proper image analysis with Gemini AI...');
    console.log('📸 Image URI:', imageUri);
    
    // Convert image to base64
    const imageBase64 = await convertImageToBase64(imageUri);
    
    // Validate base64 data
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Invalid image data - base64 too short');
    }
    
    // Prepare the prompt for plant disease analysis and crop identification
    const prompt = `
    Analyze this plant image for disease detection AND crop identification. This is an actual photograph of a plant.
    
    Provide a detailed analysis including:
    
    1. CROP IDENTIFICATION:
       - Identify the specific crop/plant type (e.g., tomato, corn, rice, wheat, etc.)
       - Plant family (e.g., Solanaceae, Poaceae, Fabaceae, etc.)
       - Growth stage (seedling, vegetative, flowering, fruiting, etc.)
    
    2. DISEASE ANALYSIS:
       - Health status (healthy/diseased)
       - Disease type if any (be specific about the disease)
       - Severity level (low/medium/high)
       - Symptoms observed (list all visible symptoms)
       - Affected plant parts (leaves, stems, roots, etc.)
    
    3. TREATMENT & PREVENTION:
       - Treatment recommendations (practical steps)
       - Prevention strategies
       - Confidence score (0.0 to 1.0)
    
    Format your response as JSON with these exact fields:
    {
      "crop_type": "specific crop name (e.g., tomato, corn, rice)",
      "plant_family": "botanical family name",
      "growth_stage": "seedling/vegetative/flowering/fruiting/mature",
      "health_status": "healthy" or "diseased",
      "disease_type": "specific disease name" or "none",
      "severity_level": "low", "medium", or "high",
      "symptoms": ["list", "of", "symptoms"],
      "affected_parts": ["list", "of", "affected", "parts"],
      "recommendations": ["list", "of", "treatment", "recommendations"],
      "prevention": ["list", "of", "prevention", "strategies"],
      "confidence": 0.0 to 1.0
    }
    
    Be thorough and accurate in your analysis. Look for:
    - Plant characteristics (leaf shape, stem structure, flowers, fruits)
    - Crop-specific features (grain heads, fruit clusters, root vegetables)
    - Disease symptoms (leaf spots, discoloration, wilting)
    - Fungal infections, bacterial infections
    - Nutrient deficiencies, pest damage
    - Environmental stress signs
    
    If you cannot clearly identify the crop or disease, set confidence to a lower value 
    and provide general recommendations for plant health.
    `;
    
    // Prepare the request payload
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }]
    };
    
    console.log('📡 Sending image to Gemini API...');
    console.log('📊 Payload size:', JSON.stringify(payload).length, 'characters');
    console.log('📊 Base64 length:', imageBase64.length);
    
    // Send request to Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Gemini API response received');
    
    // Parse the analysis result
    if (result.candidates && result.candidates.length > 0) {
      const analysisText = result.candidates[0].content.parts[0].text;
      console.log('🔍 Raw analysis text length:', analysisText.length);
      
      // Try to extract JSON from the response
      try {
        // Look for JSON in the response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysisJson = JSON.parse(jsonMatch[0]);
          console.log('✅ Parsed analysis JSON:', analysisJson);
          
          return {
            success: true,
            analysis: analysisJson,
            rawResponse: analysisText,
            timestamp: new Date().toISOString(),
            imageProcessed: true
          };
        } else {
          // Fallback: create structured response from text
          console.log('⚠️ No JSON found, creating structured response from text');
          return {
            success: true,
            analysis: {
              crop_type: "unknown",
              plant_family: "unknown",
              growth_stage: "unknown",
              health_status: "unknown",
              disease_type: "analysis_incomplete",
              severity_level: "unknown",
              symptoms: ["Unable to parse AI response"],
              affected_parts: ["unknown"],
              recommendations: ["Consult agricultural expert"],
              prevention: ["Regular monitoring recommended"],
              confidence: 0.0
            },
            rawResponse: analysisText,
            timestamp: new Date().toISOString(),
            imageProcessed: true
          };
        }
      } catch (parseError) {
        console.error('❌ Error parsing Gemini response:', parseError);
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    } else {
      throw new Error('No analysis results from Gemini API');
    }
    
  } catch (error) {
    console.error('❌ Proper image analysis failed:', error);
    throw new Error(`Proper image analysis failed: ${error.message}`);
  }
};

/**
 * Get proper image analysis with fallback
 * @param {string} imageUri - Image URI
 * @returns {Promise<Object>} Analysis result with fallback
 */
export const getProperImageAnalysis = async (imageUri) => {
  try {
    console.log('🔍 Starting proper image analysis...');
    console.log('📸 Processing image:', imageUri);
    
    const result = await analyzeImageWithProperMethod(imageUri);
    return result;
  } catch (error) {
    console.error('❌ Proper image analysis failed, using fallback');
    
    // Return a fallback response
    return {
      success: false,
      analysis: {
        crop_type: "unknown",
        plant_family: "unknown",
        growth_stage: "unknown",
        health_status: "unknown",
        disease_type: "analysis_failed",
        severity_level: "unknown",
        symptoms: ["Analysis unavailable - please try again"],
        affected_parts: ["unknown"],
        recommendations: ["Please try again or consult an expert"],
        prevention: ["Regular monitoring recommended"],
        confidence: 0.0
      },
      error: error.message,
      timestamp: new Date().toISOString(),
      imageProcessed: false
    };
  }
};

export default {
  analyzeImageWithProperMethod,
  getProperImageAnalysis
};
