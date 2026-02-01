import { useState } from 'react';
import { useJsonBin } from '@/hooks/useJsonBin';
import { Navbar } from '@/components/Navbar';
import { ConfigPage } from '@/components/ConfigPage';
import { RobloxSyncPage } from '@/components/RobloxSyncPage';
import { DataList } from '@/components/DataList';
import { SemboyanForm } from '@/components/SemboyanForm';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { ImportExportDialog } from '@/components/ImportExportDialog';
import { Semboyan, SemboyanFormData } from '@/types/semboyan';
import { AlertCircle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const {
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
    isConfigured,
    robloxSyncConfig,
    saveRobloxSyncConfig,
  } = useJsonBin();

  const [showConfig, setShowConfig] = useState(false);
  const [showRobloxSync, setShowRobloxSync] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Semboyan | null>(null);
  const [deletingItem, setDeletingItem] = useState<Semboyan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Show config page if not configured
  if (!isConfigured || showConfig) {
    return (
      <ConfigPage
        config={config}
        onSave={saveConfig}
        onClear={clearConfig}
        onTestConnection={testConnection}
        onTestSupabaseConnection={testSupabaseConnection}
        onClose={() => setShowConfig(false)}
      />
    );
  }

  // Show Roblox sync page
  if (showRobloxSync) {
    return (
      <RobloxSyncPage
        config={robloxSyncConfig}
        onSave={saveRobloxSyncConfig}
        onClose={() => setShowRobloxSync(false)}
      />
    );
  }

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: Semboyan) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (item: Semboyan) => {
    setDeletingItem(item);
  };

  const handleFormSubmit = async (formData: SemboyanFormData) => {
    if (editingItem) {
      await editSemboyan(editingItem.id, formData);
    } else {
      await addSemboyan(formData);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await deleteSemboyan(deletingItem.id);
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        status={status}
        robloxSync={robloxSyncConfig}
        onSettingsClick={() => setShowConfig(true)}
        onRobloxSyncClick={() => setShowRobloxSync(true)}
        onImportExportClick={() => setShowImportExport(true)}
        onRefresh={() => fetchData(true)}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Error Banner */}
        {status.error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Terjadi Kesalahan</p>
              <p className="text-sm text-destructive/80">{status.error}</p>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setShowConfig(true)}
                className="px-0 text-destructive"
              >
                Periksa Pengaturan →
              </Button>
            </div>
          </div>
        )}

        {/* Welcome Banner for Empty State */}
        {data.length === 0 && !status.isLoading && !status.error && (
          <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Selamat Datang! 🚂
                </h2>
                <p className="text-muted-foreground mb-3">
                  Bin JSONBin.io Anda terhubung dan siap digunakan. Mulai dengan menambahkan data semboyan pertama.
                </p>
                <Button onClick={handleAdd} size="sm">
                  Tambah Semboyan Pertama
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Data List */}
        <DataList
          data={data}
          isLoading={status.isLoading && data.length === 0}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* Form Dialog */}
      <SemboyanForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        editingItem={editingItem}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        item={deletingItem}
        isDeleting={isDeleting}
      />

      {/* Import/Export Dialog */}
      <ImportExportDialog
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        data={data}
        onImport={importData}
      />
    </div>
  );
};

export default Index;
