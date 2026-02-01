// JSONBin.io API Service

import { Semboyan } from '@/types/semboyan';

const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b';

export interface JsonBinResponse<T> {
  record: T;
  metadata: {
    id: string;
    private: boolean;
    createdAt: string;
    name?: string;
  };
}

export const jsonbinService = {
  /**
   * Fetch data from JSONBin
   */
  async fetchData(binId: string, apiKey: string): Promise<Semboyan[]> {
    const response = await fetch(`${JSONBIN_BASE_URL}/${binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('API Key tidak valid. Silakan periksa kembali.');
      }
      if (response.status === 404) {
        throw new Error('Bin ID tidak ditemukan. Silakan periksa kembali.');
      }
      throw new Error(`Gagal mengambil data: ${errorText}`);
    }

    const data: JsonBinResponse<Semboyan[]> = await response.json();
    return data.record || [];
  },

  /**
   * Update entire data array to JSONBin
   */
  async updateData(binId: string, apiKey: string, newData: Semboyan[]): Promise<void> {
    const response = await fetch(`${JSONBIN_BASE_URL}/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
      },
      body: JSON.stringify(newData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('API Key tidak valid.');
      }
      if (response.status === 413) {
        throw new Error('Data terlalu besar. JSONBin free tier memiliki limit 100KB.');
      }
      throw new Error(`Gagal menyimpan data: ${errorText}`);
    }
  },

  /**
   * Test connection to JSONBin
   */
  async testConnection(binId: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.fetchData(binId, apiKey);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Koneksi gagal',
      };
    }
  },

  /**
   * Get bin URL for sharing
   */
  getBinUrl(binId: string): string {
    return `https://jsonbin.io/b/${binId}`;
  },
};

// Helper to generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
