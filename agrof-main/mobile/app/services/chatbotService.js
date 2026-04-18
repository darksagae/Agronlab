/**
 * Chatbot Service for AGRON
 * Uses dedicated Gemini API key for conversational AI
 */

const CHATBOT_API_KEY = "AIzaSyDUMB5H8bzSIbaECO2CmVk3hfoNj7zfU60";
const CHATBOT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CHATBOT_API_KEY}`;

class ChatbotService {
  constructor() {
    this.apiKey = CHATBOT_API_KEY;
    this.apiUrl = CHATBOT_API_URL;
    this.conversationHistory = [];
  }

  /**
   * Send message to chatbot and get response
   * @param {string} message - User message
   * @param {string} context - Additional context (crop type, location, etc.)
   * @returns {Promise<Object>} Chatbot response
   */
  async sendMessage(message, context = '') {
    try {
      console.log('🤖 Sending message to chatbot...');
      
      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Create enhanced prompt with agricultural context
      const enhancedPrompt = this.createEnhancedPrompt(message, context);
      
      const payload = {
        contents: [{
          parts: [{
            text: enhancedPrompt
          }]
        }]
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Chatbot API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0) {
        const botResponse = result.candidates[0].content.parts[0].text;
        
        // Add to conversation history
        this.conversationHistory.push({
          role: 'assistant',
          content: botResponse,
          timestamp: new Date()
        });

        return {
          success: true,
          message: botResponse,
          timestamp: new Date(),
          apiUsed: 'Gemini Chatbot API'
        };
      } else {
        throw new Error('No response from chatbot API');
      }

    } catch (error) {
      console.error('❌ Chatbot service error:', error);
      return {
        success: false,
        error: error.message,
        message: 'I apologize, but I\'m having trouble connecting to my AI brain right now. Please try again in a moment.',
        timestamp: new Date()
      };
    }
  }

  /**
   * Create enhanced prompt with agricultural context
   * @param {string} message - User message
   * @param {string} context - Additional context
   * @returns {string} Enhanced prompt
   */
  createEnhancedPrompt(message, context) {
    const basePrompt = `You are AgronBot, an expert AI agricultural assistant for the AGRON platform. You help farmers with:

🌱 Crop disease identification and treatment
💊 Agricultural advice and best practices
🌾 Farming techniques and methods
🌿 Pest control and management
📚 General agricultural knowledge
🌤️ Weather-based farming advice
💰 Market insights and pricing
🏪 AGRON store product recommendations

You have access to AGRON's comprehensive agricultural database including:
- 102 fungicide products for disease treatment
- 119 seed varieties for different crops
- 50+ fertilizer products for crop nutrition
- 156 herbicide products for weed control
- 94 organic chemical products

Context: ${context || 'General agricultural inquiry'}

User Message: ${message}

Please provide a helpful, accurate, and detailed response. If recommending products, mention they're available in the AGRON store. Use emojis to make your response engaging and easy to read.`;

    return basePrompt;
  }

  /**
   * Get conversation history
   * @returns {Array} Conversation history
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    console.log('🗑️ Chatbot conversation history cleared');
  }

  /**
   * Get chatbot status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      apiKey: this.apiKey ? 'Configured' : 'Missing',
      apiUrl: this.apiUrl,
      conversationLength: this.conversationHistory.length,
      lastMessage: this.conversationHistory.length > 0 ? 
        this.conversationHistory[this.conversationHistory.length - 1] : null
    };
  }

  /**
   * Test chatbot connection
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      const testMessage = "Hello, are you working?";
      const response = await this.sendMessage(testMessage);
      
      return {
        success: response.success,
        message: response.success ? 'Chatbot API is working!' : 'Chatbot API test failed',
        response: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: 'Chatbot API test failed',
        error: error.message
      };
    }
  }
}

// Export singleton instance
const chatbotService = new ChatbotService();
export default chatbotService;

// Also export the class for direct instantiation if needed
export { ChatbotService };
