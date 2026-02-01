import { supabase } from '@/integrations/supabase/client';
import { Semboyan } from '@/types/semboyan';

export const supabaseStorageService = {
  // Fetch all semboyan data
  async fetchData(): Promise<Semboyan[]> {
    const { data, error } = await supabase
      .from('semboyan')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      throw new Error(`Gagal mengambil data: ${error.message}`);
    }

    // Map database columns to Semboyan type
    return (data || []).map(row => ({
      id: row.id,
      Nama: row.nama,
      Gambar: row.gambar || '',
      Sifat: row.sifat as Semboyan['Sifat'],
      Status: row.status as Semboyan['Status'],
      Penjelasan: row.penjelasan,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  // Add new semboyan
  async addItem(item: Omit<Semboyan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Semboyan> {
    const { data, error } = await supabase
      .from('semboyan')
      .insert({
        nama: item.Nama,
        gambar: item.Gambar || '',
        sifat: item.Sifat,
        status: item.Status,
        penjelasan: item.Penjelasan,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Gagal menambah data: ${error.message}`);
    }

    return {
      id: data.id,
      Nama: data.nama,
      Gambar: data.gambar || '',
      Sifat: data.sifat as Semboyan['Sifat'],
      Status: data.status as Semboyan['Status'],
      Penjelasan: data.penjelasan,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Update semboyan
  async updateItem(id: string, item: Omit<Semboyan, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const { error } = await supabase
      .from('semboyan')
      .update({
        nama: item.Nama,
        gambar: item.Gambar || '',
        sifat: item.Sifat,
        status: item.Status,
        penjelasan: item.Penjelasan,
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Gagal memperbarui data: ${error.message}`);
    }
  },

  // Delete semboyan
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('semboyan')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Gagal menghapus data: ${error.message}`);
    }
  },

  // Bulk import
  async importData(items: Omit<Semboyan, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const { error } = await supabase
      .from('semboyan')
      .insert(items.map(item => ({
        nama: item.Nama,
        gambar: item.Gambar || '',
        sifat: item.Sifat,
        status: item.Status,
        penjelasan: item.Penjelasan,
      })));

    if (error) {
      console.error('Supabase bulk insert error:', error);
      throw new Error(`Gagal import data: ${error.message}`);
    }
  },

  // Test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('semboyan')
        .select('id')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  // Get public URL for Roblox
  getPublicUrl(): string {
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    return `${projectUrl}/rest/v1/semboyan?select=nama,gambar,sifat,status,penjelasan&apikey=${anonKey}`;
  },
};
