import { useState } from 'react';
import { Database, Key, Clock, Link2, TestTube, Save, Trash2, ExternalLink, Check, Copy, Cloud, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StorageConfig, StorageType } from '@/types/semboyan';
import { useToast } from '@/hooks/use-toast';
import { supabaseStorageService } from '@/services/supabaseStorage';

interface ConfigPageProps {
  config: StorageConfig | null;
  onSave: (config: StorageConfig) => void;
  onClear: () => void;
  onTestConnection: (binId: string, apiKey: string) => Promise<{ success: boolean; error?: string }>;
  onTestSupabaseConnection: () => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function ConfigPage({ config, onSave, onClear, onTestConnection, onTestSupabaseConnection, onClose }: ConfigPageProps) {
  const { toast } = useToast();
  const [storageType, setStorageType] = useState<StorageType>(config?.type || 'supabase');
  const [binId, setBinId] = useState(config?.jsonbin?.binId || '');
  const [apiKey, setApiKey] = useState(config?.jsonbin?.apiKey || '');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(config?.autoRefreshInterval || 10);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    let result: { success: boolean; error?: string };

    if (storageType === 'supabase') {
      result = await onTestSupabaseConnection();
    } else {
      if (!binId || !apiKey) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Bin ID dan API Key harus diisi',
        });
        setIsTesting(false);
        return;
      }
      result = await onTestConnection(binId, apiKey);
    }

    setTestResult(result);
    setIsTesting(false);

    toast({
      variant: result.success ? 'default' : 'destructive',
      title: result.success ? 'Koneksi berhasil!' : 'Koneksi gagal',
      description: result.success 
        ? `${storageType === 'supabase' ? 'Lovable Cloud' : 'JSONBin.io'} terhubung dengan baik` 
        : result.error,
    });
  };

  const handleSave = () => {
    if (storageType === 'jsonbin' && (!binId || !apiKey)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Bin ID dan API Key harus diisi',
      });
      return;
    }

    const newConfig: StorageConfig = {
      type: storageType,
      autoRefreshInterval,
      jsonbin: storageType === 'jsonbin' ? { binId, apiKey, autoRefreshInterval } : undefined,
    };

    onSave(newConfig);

    toast({
      title: 'Konfigurasi tersimpan',
      description: `Penyimpanan ${storageType === 'supabase' ? 'Lovable Cloud' : 'JSONBin.io'} berhasil dikonfigurasi`,
    });

    onClose();
  };

  const handleCopyUrl = () => {
    let url = '';
    if (storageType === 'supabase') {
      url = supabaseStorageService.getPublicUrl();
    } else if (binId) {
      url = `https://jsonbin.io/b/${binId}`;
    }
    
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Link disalin!',
        description: 'URL API telah disalin ke clipboard',
      });
    }
  };

  const handleClear = () => {
    if (confirm('Apakah Anda yakin ingin menghapus konfigurasi? Data lokal akan dihapus.')) {
      onClear();
      setBinId('');
      setApiKey('');
      setAutoRefreshInterval(10);
      setTestResult(null);
      toast({
        title: 'Konfigurasi dihapus',
        description: 'Semua pengaturan telah direset',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Konfigurasi Penyimpanan</h1>
          <p className="text-muted-foreground mt-2">
            Pilih tempat penyimpanan data semboyan
          </p>
        </div>

        {/* Storage Type Selection */}
        <Tabs value={storageType} onValueChange={(v) => { setStorageType(v as StorageType); setTestResult(null); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supabase" className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Lovable Cloud
            </TabsTrigger>
            <TabsTrigger value="jsonbin" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              JSONBin.io
            </TabsTrigger>
          </TabsList>

          {/* Supabase Tab */}
          <TabsContent value="supabase" className="space-y-4 mt-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Keuntungan Lovable Cloud
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Tanpa limit request</strong> - tidak ada batasan seperti JSONBin</li>
                  <li><strong>Realtime sync</strong> - data otomatis update tanpa polling</li>
                  <li><strong>Sudah terkonfigurasi</strong> - tidak perlu API key eksternal</li>
                  <li><strong>URL publik</strong> - bisa diakses dari Roblox</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  URL API untuk Roblox
                </CardTitle>
                <CardDescription>
                  Gunakan URL ini di script Roblox untuk fetch data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={supabaseStorageService.getPublicUrl()}
                    className="font-mono text-xs bg-muted"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  URL ini bisa diakses publik tanpa autentikasi
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* JSONBin Tab */}
          <TabsContent value="jsonbin" className="space-y-4 mt-4">
            <Card className="bg-muted border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Cara Mendapatkan Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Buka <a href="https://jsonbin.io" target="_blank" rel="noopener" className="text-primary hover:underline">jsonbin.io</a> dan buat akun gratis</li>
                  <li>Klik "Create Bin" dan paste data JSON awal</li>
                  <li>Copy <strong>Bin ID</strong> dari URL setelah bin dibuat</li>
                  <li>Ambil <strong>API Key</strong> dari Dashboard → API Keys</li>
                </ol>
                <p className="mt-2 text-destructive">
                  ⚠️ Free tier: 10,000 requests/bulan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Credentials JSONBin.io
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="binId" className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Bin ID
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="binId"
                      value={binId}
                      onChange={(e) => setBinId(e.target.value)}
                      placeholder="Contoh: 6123456789abcdef01234567"
                      className="font-mono text-sm"
                    />
                    {binId && (
                      <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Key (Master Key)
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="$2b$10$..."
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Auto-Refresh Interval (detik)
                  </Label>
                  <Input
                    id="interval"
                    type="number"
                    min={5}
                    max={60}
                    value={autoRefreshInterval}
                    onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded-lg ${testResult.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {testResult.success ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Koneksi berhasil!
              </span>
            ) : (
              <span>{testResult.error}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || (storageType === 'jsonbin' && (!binId || !apiKey))}
            className="flex-1"
          >
            <TestTube className={`w-4 h-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Menguji...' : 'Test Koneksi'}
          </Button>
          
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Simpan Konfigurasi
          </Button>
        </div>

        {config && (
          <Button
            variant="ghost"
            onClick={handleClear}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Konfigurasi
          </Button>
        )}

        {config && (
          <Button variant="link" onClick={onClose} className="w-full">
            Kembali ke Data
          </Button>
        )}
      </div>
    </div>
  );
}
