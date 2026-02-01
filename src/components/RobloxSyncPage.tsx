import { useState } from 'react';
import { Github, FileText, Copy, Check, TestTube, ExternalLink, Link2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { RobloxSyncConfig, RobloxSyncType } from '@/types/semboyan';
import { githubService } from '@/services/github';
import { pastebinService } from '@/services/pastebin';
import { useToast } from '@/hooks/use-toast';

interface RobloxSyncPageProps {
  config: RobloxSyncConfig | null;
  onSave: (config: RobloxSyncConfig) => void;
  onClose: () => void;
}

export function RobloxSyncPage({ config, onSave, onClose }: RobloxSyncPageProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<RobloxSyncType>(config?.type || 'github');
  const [enabled, setEnabled] = useState(config?.enabled || false);
  
  // GitHub state
  const [ghUsername, setGhUsername] = useState(config?.github?.username || '');
  const [ghRepo, setGhRepo] = useState(config?.github?.repository || '');
  const [ghFilePath, setGhFilePath] = useState(config?.github?.filePath || 'semboyan.json');
  const [ghToken, setGhToken] = useState(config?.github?.token || '');
  const [ghTesting, setGhTesting] = useState(false);
  const [ghTestResult, setGhTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  
  // Pastebin state
  const [pbApiKey, setPbApiKey] = useState(config?.pastebin?.apiKey || '');
  const [pbUserKey, setPbUserKey] = useState(config?.pastebin?.userKey || '');
  const [pbPasteId, setPbPasteId] = useState(config?.pastebin?.currentPasteId || '');
  const [pbTesting, setPbTesting] = useState(false);
  const [pbTestResult, setPbTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  
  const [copied, setCopied] = useState(false);

  const getPublicUrl = (): string => {
    if (activeTab === 'github' && ghUsername && ghRepo && ghFilePath) {
      return githubService.getPublicUrl({ username: ghUsername, repository: ghRepo, filePath: ghFilePath, token: '' });
    }
    if (activeTab === 'pastebin' && pbPasteId) {
      return pastebinService.getPublicUrl(pbPasteId);
    }
    return '';
  };

  const handleTestGitHub = async () => {
    if (!ghUsername || !ghRepo || !ghToken) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Semua field GitHub harus diisi',
      });
      return;
    }

    setGhTesting(true);
    setGhTestResult(null);

    const result = await githubService.testConnection({
      username: ghUsername,
      repository: ghRepo,
      filePath: ghFilePath,
      token: ghToken,
    });

    setGhTestResult(result);
    setGhTesting(false);

    toast({
      variant: result.success ? 'default' : 'destructive',
      title: result.success ? 'Koneksi GitHub berhasil!' : 'Koneksi gagal',
      description: result.success ? 'Repository terhubung dengan baik' : result.error,
    });
  };

  const handleTestPastebin = async () => {
    if (!pbApiKey) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'API Key Pastebin harus diisi',
      });
      return;
    }

    setPbTesting(true);
    setPbTestResult(null);

    const result = await pastebinService.testConnection(pbApiKey);

    setPbTestResult({ success: result.success, error: result.error });
    setPbTesting(false);

    toast({
      variant: result.success ? 'default' : 'destructive',
      title: result.success ? 'Koneksi Pastebin berhasil!' : 'Koneksi gagal',
      description: result.success ? 'API Key valid' : result.error,
    });
  };

  const handleCopyUrl = () => {
    const url = getPublicUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'URL disalin!',
        description: 'Gunakan URL ini di Roblox script',
      });
    }
  };

  const handleSave = () => {
    const newConfig: RobloxSyncConfig = {
      enabled,
      type: activeTab,
      github: activeTab === 'github' ? {
        username: ghUsername,
        repository: ghRepo,
        filePath: ghFilePath,
        token: ghToken,
      } : config?.github,
      pastebin: activeTab === 'pastebin' ? {
        apiKey: pbApiKey,
        userKey: pbUserKey || undefined,
        currentPasteId: pbPasteId || undefined,
      } : config?.pastebin,
      publicUrl: getPublicUrl(),
    };

    onSave(newConfig);
    toast({
      title: 'Konfigurasi Roblox Sync tersimpan',
      description: `Sinkronisasi ${enabled ? 'aktif' : 'tidak aktif'} via ${activeTab === 'github' ? 'GitHub Pages' : 'Pastebin'}`,
    });
    onClose();
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Roblox Sync</h1>
          <p className="text-muted-foreground mt-2">
            Sinkronisasi data ke URL publik untuk diakses dari Roblox
          </p>
        </div>

        {/* Enable Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Aktifkan Roblox Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Data akan otomatis di-push ke storage publik setiap ada perubahan
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* Storage Provider Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RobloxSyncType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub Pages
            </TabsTrigger>
            <TabsTrigger value="pastebin" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pastebin
            </TabsTrigger>
          </TabsList>

          {/* GitHub Tab */}
          <TabsContent value="github" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Github className="w-5 h-5" />
                  GitHub Pages Setup
                </CardTitle>
                <CardDescription>
                  Data akan di-push ke repository GitHub dan tersedia via GitHub Pages URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Info Box */}
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                  <p className="font-medium text-primary mb-2">📋 Cara Setup:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Buat repository baru di GitHub (public)</li>
                    <li>Enable GitHub Pages di Settings → Pages</li>
                    <li>Generate Personal Access Token dengan scope <code className="bg-muted px-1 rounded">repo</code></li>
                    <li>Isi credentials di bawah</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label>GitHub Username</Label>
                  <Input
                    value={ghUsername}
                    onChange={(e) => setGhUsername(e.target.value)}
                    placeholder="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Repository Name</Label>
                  <Input
                    value={ghRepo}
                    onChange={(e) => setGhRepo(e.target.value)}
                    placeholder="roblox-semboyan-data"
                  />
                </div>

                <div className="space-y-2">
                  <Label>File Path</Label>
                  <Input
                    value={ghFilePath}
                    onChange={(e) => setGhFilePath(e.target.value)}
                    placeholder="semboyan.json"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Personal Access Token</Label>
                  <Input
                    type="password"
                    value={ghToken}
                    onChange={(e) => setGhToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    <a 
                      href="https://github.com/settings/tokens?type=beta" 
                      target="_blank" 
                      rel="noopener"
                      className="text-primary hover:underline flex items-center gap-1 inline-flex"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Generate token di GitHub Settings
                    </a>
                  </p>
                </div>

                {/* Test Result */}
                {ghTestResult && (
                  <div className={`p-3 rounded-lg ${ghTestResult.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {ghTestResult.success ? (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" /> Repository terhubung!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {ghTestResult.error}
                      </span>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={handleTestGitHub}
                  disabled={ghTesting || !ghUsername || !ghRepo || !ghToken}
                  className="w-full"
                >
                  <TestTube className={`w-4 h-4 mr-2 ${ghTesting ? 'animate-spin' : ''}`} />
                  {ghTesting ? 'Menguji...' : 'Test Koneksi GitHub'}
                </Button>
              </CardContent>
            </Card>

            {/* GitHub Pages URL Preview */}
            {ghUsername && ghRepo && ghFilePath && (
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    🎮 URL untuk Roblox
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Gunakan URL ini di Roblox HttpService:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={getPublicUrl()}
                      className="font-mono text-xs bg-muted"
                    />
                    <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Update mungkin butuh 1-2 menit untuk reflect di GitHub Pages
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pastebin Tab */}
          <TabsContent value="pastebin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  Pastebin Setup
                </CardTitle>
                <CardDescription>
                  Data akan di-upload ke Pastebin sebagai paste unlisted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Warning */}
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm">
                  <p className="font-medium text-warning mb-1">⚠️ Limitasi Pastebin:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Setiap update membuat paste baru (URL berubah)</li>
                    <li>Free tier: 25 pastes/24 jam</li>
                    <li>Perlu update URL di Roblox script setelah edit</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label>API Developer Key</Label>
                  <Input
                    type="password"
                    value={pbApiKey}
                    onChange={(e) => setPbApiKey(e.target.value)}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    <a 
                      href="https://pastebin.com/doc_api" 
                      target="_blank" 
                      rel="noopener"
                      className="text-primary hover:underline flex items-center gap-1 inline-flex"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Dapatkan API key di Pastebin
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>User Key (Opsional)</Label>
                  <Input
                    type="password"
                    value={pbUserKey}
                    onChange={(e) => setPbUserKey(e.target.value)}
                    placeholder="Opsional - untuk user pastes"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Current Paste ID (Opsional)</Label>
                  <Input
                    value={pbPasteId}
                    onChange={(e) => setPbPasteId(e.target.value)}
                    placeholder="abc123XYZ"
                  />
                  <p className="text-xs text-muted-foreground">
                    ID paste saat ini (akan ter-update otomatis setelah sync)
                  </p>
                </div>

                {/* Test Result */}
                {pbTestResult && (
                  <div className={`p-3 rounded-lg ${pbTestResult.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {pbTestResult.success ? (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" /> API Key valid!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {pbTestResult.error}
                      </span>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={handleTestPastebin}
                  disabled={pbTesting || !pbApiKey}
                  className="w-full"
                >
                  <TestTube className={`w-4 h-4 mr-2 ${pbTesting ? 'animate-spin' : ''}`} />
                  {pbTesting ? 'Menguji...' : 'Test Koneksi Pastebin'}
                </Button>
              </CardContent>
            </Card>

            {/* Pastebin URL Preview */}
            {pbPasteId && (
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    🎮 URL untuk Roblox
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Gunakan URL ini di Roblox HttpService:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={pastebinService.getPublicUrl(pbPasteId)}
                      className="font-mono text-xs bg-muted"
                    />
                    <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Roblox Code Example */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              📜 Contoh Roblox Script
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`local HttpService = game:GetService("HttpService")
local DATA_URL = "${getPublicUrl() || 'https://your-url-here'}"

local function fetchSemboyanData()
    local success, response = pcall(function()
        return HttpService:GetAsync(DATA_URL)
    end)
    
    if success then
        local data = HttpService:JSONDecode(response)
        for _, semboyan in pairs(data) do
            print(semboyan.Nama, semboyan.Status)
        end
        return data
    else
        warn("Failed to fetch:", response)
        return nil
    end
end

-- Fetch data
local semboyanData = fetchSemboyanData()`}
            </pre>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={handleSave} className="w-full">
            Simpan Konfigurasi
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Kembali
          </Button>
        </div>
      </div>
    </div>
  );
}
