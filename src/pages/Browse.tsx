import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { useProjects, useProjectRatings } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter,
  SortAsc,
  Puzzle,
  Blocks,
  Map,
  Palette,
  Package,
  Settings,
  X,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContentType, CONTENT_TYPE_LABELS } from '@/types/database';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

const contentTypes: { value: ContentType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'build', label: 'Сборки', icon: Package },
  { value: 'plugin', label: 'Плагины', icon: Puzzle },
  { value: 'mod', label: 'Моды', icon: Blocks },
  { value: 'map', label: 'Карты', icon: Map },
  { value: 'resourcepack', label: 'Ресурспаки', icon: Palette },
  { value: 'config', label: 'Конфиги', icon: Settings },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const type = searchParams.get('type') as ContentType | null;
  const search = searchParams.get('search') || undefined;

  const { data: projects = [], isLoading } = useProjects({ 
    type: type || undefined, 
    search,
    limit: 100,
  });

  const projectIds = projects.map(p => p.id);
  const { data: ratings = {} } = useProjectRatings(projectIds);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchParams.set('search', searchQuery.trim());
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const handleTypeFilter = (value: ContentType | 'all') => {
    if (value === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', value);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  const hasFilters = type || search;

  return (
    <>
      <Helmet>
        <title>
          {type ? CONTENT_TYPE_LABELS[type] : 'Каталог'} | TestLeak
        </title>
        <meta 
          name="description" 
          content={`Скачать ${type ? CONTENT_TYPE_LABELS[type].toLowerCase() : 'сборки, плагины, моды, карты и ресурспаки'} для Minecraft бесплатно.`}
        />
      </Helmet>

      <Layout>
        <div className="container py-4 sm:py-6 md:py-8 px-3 sm:px-4">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1 sm:mb-2">
              {type ? CONTENT_TYPE_LABELS[type] : 'Каталог'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Найдите лучший контент для Minecraft
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
            {/* Search */}
            <form onSubmit={handleSearch} className="w-full lg:max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Поиск по названию или описанию..."
                  className="pl-10 bg-card border-border h-9 sm:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Type filter - horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
              <Button
                variant={!type ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeFilter('all')}
                className={cn('shrink-0 text-xs sm:text-sm', !type && 'bg-primary')}
              >
                Все
              </Button>
              {contentTypes.map((ct) => (
                <Button
                  key={ct.value}
                  variant={type === ct.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeFilter(ct.value)}
                  className={cn('shrink-0 text-xs sm:text-sm', type === ct.value && 'bg-primary')}
                >
                  <ct.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden xs:inline">{ct.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Active filters */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
              <span className="text-xs sm:text-sm text-muted-foreground">Фильтры:</span>
              {search && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Поиск: {search}
                  <button onClick={() => {
                    searchParams.delete('search');
                    setSearchParams(searchParams);
                    setSearchQuery('');
                  }}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs sm:text-sm h-7 sm:h-8">
                Сбросить
              </Button>
            </div>
          )}

          {/* Results count */}
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            Найдено: {projects.length} {projects.length === 1 ? 'проект' : 'проектов'}
          </p>

          {/* Grid */}
          <ProjectGrid 
            projects={projects} 
            loading={isLoading}
            ratings={ratings}
          />
        </div>
      </Layout>
    </>
  );
}
