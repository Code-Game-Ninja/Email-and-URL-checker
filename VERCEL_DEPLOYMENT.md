# Deploying Cybersecurity Risk AI to Vercel

Since your project is already on GitHub, deploying to Vercel is very easy.

## Prerequisites

1.  A [Vercel Account](https://vercel.com/signup).
2.  Your project pushed to GitHub (which you have already done).

## Steps to Deploy

1.  **Log in to Vercel:**
    Go to [vercel.com](https://vercel.com) and log in.

2.  **Add New Project:**
    *   Click on the **"Add New..."** button and select **"Project"**.
    *   Select **"Continue with GitHub"**.
    *   Find your repository `Email-and-URL-checker` and click **"Import"**.

3.  **Configure Project:**
    *   **Framework Preset:** It should automatically detect **Next.js**.
    *   **Root Directory:** Select `cybersecurity-risk-ai` (since your Next.js app is inside this folder, not at the root of the repo).
        *   Click "Edit" next to Root Directory and select the `cybersecurity-risk-ai` folder.

4.  **Environment Variables:**
    Expand the **"Environment Variables"** section and add the following keys (copy values from your local `.env.local` file):

    | Key | Value |
    | --- | --- |
    | `VIRUSTOTAL_API_KEY` | *[Your VirusTotal API Key]* |
    | `OPENROUTER_API_KEY` | *[Your OpenRouter API Key]* |
    | `OPENROUTER_MODEL` | `meta-llama/llama-3.2-3b-instruct:free` |
    | `MONGODB_URI` | *[Your MongoDB Connection String]* |

    *Note: Ensure your MongoDB Atlas IP Access List allows access from anywhere (`0.0.0.0/0`) since Vercel uses dynamic IPs.*

5.  **Deploy:**
    Click **"Deploy"**.

6.  **Wait for Build:**
    Vercel will build your project. Once finished, you will get a deployment URL (e.g., `https://cybersecurity-risk-ai.vercel.app`).

## After Deployment

1.  **Update Extension:**
    If your deployed URL is different from `https://cybersecurity-risk-ai.vercel.app`, you need to update the `API_URL` in `extension/popup.js` and `baseUrl` in `extension/background.js` with your new URL.
    
2.  **Push Changes:**
    If you updated the URL, commit and push the changes to GitHub.

## Troubleshooting

*   **Database Connection:** If the app fails to connect to MongoDB, check your MongoDB Atlas Network Access settings and ensure "Allow Access from Anywhere" is enabled.
*   **Build Errors:** Check the "Logs" tab in your Vercel dashboard for details.
