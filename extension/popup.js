// const API_URL = 'http://localhost:3000/api/analyze'; // Localhost for development
const API_URL = 'https://email-and-url-checker.vercel.app'; // Production URL (Replace with actual deployed URL)

document.addEventListener('DOMContentLoaded', async () => {
  const input = document.getElementById('input');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  
  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url && !tab.url.startsWith('chrome://')) {
    input.value = tab.url;
  }

  analyzeBtn.addEventListener('click', () => analyze(input.value));

  // Manual Email Check
  const checkEmailBtn = document.getElementById('checkEmailBtn');
  const manualEmailInput = document.getElementById('manualEmail');
  
  checkEmailBtn.addEventListener('click', async () => {
      const email = manualEmailInput.value;
      if(!email) return;
      
      checkEmailBtn.disabled = true;
      checkEmailBtn.textContent = '...';
      
      try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: email })
          });
          const data = await response.json();
          
          // Merge results (simplified for popup)
          // In a full app we'd merge properly, here we just append to the list
          const emailSection = document.getElementById('emailSection');
          const emailList = document.getElementById('emailList');
          emailSection.classList.remove('hidden');
          
          if(data.fraud_text_analysis.email_risk_analysis) {
              data.fraud_text_analysis.email_risk_analysis.forEach(emailData => {
                  const div = document.createElement('div');
                  div.className = `email-item ${emailData.riskLevel}`;
                  div.innerHTML = `<strong>${emailData.email}</strong><br>Risk: ${emailData.riskLevel}`;
                  emailList.appendChild(div);
              });
          }
          
          manualEmailInput.value = '';
          document.getElementById('emailCheckSection').classList.add('hidden');

      } catch (err) {
          console.error(err);
      } finally {
          checkEmailBtn.disabled = false;
          checkEmailBtn.textContent = 'Check';
      }
  });
});

async function analyze(content) {
  if (!content) return;

  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const errorDiv = document.getElementById('errorMessage');

  loading.classList.remove('hidden');
  result.classList.add('hidden');
  errorDiv.classList.add('hidden');
  analyzeBtn.disabled = true;

  try {
    const isUrl = /^(http|https):\/\/[^ "]+$/.test(content);
    const payload = isUrl ? { url: content } : { message: content };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    displayResult(data);

  } catch (error) {
    console.error('Analysis failed:', error);
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = 'Analysis failed. Ensure the server is deployed and running.';
    errorDiv.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
  } finally {
    loading.classList.add('hidden');
    analyzeBtn.disabled = false;
  }
}

function displayResult(data) {
  const result = document.getElementById('result');
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.classList.add('hidden'); // Hide error if successful
  
  const riskBanner = document.getElementById('riskBanner');
  const warningMessage = document.getElementById('warningMessage');
  const riskLevel = document.getElementById('riskLevel');
  
  result.classList.remove('hidden');

  // Reset classes
  riskBanner.className = 'banner';
  
  // Set Risk Level
  riskLevel.textContent = data.overall_risk;
  warningMessage.textContent = data.user_warning_message;

  if (data.overall_risk === 'SAFE') {
    riskBanner.classList.add('safe');
  } else if (data.overall_risk === 'CAUTION') {
    riskBanner.classList.add('caution');
  } else {
    riskBanner.classList.add('dangerous');
  }

  // URL Section
  const urlSection = document.getElementById('urlSection');
  if (data.url_analysis && data.url_analysis.summary !== 'No significant threats detected.') {
    urlSection.classList.remove('hidden');
    document.getElementById('urlSummary').textContent = data.url_analysis.summary;
  } else {
    urlSection.classList.add('hidden');
  }

  // Text Section
  const textSection = document.getElementById('textSection');
  if (data.fraud_text_analysis.category !== 'unknown') {
    textSection.classList.remove('hidden');
    document.getElementById('fraudProb').textContent = (data.fraud_text_analysis.fraud_probability * 100).toFixed(1) + '%';
    document.getElementById('category').textContent = data.fraud_text_analysis.category;
    
    const signalsContainer = document.getElementById('signals');
    signalsContainer.innerHTML = '';
    data.fraud_text_analysis.signals_detected.forEach(signal => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = signal;
      signalsContainer.appendChild(span);
    });
  } else {
    textSection.classList.add('hidden');
  }

  // Email Section
  const emailSection = document.getElementById('emailSection');
  const emailList = document.getElementById('emailList');
  emailList.innerHTML = '';
  
  if (data.fraud_text_analysis.extracted_emails && data.fraud_text_analysis.extracted_emails.length > 0) {
      emailSection.classList.remove('hidden');
      data.fraud_text_analysis.email_risk_analysis.forEach(emailData => {
          const div = document.createElement('div');
          div.className = `email-item ${emailData.riskLevel}`;
          div.innerHTML = `<strong>${emailData.email}</strong><br>Risk: ${emailData.riskLevel}`;
          emailList.appendChild(div);
      });
      document.getElementById('emailCheckSection').classList.add('hidden');
  } else {
      emailSection.classList.add('hidden');
      // Show manual check if suspicious but no email
      if (data.overall_risk !== 'SAFE') {
          document.getElementById('emailCheckSection').classList.remove('hidden');
      } else {
          document.getElementById('emailCheckSection').classList.add('hidden');
      }
  }
}
