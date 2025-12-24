// Content script to extract data and request analysis

function extractContent() {
  const url = window.location.href;
  // Get visible text, limit to 2000 chars to avoid payload issues
  const pageContent = document.body.innerText.substring(0, 2000);
  
  // Send to background script
  chrome.runtime.sendMessage({
    action: "analyze_page",
    data: {
      url: url,
      pageContent: pageContent
    }
  });
}

// Run on load
if (document.readyState === 'complete') {
  extractContent();
} else {
  window.addEventListener('load', extractContent);
}
