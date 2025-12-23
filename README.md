# Cybersecurity Risk Analysis AI & Browser Extension

A comprehensive cybersecurity tool that helps users detect malicious URLs, analyze text for phishing/scams, and identify adult/gambling content using VirusTotal and AI-powered analysis. Includes a web application and a Chrome extension.

**Live Demo:** [https://email-and-url-checker.vercel.app](https://email-and-url-checker.vercel.app)

## Features

- **🛡️ URL Risk Analysis**: Checks URLs against VirusTotal's database to identify malicious sites.
- **🧠 AI Content Analysis**: Uses advanced LLMs to analyze text messages, emails, and chats for fraud signals (urgency, fake authority, etc.).
- **🔞 Content Filtering**: Automatically flags adult and gambling content as "Caution".
- **📧 Email Reputation Check**: Extracts emails from text and checks their reputation. Allows manual email lookup if none are found.
- **🧩 Browser Extension**: Analyze any text or link directly from your browser with a right-click context menu or popup.
- **🔄 Feedback Loop**: Users can provide feedback ("Safe" vs "Threat") to help the system learn and improve.
- **📊 Risk Scoring**: Clear "SAFE", "CAUTION", or "DANGEROUS" assessment.

## Project Structure

- **Web App**: Next.js 14 application (App Router) hosted on Vercel.
- **Extension**: Chrome extension that communicates with the web app API.
- **Database**: MongoDB for storing user feedback and threat intelligence.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (Local or Atlas)
- VirusTotal API Key
- OpenRouter API Key

### Installation (Web App)

1. Clone the repository:
   ```bash
   git clone https://github.com/Code-Game-Ninja/Email-and-URL-checker.git
   cd Email-and-URL-checker/cybersecurity-risk-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env.local`:
   ```env
   VIRUSTOTAL_API_KEY=your_virustotal_key
   OPENROUTER_API_KEY=your_openrouter_key
   OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
   MONGODB_URI=your_mongodb_connection_string
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Installation (Browser Extension)

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the `extension` folder located inside the project directory.
5. The extension is now installed! You can pin it to your toolbar.

## Deployment

The web application is designed to be deployed on Vercel.
See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

## Usage

### Web App
1. Go to the website (local or live).
2. Paste a URL or message text.
3. Click **Analyze Risk**.
4. If suspicious, you may be prompted to check the sender's email.

### Extension
1. **Popup**: Click the extension icon, paste text/URL, and click Analyze.
2. **Context Menu**: Highlight text or right-click a link on any webpage, then select **"Analyze Risk with AI"**.

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes
- **AI/ML**: OpenRouter (Llama 3.2), VirusTotal API
- **Database**: MongoDB, Mongoose
- **Extension**: Manifest V3, JavaScript

## API Endpoints

### POST `/api/analyze`
Analyzes a URL or message for threats.

**Request:**
```json
{
  "url": "https://example.com",  // optional
  "message": "Suspicious text"   // optional
}
```

### POST `/api/feedback`
Saves user feedback for AI learning.

**Request:**
```json
{
  "content": "URL or message",
  "contentType": "url" | "message",
  "userFeedback": "safe" | "threat",
  "aiPrediction": "SAFE" | "CAUTION" | "DANGEROUS",
  "fraudProbability": 0.8,
  "signals": ["urgency pressure", "fake authority"]
}
```

### GET `/api/feedback?content=...&contentType=...`
Retrieves historical feedback (for internal use).

## Disclaimer

This tool provides an automated risk assessment. Do not rely on this as a legal or financial guarantee. Always exercise caution when dealing with unknown links or messages.

## License

This project is open source.
