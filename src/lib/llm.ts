import axios from 'axios';
import connectDB from './mongodb';
import { ThreatFeedback } from '@/models/ThreatFeedback';
import { extractEmails, analyzeEmailRisk, checkEmailHistory } from './emailExtractor';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Use Gemini if available, fallback to OpenRouter
const USE_GEMINI = !!GEMINI_API_KEY;

export interface FraudAnalysisResult {
  fraud_probability: number;
  category: 'phishing' | 'scam' | 'spam' | 'legitimate' | 'unknown';
  signals_detected: string[];
  extracted_emails?: string[];
  email_risk_analysis?: {
    email: string;
    riskLevel: 'safe' | 'suspicious' | 'high_risk';
    reasons: string[];
    historical: {
      isFlagged: boolean;
      threatCount: number;
      safeCount: number;
    };
  }[];
}

async function getHistoricalLearning(): Promise<string> {
  try {
    const db = await connectDB();
    if (!db) {
      // MongoDB not available, skip historical learning
      return '';
    }
    
    // Get only 5 recent feedbacks (reduced from 20 for speed)
    const feedbacks = await ThreatFeedback.find()
      .limit(5)
      .sort({ createdAt: -1 })
      .select('content userFeedback signals') // Only select needed fields
      .lean(); // Use lean for faster queries

    if (feedbacks.length === 0) {
      return '';
    }

    // Build learning context from historical data
    const learningData = feedbacks.map((fb) => {
      const actualThreat = fb.userFeedback === 'threat' ? 'THREAT' : 'SAFE';
      return `- Content: "${fb.content.substring(0, 50)}..." | ${actualThreat}`;
    }).join('\n');

    return `\n\nRECENT EXAMPLES:\n${learningData}`;
  } catch (error) {
    console.error('Error fetching historical learning:', error);
    return '';
  }
}

export async function analyzeText(text: string, context?: string): Promise<FraudAnalysisResult> {
  console.log('🧠 analyzeText started');
  
  if (!GEMINI_API_KEY && !OPENROUTER_API_KEY) {
    console.error('No AI API key available (Gemini or OpenRouter)');
    return {
      fraud_probability: 0,
      category: 'unknown',
      signals_detected: [],
      extracted_emails: [],
      email_risk_analysis: [],
    };
  }

  // Extract and analyze emails
  console.log('📧 Extracting emails...');
  const extractedEmails = extractEmails(text);
  console.log(`Found ${extractedEmails.length} emails`);
  
  const emailRiskAnalysis: FraudAnalysisResult['email_risk_analysis'] = [];
  
  // Quick email analysis without historical check (to speed up)
  for (const email of extractedEmails.slice(0, 3)) { // Limit to first 3 emails
    const riskAnalysis = analyzeEmailRisk(email);
    
    emailRiskAnalysis.push({
      email,
      ...riskAnalysis,
      historical: { isFlagged: false, threatCount: 0, safeCount: 0 }, // Skip DB check for speed
    });
  }

  // Build email context for AI
  let emailContext = '';
  if (extractedEmails.length > 0) {
    emailContext = `\n\nEMAILS DETECTED: ${extractedEmails.join(', ')}\n`;
    emailContext += 'EMAIL RISK ANALYSIS:\n';
    emailRiskAnalysis.forEach(analysis => {
      emailContext += `- ${analysis.email}: Risk Level = ${analysis.riskLevel.toUpperCase()}`;
      if (analysis.historical.isFlagged) {
        emailContext += ` [⚠️ FLAGGED IN HISTORY: ${analysis.historical.threatCount} threat reports]`;
      }
      if (analysis.reasons.length > 0) {
        emailContext += ` | Reasons: ${analysis.reasons.join(', ')}`;
      }
      emailContext += '\n';
    });
  }

  // Skip historical content check for speed
  console.log('✅ Email extraction complete, calling AI...');

  const prompt = `
Analyze this text for phishing/fraud/scam:

TEXT: "${text.substring(0, 500)}"
${emailContext}

Detect: urgency, fake authority, threats, credential requests, suspicious emails.
Estimate fraud probability (0.0-1.0).

JSON OUTPUT ONLY:
{
  "fraud_probability": 0.0,
  "category": "phishing|scam|spam|legitimate|unknown",
  "signals_detected": ["urgency", "fake authority", "etc"]
}
`;

  try {
    if (USE_GEMINI) {
      // Use Google Gemini API
      console.log('🤖 Calling Google Gemini API...');
      const startTime = Date.now();
      
      try {
        const response = await axios.post(
          `${GEMINI_BASE_URL}/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 15000, // 15 second timeout for Gemini
          }
        );
        
        console.log(`✅ Gemini responded in ${Date.now() - startTime}ms`);
        
        const content = response.data.candidates[0].content.parts[0].text;
        try {
          // Remove markdown code blocks if present
          let jsonString = content.trim();
          if (jsonString.startsWith('```json')) {
            jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.replace(/```\n?/g, '');
          }
          
          const json = JSON.parse(jsonString.trim());
          return {
            fraud_probability: json.fraud_probability || 0,
            category: json.category || 'unknown',
            signals_detected: json.signals_detected || [],
            extracted_emails: extractedEmails,
            email_risk_analysis: emailRiskAnalysis,
          };
        } catch (e) {
          console.error('Failed to parse Gemini response:', content);
          return {
            fraud_probability: 0,
            category: 'unknown',
            signals_detected: [],
            extracted_emails: extractedEmails,
            email_risk_analysis: emailRiskAnalysis,
          };
        }
      } catch (geminiError) {
        console.error('❌ Gemini API error, falling back to OpenRouter:', geminiError);
        // Fall through to OpenRouter
      }
    }
    
    // Use OpenRouter (either as primary or fallback)
    if (!USE_GEMINI || true) { // Always available as fallback
      console.log('🤖 Calling OpenRouter API...');
      const startTime = Date.now();
      
      const response = await axios.post(
        `${OPENROUTER_BASE_URL}/chat/completions`,
        {
          model: MODEL,
          messages: [
            { role: 'system', content: 'You are a helpful assistant that outputs only valid JSON.' },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://email-and-url-checker.vercel.app',
            'X-Title': 'Cybersecurity Risk AI',
          },
          timeout: 15000, // 15 second timeout
        }
      );
      
      console.log(`✅ OpenRouter responded in ${Date.now() - startTime}ms`);

      const content = response.data.choices[0].message.content;
      try {
        // Remove markdown code blocks if present
        let jsonString = content.trim();
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```\n?/g, '');
        }
        
        const json = JSON.parse(jsonString.trim());
        return {
          fraud_probability: json.fraud_probability || 0,
          category: json.category || 'unknown',
          signals_detected: json.signals_detected || [],
          extracted_emails: extractedEmails,
          email_risk_analysis: emailRiskAnalysis,
        };
      } catch (e) {
        console.error('Failed to parse OpenRouter response:', content);
        return {
          fraud_probability: 0,
          category: 'unknown',
          signals_detected: [],
          extracted_emails: extractedEmails,
          email_risk_analysis: emailRiskAnalysis,
        };
      }
    }
  } catch (error) {
    console.error('Error calling AI API:', error);
    return {
      fraud_probability: 0,
      category: 'unknown',
      signals_detected: [],
      extracted_emails: extractedEmails,
      email_risk_analysis: emailRiskAnalysis,
    };
  }
}
