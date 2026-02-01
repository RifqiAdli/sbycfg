import { Moon, Sun, Settings, Train, RefreshCw, Link2, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { ConnectionStatus, RobloxSyncConfig } from '@/types/semboyan';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface NavbarProps {
  status: ConnectionStatus;
  robloxSync?: RobloxSyncConfig | null;
  onSettingsClick: () => void;
  onRobloxSyncClick: () => void;
  onImportExportClick: () => void;
  onRefresh: () => void;
}

export function Navbar({ status, robloxSync, onSettingsClick, onRobloxSyncClick, onImportExportClick, onRefresh }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Train className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Semboyan KA</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Manajemen Data Semboyan Kereta Api
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Connection Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full">
            <div 
              className={`w-2 h-2 rounded-full ${
                status.isConnected ? 'bg-success' : 'bg-destructive'
              } ${status.isLoading ? 'animate-pulse' : ''}`}
            />
            <span className="text-xs text-secondary-foreground">
              {status.isLoading 
                ? 'Sinkronisasi...' 
                : status.isConnected 
                  ? status.lastSynced 
                    ? `Sync ${formatDistanceToNow(status.lastSynced, { locale: id, addSuffix: true })}`
                    : 'Terhubung'
                  : 'Tidak terhubung'}
            </span>
          </div>

          {/* Mobile Status Indicator */}
          <div className="sm:hidden">
            <div 
              className={`w-3 h-3 rounded-full ${
                status.isConnected ? 'bg-success' : 'bg-destructive'
              } ${status.isLoading ? 'animate-pulse' : ''}`}
            />
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={status.isLoading}
            className="hover:bg-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${status.isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-secondary"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {/* Import/Export Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onImportExportClick}
            className="hover:bg-secondary"
            title="Import/Export Data"
          >
            <FileJson className="w-4 h-4" />
          </Button>

          {/* Roblox Sync Button */}
          <Button
            variant={robloxSync?.enabled ? "default" : "outline"}
            size="sm"
            onClick={onRobloxSyncClick}
            className="gap-2"
          >
            <Link2 className={`w-4 h-4 ${robloxSync?.enabled ? 'text-primary-foreground' : ''}`} />
            <span className="hidden sm:inline">Roblox</span>
          </Button>

          {/* Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSettingsClick}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Pengaturan</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
