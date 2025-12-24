chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyze-risk",
    title: "Analyze Risk with AI",
    contexts: ["selection", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyze-risk") {
    const content = info.selectionText || info.linkUrl;
    
    // Open popup (not directly possible via API in all cases, so we might open a new tab or just store it)
    // For simplicity, we'll open the web app with the content as a query param if we were building a full integration.
    // But since we want to use the extension popup, we can't programmatically open it easily from background.
    // Instead, we'll open a new tab to the local app for now.
    
    // const baseUrl = 'http://localhost:3000'; // Localhost for development
    const baseUrl = 'https://email-and-url-checker.vercel.app'; // Production URL
    const url = `${baseUrl}?analyze=${encodeURIComponent(content)}`;
    chrome.tabs.create({ url });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analyze_page") {
    analyzeContent(message.data);
  }
});

async function analyzeContent(data) {
  const apiUrl = 'https://email-and-url-checker.vercel.app/api/analyze';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: data.url,
        pageContent: data.pageContent
      })
    });

    if (!response.ok) throw new Error('Analysis failed');

    const result = await response.json();
    showNotification(result);
  } catch (error) {
    console.error('Analysis error:', error);
  }
}

function showNotification(result) {
  const risk = result.overall_risk;
  let title = `Risk Analysis: ${risk}`;
  let message = result.user_warning_message || result.url_analysis?.summary || "Analysis complete.";
  
  // Use the existing icon
  let iconUrl = "icons/icon128.png"; 

  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconUrl,
    title: title,
    message: message,
    priority: 1
  });
}
