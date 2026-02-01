import { useState, useMemo } from 'react';
import { Search, Plus, SlidersHorizontal, Grid3X3, List, Train } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Semboyan, SIFAT_OPTIONS, STATUS_OPTIONS, SifatType, StatusType } from '@/types/semboyan';
import { SemboyanCard } from './SemboyanCard';

interface DataListProps {
  data: Semboyan[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: Semboyan) => void;
  onDelete: (item: Semboyan) => void;
}

type SortOption = 'nama-asc' | 'nama-desc' | 'status' | 'sifat' | 'newest' | 'oldest';
type ViewMode = 'grid' | 'list';

export function DataList({ data, isLoading, onAdd, onEdit, onDelete }: DataListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSifat, setFilterSifat] = useState<SifatType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StatusType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('nama-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.Nama.toLowerCase().includes(query) ||
          item.Penjelasan.toLowerCase().includes(query)
      );
    }

    // Filter by sifat
    if (filterSifat !== 'all') {
      result = result.filter(item => item.Sifat === filterSifat);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(item => item.Status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'nama-asc':
          return a.Nama.localeCompare(b.Nama);
        case 'nama-desc':
          return b.Nama.localeCompare(a.Nama);
        case 'status':
          return a.Status.localeCompare(b.Status);
        case 'sifat':
          return a.Sifat.localeCompare(b.Sifat);
        case 'newest':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        case 'oldest':
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        default:
          return 0;
      }
    });

    return result;
  }, [data, searchQuery, filterSifat, filterStatus, sortBy]);

  const activeFiltersCount = [
    filterSifat !== 'all',
    filterStatus !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Data Semboyan</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedData.length} dari {data.length} semboyan
          </p>
        </div>
        <Button onClick={onAdd} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Tambah Semboyan
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau penjelasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterSifat} onValueChange={(v) => setFilterSifat(v as SifatType | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sifat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Sifat</SelectItem>
              {SIFAT_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StatusType | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nama-asc">Nama A-Z</SelectItem>
              <SelectItem value="nama-desc">Nama Z-A</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="sifat">Sifat</SelectItem>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="oldest">Terlama</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-input overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Badge */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {activeFiltersCount} filter aktif
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterSifat('all');
              setFilterStatus('all');
            }}
            className="h-auto py-1 px-2 text-xs"
          >
            Reset
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedData.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex p-4 bg-muted rounded-full mb-4">
            <Train className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {data.length === 0 ? 'Belum ada data' : 'Tidak ada hasil'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {data.length === 0
              ? 'Mulai dengan menambahkan semboyan pertama'
              : 'Coba ubah filter atau kata kunci pencarian'}
          </p>
          {data.length === 0 && (
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Semboyan
            </Button>
          )}
        </div>
      )}

      {/* Data Grid/List */}
      {!isLoading && filteredAndSortedData.length > 0 && (
        <div className={
          viewMode === 'grid'
            ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'flex flex-col gap-3'
        }>
          {filteredAndSortedData.map((item, index) => (
            <div
              key={item.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <SemboyanCard
                item={item}
                viewMode={viewMode}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
