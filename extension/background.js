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
    const baseUrl = 'https://cybersecurity-risk-ai.vercel.app'; // Production URL (Replace with actual deployed URL)
    const url = `${baseUrl}?analyze=${encodeURIComponent(content)}`;
    chrome.tabs.create({ url });
  }
});
