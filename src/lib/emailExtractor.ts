/**
 * Email extraction and risk analysis utilities
 */

// Common suspicious email patterns and domains
const SUSPICIOUS_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'throwaway.email',
  'yopmail.com',
  'maildrop.cc',
  'trashmail.com',
];

const HIGH_RISK_PATTERNS = [
  /no-?reply/i,
  /support@[^.]+\.(xyz|top|site|club|online|info)/i,
  /admin@[^.]+\.(tk|ml|ga|cf)/i,
  /verify@/i,
  /security@/i,
  /alert@/i,
  /notification@/i,
];

/**
 * Extract all email addresses from text
 */
export function extractEmails(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailRegex);
  return matches ? [...new Set(matches)] : []; // Remove duplicates
}

/**
 * Analyze email address for risk indicators
 */
export function analyzeEmailRisk(email: string): {
  riskLevel: 'safe' | 'suspicious' | 'high_risk';
  reasons: string[];
} {
  const reasons: string[] = [];
  let riskLevel: 'safe' | 'suspicious' | 'high_risk' = 'safe';

  // Check for suspicious domains
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && SUSPICIOUS_DOMAINS.some(d => domain.includes(d))) {
    reasons.push('Temporary/disposable email domain');
    riskLevel = 'high_risk';
  }

  // Check for high-risk patterns
  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(email)) {
      reasons.push(`Suspicious pattern: ${pattern.source}`);
      if (riskLevel !== 'high_risk') {
        riskLevel = 'suspicious';
      }
    }
  }

  // Check for unusual TLDs
  if (domain && /\.(tk|ml|ga|cf|gq|xyz|top|work|click|link)$/i.test(domain)) {
    reasons.push('Uncommon or free top-level domain');
    if (riskLevel === 'safe') {
      riskLevel = 'suspicious';
    }
  }

  // Check for excessive numbers
  if (/\d{4,}/.test(email.split('@')[0])) {
    reasons.push('Unusual number sequence in username');
    if (riskLevel === 'safe') {
      riskLevel = 'suspicious';
    }
  }

  // Check for common phishing prefixes
  if (/^(noreply|no-reply|donotreply|support|admin|security|verify|alert)@/i.test(email)) {
    reasons.push('Common phishing email prefix');
    if (riskLevel === 'safe') {
      riskLevel = 'suspicious';
    }
  }

  return { riskLevel, reasons };
}

/**
 * Get the highest risk level from multiple emails
 */
export function getOverallEmailRisk(emails: string[]): 'safe' | 'suspicious' | 'high_risk' {
  if (emails.length === 0) return 'safe';

  const riskLevels = emails.map(email => analyzeEmailRisk(email).riskLevel);
  
  if (riskLevels.includes('high_risk')) return 'high_risk';
  if (riskLevels.includes('suspicious')) return 'suspicious';
  return 'safe';
}

/**
 * Check if email has been flagged as threat in historical data
 */
export async function checkEmailHistory(
  email: string,
  ThreatFeedback: any
): Promise<{
  isFlagged: boolean;
  threatCount: number;
  safeCount: number;
}> {
  try {
    const historicalData = await ThreatFeedback.find({
      extractedEmails: email,
    }).lean();

    const threatCount = historicalData.filter(
      (d: any) => d.userFeedback === 'threat'
    ).length;
    
    const safeCount = historicalData.filter(
      (d: any) => d.userFeedback === 'safe'
    ).length;

    return {
      isFlagged: threatCount > safeCount,
      threatCount,
      safeCount,
    };
  } catch (error) {
    console.error('Error checking email history:', error);
    return { isFlagged: false, threatCount: 0, safeCount: 0 };
  }
}
