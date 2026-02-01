import { Pencil, Trash2, Image, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Semboyan } from '@/types/semboyan';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface SemboyanCardProps {
  item: Semboyan;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onDelete: () => void;
}

export function SemboyanCard({ item, viewMode, onEdit, onDelete }: SemboyanCardProps) {
  const isRobloxAsset = item.Gambar?.startsWith('rbxassetid://');
  const hasImage = item.Gambar && item.Gambar.trim() !== '';

  // For Roblox assets, we can't display them directly
  const imagePreviewUrl = hasImage && !isRobloxAsset ? item.Gambar : null;

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Image Thumbnail */}
            <div className="shrink-0 w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {imagePreviewUrl ? (
                <img 
                  src={imagePreviewUrl} 
                  alt={item.Nama}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <Image className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground truncate">{item.Nama}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{item.Penjelasan}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={item.Status === 'Aktif' ? 'default' : 'secondary'}>
                    {item.Status}
                  </Badge>
                  <Badge variant="outline">{item.Sifat}</Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-0.5 group">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Area */}
        <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-xl flex items-center justify-center overflow-hidden">
          {imagePreviewUrl ? (
            <>
              <img 
                src={imagePreviewUrl} 
                alt={item.Nama}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 hidden items-center justify-center bg-muted">
                <Image className="w-8 h-8 text-muted-foreground" />
              </div>
            </>
          ) : isRobloxAsset ? (
            <div className="text-center p-4">
              <Image className="w-8 h-8 text-primary/50 mx-auto mb-2" />
              <span className="text-xs text-muted-foreground font-mono">
                {item.Gambar}
              </span>
            </div>
          ) : (
            <Image className="w-12 h-12 text-muted-foreground/30" />
          )}
          
          {/* Status Badge Overlay */}
          <div className="absolute top-3 right-3">
            <Badge 
              className={`${
                item.Status === 'Aktif' 
                  ? 'bg-success/90 hover:bg-success text-success-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {item.Status}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground leading-tight">{item.Nama}</h3>
            <Badge variant="outline" className="shrink-0 text-xs">
              {item.Sifat}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {item.Penjelasan}
          </p>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            {item.updatedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(item.updatedAt), { locale: id, addSuffix: true })}
              </span>
            )}
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-2">
                <Pencil className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDelete} 
                className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
