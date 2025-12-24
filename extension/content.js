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
      animation: slideInRight 0.3s ease-out;
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
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      min-width: 340px;
      max-width: 400px;
      overflow: hidden;
    }
    
    .cyber-popup-content.safe {
      border-left: 4px solid #10b981;
    }
    
    .cyber-popup-content.caution {
      border-left: 4px solid #f59e0b;
    }
    
    .cyber-popup-content.dangerous {
      border-left: 4px solid #ef4444;
    }
    
    .cyber-popup-header {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid #2a2a2a;
    }
    
    .cyber-icon {
      width: 20px;
      height: 20px;
      margin-right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    
    .cyber-popup-content.safe .cyber-icon::before {
      content: '✓';
      color: #10b981;
      font-weight: bold;
    }
    
    .cyber-popup-content.caution .cyber-icon::before {
      content: '⚠';
      color: #f59e0b;
    }
    
    .cyber-popup-content.dangerous .cyber-icon::before {
      content: '✕';
      color: #ef4444;
      font-weight: bold;
    }
    
    .cyber-title {
      color: #e5e5e5;
      font-size: 14px;
      font-weight: 500;
      margin: 0;
      flex: 1;
    }
    
    .cyber-close {
      background: transparent;
      border: none;
      color: #9ca3af;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .cyber-close:hover {
      background: #2a2a2a;
      color: #e5e5e5;
    }
    
    .cyber-popup-body {
      padding: 16px;
      color: #d1d5db;
    }
    
    .cyber-risk-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 11px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .cyber-popup-content.safe .cyber-risk-badge {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .cyber-popup-content.caution .cyber-risk-badge {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    .cyber-popup-content.dangerous .cyber-risk-badge {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .cyber-message {
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 10px 0;
      color: #e5e5e5;
    }
    
    .cyber-details {
      font-size: 12px;
      color: #9ca3af;
      background: #0f0f0f;
      padding: 10px 12px;
      border-radius: 6px;
      margin-top: 10px;
      border: 1px solid #2a2a2a;
    }
    
    .cyber-details-item {
      margin: 6px 0;
      display: flex;
      align-items: flex-start;
      line-height: 1.4;
    }
    
    .cyber-details-item::before {
      content: '›';
      margin-right: 8px;
      color: #6b7280;
      font-weight: bold;
      flex-shrink: 0;
    }
    
    .cyber-progress-bar {
      height: 2px;
      background: #2a2a2a;
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
      animation: progress 5s linear forwards;
    }
    
    .cyber-popup-content.safe .cyber-progress-bar::after {
      background: #10b981;
    }
    
    .cyber-popup-content.caution .cyber-progress-bar::after {
      background: #f59e0b;
    }
    
    .cyber-popup-content.dangerous .cyber-progress-bar::after {
      background: #ef4444;
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
