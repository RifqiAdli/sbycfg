import { useState, useRef } from 'react';
import { Download, Upload, FileJson, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Semboyan } from '@/types/semboyan';
import { supabase } from '@/integrations/supabase/client';

interface ImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: Semboyan[];
  onImport: (data: Semboyan[]) => Promise<void>;
}

export function ImportExportDialog({ isOpen, onClose, data, onImport }: ImportExportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    data?: Semboyan[];
    message: string;
  } | null>(null);

  const handleExport = () => {
    try {
      // Clean data for export (remove internal fields)
      const exportData = data.map(({ id, createdAt, updatedAt, ...rest }) => rest);
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `semboyan-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Berhasil',
        description: `${exportData.length} data semboyan berhasil diekspor`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Gagal',
        description: 'Terjadi kesalahan saat mengekspor data',
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
      setValidationResult(null);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleValidateWithAI = async () => {
    if (!importText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Data Kosong',
        description: 'Masukkan data JSON terlebih dahulu',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Try to parse as JSON first
      let jsonData;
      try {
        jsonData = JSON.parse(importText);
      } catch {
        // If not valid JSON, send raw text for AI to process
        jsonData = importText;
      }

      const { data: result, error } = await supabase.functions.invoke('validate-json', {
        body: { jsonData },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (result.error) {
        setValidationResult({
          success: false,
          message: result.error,
        });
        return;
      }

      if (result.validatedData && result.validatedData.length > 0) {
        setValidationResult({
          success: true,
          data: result.validatedData,
          message: `AI berhasil memvalidasi ${result.validatedCount} dari ${result.originalCount} item`,
        });
      } else {
        setValidationResult({
          success: false,
          message: 'AI tidak dapat memproses data. Pastikan format JSON benar.',
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        success: false,
        message: error instanceof Error ? error.message : 'Gagal memvalidasi data',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validationResult?.success || !validationResult.data) {
      toast({
        variant: 'destructive',
        title: 'Validasi Diperlukan',
        description: 'Validasi data dengan AI terlebih dahulu',
      });
      return;
    }

    try {
      await onImport(validationResult.data);
      toast({
        title: 'Import Berhasil',
        description: `${validationResult.data.length} data semboyan berhasil diimpor`,
      });
      onClose();
      setImportText('');
      setValidationResult(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Import Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            Import / Export Data
          </DialogTitle>
          <DialogDescription>
            Backup atau restore data semboyan dalam format JSON
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <h4 className="font-medium mb-2">Data Saat Ini</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {data.length} semboyan tersedia untuk diekspor
              </p>
              
              <div className="bg-background rounded-md border p-3 max-h-48 overflow-auto">
                <pre className="text-xs">
                  {JSON.stringify(data.slice(0, 2).map(({ id, createdAt, updatedAt, ...rest }) => rest), null, 2)}
                  {data.length > 2 && '\n... dan ' + (data.length - 2) + ' item lainnya'}
                </pre>
              </div>
            </div>

            <Button onClick={handleExport} className="w-full" disabled={data.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Download JSON Backup
            </Button>
          </TabsContent>

          <TabsContent value="import" className="flex-1 overflow-hidden flex flex-col space-y-4 mt-4">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File JSON
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <label className="text-sm font-medium mb-2">
                Atau paste data JSON:
              </label>
              <Textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setValidationResult(null);
                }}
                placeholder='[{"Nama": "Semboyan 1", "Sifat": "Tetap", "Status": "Aktif", "Penjelasan": "..."}]'
                className="flex-1 min-h-[120px] font-mono text-xs resize-none"
              />
            </div>

            {validationResult && (
              <div className={`p-3 rounded-lg border flex items-start gap-2 ${
                validationResult.success 
                  ? 'bg-success/10 border-success/30' 
                  : 'bg-destructive/10 border-destructive/30'
              }`}>
                {validationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    validationResult.success ? 'text-success' : 'text-destructive'
                  }`}>
                    {validationResult.success ? 'Validasi Berhasil' : 'Validasi Gagal'}
                  </p>
                  <p className="text-xs text-muted-foreground">{validationResult.message}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleValidateWithAI} 
                variant="secondary"
                className="flex-1"
                disabled={!importText.trim() || isValidating}
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isValidating ? 'Memvalidasi...' : 'Validasi dengan AI'}
              </Button>
              
              <Button 
                onClick={handleImport}
                disabled={!validationResult?.success}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
