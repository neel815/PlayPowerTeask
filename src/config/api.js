// API Configuration
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// System instructions for different analysis types
export const SYSTEM_INSTRUCTIONS = {
    general: `You are an AI text analyzer. Analyze the given text and provide your analysis in the following format:

Summary: A brief overview of the main points and key ideas.

Suggested Tags: Relevant topics, themes, or categories, comma-separated.

Key Terms: Important words or phrases from the text, comma-separated.

Grammar Check: Any grammar, spelling, or style improvements.`,

    sentiment: `You are a sentiment analysis expert. Analyze the text and provide your analysis in the following format:

Summary: A detailed breakdown of the emotional tone and overall sentiment.

Suggested Tags: Emotional themes and tones detected, comma-separated.

Key Terms: Words and phrases carrying emotional weight, comma-separated.

Grammar Check: Any improvements for clearer emotional expression.`,

    summary: `You are a text summarization expert. Analyze the text and provide your response in the following format:

Summary: A concise summary capturing the main points.

Suggested Tags: Main themes and topics covered, comma-separated.

Key Terms: Essential words and phrases, comma-separated.

Grammar Check: Any clarity or structure improvements.`,

    keywords: `You are a keyword extraction specialist. Analyze the text and provide your response in the following format:

Summary: Brief context for the identified keywords.

Suggested Tags: Primary topics and themes, comma-separated.

Key Terms: Key words and phrases identified, comma-separated.

Grammar Check: Any suggestions for keyword clarity.`
};

// Gemini API endpoints and configuration
export const GEMINI_CONFIG = {
    apiKey: GEMINI_API_KEY,
    modelVersion: 'gemini-2.0-flash',
    maxOutputTokens: 2048,
    temperature: 0.7,
    topK: 40,
    topP: 0.95
};
