import { NextResponse } from 'next/server';
import { getURLReport, VirusTotalStats } from '@/lib/virustotal';
import { analyzeText, FraudAnalysisResult } from '@/lib/llm';

interface AnalysisRequest {
  url?: string;
  message?: string;
  pageContent?: string;
}

interface AnalysisResponse {
  overall_risk: 'SAFE' | 'CAUTION' | 'DANGEROUS';
  url_analysis: {
    summary: string;
    confidence: 'High' | 'Medium' | 'Low';
  };
  fraud_text_analysis: FraudAnalysisResult;
  user_warning_message: string;
  disclaimer: string;
}

export async function POST(request: Request) {
  try {
    console.log('📥 Analysis request received');
    const body: AnalysisRequest = await request.json();
    const { url, message, pageContent } = body;
    console.log(`📝 Input - URL: ${url ? 'Yes' : 'No'}, Message: ${message ? message.substring(0, 50) : 'None'}`);

    // Create a promise that rejects after 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 30000);
    });

    // Wrap the analysis in a race with timeout
    const analysisPromise = (async () => {
      console.log('🚀 Starting analysis...');
      
      // 1. URL Analysis
      let vtStats: VirusTotalStats | null = null;
      if (url) {
        console.log('🔗 Analyzing URL...');
        vtStats = await getURLReport(url);
        console.log('✅ URL analysis complete');
      }

    // 2. Text Analysis
    let textAnalysis: FraudAnalysisResult = {
      fraud_probability: 0,
      category: 'unknown',
      signals_detected: [],
    };

    const textToAnalyze = message || pageContent || '';
    if (textToAnalyze) {
      console.log('📄 Analyzing text...');
      textAnalysis = await analyzeText(textToAnalyze, pageContent);
      console.log('✅ Text analysis complete');
    }

    // 3. Risk Scoring
    let overall_risk: 'SAFE' | 'CAUTION' | 'DANGEROUS' = 'SAFE';
    let confidence: 'High' | 'Medium' | 'Low' = 'Low';

    const malicious = vtStats?.malicious || 0;
    const suspicious = vtStats?.suspicious || 0;
    const fraudProb = textAnalysis.fraud_probability;
    const category = textAnalysis.category;

    if (malicious > 0) {
      overall_risk = 'DANGEROUS';
      confidence = 'High';
    } else if (suspicious > 0 || fraudProb >= 0.7 || category === 'adult' || category === 'gambling') {
      overall_risk = 'CAUTION';
      confidence = 'Medium';
    } else {
      overall_risk = 'SAFE';
      confidence = vtStats ? 'High' : 'Medium';
    }

    // 4. Generate Summary and Warning
    let summary = 'No significant threats detected.';
    let warning = 'Proceed with normal caution.';

    if (overall_risk === 'DANGEROUS') {
      summary = `Dangerous URL detected with ${malicious} malicious flags.`;
      warning = '⛔ DANGER: This site is known to be malicious. Do not proceed.';
    } else if (overall_risk === 'CAUTION') {
      if (suspicious > 0) {
        summary = `Suspicious activity detected (${suspicious} flags).`;
      } else if (category === 'adult') {
        summary = `Adult content detected. Proceed with caution.`;
        warning = '⚠️ CAUTION: This site contains adult content.';
      } else if (category === 'gambling') {
        summary = `Gambling content detected. Proceed with caution.`;
        warning = '⚠️ CAUTION: This site contains gambling content.';
      } else {
        summary = `High probability of fraud detected in text (${(fraudProb * 100).toFixed(0)}%).`;
        warning = '⚠️ CAUTION: This content shows signs of being a scam or phishing attempt.';
      }
    } else {
        if (vtStats) {
            summary = `Clean URL scan (${vtStats.harmless} harmless, ${vtStats.undetected} undetected).`;
        } else {
            summary = `No specific threats found in text analysis.`;
        }
        warning = '✅ SAFE: No immediate threats detected, but always stay vigilant.';
    }

    const response: AnalysisResponse = {
      overall_risk,
      url_analysis: {
        summary,
        confidence,
      },
      fraud_text_analysis: textAnalysis,
      user_warning_message: warning,
      disclaimer: "Automated risk assessment. Do not rely on this as a legal or financial guarantee."
    };

    return NextResponse.json(response);
    })();

    // Race between analysis and timeout
    const result = await Promise.race([analysisPromise, timeoutPromise]);
    return result as Response;

  } catch (error) {
    console.error('Error in analysis route:', error);
    
    // Check if it's a timeout error
    if (error instanceof Error && error.message === 'TIMEOUT') {
      return NextResponse.json({ 
        error: 'Analysis timeout',
        message: 'The analysis is taking too long. This might be due to API rate limits or network issues. Please try again.',
        overall_risk: 'CAUTION',
        user_warning_message: '⚠️ Analysis timed out. Please try again or check your internet connection.'
      }, { status: 504 });
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      overall_risk: 'CAUTION',
      user_warning_message: '⚠️ Unable to complete analysis. Please try again.'
    }, { status: 500 });
  }
}
