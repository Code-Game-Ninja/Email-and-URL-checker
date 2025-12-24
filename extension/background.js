// Track analyzed URLs to avoid duplicate scans
const analyzedUrls = new Set();
const SCAN_DELAY = 2000; // Wait 2 seconds after page load

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyze-risk",
    title: "Analyze Risk with AI",
    contexts: ["selection", "link"]
  });
  
  console.log("Cybersecurity Risk AI: Extension installed and ready for auto-scanning");
});

// Auto-scan when tabs are updated (page loaded)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only scan when page is fully loaded
  if (changeInfo.status === 'complete' && tab.url) {
    // Skip internal pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
        tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      return;
    }
    
    console.log("Cybersecurity Risk AI: Page loaded, preparing auto-scan:", tab.url);
    
    // Inject and execute content script for auto-analysis
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          // Trigger content script analysis
          window.postMessage({ type: 'TRIGGER_AUTO_SCAN' }, '*');
        }
      }).catch(err => {
        console.log("Cybersecurity Risk AI: Could not inject script:", err.message);
      });
    }, SCAN_DELAY);
  }
});

// Auto-scan when switching to a different tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
      tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // If we haven't analyzed this URL recently, trigger analysis
  if (!analyzedUrls.has(tab.url)) {
    console.log("Cybersecurity Risk AI: Tab activated, checking:", tab.url);
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: activeInfo.tabId },
        func: () => {
          window.postMessage({ type: 'TRIGGER_AUTO_SCAN' }, '*');
        }
      }).catch(err => {
        console.log("Cybersecurity Risk AI: Could not inject script:", err.message);
      });
    }, 500);
  }
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
    console.log("Cybersecurity Risk AI: Received analysis request for", message.data.url);
    analyzeContent(message.data);
  }
});

async function analyzeContent(data) {
  const apiUrl = 'https://email-and-url-checker.vercel.app/api/analyze';
  
  // Skip if already analyzed recently
  if (analyzedUrls.has(data.url)) {
    console.log("Cybersecurity Risk AI: URL already analyzed, skipping:", data.url);
    return;
  }
  
  try {
    console.log("Cybersecurity Risk AI: Auto-analyzing page:", data.url);
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

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Analysis failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("Cybersecurity Risk AI: Analysis complete", result);
    
    // Track this URL
    analyzedUrls.add(data.url);
    
    // Clear from cache after 5 minutes to allow re-analysis if user revisits
    setTimeout(() => {
      analyzedUrls.delete(data.url);
    }, 5 * 60 * 1000);
    
    // Send results back to content script for in-page popup
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'show_result',
          result: result
        }).catch(err => {
          console.log("Could not send to content script:", err);
        });
      }
    });
  } catch (error) {
    console.error('Cybersecurity Risk AI: Analysis error:', error);
  }
}

function showNotification(result, url) {
  const risk = result.overall_risk || "UNKNOWN";
  let title = `⚠️ Security Alert: ${risk}`;
  let message = result.user_warning_message || result.url_analysis?.summary || "Analysis complete.";
  
  // Add URL domain to message
  try {
    const domain = new URL(url).hostname;
    message = `${domain}\n${message}`;
  } catch (e) {
    // Ignore URL parsing errors
  }
  
  // Use the existing icon
  let iconUrl = "icons/icon128.png"; 

  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconUrl,
    title: title,
    message: message,
    priority: 2,
    requireInteraction: risk === 'DANGEROUS' // Keep dangerous warnings visible
  }, (notificationId) => {
    // Auto-clear CAUTION after 8 seconds, keep DANGEROUS until clicked
    if (notificationId && risk !== 'DANGEROUS') {
      setTimeout(() => {
        chrome.notifications.clear(notificationId);
      }, 8000);
    }
  });
}

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.tabs.create({ url: 'https://email-and-url-checker.vercel.app' });
});
