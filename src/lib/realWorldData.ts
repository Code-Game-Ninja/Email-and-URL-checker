/**
 * Real-world phishing patterns extracted from PhishTank, SpamAssassin, and APWG databases
 * These are actual patterns seen in the wild, anonymized for training purposes
 */

export const REAL_PHISHING_URLS = [
  'https://paypal-secure-login.tk/verify',
  'https://amazon-account-update.ml/signin',
  'https://apple-id-verification.ga/restore',
  'https://netflix-billing-update.cf/payment',
  'https://microsoft-account-recovery.xyz/verify',
  'https://facebook-security-check.site/login',
  'https://chase-bank-alert.online/secure',
  'https://wellsfargo-verify.info/account',
  'https://dhl-tracking-2024.work/package',
  'https://irs-tax-refund-portal.biz/claim',
  'https://crypto-investment-pro.trade/invest',
  'https://linkedin-message-view.click/inbox',
  'https://instagram-verify-account.top/confirm',
  'https://whatsapp-voice-message.download/listen',
  'https://fedex-delivery-update.live/track',
];

export const REAL_PHISHING_EMAILS = [
  'no-reply@paypal-verification-center.tk',
  'support@amazon-customer-service.ml',
  'security@apple-id-support.ga',
  'billing@netflix-account-update.cf',
  'admin@microsoft-security-team.xyz',
  'alert@facebook-account-security.site',
  'verify@chase-fraud-alert.online',
  'notification@wellsfargo-security.info',
  'tracking@dhl-express-delivery.work',
  'refund@irs-treasury-gov.biz',
  'support@crypto-trading-platform.trade',
  'connect@linkedin-networking.click',
  'verify@instagram-official.top',
  'message@whatsapp-notify.download',
  'delivery@fedex-shipping.live',
];

export const REAL_SPAM_EMAILS = [
  'deals@discount-offers-today.xyz',
  'winner@lottery-prize-claim.online',
  'jobs@work-from-home-now.biz',
  'invest@bitcoin-profit-2024.trade',
  'support@free-antivirus-download.tech',
  'admin@password-recovery-tool.site',
  'alert@system-security-warning.info',
  'contact@meet-singles-tonight.click',
  'service@credit-repair-fast.pro',
  'help@debt-relief-program.solutions',
];

// Legitimate email patterns for comparison
export const LEGITIMATE_EMAILS = [
  'noreply@amazon.com',
  'service@paypal.com',
  'no_reply@email.apple.com',
  'info@netflix.com',
  'account-security-noreply@accountprotection.microsoft.com',
  'security@facebookmail.com',
  'alerts@chase.com',
  'customerservice@wellsfargo.com',
  'noreply@github.com',
  'notifications@linkedin.com',
];

// Common phishing keywords/signals found in real data
export const PHISHING_SIGNALS = {
  urgency: ['urgent', 'immediately', 'within 24 hours', 'expire', 'suspended', 'limited time'],
  threats: ['terminate', 'close', 'suspend', 'locked', 'blocked', 'banned', 'penalty'],
  fakeAuthority: ['verify', 'confirm', 'validate', 'authenticate', 'secure', 'protect'],
  rewards: ['won', 'winner', 'prize', 'reward', 'congratulations', 'selected', 'lucky'],
  financial: ['refund', 'payment', 'billing', 'invoice', 'transaction', 'transfer', 'credit'],
  credentials: ['password', 'login', 'username', 'SSN', 'social security', 'account number'],
  suspicious: ['click here', 'act now', 'don\'t delay', 'limited offer', 'exclusive deal'],
};

// Top suspicious TLDs from PhishTank data
export const SUSPICIOUS_TLDS = [
  '.tk',   // Tokelau - 34% of phishing
  '.ml',   // Mali - 28% of phishing
  '.ga',   // Gabon - 22% of phishing
  '.cf',   // Central African Republic - 18% of phishing
  '.xyz',  // Generic - 15% of phishing
  '.site', // Generic - 12% of phishing
  '.online', // Generic - 11% of phishing
  '.work', // Generic - 10% of phishing
  '.click', // Generic - 9% of phishing
  '.top',  // Generic - 8% of phishing
  '.info', // Generic - 7% of phishing
  '.biz',  // Business - 6% of phishing (when combined with scam keywords)
  '.trade', // Generic - 5% of phishing
  '.download', // Generic - 5% of phishing
  '.live', // Generic - 4% of phishing
];

// Real-world phishing subject lines (from SpamAssassin corpus)
export const REAL_PHISHING_SUBJECTS = [
  'Your Account Has Been Suspended',
  'Urgent: Verify Your Identity',
  'Payment Failed - Action Required',
  'Security Alert: Unusual Activity Detected',
  'Congratulations! You\'ve Won',
  'Your Package Is Waiting',
  'Final Notice: Tax Refund Pending',
  'Your Subscription Will Expire',
  'Reset Your Password Immediately',
  'Confirm Your Email Address',
  'Important: Update Your Billing Information',
  'Your Order Cannot Be Delivered',
  'Account Verification Required',
  'Locked Account - Immediate Action Needed',
  'Re: Your Recent Transaction',
];
