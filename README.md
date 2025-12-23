# Cybersecurity Risk Analysis AI

A Next.js application that helps users detect malicious URLs and analyze text for phishing, scam, and fraud attempts using VirusTotal and AI-powered text analysis. **Now with AI learning from user feedback!**

## Features

- **URL Risk Interpretation**: Checks URLs against VirusTotal's database to identify malicious or suspicious sites.
- **Fraud Text Analysis**: Uses AI to analyze messages (SMS, email, chat) for signs of urgency, fake authority, and other fraud signals.
- **Risk Scoring**: Provides a clear "SAFE", "CAUTION", or "DANGEROUS" assessment based on strict scoring rules.
- **User Feedback System**: Submit feedback on analysis accuracy to help the AI learn and improve.
- **Historical Learning**: The AI learns from previous user feedback stored in MongoDB.
- **User-Friendly UI**: Simple interface with toast notifications and feedback buttons.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB installed and running (local or cloud)
- VirusTotal API Key
- OpenRouter API Key

### Installation

1. Navigate to the project directory:
   ```bash
   cd cybersecurity-risk-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up MongoDB:
   
   **Option A: Local MongoDB**
   - Install MongoDB: https://www.mongodb.com/docs/manual/installation/
   - Start MongoDB service:
     ```bash
     sudo systemctl start mongodb
     # or on macOS with homebrew:
     brew services start mongodb-community
     ```
   
   **Option B: MongoDB Atlas (Cloud)**
   - Create a free account at https://www.mongodb.com/cloud/atlas
   - Create a cluster and get your connection string
   - Replace `MONGODB_URI` in `.env.local` with your Atlas connection string

4. Set up environment variables:
   Create/update `.env.local` file:
   ```env
   VIRUSTOTAL_API_KEY=your_virustotal_key
   OPENROUTER_API_KEY=your_openrouter_key
   OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
   MONGODB_URI=mongodb://localhost:27017/cybersecurity-risk-ai
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser.

## How It Works

### AI Learning System

1. **Analysis**: The AI analyzes URLs and messages for threats using VirusTotal and LLM analysis.
2. **User Feedback**: After each analysis, users can mark it as "Safe" or "Threat".
3. **Storage**: Feedback is stored in MongoDB with the content, prediction, and actual result.
4. **Learning**: For future analyses:
   - If the exact content was seen before, the AI considers the previous feedback heavily
   - The AI learns from the last 20 feedback entries to improve pattern recognition
5. **Improvement**: Over time, the AI becomes more accurate by learning from real user corrections.

### Database Schema

**ThreatFeedback Collection:**
- `content`: URL or message text
- `contentType`: 'url' or 'message'
- `userFeedback`: 'safe' or 'threat' (user's correction)
- `aiPrediction`: 'SAFE', 'CAUTION', or 'DANGEROUS'
- `fraudProbability`: 0.0 - 1.0
- `signals`: Array of detected threat signals
- `createdAt`, `updatedAt`: Timestamps

## Usage

1. **Enter Content**: Paste a URL or message text into the input box.
2. **Analyze**: Click "Analyze Risk" to get a comprehensive report.
3. **Review Results**: Check the risk level, URL analysis, and content analysis.
4. **Give Feedback**: Click "It's Safe" or "It's a Threat" to help the AI learn.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast notifications)
- **API Integration**: Axios
- **External APIs**: VirusTotal, OpenRouter (LLM)

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
