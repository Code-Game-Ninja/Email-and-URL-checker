// Content script to extract data and request analysis

console.log("Cybersecurity Risk AI: Content script loaded on", window.location.href);

let hasAnalyzed = false;

function extractContent() {
  console.log("Cybersecurity Risk AI: Extracting content...");
  const url = window.location.href;
  
  // Skip internal browser pages
  if (url.startsWith('chrome://') || url.startsWith('edge://') || 
      url.startsWith('about:') || url.startsWith('chrome-extension://')) {
      return;
  }
  
  // Skip if already analyzed on this page load
  if (hasAnalyzed) {
    console.log("Cybersecurity Risk AI: Already analyzed this page");
    return;
  }

  // Get visible text, limit to 2000 chars to avoid payload issues
  const pageContent = document.body ? document.body.innerText.substring(0, 2000) : "";
  
  // Extract emails from page
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = pageContent.match(emailRegex) || [];
  
  console.log("Cybersecurity Risk AI: Sending to background", { 
    url, 
    emailsFound: emails.length 
  });
  
  hasAnalyzed = true;
  
  // Send to background script
  chrome.runtime.sendMessage({
    action: "analyze_page",
    data: {
      url: url,
      pageContent: pageContent,
      emailsFound: emails.length
    }
  }, (response) => {
      if (chrome.runtime.lastError) {
          console.error("Cybersecurity Risk AI: Error sending message", chrome.runtime.lastError);
      }
  });
}

// Listen for manual trigger from background script
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_AUTO_SCAN') {
    console.log("Cybersecurity Risk AI: Manual trigger received");
    hasAnalyzed = false; // Reset flag
    extractContent();
  }
});

// Auto-run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', extractContent);
} else {
    // Page already loaded
    extractContent();
}

// Re-analyze if page content changes significantly (for SPAs)
let lastContent = document.body ? document.body.innerText.substring(0, 500) : "";
const observer = new MutationObserver(() => {
  const currentContent = document.body ? document.body.innerText.substring(0, 500) : "";
  
  // If content changed significantly, re-analyze
  if (currentContent !== lastContent && currentContent.length > 100) {
    lastContent = currentContent;
    hasAnalyzed = false;
    console.log("Cybersecurity Risk AI: Significant page change detected, re-analyzing");
    setTimeout(extractContent, 1000); // Debounce
  }
});

// Start observing after page load
if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}
