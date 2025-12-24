// Content script to extract data and request analysis

console.log("Cybersecurity Risk AI: Content script loaded on", window.location.href);

let hasAnalyzed = false;
let popupElement = null;

// Create beautiful in-page popup
function createPopup() {
  if (popupElement) return popupElement;
  
  const popup = document.createElement('div');
  popup.id = 'cyber-risk-popup';
  popup.innerHTML = `
    <div class="cyber-popup-content">
      <div class="cyber-popup-header">
        <div class="cyber-icon"></div>
        <h3 class="cyber-title">Security Analysis</h3>
        <button class="cyber-close">×</button>
      </div>
      <div class="cyber-popup-body">
        <div class="cyber-risk-badge"></div>
        <p class="cyber-message"></p>
        <div class="cyber-details"></div>
      </div>
      <div class="cyber-progress-bar"></div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #cyber-risk-popup {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    
    #cyber-risk-popup.closing {
      animation: slideOutRight 0.3s ease-in;
    }
    
    .cyber-popup-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
      min-width: 320px;
      max-width: 400px;
      overflow: hidden;
      backdrop-filter: blur(10px);
    }
    
    .cyber-popup-content.safe {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
    
    .cyber-popup-content.caution {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    .cyber-popup-content.dangerous {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }
    
    .cyber-popup-header {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }
    
    .cyber-icon {
      width: 28px;
      height: 28px;
      background: white;
      border-radius: 50%;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    .cyber-icon::before {
      content: '🛡️';
    }
    
    .cyber-title {
      color: white;
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      flex: 1;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .cyber-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .cyber-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }
    
    .cyber-popup-body {
      padding: 20px;
      color: white;
    }
    
    .cyber-risk-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    .cyber-message {
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 12px 0;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    .cyber-details {
      font-size: 12px;
      opacity: 0.9;
      background: rgba(0, 0, 0, 0.15);
      padding: 10px 12px;
      border-radius: 8px;
      margin-top: 10px;
    }
    
    .cyber-details-item {
      margin: 4px 0;
      display: flex;
      align-items: center;
    }
    
    .cyber-details-item::before {
      content: '•';
      margin-right: 8px;
      font-weight: bold;
    }
    
    .cyber-progress-bar {
      height: 3px;
      background: rgba(255, 255, 255, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    .cyber-progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      background: white;
      animation: progress 5s linear forwards;
    }
    
    @keyframes progress {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    
    @media (max-width: 480px) {
      #cyber-risk-popup {
        top: 10px;
        right: 10px;
        left: 10px;
      }
      
      .cyber-popup-content {
        min-width: auto;
        max-width: none;
      }
    }
  `;
  
  document.head.appendChild(style);
  popupElement = popup;
  
  // Close button handler
  const closeBtn = popup.querySelector('.cyber-close');
  closeBtn.addEventListener('click', () => hidePopup());
  
  return popup;
}

// Show popup with results
function showPopup(result) {
  const popup = createPopup();
  const content = popup.querySelector('.cyber-popup-content');
  const badge = popup.querySelector('.cyber-risk-badge');
  const message = popup.querySelector('.cyber-message');
  const details = popup.querySelector('.cyber-details');
  
  // Reset animation
  popup.classList.remove('closing');
  
  // Set risk level styling
  content.className = 'cyber-popup-content';
  const riskLevel = result.overall_risk?.toLowerCase() || 'unknown';
  content.classList.add(riskLevel);
  
  // Set content
  badge.textContent = result.overall_risk || 'UNKNOWN';
  message.textContent = result.user_warning_message || 'Page analysis complete.';
  
  // Add details
  details.innerHTML = '';
  
  if (result.fraud_text_analysis?.extracted_emails?.length > 0) {
    const emailDiv = document.createElement('div');
    emailDiv.className = 'cyber-details-item';
    emailDiv.textContent = `${result.fraud_text_analysis.extracted_emails.length} email(s) found`;
    details.appendChild(emailDiv);
  }
  
  if (result.fraud_text_analysis?.category && result.fraud_text_analysis.category !== 'unknown') {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'cyber-details-item';
    categoryDiv.textContent = `Category: ${result.fraud_text_analysis.category}`;
    details.appendChild(categoryDiv);
  }
  
  if (result.url_analysis?.summary && result.url_analysis.summary !== 'No significant threats detected.') {
    const urlDiv = document.createElement('div');
    urlDiv.className = 'cyber-details-item';
    urlDiv.textContent = result.url_analysis.summary;
    details.appendChild(urlDiv);
  }
  
  // Add to page if not already present
  if (!document.body.contains(popup)) {
    document.body.appendChild(popup);
  }
  
  // Auto-hide after 5 seconds
  setTimeout(() => hidePopup(), 5000);
}

// Hide popup with animation
function hidePopup() {
  if (popupElement && document.body.contains(popupElement)) {
    popupElement.classList.add('closing');
    setTimeout(() => {
      if (popupElement && document.body.contains(popupElement)) {
        document.body.removeChild(popupElement);
      }
    }, 300);
  }
}

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

// Listen for results from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'show_result') {
    console.log("Cybersecurity Risk AI: Showing popup with results", message.result);
    showPopup(message.result);
    sendResponse({ success: true });
  }
  return true;
});

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
