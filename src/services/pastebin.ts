// Pastebin API Service
// Uses Pastebin API to create/update public pastes

export interface PastebinConfig {
  apiKey: string;
  userKey?: string;
  pasteId?: string;
}

const PASTEBIN_API_URL = 'https://pastebin.com/api/api_post.php';
// Use a CORS proxy for browser requests
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export const pastebinService = {
  /**
   * Get public Pastebin raw URL
   */
  getPublicUrl(pasteId: string): string {
    return `https://pastebin.com/raw/${pasteId}`;
  },

  /**
   * Extract paste ID from Pastebin URL
   */
  extractPasteId(url: string): string {
    const match = url.match(/pastebin\.com\/(?:raw\/)?([a-zA-Z0-9]+)/);
    return match ? match[1] : '';
  },

  /**
   * Fetch data from Pastebin
   */
  async fetchData<T>(pasteId: string): Promise<T> {
    const rawUrl = `https://pastebin.com/raw/${pasteId}`;
    
    // Use CORS proxy for browser requests
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(rawUrl)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch from Pastebin: ${response.status}`);
    }

    const text = await response.text();
    return JSON.parse(text);
  },

  /**
   * Create new paste on Pastebin
   * Note: Pastebin doesn't support updating existing pastes via API
   * Each update creates a new paste with new URL
   */
  async createPaste<T>(config: PastebinConfig, data: T, name = 'Semboyan Data'): Promise<string> {
    const formData = new URLSearchParams();
    formData.append('api_dev_key', config.apiKey);
    formData.append('api_option', 'paste');
    formData.append('api_paste_code', JSON.stringify(data, null, 2));
    formData.append('api_paste_format', 'json');
    formData.append('api_paste_private', '1'); // 1 = unlisted (can be accessed with URL but not searchable)
    formData.append('api_paste_name', name);
    formData.append('api_paste_expire_date', 'N'); // Never expire
    
    if (config.userKey) {
      formData.append('api_user_key', config.userKey);
    }

    // Pastebin API has CORS restrictions, so we use a proxy
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(PASTEBIN_API_URL)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Pastebin API error: ${response.status}`);
    }

    const result = await response.text();
    
    // Check for error response
    if (result.startsWith('Bad API request')) {
      throw new Error(result);
    }
    
    // Extract paste ID from response URL
    const pasteId = this.extractPasteId(result);
    
    if (!pasteId) {
      throw new Error('Failed to get paste ID from response');
    }

    return pasteId;
  },

  /**
   * Update data on Pastebin
   * Since Pastebin doesn't support updating existing pastes,
   * this creates a new paste and returns the new ID
   */
  async updateData<T>(config: PastebinConfig, data: T, name = 'Semboyan Data'): Promise<string> {
    // Create new paste (Pastebin doesn't support update)
    return await this.createPaste(config, data, name);
  },

  /**
   * Test Pastebin connection by creating a test paste
   */
  async testConnection(apiKey: string): Promise<{ success: boolean; error?: string; pasteId?: string }> {
    try {
      const testData = { test: true, timestamp: new Date().toISOString() };
      
      const formData = new URLSearchParams();
      formData.append('api_dev_key', apiKey);
      formData.append('api_option', 'paste');
      formData.append('api_paste_code', JSON.stringify(testData));
      formData.append('api_paste_format', 'json');
      formData.append('api_paste_private', '1');
      formData.append('api_paste_name', 'Connection Test');
      formData.append('api_paste_expire_date', '10M'); // Expire in 10 minutes

      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(PASTEBIN_API_URL)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await response.text();
      
      if (result.startsWith('Bad API request')) {
        return { success: false, error: result.replace('Bad API request, ', '') };
      }

      const pasteId = this.extractPasteId(result);
      
      return { success: true, pasteId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Gagal terhubung ke Pastebin' 
      };
    }
  },
};
