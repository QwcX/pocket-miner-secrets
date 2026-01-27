import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, Filter, X, Star, Calendar, Download, TrendingUp,
  Puzzle, Blocks, Map, Palette, Package, Settings 
} from 'lucide-react';
import { ContentType, CONTENT_TYPE_LABELS } from '@/types/database';
import { cn } from '@/lib/utils';

const contentTypes: { value: ContentType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'build', label: 'Сборки', icon: Package },
  { value: 'plugin', label: 'Плагины', icon: Puzzle },
  { value: 'mod', label: 'Моды', icon: Blocks },
  { value: 'map', label: 'Карты', icon: Map },
  { value: 'resourcepack', label: 'Ресурспаки', icon: Palette },
  { value: 'config', label: 'Конфиги', icon: Settings },
];

const minecraftVersions = [
  '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
  '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.20',
  '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
  '1.18.2', '1.18.1', '1.18',
  '1.17.1', '1.17',
  '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
  '1.12.2', '1.12.1', '1.12',
  '1.8.9', '1.8.8', '1.8',
  '1.7.10',
];

const sortOptions = [
  { value: 'newest', label: 'Сначала новые', icon: Calendar },
  { value: 'popular', label: 'По популярности', icon: TrendingUp },
  { value: 'downloads', label: 'По скачиваниям', icon: Download },
  { value: 'rating', label: 'По рейтингу', icon: Star },
];

const priceOptions = [
  { value: 'all', label: 'Все' },
  { value: 'free', label: 'Бесплатные' },
  { value: 'paid', label: 'Платные' },
  { value: 'leak', label: 'Сливы' },
];

const dateOptions = [
  { value: 'all', label: 'За все время' },
  { value: 'day', label: 'За день' },
  { value: 'week', label: 'За неделю' },
  { value: 'month', label: 'За месяц' },
  { value: 'year', label: 'За год' },
];

const ratingOptions = [
  { value: 'all', label: 'Любой' },
  { value: '5', label: '⭐ 5' },
  { value: '4', label: '⭐ 4+' },
  { value: '3', label: '⭐ 3+' },
];

interface BrowseFiltersProps {
  filters: {
    type: ContentType | null;
    search: string;
    sort: string;
    price: string;
    date: string;
    rating: string;
    minecraftVersions: string[];
  };
  onFiltersChange: (filters: BrowseFiltersProps['filters']) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
}

export function BrowseFilters({ filters, onFiltersChange, onSearch, onClear }: BrowseFiltersProps) {
  const hasFilters = filters.type || filters.search || filters.sort !== 'newest' || 
    filters.price !== 'all' || filters.date !== 'all' || filters.rating !== 'all' ||
    filters.minecraftVersions.length > 0;

  const handleTypeChange = (type: ContentType | 'all') => {
    onFiltersChange({ ...filters, type: type === 'all' ? null : type });
  };

  const handleMCVersionToggle = (version: string) => {
    const current = filters.minecraftVersions;
    const updated = current.includes(version)
      ? current.filter(v => v !== version)
      : [...current, version];
    onFiltersChange({ ...filters, minecraftVersions: updated });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск по названию..."
          className="pl-10 bg-card border-border"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onSearch(filters.search)}
        />
      </div>

      {/* Type filter - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={!filters.type ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('all')}
          className="shrink-0"
        >
          Все
        </Button>
        {contentTypes.map((ct) => (
          <Button
            key={ct.value}
            variant={filters.type === ct.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange(ct.value)}
            className="shrink-0"
          >
            <ct.icon className="w-4 h-4 mr-1" />
            {ct.label}
          </Button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Sort */}
        <Select value={filters.sort} onValueChange={(v) => onFiltersChange({ ...filters, sort: v })}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price */}
        <Select value={filters.price} onValueChange={(v) => onFiltersChange({ ...filters, price: v })}>
          <SelectTrigger className="w-[140px] bg-card">
            <SelectValue placeholder="Цена" />
          </SelectTrigger>
          <SelectContent>
            {priceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date */}
        <Select value={filters.date} onValueChange={(v) => onFiltersChange({ ...filters, date: v })}>
          <SelectTrigger className="w-[140px] bg-card">
            <SelectValue placeholder="Период" />
          </SelectTrigger>
          <SelectContent>
            {dateOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Rating */}
        <Select value={filters.rating} onValueChange={(v) => onFiltersChange({ ...filters, rating: v })}>
          <SelectTrigger className="w-[120px] bg-card">
            <SelectValue placeholder="Рейтинг" />
          </SelectTrigger>
          <SelectContent>
            {ratingOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="w-4 h-4 mr-1" />
            Сбросить
          </Button>
        )}
      </div>

      {/* Minecraft versions accordion */}
      <Accordion type="single" collapsible className="bg-card rounded-lg border border-border">
        <AccordionItem value="mc-versions" className="border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Версии Minecraft
              {filters.minecraftVersions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.minecraftVersions.length}
                </Badge>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {minecraftVersions.map((version) => (
                <label
                  key={version}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors",
                    filters.minecraftVersions.includes(version)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={filters.minecraftVersions.includes(version)}
                    onCheckedChange={() => handleMCVersionToggle(version)}
                    className="sr-only"
                  />
                  <span className="text-sm">{version}</span>
                </label>
              ))}
            </div>
            {filters.minecraftVersions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => onFiltersChange({ ...filters, minecraftVersions: [] })}
              >
                Очистить выбор
              </Button>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Active filters badges */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Активные фильтры:</span>
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              {CONTENT_TYPE_LABELS[filters.type]}
              <button onClick={() => handleTypeChange('all')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Поиск: {filters.search}
              <button onClick={() => onFiltersChange({ ...filters, search: '' })}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.price !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {priceOptions.find(o => o.value === filters.price)?.label}
              <button onClick={() => onFiltersChange({ ...filters, price: 'all' })}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.minecraftVersions.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1">
              MC {v}
              <button onClick={() => handleMCVersionToggle(v)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
