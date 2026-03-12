/**
 * BmbAi API Handler
 * Manages multiple API endpoints for chat and image generation with fallback support
 */

const BmbAI = (function() {
    'use strict';

    // =========================================
    // API Configuration
    // =========================================
    
    const config = {
        // Chat APIs (zitatumika kwa mlolongo)
        chatAPIs: [
            "https://eliteprotech-apis.zone.id/copilot?message=",
            "https://api.yupra.my.id/api/ai/copilot?text=",
            "https://iamtkm.vercel.app/ai/gpt5?apikey=tkm&text=",
            "https://api.giftedtech.co.ke/api/ai/openai?apikey=gifted&q="
        ],
        
        // Image Generation APIs (zitatumika kwa mlolongo)
        imageAPIs: [
            {
                url: "https://img.hazex.workers.dev/",
                params: { prompt: "", improve: "true", format: "square" }
            },
            {
                url: "https://image.pollinations.ai/prompt/",
                params: { width: 1080, height: 1080, nologo: "true", private: "true", seed: 42, enhance: "true", model: "flux-pro" }
            },
            {
                url: "https://imgen.duck.mom/prompt/",
                params: {}
            }
        ],
        
        // Default settings
        currentChatAPI: 0,
        currentImageAPI: 0,
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000 // 30 seconds
    };

    // Chat history storage
    let chatHistory = [];

    // =========================================
    // Helper Functions
    // =========================================

    /**
     * Get current timestamp
     */
    function getTimestamp() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Check if message is asking about bot identity
     */
    function isIdentityQuestion(message) {
        const lower = message.toLowerCase().trim();
        
        // Swahili name questions
        const swahiliQuestions = [
            "unaitwa nani",
            "jina lako nani",
            "jina lako ni nani",
            "wewe ni nani",
            "una jina gani",
            "jina lako"
        ];
        
        // English name questions
        const englishQuestions = [
            "what is your name",
            "what's your name",
            "who are you",
            "your name",
            "may i know your name",
            "who created you",
            "who made you"
        ];
        
        // Check if message contains any identity question
        const isSwahili = swahiliQuestions.some(q => lower.includes(q));
        const isEnglish = englishQuestions.some(q => lower.includes(q));
        
        if (isSwahili) return { type: 'identity', lang: 'sw' };
        if (isEnglish) return { type: 'identity', lang: 'en' };
        
        return null;
    }

    /**
     * Get identity response based on language
     */
    function getIdentityResponse(lang) {
        if (lang === 'sw') {
            return {
                text: `Naitwa BmbAi, ninaundwa na BMB Tech na Maxx Tech. Mimi ni msaidizi wako wa AI nikusaidie kwa lolote! 😊`,
                response: `Naitwa BmbAi, ninaundwa na BMB Tech na Maxx Tech. Mimi ni msaidizi wako wa AI nikusaidie kwa lolote! 😊`
            };
        } else {
            return {
                text: `My name is BmbAi, created by BMB Tech and Maxx Tech. I'm your AI assistant here to help you with anything! 😊`,
                response: `My name is BmbAi, created by BMB Tech and Maxx Tech. I'm your AI assistant here to help you with anything! 😊`
            };
        }
    }

    /**
     * Check if message is asking for image generation
     */
    function isImageRequest(message) {
        const lower = message.toLowerCase();
        const imageKeywords = [
            'draw', 'generate', 'image', 'make a picture', 'create image',
            'picha', 'chora', 'tengeneza picha', 'create a photo',
            'generate image', 'make image', 'create a picture'
        ];
        return imageKeywords.some(keyword => lower.includes(keyword));
    }

    /**
     * Escape HTML for safety
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =========================================
    // Chat API Functions
    // =========================================

    /**
     * Try all chat APIs with fallback
     */
    async function tryAllChatAPIs(message, startIndex = 0) {
        let lastError = null;
        
        for (let i = startIndex; i < config.chatAPIs.length; i++) {
            try {
                const apiUrl = config.chatAPIs[i] + encodeURIComponent(message);
                console.log(`Trying chat API ${i + 1}: ${config.chatAPIs[i]}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                
                const response = await fetch(apiUrl, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const data = await response.json();
                
                // Extract response from different API response formats
                let reply = null;
                
                // Format 1: { text: "..." }
                if (data.text) reply = data.text;
                // Format 2: { result: "..." }
                else if (data.result) reply = data.result;
                // Format 3: { response: "..." }
                else if (data.response) reply = data.response;
                // Format 4: { answer: "..." }
                else if (data.answer) reply = data.answer;
                // Format 5: { message: "..." }
                else if (data.message) reply = data.message;
                // Format 6: { choices: [{ text: "..." }] }
                else if (data.choices && data.choices[0] && data.choices[0].text) reply = data.choices[0].text;
                // Format 7: { data: { text: "..." } }
                else if (data.data && data.data.text) reply = data.data.text;
                // Format 8: string response
                else if (typeof data === 'string') reply = data;
                
                if (reply && reply.length > 0) {
                    // Update current API index for next time
                    config.currentChatAPI = i;
                    return { success: true, message: reply };
                }
                
            } catch (error) {
                console.warn(`Chat API ${i + 1} failed:`, error.message);
                lastError = error;
                // Continue to next API
            }
        }
        
        // If all APIs failed, return fallback response
        return {
            success: false,
            message: getFallbackResponse(message),
            error: lastError?.message || 'All APIs failed'
        };
    }

    /**
     * Get fallback response when all APIs fail
     */
    function getFallbackResponse(message) {
        const fallbacks = [
            "Okay 👍",
            "Sawa nimekupata 😎",
            "Hmm interesting...",
            "Ndio kabisa!",
            "😂 Hahaha nimecheka",
            "I understand. Tell me more.",
            "That's cool!",
            "Nice question! Let me think...",
            "I'm here to help!",
            "Got it! 😊"
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // =========================================
    // Image Generation Functions
    // =========================================

    /**
     * Build image URL for different APIs
     */
    function buildImageURL(api, prompt) {
        const encodedPrompt = encodeURIComponent(prompt);
        
        if (api.url.includes('hazex.workers.dev')) {
            return `${api.url}?prompt=${encodedPrompt}&improve=true&format=square&random=${Math.random()}`;
        }
        else if (api.url.includes('pollinations.ai')) {
            const params = new URLSearchParams({
                width: 1080,
                height: 1080,
                nologo: "true",
                private: "true",
                seed: 42,
                enhance: "true",
                model: "flux-pro"
            });
            return `${api.url}${encodedPrompt}?${params.toString()}`;
        }
        else if (api.url.includes('duck.mom')) {
            return `${api.url}${encodedPrompt}`;
        }
        
        return `${api.url}${encodedPrompt}`;
    }

    /**
     * Try all image APIs with fallback
     */
    async function tryAllImageAPIs(prompt, startIndex = 0) {
        let lastError = null;
        
        for (let i = startIndex; i < config.imageAPIs.length; i++) {
            try {
                const api = config.imageAPIs[i];
                const imageUrl = buildImageURL(api, prompt);
                
                console.log(`Trying image API ${i + 1}: ${api.url}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                
                // First try to fetch the image to check if it works
                const response = await fetch(imageUrl, {
                    signal: controller.signal,
                    method: 'HEAD'
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    config.currentImageAPI = i;
                    return { success: true, imageUrl: imageUrl };
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
                
            } catch (error) {
                console.warn(`Image API ${i + 1} failed:`, error.message);
                lastError = error;
                // Continue to next API
            }
        }
        
        return {
            success: false,
            error: lastError?.message || 'All image APIs failed'
        };
    }

    // =========================================
    // Main Public Functions
    // =========================================

    /**
     * Send chat message to API with automatic fallback
     * @param {string} message - User message
     * @param {string} provider - 'openai', 'gemini', 'ollama' (kwa compatibility)
     * @returns {Promise} - API response
     */
    async function sendChatMessage(message, provider = 'openai') {
        try {
            // Validate message
            if (!message || message.trim().length === 0) {
                throw new Error('Message cannot be empty');
            }
            if (message.length > 5000) {
                throw new Error('Message too long (max 5000 characters)');
            }

            // Add to history (user message)
            const userMessage = {
                role: 'user',
                content: message,
                timestamp: getTimestamp()
            };
            chatHistory.push(userMessage);

            // Check if it's an identity question
            const identityCheck = isIdentityQuestion(message);
            if (identityCheck) {
                const response = getIdentityResponse(identityCheck.lang);
                
                // Add to history (assistant response)
                chatHistory.push({
                    role: 'assistant',
                    content: response.text,
                    timestamp: getTimestamp()
                });

                // Keep only last 50 messages
                if (chatHistory.length > 50) {
                    chatHistory = chatHistory.slice(-50);
                }

                return {
                    success: true,
                    message: response.text,
                    response: response.response,
                    history: chatHistory
                };
            }

            // Check if it's an image generation request
            if (isImageRequest(message)) {
                const imageResult = await generateImage(message);
                if (imageResult.success) {
                    const response = `I've generated an image for: "${message}"`;
                    
                    chatHistory.push({
                        role: 'assistant',
                        content: response,
                        image: imageResult.imageUrl,
                        timestamp: getTimestamp()
                    });

                    return {
                        success: true,
                        message: response,
                        image: imageResult.imageUrl,
                        history: chatHistory
                    };
                }
            }

            // Try chat APIs with fallback
            const result = await tryAllChatAPIs(message, config.currentChatAPI);
            
            // Add to history (assistant response)
            chatHistory.push({
                role: 'assistant',
                content: result.message,
                timestamp: getTimestamp()
            });

            // Keep only last 50 messages
            if (chatHistory.length > 50) {
                chatHistory = chatHistory.slice(-50);
            }

            return {
                success: result.success,
                message: result.message,
                response: result.message,
                history: chatHistory
            };

        } catch (error) {
            console.error('Chat API Error:', error);
            
            // Add error message to history
            chatHistory.push({
                role: 'assistant',
                content: `Error: ${error.message}`,
                timestamp: getTimestamp(),
                isError: true
            });

            return {
                success: false,
                error: error.message,
                message: getFallbackResponse(message),
                history: chatHistory
            };
        }
    }

    /**
     * Generate image from prompt with automatic fallback
     * @param {string} prompt - Image description
     * @param {string} size - Image size (haitumiki kwa API hizi)
     * @returns {Promise} - API response with image URL
     */
    async function generateImage(prompt, size = '1024x1024') {
        try {
            // Validate prompt
            if (!prompt || prompt.trim().length === 0) {
                throw new Error('Prompt cannot be empty');
            }
            if (prompt.length > 1000) {
                throw new Error('Prompt too long (max 1000 characters)');
            }

            // Clean prompt - remove image generation keywords
            let cleanPrompt = prompt;
            const keywordsToRemove = [
                'draw', 'generate', 'image', 'make a picture', 'create image',
                'picha', 'chora', 'tengeneza picha', 'create a photo',
                'generate image', 'make image', 'create a picture',
                'please', 'pls', 'can you', 'could you', 'would you'
            ];
            
            keywordsToRemove.forEach(keyword => {
                cleanPrompt = cleanPrompt.replace(new RegExp(keyword, 'gi'), '');
            });
            
            cleanPrompt = cleanPrompt.trim();
            if (cleanPrompt.length === 0) {
                cleanPrompt = prompt; // If all keywords removed, use original
            }

            // Try image APIs with fallback
            const result = await tryAllImageAPIs(cleanPrompt, config.currentImageAPI);

            if (result.success) {
                return {
                    success: true,
                    imageUrl: result.imageUrl,
                    prompt: cleanPrompt,
                    size: size
                };
            } else {
                throw new Error(result.error || 'Failed to generate image');
            }

        } catch (error) {
            console.error('Image Generation Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get chat history
     * @returns {Array} - Chat history
     */
    function getChatHistory() {
        return chatHistory;
    }

    /**
     * Clear chat history
     */
    function clearChatHistory() {
        chatHistory = [];
    }

    /**
     * Update API configuration
     * @param {Object} newConfig - New configuration
     */
    function updateConfig(newConfig) {
        Object.assign(config, newConfig);
    }

    /**
     * Get current API status
     */
    function getAPIStatus() {
        return {
            currentChatAPI: config.currentChatAPI + 1,
            totalChatAPIs: config.chatAPIs.length,
            currentImageAPI: config.currentImageAPI + 1,
            totalImageAPIs: config.imageAPIs.length,
            chatHistoryCount: chatHistory.length
        };
    }

    // =========================================
    // Load saved history from localStorage
    // =========================================
    try {
        const saved = localStorage.getItem('bmbai_chat_history');
        if (saved) {
            chatHistory = JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Could not load chat history:', e);
    }

    // Save history to localStorage when updated
    function saveHistory() {
        try {
            localStorage.setItem('bmbai_chat_history', JSON.stringify(chatHistory.slice(-50)));
        } catch (e) {
            console.warn('Could not save chat history:', e);
        }
    }

    // Override push to save automatically
    const originalPush = chatHistory.push;
    chatHistory.push = function(...items) {
        const result = originalPush.apply(this, items);
        saveHistory();
        return result;
    };

    // Public API
    return {
        sendMessage: sendChatMessage,
        generateImage: generateImage,
        getHistory: getChatHistory,
        clearHistory: clearChatHistory,
        updateConfig: updateConfig,
        getStatus: getAPIStatus
    };

})();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BmbAI;
}

// Make available globally
window.BmbAI = BmbAI;
