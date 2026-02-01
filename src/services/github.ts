// GitHub API Service for GitHub Pages integration
// Uses GitHub REST API to update JSON files in a repository

export interface GitHubConfig {
  username: string;
  repository: string;
  filePath: string;
  token: string;
}

export interface GitHubFileResponse {
  sha: string;
  content: string;
  encoding: string;
}

const GITHUB_API_BASE = 'https://api.github.com';

export const githubService = {
  /**
   * Get public GitHub Pages URL for a file
   */
  getPublicUrl(config: GitHubConfig): string {
    return `https://${config.username}.github.io/${config.repository}/${config.filePath}`;
  },

  /**
   * Get raw GitHub content URL (alternative public URL)
   */
  getRawUrl(config: GitHubConfig): string {
    return `https://raw.githubusercontent.com/${config.username}/${config.repository}/main/${config.filePath}`;
  },

  /**
   * Fetch data from GitHub repository
   */
  async fetchData<T>(config: GitHubConfig): Promise<T> {
    const url = `${GITHUB_API_BASE}/repos/${config.username}/${config.repository}/contents/${config.filePath}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `GitHub API error: ${response.status}`);
    }

    const data: GitHubFileResponse = await response.json();
    
    // Decode base64 content
    const content = atob(data.content.replace(/\n/g, ''));
    return JSON.parse(content);
  },

  /**
   * Get file SHA (required for updates)
   */
  async getFileSha(config: GitHubConfig): Promise<string> {
    const url = `${GITHUB_API_BASE}/repos/${config.username}/${config.repository}/contents/${config.filePath}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return ''; // File doesn't exist yet
      }
      throw new Error(`Failed to get file SHA: ${response.status}`);
    }

    const data: GitHubFileResponse = await response.json();
    return data.sha;
  },

  /**
   * Update data in GitHub repository
   */
  async updateData<T>(config: GitHubConfig, newData: T, commitMessage = 'Update data from Semboyan App'): Promise<void> {
    const url = `${GITHUB_API_BASE}/repos/${config.username}/${config.repository}/contents/${config.filePath}`;
    
    // Get current file SHA
    const sha = await this.getFileSha(config);
    
    // Encode content to base64
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
    
    const body: Record<string, string> = {
      message: commitMessage,
      content,
    };
    
    // SHA required for update, not for create
    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update GitHub: ${response.status}`);
    }
  },

  /**
   * Test GitHub connection
   */
  async testConnection(config: GitHubConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to access the repository
      const url = `${GITHUB_API_BASE}/repos/${config.username}/${config.repository}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Repository tidak ditemukan. Periksa username dan nama repository.' };
        }
        if (response.status === 401) {
          return { success: false, error: 'Token tidak valid. Periksa Personal Access Token Anda.' };
        }
        return { success: false, error: `GitHub API error: ${response.status}` };
      }

      // Check if we have write access
      const repoData = await response.json();
      if (!repoData.permissions?.push) {
        return { success: false, error: 'Token tidak memiliki akses tulis ke repository.' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Gagal terhubung ke GitHub' 
      };
    }
  },
};
