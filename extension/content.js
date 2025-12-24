// Content script to extract data and request analysis

console.log("Cybersecurity Risk AI: Content script loaded");

function extractContent() {
  console.log("Cybersecurity Risk AI: Extracting content...");
  const url = window.location.href;
  
  // Skip internal browser pages if they somehow get injected
  if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
      return;
  }

  // Get visible text, limit to 2000 chars to avoid payload issues
  const pageContent = document.body ? document.body.innerText.substring(0, 2000) : "";
  
  console.log("Cybersecurity Risk AI: Sending to background", { url });
  
  // Send to background script
  chrome.runtime.sendMessage({
    action: "analyze_page",
    data: {
      url: url,
      pageContent: pageContent
    }
  }, (response) => {
      if (chrome.runtime.lastError) {
          console.error("Cybersecurity Risk AI: Error sending message", chrome.runtime.lastError);
      }
  });
}

// Run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', extractContent);
} else {
    extractContent();
}
