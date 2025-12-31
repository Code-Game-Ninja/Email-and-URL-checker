import { extractEmails, analyzeEmailRisk, getOverallEmailRisk } from '../emailExtractor';

describe('extractEmails', () => {
  it('should extract simple email addresses', () => {
    const text = 'Contact us at test@example.com';
    expect(extractEmails(text)).toEqual(['test@example.com']);
  });

  it('should extract multiple unique email addresses', () => {
    const text = 'test1@example.com and test2@example.com and test1@example.com';
    const result = extractEmails(text);
    expect(result).toHaveLength(2);
    expect(result).toContain('test1@example.com');
    expect(result).toContain('test2@example.com');
  });

  it('should return empty array if no emails found', () => {
    const text = 'No emails here';
    expect(extractEmails(text)).toEqual([]);
  });
});

describe('analyzeEmailRisk', () => {
  it('should identify safe emails', () => {
    const email = 'john.doe@gmail.com';
    const result = analyzeEmailRisk(email);
    expect(result.riskLevel).toBe('safe');
    expect(result.reasons).toHaveLength(0);
  });

  it('should identify suspicious domains', () => {
    const email = 'hacker@tempmail.com';
    const result = analyzeEmailRisk(email);
    expect(result.riskLevel).toBe('high_risk');
    expect(result.reasons).toContain('Temporary/disposable email domain');
  });

  it('should identify high-risk patterns', () => {
    const email = 'security@example.xyz';
    const result = analyzeEmailRisk(email);
    // Based on the code, security@ matches /security@/ pattern
    expect(result.reasons.some(r => r.includes('Suspicious pattern'))).toBeTruthy();
  });
});

describe('getOverallEmailRisk', () => {
  it('should return safe if no emails', () => {
    expect(getOverallEmailRisk([])).toBe('safe');
  });

  it('should return high_risk if any email is high risk', () => {
    expect(getOverallEmailRisk(['test@gmail.com', 'hack@tempmail.com'])).toBe('high_risk');
  });

  it('should return suspicious if any email is suspicious but none high risk', () => {
    // Assuming we can craft a suspicious email that isn't high risk based on logic
    // analyzeEmailRisk logic:
    // - SUSPICIOUS_DOMAINS -> high_risk
    // - HIGH_RISK_PATTERNS -> suspicious (unless already high_risk)
    // - Unusual TLD -> suspicious
    // - Numbers -> suspicious
    // - Phishing prefixes -> suspicious

    // 'support@company.xyz' -> HIGH_RISK_PATTERNS matches support@...xyz -> suspicious
    // Also .xyz is unusual TLD -> suspicious

    expect(getOverallEmailRisk(['test@gmail.com', 'support@company.xyz'])).toBe('suspicious');
  });
});
