/**
 * Real Image Analysis Service - JavaScript-based AI image processing
 * Handles real image analysis using Gemini AI with proper image conversion
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Convert image to base64 using fetch API (works with React Native)
 * @param {string} imageUri - Image URI
 * @returns {Promise<string>} Base64 encoded image
 */
const convertImageToBase64 = async (imageUri) => {
  try {
    console.log('🔄 Converting real image to base64...');
    console.log('📸 Image URI:', imageUri);
    
    // Use fetch to get the image as blob, then convert to base64
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('📊 Blob size:', blob.size, 'bytes');
    
    // Convert blob to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove data:image/jpeg;base64, prefix
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
 * Analyze real image using Gemini AI
 * @param {string} imageUri - Image URI
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeRealImageWithGemini = async (imageUri) => {
  try {
    console.log('🤖 Starting real image analysis with Gemini AI...');
    console.log('📸 Image URI:', imageUri);
    
    // Convert real image to base64
    const imageBase64 = await convertImageToBase64(imageUri);
    
    // Prepare the prompt for plant disease analysis
    const prompt = `
    Analyze this REAL plant image for disease detection. This is an actual photograph of a plant.
    
    Provide a detailed analysis including:
    
    1. Health status (healthy/diseased)
    2. Disease type if any (be specific about the disease)
    3. Severity level (low/medium/high)
    4. Symptoms observed (list all visible symptoms)
    5. Affected plant parts (leaves, stems, roots, etc.)
    6. Treatment recommendations (practical steps)
    7. Prevention strategies
    8. Confidence score (0.0 to 1.0)
    
    Format your response as JSON with these exact fields:
    {
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
    - Leaf spots, discoloration, wilting
    - Fungal infections, bacterial infections
    - Nutrient deficiencies
    - Pest damage
    - Environmental stress signs
    
    If you cannot clearly identify a disease, set confidence to a lower value 
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
    
    console.log('📡 Sending real image to Gemini API...');
    console.log('📊 Payload size:', JSON.stringify(payload).length, 'characters');
    
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
    console.error('❌ Real image analysis failed:', error);
    throw new Error(`Real image analysis failed: ${error.message}`);
  }
};

/**
 * Analyze real image with enhanced error handling and retry logic
 * @param {string} imageUri - Image URI
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeRealImageWithRetry = async (imageUri, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Real image analysis attempt ${attempt}/${maxRetries}`);
      const result = await analyzeRealImageWithGemini(imageUri);
      console.log(`✅ Real image analysis successful on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = attempt * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Real image analysis failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
};

/**
 * Get real image analysis with fallback
 * @param {string} imageUri - Image URI
 * @returns {Promise<Object>} Analysis result with fallback
 */
export const getRealImageAnalysis = async (imageUri) => {
  try {
    console.log('🔍 Starting real image analysis...');
    console.log('📸 Processing image:', imageUri);
    
    const result = await analyzeRealImageWithRetry(imageUri);
    return result;
  } catch (error) {
    console.error('❌ All real image analysis attempts failed, using fallback');
    
    // Return a fallback response
    return {
      success: false,
      analysis: {
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
  analyzeRealImageWithGemini,
  analyzeRealImageWithRetry,
  getRealImageAnalysis
};
