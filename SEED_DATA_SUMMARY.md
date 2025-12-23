# Seed Database Expansion Summary

## Overview
Expanded the seed database from **21 examples** to **50 examples** using real-world phishing patterns from public datasets (PhishTank, SpamAssassin, APWG).

## Dataset Distribution

### High-Risk Threats: 20 examples (40%)
Confirmed dangerous phishing attempts targeting:
- **Banking**: PayPal, Wells Fargo, Chase Bank
- **E-commerce**: Amazon, Walmart
- **Tech Services**: Microsoft, Apple, Netflix, DocuSign
- **Financial Apps**: Zelle, Venmo
- **Security Software**: McAfee
- **Government**: Social Security Administration, USPS
- **Cryptocurrencies**: Various crypto scams

**Common patterns**:
- Suspicious TLDs: .tk, .ml, .ga, .cf, .site, .xyz
- Urgency pressure: "within 24 hours", "account will be closed"
- Credential phishing: "verify your identity", "update payment"
- Fear tactics: "unauthorized access", "suspended account"

### Suspicious Emails: 18 examples (36%)
Potentially harmful but not confirmed threats:
- **Scam Offers**: Discount deals, work-from-home schemes
- **Fake Giveaways**: Free iPhones, lottery wins
- **Package Delivery**: Fake tracking links
- **Investment Scams**: Crypto profits, get-rich-quick
- **Social Media**: LinkedIn, Instagram, WhatsApp, Twitter phishing
- **Tech Support**: FedEx, Google, Microsoft 365, IRS, Norton
- **Rewards Programs**: Credit reports, Costco rewards
- **Gaming**: Steam account verification

**Common patterns**:
- Suspicious TLDs: .click, .top, .download, .live, .biz, .info, .online, .club, .trade
- Too good to be true: "90% off", "earn $5000/month"
- Generic greetings: No personalization
- Suspicious links: Non-official domains

### Safe Emails: 12 examples (24%)
Legitimate notifications for AI comparison:
- **Tech Services**: GitHub, Google Calendar, Microsoft Teams, Dropbox, Spotify, Zoom
- **Social Media**: LinkedIn, Twitter/X, Slack
- **E-commerce**: Amazon, PayPal
- **Banking**: Chase Bank statements
- **Entertainment**: Netflix subscriptions
- **Apple Services**: Apple ID notifications

**Common patterns**:
- Official domains: .com, .org, .gov from verified senders
- Legitimate TLDs: amazon.com, github.com, microsoft.com
- Clear sender identity: noreply@github.com
- Professional formatting: No spelling errors or suspicious requests

## Data Sources
All examples based on real patterns from:
1. **PhishTank**: 100,000+ verified phishing URLs
2. **SpamAssassin Public Corpus**: 6,000+ spam emails
3. **APWG eCrime Database**: Millions of phishing URLs
4. **URLhaus**: Daily malware distribution URLs

See `PUBLIC_DATASETS.md` for detailed dataset information.

## Real-World Patterns Implemented
The `src/lib/realWorldData.ts` file contains:
- 15 real phishing URLs extracted from PhishTank
- 15 phishing email patterns from SpamAssassin
- 10 spam email examples
- 10 legitimate email examples for comparison
- Phishing signals dictionary (7 categories)
- 15 suspicious TLDs with abuse percentages
- 15 real phishing subject lines

## Auto-Seeding Behavior
The database automatically seeds on first MongoDB connection:
- Triggered in `src/lib/mongodb.ts` when `cached.seeded` is false
- Runs once per application lifecycle
- Skips if database already has entries
- Can be manually triggered via `/api/seed` POST endpoint

## Statistics
To view current database statistics, visit:
```
GET http://localhost:3000/api/stats
```

This returns:
- Total threat count
- Email risk level distribution (high_risk, suspicious, safe)
- AI prediction accuracy metrics
- Top 10 most threatening email addresses
- Global spam statistics

## Testing the Seed Data
1. **Clear database**: `POST /api/seed` with `action: "clear"`
2. **Restart server**: Database will auto-seed
3. **View stats**: `GET /api/stats`
4. **Test AI**: Submit messages containing seed emails to see if AI recognizes patterns

## Rationale for Distribution
- **40% high-risk**: Represents realistic threat landscape (global spam rate ~48%)
- **36% suspicious**: Gray area requiring user judgment
- **24% safe**: Baseline for AI to distinguish legitimate vs. malicious

This balanced distribution ensures the AI learns to:
- Identify clear threats with high confidence
- Flag suspicious content for user review
- Recognize legitimate communications to reduce false positives

## Future Expansion
To add more examples:
1. Edit `src/lib/seedDatabase.ts`
2. Add to `KNOWN_THREAT_EMAILS`, `SUSPICIOUS_EMAILS`, or `SAFE_EMAILS` arrays
3. Follow the structure: content, contentType, userFeedback, aiPrediction, fraudProbability, signals, extractedEmails, emailRiskLevel
4. Run `npm run build` to verify
5. Clear database and restart to trigger re-seed

## References
- `src/lib/seedDatabase.ts`: Main seed data file
- `src/lib/realWorldData.ts`: Real-world patterns extracted from public datasets
- `PUBLIC_DATASETS.md`: Documentation of 10 public phishing datasets
- `src/lib/mongodb.ts`: Auto-seed trigger mechanism
