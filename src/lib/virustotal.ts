import axios from 'axios';

const API_KEY = process.env.VIRUSTOTAL_API_KEY;
const BASE_URL = 'https://www.virustotal.com/api/v3';

export interface VirusTotalStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  timeout: number;
}

export async function getURLReport(url: string): Promise<VirusTotalStats | null> {
  if (!API_KEY) {
    console.error('VirusTotal API key is missing');
    return null;
  }

  try {
    console.log('🔍 Checking VirusTotal for URL...');
    const startTime = Date.now();
    
    // URL identifier is base64 representation of the URL
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
    
    const response = await axios.get(`${BASE_URL}/urls/${urlId}`, {
      headers: {
        'x-apikey': API_KEY,
      },
      timeout: 10000, // 10 second timeout
    });

    console.log(`✅ VirusTotal responded in ${Date.now() - startTime}ms`);
    const attributes = response.data.data.attributes;
    return attributes.last_analysis_stats;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        // URL not found in VT database
        console.log('URL not found in VirusTotal database');
        return null;
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        console.error('VirusTotal API timeout');
        return null;
      }
    }
    console.error('Error fetching VirusTotal report:', error);
    return null;
  }
}
