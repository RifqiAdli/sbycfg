import { useState, useEffect, useCallback, useRef } from 'react';
import { Semboyan, StorageConfig, RobloxSyncConfig } from '@/types/semboyan';
import { jsonbinService, generateId } from '@/services/jsonbin';
import { supabaseStorageService } from '@/services/supabaseStorage';
import { githubService } from '@/services/github';
import { pastebinService } from '@/services/pastebin';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CONFIG_STORAGE_KEY = 'storage_config';
const ROBLOX_SYNC_STORAGE_KEY = 'roblox_sync_config';
const DEFAULT_REFRESH_INTERVAL = 10; // seconds

export function useJsonBin() {
  const { toast } = useToast();
  const [config, setConfig] = useState<StorageConfig | null>(null);
  const [robloxSyncConfig, setRobloxSyncConfig] = useState<RobloxSyncConfig | null>(null);
  const [data, setData] = useState<Semboyan[]>([]);
  const [status, setStatus] = useState({
    isConnected: false,
    lastSynced: null as Date | null,
    isLoading: false,
    error: null as string | null,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Decrypt API key if JSONBin
        if (parsed.jsonbin?.apiKey) {
          parsed.jsonbin.apiKey = atob(parsed.jsonbin.apiKey);
        }
        setConfig(parsed);
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }

    // Load Roblox sync config
    const savedRobloxConfig = localStorage.getItem(ROBLOX_SYNC_STORAGE_KEY);
    if (savedRobloxConfig) {
      try {
        const parsed = JSON.parse(savedRobloxConfig);
        if (parsed.github?.token) {
          parsed.github.token = atob(parsed.github.token);
        }
        if (parsed.pastebin?.apiKey) {
          parsed.pastebin.apiKey = atob(parsed.pastebin.apiKey);
        }
        setRobloxSyncConfig(parsed);
      } catch (e) {
        console.error('Failed to parse saved Roblox sync config:', e);
      }
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: StorageConfig) => {
    const configToSave = {
      ...newConfig,
      jsonbin: newConfig.jsonbin ? {
        ...newConfig.jsonbin,
        apiKey: btoa(newConfig.jsonbin.apiKey),
      } : undefined,
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configToSave));
    setConfig(newConfig);
  }, []);

  // Clear config
  const clearConfig = useCallback(() => {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    setConfig(null);
    setData([]);
    setStatus({
      isConnected: false,
      lastSynced: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // Save Roblox sync config
  const saveRobloxSyncConfig = useCallback((newConfig: RobloxSyncConfig) => {
    const configToSave = {
      ...newConfig,
      github: newConfig.github ? {
        ...newConfig.github,
        token: btoa(newConfig.github.token),
      } : undefined,
      pastebin: newConfig.pastebin ? {
        ...newConfig.pastebin,
        apiKey: btoa(newConfig.pastebin.apiKey),
      } : undefined,
    };
    localStorage.setItem(ROBLOX_SYNC_STORAGE_KEY, JSON.stringify(configToSave));
    setRobloxSyncConfig(newConfig);
  }, []);

  // Sync to Roblox storage
  const syncToRoblox = useCallback(async (dataToSync: Semboyan[]) => {
    if (!robloxSyncConfig?.enabled) return;

    try {
      if (robloxSyncConfig.type === 'github' && robloxSyncConfig.github) {
        await githubService.updateData(
          robloxSyncConfig.github,
          dataToSync,
          `Update semboyan data - ${new Date().toISOString()}`
        );
        toast({
          title: 'Sync ke GitHub berhasil',
          description: 'Data akan tersedia di GitHub Pages dalam 1-2 menit',
        });
      } else if (robloxSyncConfig.type === 'pastebin' && robloxSyncConfig.pastebin) {
        const newPasteId = await pastebinService.updateData(
          robloxSyncConfig.pastebin,
          dataToSync,
          'Semboyan Data'
        );
        const updatedConfig: RobloxSyncConfig = {
          ...robloxSyncConfig,
          pastebin: { ...robloxSyncConfig.pastebin, currentPasteId: newPasteId },
          publicUrl: pastebinService.getPublicUrl(newPasteId),
        };
        saveRobloxSyncConfig(updatedConfig);
        toast({
          title: 'Sync ke Pastebin berhasil',
          description: `URL baru: ${pastebinService.getPublicUrl(newPasteId)}`,
        });
      }
    } catch (error) {
      console.error('Roblox sync error:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal sync ke Roblox storage',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [robloxSyncConfig, saveRobloxSyncConfig, toast]);

  // Fetch data
  const fetchData = useCallback(async (showToast = false) => {
    if (!config) return;

    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let fetchedData: Semboyan[];

      if (config.type === 'supabase') {
        fetchedData = await supabaseStorageService.fetchData();
      } else if (config.type === 'jsonbin' && config.jsonbin) {
        fetchedData = await jsonbinService.fetchData(config.jsonbin.binId, config.jsonbin.apiKey);
      } else {
        throw new Error('Invalid storage configuration');
      }

      if (isMountedRef.current) {
        setData(fetchedData);
        setStatus({
          isConnected: true,
          lastSynced: new Date(),
          isLoading: false,
          error: null,
        });

        if (showToast) {
          toast({
            title: 'Data berhasil dimuat',
            description: `${fetchedData.length} semboyan ditemukan`,
          });
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Gagal mengambil data';
        setStatus(prev => ({
          ...prev,
          isConnected: false,
          isLoading: false,
          error: errorMessage,
        }));

        if (showToast) {
          toast({
            variant: 'destructive',
            title: 'Gagal memuat data',
            description: errorMessage,
          });
        }
      }
    }
  }, [config, toast]);

  // Add semboyan
  const addSemboyan = useCallback(async (newItem: Omit<Semboyan, 'id'>) => {
    if (!config) return;

    setStatus(prev => ({ ...prev, isLoading: true }));

    try {
      let addedItem: Semboyan;

      if (config.type === 'supabase') {
        addedItem = await supabaseStorageService.addItem(newItem);
        setData(prev => [...prev, addedItem]);
      } else if (config.type === 'jsonbin' && config.jsonbin) {
        addedItem = {
          ...newItem,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updatedData = [...data, addedItem];
        await jsonbinService.updateData(config.jsonbin.binId, config.jsonbin.apiKey, updatedData);
        setData(updatedData);
        syncToRoblox(updatedData);
      } else {
        throw new Error('Invalid storage configuration');
      }

      setStatus(prev => ({ ...prev, lastSynced: new Date(), isLoading: false }));
      toast({
        title: 'Berhasil ditambahkan',
        description: `Semboyan "${newItem.Nama}" telah ditambahkan`,
      });

      return addedItem!;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menambah data';
      setStatus(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: errorMessage });
      throw error;
    }
  }, [config, data, toast, syncToRoblox]);

  // Edit semboyan
  const editSemboyan = useCallback(async (id: string, updatedItem: Omit<Semboyan, 'id'>) => {
    if (!config) return;

    setStatus(prev => ({ ...prev, isLoading: true }));

    try {
      if (config.type === 'supabase') {
        await supabaseStorageService.updateItem(id, updatedItem);
        setData(prev => prev.map(item => 
          item.id === id ? { ...item, ...updatedItem, updatedAt: new Date().toISOString() } : item
        ));
      } else if (config.type === 'jsonbin' && config.jsonbin) {
        const updatedData = data.map(item =>
          item.id === id ? { ...item, ...updatedItem, updatedAt: new Date().toISOString() } : item
        );
        await jsonbinService.updateData(config.jsonbin.binId, config.jsonbin.apiKey, updatedData);
        setData(updatedData);
        syncToRoblox(updatedData);
      }

      setStatus(prev => ({ ...prev, lastSynced: new Date(), isLoading: false }));
      toast({
        title: 'Berhasil diperbarui',
        description: `Semboyan "${updatedItem.Nama}" telah diperbarui`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui data';
      setStatus(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: errorMessage });
      throw error;
    }
  }, [config, data, toast, syncToRoblox]);

  // Delete semboyan
  const deleteSemboyan = useCallback(async (id: string) => {
    if (!config) return;

    const itemToDelete = data.find(item => item.id === id);
    setStatus(prev => ({ ...prev, isLoading: true }));

    try {
      if (config.type === 'supabase') {
        await supabaseStorageService.deleteItem(id);
        setData(prev => prev.filter(item => item.id !== id));
      } else if (config.type === 'jsonbin' && config.jsonbin) {
        const updatedData = data.filter(item => item.id !== id);
        await jsonbinService.updateData(config.jsonbin.binId, config.jsonbin.apiKey, updatedData);
        setData(updatedData);
        syncToRoblox(updatedData);
      }

      setStatus(prev => ({ ...prev, lastSynced: new Date(), isLoading: false }));
      toast({
        title: 'Berhasil dihapus',
        description: itemToDelete ? `Semboyan "${itemToDelete.Nama}" telah dihapus` : 'Data telah dihapus',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus data';
      setStatus(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({ variant: 'destructive', title: 'Gagal menghapus', description: errorMessage });
      throw error;
    }
  }, [config, data, toast, syncToRoblox]);

  // Import data
  const importData = useCallback(async (importedData: Semboyan[]) => {
    if (!config) return;

    setStatus(prev => ({ ...prev, isLoading: true }));

    try {
      if (config.type === 'supabase') {
        // Filter out existing IDs
        const existingIds = new Set(data.map(item => item.id));
        const newItems = importedData.filter(item => !existingIds.has(item.id));
        
        if (newItems.length > 0) {
          await supabaseStorageService.importData(newItems);
          await fetchData(false);
        }
        
        toast({
          title: 'Import Berhasil',
          description: `${newItems.length} data baru ditambahkan`,
        });
      } else if (config.type === 'jsonbin' && config.jsonbin) {
        const existingIds = new Set(data.map(item => item.id));
        const newItems = importedData.filter(item => !existingIds.has(item.id));
        const updatedData = [...data, ...newItems];
        
        await jsonbinService.updateData(config.jsonbin.binId, config.jsonbin.apiKey, updatedData);
        setData(updatedData);
        syncToRoblox(updatedData);
        
        toast({
          title: 'Import Berhasil',
          description: `${newItems.length} data baru ditambahkan`,
        });
      }

      setStatus(prev => ({ ...prev, lastSynced: new Date(), isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal import data';
      setStatus(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({ variant: 'destructive', title: 'Gagal import', description: errorMessage });
      throw error;
    }
  }, [config, data, fetchData, toast, syncToRoblox]);

  // Test connection
  const testConnection = useCallback(async (binId: string, apiKey: string) => {
    return await jsonbinService.testConnection(binId, apiKey);
  }, []);

  // Test Supabase connection
  const testSupabaseConnection = useCallback(async () => {
    return await supabaseStorageService.testConnection();
  }, []);

  // Setup realtime subscription for Supabase
  useEffect(() => {
    if (config?.type !== 'supabase' || !status.isConnected) return;

    const channel = supabase
      .channel('semboyan-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'semboyan' },
        () => {
          // Refetch data on any change
          fetchData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config?.type, status.isConnected, fetchData]);

  // Setup auto-refresh for JSONBin
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Only use interval for JSONBin (Supabase uses realtime)
    if (config?.type === 'jsonbin' && status.isConnected) {
      const interval = (config.autoRefreshInterval || DEFAULT_REFRESH_INTERVAL) * 1000;
      intervalRef.current = setInterval(() => {
        fetchData(false);
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config, status.isConnected, fetchData]);

  // Initial fetch when config is set
  useEffect(() => {
    if (config) {
      fetchData(true);
    }
  }, [config?.type, config?.jsonbin?.binId, config?.jsonbin?.apiKey]);

  return {
    config,
    data,
    status,
    saveConfig,
    clearConfig,
    fetchData,
    addSemboyan,
    editSemboyan,
    deleteSemboyan,
    importData,
    testConnection,
    testSupabaseConnection,
    isConfigured: !!config,
    robloxSyncConfig,
    saveRobloxSyncConfig,
    syncToRoblox,
  };
}
