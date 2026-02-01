// Types for Semboyan Kereta Api Management System

export interface Semboyan {
  id: string;
  Nama: string;
  Gambar: string;
  Sifat: SifatType;
  Status: StatusType;
  Penjelasan: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SifatType = 'Sementara' | 'Tetap' | 'Khusus';
export type StatusType = 'Aktif' | 'Tidak Aktif';

export type StorageType = 'jsonbin' | 'supabase';

export interface JsonBinConfig {
  binId: string;
  apiKey: string;
  autoRefreshInterval: number; // in seconds
}

export interface StorageConfig {
  type: StorageType;
  jsonbin?: JsonBinConfig;
  autoRefreshInterval: number; // in seconds
}

export type RobloxSyncType = 'none' | 'github' | 'pastebin';

export interface GitHubSyncConfig {
  username: string;
  repository: string;
  filePath: string;
  token: string;
}

export interface PastebinSyncConfig {
  apiKey: string;
  userKey?: string;
  currentPasteId?: string;
}

export interface RobloxSyncConfig {
  enabled: boolean;
  type: RobloxSyncType;
  github?: GitHubSyncConfig;
  pastebin?: PastebinSyncConfig;
  lastSynced?: Date;
  publicUrl?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastSynced: Date | null;
  isLoading: boolean;
  error: string | null;
}

export interface SemboyanFormData {
  Nama: string;
  Gambar: string;
  Sifat: SifatType;
  Status: StatusType;
  Penjelasan: string;
}

export const SIFAT_OPTIONS: SifatType[] = ['Sementara', 'Tetap', 'Khusus'];
export const STATUS_OPTIONS: StatusType[] = ['Aktif', 'Tidak Aktif'];

// Initial demo data
export const DEMO_DATA: Omit<Semboyan, 'id'>[] = [
  {
    Nama: "Semboyan 1",
    Gambar: "rbxassetid://12345678",
    Sifat: "Sementara",
    Status: "Aktif",
    Penjelasan: "Semboyan 1 adalah tanda yang diberikan untuk memberikan perintah tertentu kepada masinis."
  },
  {
    Nama: "Semboyan 2",
    Gambar: "rbxassetid://87654321",
    Sifat: "Tetap",
    Status: "Aktif",
    Penjelasan: "Semboyan 2 merupakan tanda batas kecepatan pada jalur tertentu."
  }
];
