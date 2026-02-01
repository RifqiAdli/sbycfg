import { useState, useEffect } from 'react';
import { X, Save, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Semboyan, SemboyanFormData, SIFAT_OPTIONS, STATUS_OPTIONS, SifatType, StatusType } from '@/types/semboyan';

interface SemboyanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SemboyanFormData) => Promise<void>;
  editingItem: Semboyan | null;
}

const initialFormData: SemboyanFormData = {
  Nama: '',
  Gambar: '',
  Sifat: 'Sementara',
  Status: 'Aktif',
  Penjelasan: '',
};

export function SemboyanForm({ isOpen, onClose, onSubmit, editingItem }: SemboyanFormProps) {
  const [formData, setFormData] = useState<SemboyanFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof SemboyanFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        Nama: editingItem.Nama,
        Gambar: editingItem.Gambar || '',
        Sifat: editingItem.Sifat,
        Status: editingItem.Status,
        Penjelasan: editingItem.Penjelasan,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [editingItem, isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SemboyanFormData, string>> = {};

    if (!formData.Nama.trim()) {
      newErrors.Nama = 'Nama wajib diisi';
    } else if (formData.Nama.length > 100) {
      newErrors.Nama = 'Nama maksimal 100 karakter';
    }

    if (!formData.Penjelasan.trim()) {
      newErrors.Penjelasan = 'Penjelasan wajib diisi';
    } else if (formData.Penjelasan.length > 1000) {
      newErrors.Penjelasan = 'Penjelasan maksimal 1000 karakter';
    }

    if (formData.Gambar && formData.Gambar.length > 500) {
      newErrors.Gambar = 'URL gambar maksimal 500 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error is handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof SemboyanFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isRobloxAsset = formData.Gambar?.startsWith('rbxassetid://');
  const showImagePreview = formData.Gambar && !isRobloxAsset;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Semboyan' : 'Tambah Semboyan Baru'}
          </DialogTitle>
          <DialogDescription>
            {editingItem 
              ? 'Ubah informasi semboyan yang sudah ada' 
              : 'Isi form berikut untuk menambahkan semboyan baru'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama */}
          <div className="space-y-2">
            <Label htmlFor="nama">
              Nama <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nama"
              value={formData.Nama}
              onChange={(e) => handleChange('Nama', e.target.value)}
              placeholder="Contoh: Semboyan 1"
              className={errors.Nama ? 'border-destructive' : ''}
            />
            {errors.Nama && (
              <p className="text-xs text-destructive">{errors.Nama}</p>
            )}
          </div>

          {/* Gambar */}
          <div className="space-y-2">
            <Label htmlFor="gambar">
              Gambar (URL/Roblox Asset ID)
              <span className="text-muted-foreground ml-1 font-normal">- Opsional</span>
            </Label>
            <Input
              id="gambar"
              value={formData.Gambar}
              onChange={(e) => handleChange('Gambar', e.target.value)}
              placeholder="rbxassetid://12345678 atau https://..."
              className={errors.Gambar ? 'border-destructive' : ''}
            />
            {errors.Gambar && (
              <p className="text-xs text-destructive">{errors.Gambar}</p>
            )}
            {formData.Gambar && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                {showImagePreview ? (
                  <div className="relative">
                    <img 
                      src={formData.Gambar} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : isRobloxAsset ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Image className="w-4 h-4" />
                    <span className="font-mono">{formData.Gambar}</span>
                    <span className="text-xs">(Preview tidak tersedia untuk Roblox asset)</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Sifat & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sifat">Sifat</Label>
              <Select
                value={formData.Sifat}
                onValueChange={(v) => handleChange('Sifat', v as SifatType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIFAT_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.Status}
                onValueChange={(v) => handleChange('Status', v as StatusType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Penjelasan */}
          <div className="space-y-2">
            <Label htmlFor="penjelasan">
              Penjelasan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="penjelasan"
              value={formData.Penjelasan}
              onChange={(e) => handleChange('Penjelasan', e.target.value)}
              placeholder="Jelaskan fungsi dan penggunaan semboyan ini..."
              rows={4}
              className={errors.Penjelasan ? 'border-destructive' : ''}
            />
            {errors.Penjelasan && (
              <p className="text-xs text-destructive">{errors.Penjelasan}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {formData.Penjelasan.length}/1000
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Semboyan'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
