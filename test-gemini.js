// Test script for Gemini AI integration
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY not found in environment variables');
    console.log('To test Gemini:');
    console.log('1. Get API key from: https://makersuite.google.com/app/apikey');
    console.log('2. Add to .env file: GEMINI_API_KEY="your-key-here"');
    return;
  }

  try {
    console.log('Testing Gemini AI API...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      'Say hello and that you are Nomora, a travel companion for Indonesia'
    ]);

    const response = await result.response;
    console.log('✅ Gemini AI working!');
    console.log('Response:', response.text());
  } catch (error) {
    console.error('❌ Gemini AI error:', error.message);
    if (error.status) {
      console.error('HTTP status:', error.status);
    }
  }
}

testGemini();
