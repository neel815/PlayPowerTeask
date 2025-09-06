import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, SYSTEM_INSTRUCTIONS, GEMINI_CONFIG } from '../config/api.js';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Fallback analysis when AI service is unavailable
const generateFallbackAnalysis = (text) => {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  
  // Simple word frequency analysis
  const wordFreq = {};
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    if (cleanWord.length > 3) { // Only count words longer than 3 characters
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  });
  
  // Get most frequent words as key terms
  const keyTerms = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  // Generate simple tags based on content
  const tags = [];
  if (text.toLowerCase().includes('meeting') || text.toLowerCase().includes('discuss')) {
    tags.push('meeting', 'discussion');
  }
  if (text.toLowerCase().includes('todo') || text.toLowerCase().includes('task')) {
    tags.push('todo', 'tasks');
  }
  if (text.toLowerCase().includes('idea') || text.toLowerCase().includes('think')) {
    tags.push('ideas', 'thoughts');
  }
  if (text.toLowerCase().includes('note') || text.toLowerCase().includes('remember')) {
    tags.push('notes', 'reminder');
  }
  
  // Simple grammar check
  const grammarIssues = [];
  if (text.includes('  ')) {
    grammarIssues.push('Multiple spaces detected');
  }
  if (text.length > 0 && !text.match(/[.!?]$/)) {
    grammarIssues.push('Consider adding proper punctuation');
  }
  
  return {
    summary: `This note contains ${words.length} words across ${sentences.length} sentences. ${keyTerms.length > 0 ? `Key topics include: ${keyTerms.slice(0, 3).join(', ')}.` : ''}`,
    tags: tags.length > 0 ? tags : ['general'],
    keyTerms: keyTerms,
    grammarCheck: grammarIssues.length > 0 ? grammarIssues.join('. ') : 'No obvious grammar issues detected.',
    isFallback: true
  };
};

// Retry mechanism for API calls
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryableError = error.message.includes('503') || 
                              error.message.includes('overloaded') || 
                              error.message.includes('rate limit') ||
                              error.message.includes('timeout');
      
      if (isLastAttempt || !isRetryableError) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const analyzeText = async (text, type = 'general') => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('Gemini API key not configured, using fallback analysis');
      return generateFallbackAnalysis(text);
    }

    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.modelVersion,
      generationConfig: {
        maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
        temperature: GEMINI_CONFIG.temperature,
        topK: GEMINI_CONFIG.topK,
        topP: GEMINI_CONFIG.topP,
      }
    });

    const systemInstruction = SYSTEM_INSTRUCTIONS[type] || SYSTEM_INSTRUCTIONS.general;
    
    const prompt = `${systemInstruction}

Text to analyze:
${text}`;

    // Use retry mechanism for API calls
    const result = await retryWithBackoff(async () => {
      return await model.generateContent(prompt);
    });

    const response = await result.response;
    const aiResponseText = response.text();

    // Parse the AI response into our expected format
    const lines = aiResponseText.split('\n').filter(line => line.trim());
    const analysis = {
      summary: '',
      tags: [],
      keyTerms: [],
      grammarCheck: '',
      isFallback: false
    };

    let currentSection = '';
    lines.forEach(line => {
      if (line.toLowerCase().includes('summary:')) {
        currentSection = 'summary';
        analysis.summary = line.replace(/summary:\s*/i, '').trim();
      } else if (line.toLowerCase().includes('suggested tags:')) {
        currentSection = 'tags';
        const tagsText = line.replace(/suggested tags:\s*/i, '').trim();
        analysis.tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (line.toLowerCase().includes('key terms:')) {
        currentSection = 'keyTerms';
        const termsText = line.replace(/key terms:\s*/i, '').trim();
        analysis.keyTerms = termsText.split(',').map(term => term.trim()).filter(term => term);
      } else if (line.toLowerCase().includes('grammar check:')) {
        currentSection = 'grammarCheck';
        analysis.grammarCheck = line.replace(/grammar check:\s*/i, '').trim();
      } else if (line.trim() && currentSection) {
        // Continue adding to the current section
        if (currentSection === 'summary') {
          analysis.summary += ' ' + line.trim();
        } else if (currentSection === 'grammarCheck') {
          analysis.grammarCheck += ' ' + line.trim();
        }
      }
    });

    return analysis;
  } catch (error) {
    console.error('AI analysis failed, using fallback:', error);
    
    // Check if it's a service overload error
    if (error.message.includes('503') || error.message.includes('overloaded')) {
      console.warn('AI service is overloaded, providing fallback analysis');
      return generateFallbackAnalysis(text);
    }
    
    // For other errors, still provide fallback but show a warning
    const fallbackAnalysis = generateFallbackAnalysis(text);
    fallbackAnalysis.error = 'AI service temporarily unavailable. Showing basic analysis.';
    return fallbackAnalysis;
  }
};

export default {
  analyzeText
};
