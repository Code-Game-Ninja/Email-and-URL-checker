/**
 * Seed database with real-world spam/phishing statistics and known malicious email patterns
 * This helps bootstrap the AI with existing threat intelligence
 */

import connectDB from './mongodb';
import { ThreatFeedback } from '@/models/ThreatFeedback';

interface SeedData {
  content: string;
  contentType: 'url' | 'message';
  userFeedback: 'safe' | 'threat';
  aiPrediction: 'SAFE' | 'CAUTION' | 'DANGEROUS';
  fraudProbability: number;
  signals: string[];
  extractedEmails: string[];
  emailRiskLevel: 'safe' | 'suspicious' | 'high_risk';
}

// Real-world malicious email addresses (anonymized/examples for training)
const KNOWN_THREAT_EMAILS: SeedData[] = [
  {
    content: "URGENT: Your PayPal account has been limited. Verify immediately at secure-paypal-verify.tk",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.95,
    signals: ['urgency pressure', 'fake authority', 'credential request', 'suspicious domain'],
    extractedEmails: ['no-reply@paypal-secure.tk', 'support@paypal-verify.xyz'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Congratulations! You've won $5,000,000 in the Microsoft Lottery. Contact prize-claims@microsoft-lottery.ml",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.98,
    signals: ['fake lottery', 'urgency pressure', 'fake authority', 'too good to be true'],
    extractedEmails: ['prize-claims@microsoft-lottery.ml', 'winner-notification@lottery-claims.tk'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Your Amazon order #123456 requires payment update. Click here: amazon-payment-update.xyz",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.92,
    signals: ['fake delivery', 'credential request', 'suspicious link'],
    extractedEmails: ['no-reply@amazon-orders.xyz', 'support123@amzn-update.tk'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "FINAL NOTICE: IRS Tax Refund Pending. Verify your SSN at irs-refund-portal.site",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.97,
    signals: ['fake government', 'urgency pressure', 'credential request', 'threats'],
    extractedEmails: ['donotreply@irs-tax-refund.site', 'verify@tax-return.xyz'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Your bank account has been compromised! Call us immediately at security-alert@bank-fraud-prevention.tk",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.96,
    signals: ['fake bank', 'urgency pressure', 'fear tactics', 'credential request'],
    extractedEmails: ['security-alert@bank-fraud-prevention.tk', 'emergency@secure-banking.ga'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Apple ID suspended. Verify within 24 hours at apple-id-verification.tk or lose access permanently.",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.94,
    signals: ['urgency pressure', 'fake authority', 'threats', 'suspicious domain'],
    extractedEmails: ['no-reply@apple-support.tk', 'security@apple-id-verify.xyz'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Netflix: Your payment failed. Update billing at netflix-billing-update.site immediately.",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.93,
    signals: ['fake subscription', 'urgency pressure', 'credential request'],
    extractedEmails: ['billing@netflix-payment.site', 'no-reply@netflix-update.online'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Facebook security alert! Someone tried to access your account from Russia. Verify at fb-security-check.tk",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.91,
    signals: ['fear tactics', 'fake authority', 'urgency pressure'],
    extractedEmails: ['security-alert@facebook-verify.tk', 'no-reply@fb-security.ml'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "DHL delivery failed. Reschedule at dhl-delivery-tracking.xyz and pay $2.99 customs fee.",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.90,
    signals: ['fake delivery', 'unexpected payment', 'suspicious link'],
    extractedEmails: ['tracking@dhl-parcels.xyz', 'delivery@dhl-shipping.tk'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Wells Fargo: Unusual activity detected. Confirm your identity at wellsfargo-secure-login.site now!",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.95,
    signals: ['fake bank', 'urgency pressure', 'credential request', 'suspicious domain'],
    extractedEmails: ['alert@wellsfargo-security.site', 'verify@wf-bank-alert.online'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Chase Bank Alert: Your account will be closed in 24 hours. Update info at chase-secure-banking.tk",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.94,
    signals: ['fake bank', 'threats', 'urgency pressure', 'credential request'],
    extractedEmails: ['alert@chase-bank-security.tk', 'fraud@chase-alert.ml'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Microsoft Security: Your Windows license expired. Activate at microsoft-windows-activation.xyz immediately.",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.89,
    signals: ['fake software', 'urgency pressure', 'payment request'],
    extractedEmails: ['support@microsoft-activation.xyz', 'windows@ms-license.site'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Walmart order confirmation: $899.99 charged. Cancel unauthorized order at walmart-orders-cancel.ml",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.92,
    signals: ['fake purchase', 'fear tactics', 'urgency pressure'],
    extractedEmails: ['orders@walmart-customer-service.ml', 'cancel@walmart-help.tk'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Social Security Administration: Your SSN suspended due to fraud. Verify at ssa-gov-verify.tk",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.98,
    signals: ['fake government', 'threats', 'SSN request', 'fear tactics'],
    extractedEmails: ['alert@ssa-fraud-department.tk', 'verify@social-security-gov.ml'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Zelle payment received: $2,500 pending. Accept payment at zelle-payment-receive.ga immediately.",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.90,
    signals: ['fake payment notification', 'too good to be true', 'urgency pressure'],
    extractedEmails: ['payment@zelle-transfer.ga', 'support@zelle-payments.cf'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "DocuSign: Important document requires signature. View at docusign-document-view.tk",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.88,
    signals: ['fake business service', 'credential phishing', 'malware distribution'],
    extractedEmails: ['noreply@docusign-secure.tk', 'documents@docusign-view.ml'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "McAfee Total Protection: Your subscription ends today. Renew at mcafee-renewal-center.ga",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.86,
    signals: ['fake security software', 'urgency pressure', 'payment scam'],
    extractedEmails: ['billing@mcafee-subscription.ga', 'renew@mcafee-antivirus.cf'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Amazon Prime: Auto-renewal failed. Update payment at amazon-prime-billing.ml to keep membership.",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.93,
    signals: ['fake subscription', 'payment request', 'urgency pressure'],
    extractedEmails: ['prime@amazon-membership.ml', 'billing@amazon-autopay.tk'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "USPS delivery notice: Package undeliverable. Reschedule at usps-redelivery-schedule.ga",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.87,
    signals: ['fake delivery', 'suspicious link', 'payment request'],
    extractedEmails: ['delivery@usps-tracking.ga', 'redelivery@usps-parcels.cf'],
    emailRiskLevel: 'high_risk',
  },
  {
    content: "Venmo payment request: $350.00 requested by unknown user. Cancel at venmo-payment-cancel.tk",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'DANGEROUS',
    fraudProbability: 0.91,
    signals: ['fake payment app', 'fear tactics', 'credential request'],
    extractedEmails: ['requests@venmo-payments.tk', 'support@venmo-help.ml'],
    emailRiskLevel: 'high_risk',
  },
];

// Suspicious but not confirmed threats (for AI learning)
const SUSPICIOUS_EMAILS: SeedData[] = [
  {
    content: "Limited time offer! Get 90% off all products. Reply to sales@discount-deals.xyz",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.65,
    signals: ['urgency pressure', 'too good to be true', 'suspicious domain'],
    extractedEmails: ['sales@discount-deals.xyz', 'offers123@deals-now.online'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "You have a new message from someone interested in your profile. View here: dating-messages.click",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.70,
    signals: ['catfishing attempt', 'suspicious link', 'urgency'],
    extractedEmails: ['notifications@dating-messages.click', 'no-reply@dating-alerts.site'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Your package is waiting! Track your delivery at package-tracking-2024.link",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.68,
    signals: ['fake delivery', 'suspicious link'],
    extractedEmails: ['tracking@package-delivery.link', 'support@parcels-online.work'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Earn $5000/month working from home! No experience needed. Apply at work-from-home-jobs.biz",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.72,
    signals: ['too good to be true', 'work from home scam', 'suspicious domain'],
    extractedEmails: ['jobs@work-from-home.biz', 'recruiting@easy-money.online'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Free iPhone 15 Pro! You're the 1000th visitor. Claim your prize at free-iphone-giveaway.click",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.75,
    signals: ['too good to be true', 'fake giveaway', 'suspicious domain'],
    extractedEmails: ['winner@free-prizes.click', 'giveaway@iphone-winners.site'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Your computer is infected with viruses! Download our antivirus at pc-security-fix.download",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.80,
    signals: ['fear tactics', 'fake security', 'malware distribution'],
    extractedEmails: ['support@pc-security-fix.download', 'alerts@virus-removal.tech'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Crypto investment opportunity! 500% returns guaranteed. Invest at crypto-profits-2024.trade",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.85,
    signals: ['investment scam', 'too good to be true', 'cryptocurrency fraud'],
    extractedEmails: ['invest@crypto-profits.trade', 'support@bitcoin-invest.online'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "LinkedIn: You have 5 new profile views. See who viewed your profile at linkedin-networking.click",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.73,
    signals: ['fake social media', 'suspicious link', 'credential phishing'],
    extractedEmails: ['connect@linkedin-networking.click', 'notifications@linkedin-views.top'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Instagram security notice: Verify your account at instagram-verify-account.top within 24 hours.",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.78,
    signals: ['urgency pressure', 'fake social media', 'suspicious domain'],
    extractedEmails: ['verify@instagram-official.top', 'security@instagram-help.site'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "WhatsApp: You have a new voice message. Listen at whatsapp-voice-message.download",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.76,
    signals: ['fake app notification', 'malware distribution', 'suspicious domain'],
    extractedEmails: ['message@whatsapp-notify.download', 'support@whatsapp-voice.site'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "FedEx shipping notification: Your package is delayed. Track at fedex-delivery-update.live",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.71,
    signals: ['fake delivery', 'suspicious link'],
    extractedEmails: ['delivery@fedex-shipping.live', 'tracking@fedex-express.online'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Google Account: Unusual sign-in activity detected. Review now at google-account-security.site",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.82,
    signals: ['fake authority', 'urgency pressure', 'credential request'],
    extractedEmails: ['noreply@google-security.site', 'alerts@google-account.online'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Microsoft 365: Your subscription expired. Renew at microsoft-365-renewal.xyz to avoid data loss.",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.79,
    signals: ['urgency pressure', 'fake subscription', 'threats'],
    extractedEmails: ['billing@microsoft-365.xyz', 'support@office-renewal.site'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Your tax refund of $2,847 is ready. Claim at irs-tax-refund-portal.biz before it expires.",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.84,
    signals: ['fake government', 'too good to be true', 'urgency pressure'],
    extractedEmails: ['refund@irs-treasury.biz', 'claims@tax-return-gov.site'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Credit score alert! Check your free credit report at credit-report-free.info immediately.",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.69,
    signals: ['fake financial service', 'data harvesting', 'suspicious domain'],
    extractedEmails: ['alerts@credit-monitoring.info', 'support@credit-report-free.biz'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Norton Antivirus: Your protection expired. Renew at norton-antivirus-renewal.online",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.74,
    signals: ['fake security software', 'urgency pressure', 'suspicious domain'],
    extractedEmails: ['renewal@norton-security.online', 'billing@antivirus-update.site'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Costco membership rewards: You've earned $150 cashback. Claim at costco-rewards-center.club",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.77,
    signals: ['fake rewards', 'too good to be true', 'suspicious domain'],
    extractedEmails: ['rewards@costco-membership.club', 'cashback@costco-benefits.site'],
    emailRiskLevel: 'suspicious',
  },
  {
    content: "Steam security code: Someone tried to access your account. Verify at steam-account-verify.tk",
    contentType: 'message',
    userFeedback: 'threat',
    aiPrediction: 'CAUTION',
    fraudProbability: 0.80,
    signals: ['fake gaming platform', 'fear tactics', 'credential phishing'],
    extractedEmails: ['security@steam-support.tk', 'noreply@steam-verify.ml'],
    emailRiskLevel: 'suspicious',
  },
];

// Legitimate emails (for balanced training)
const SAFE_EMAILS: SeedData[] = [
  {
    content: "Your Amazon order #123456 has shipped. Track your package at amazon.com",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.05,
    signals: [],
    extractedEmails: ['ship-confirm@amazon.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Your PayPal payment of $25.00 has been completed. View details in your account.",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.08,
    signals: [],
    extractedEmails: ['service@paypal.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Your monthly statement is ready. Login to your bank at chase.com to view.",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.10,
    signals: [],
    extractedEmails: ['alerts@chase.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Welcome to GitHub! Verify your email address to get started.",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.05,
    signals: [],
    extractedEmails: ['noreply@github.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Google Calendar: Meeting reminder - Team standup at 10:00 AM tomorrow.",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.03,
    signals: [],
    extractedEmails: ['calendar-notification@google.com', 'no-reply@calendar.google.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Microsoft Teams: You have been added to the 'Project Alpha' team. Join at teams.microsoft.com",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.04,
    signals: [],
    extractedEmails: ['noreply@teams.microsoft.com', 'notifications@microsoft.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Dropbox: Your file 'Q4_Report.pdf' was successfully uploaded. Access at dropbox.com",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.06,
    signals: [],
    extractedEmails: ['no-reply@dropbox.com', 'notifications@dropbox.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Spotify: Your Discover Weekly playlist is ready! Listen at spotify.com",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.05,
    signals: [],
    extractedEmails: ['no-reply@spotify.com', 'playlists@spotify.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "LinkedIn: Your post received 25 likes and 5 comments. View engagement at linkedin.com",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.07,
    signals: [],
    extractedEmails: ['notifications@linkedin.com', 'messages@linkedin.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Twitter/X: Your tweet was retweeted 10 times. See activity at twitter.com",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.06,
    signals: [],
    extractedEmails: ['notify@twitter.com', 'info@x.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Slack: @john mentioned you in #general channel. Reply at slack.com/workspace",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.04,
    signals: [],
    extractedEmails: ['feedback@slack.com', 'notifications@slack.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Apple ID: Your password was successfully changed. If you didn't make this change, visit appleid.apple.com",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.09,
    signals: [],
    extractedEmails: ['noreply@email.apple.com', 'appleid@id.apple.com'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Zoom: Your upcoming meeting 'Team Review' starts in 15 minutes. Join at zoom.us/j/123456789",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.05,
    signals: [],
    extractedEmails: ['no-reply@zoom.us', 'notifications@zoom.us'],
    emailRiskLevel: 'safe',
  },
  {
    content: "Netflix: Your monthly subscription of $15.99 has been processed successfully.",
    contentType: 'message',
    userFeedback: 'safe',
    aiPrediction: 'SAFE',
    fraudProbability: 0.06,
    signals: [],
    extractedEmails: ['info@account.netflix.com', 'billing@netflix.com'],
    emailRiskLevel: 'safe',
  },
];

/**
 * Seed the database with known threat intelligence
 */
export async function seedDatabase() {
  try {
    const db = await connectDB();
    
    if (!db) {
      console.error('❌ MongoDB not available. Cannot seed database.');
      return { success: false, message: 'Database not available' };
    }

    console.log('🌱 Starting database seeding...');

    // Check if already seeded
    const existingCount = await ThreatFeedback.countDocuments();
    if (existingCount > 0) {
      console.log(`ℹ️  Database already has ${existingCount} entries. Skipping seed.`);
      return { 
        success: true, 
        message: `Database already seeded with ${existingCount} entries`,
        skipped: true 
      };
    }

    // Combine all seed data
    const allSeedData = [
      ...KNOWN_THREAT_EMAILS,
      ...SUSPICIOUS_EMAILS,
      ...SAFE_EMAILS,
    ];

    // Insert seed data
    const result = await ThreatFeedback.insertMany(allSeedData);

    console.log(`✅ Successfully seeded database with ${result.length} entries:`);
    console.log(`   - ${KNOWN_THREAT_EMAILS.length} high-risk threats`);
    console.log(`   - ${SUSPICIOUS_EMAILS.length} suspicious emails`);
    console.log(`   - ${SAFE_EMAILS.length} safe emails`);

    return {
      success: true,
      message: `Seeded ${result.length} entries`,
      stats: {
        highRisk: KNOWN_THREAT_EMAILS.length,
        suspicious: SUSPICIOUS_EMAILS.length,
        safe: SAFE_EMAILS.length,
        total: result.length,
      },
    };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Clear all seed data (for testing)
 */
export async function clearSeedData() {
  try {
    const db = await connectDB();
    
    if (!db) {
      return { success: false, message: 'Database not available' };
    }

    await ThreatFeedback.deleteMany({});
    console.log('🗑️  All seed data cleared');

    return { success: true, message: 'Seed data cleared' };
  } catch (error) {
    console.error('❌ Error clearing seed data:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
