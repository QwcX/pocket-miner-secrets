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
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {type ? CONTENT_TYPE_LABELS[type] : 'Каталог'}
            </h1>
            <p className="text-muted-foreground">
              Найдите лучший контент для Minecraft
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Поиск по названию или описанию..."
                  className="pl-10 bg-card border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Type filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!type ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeFilter('all')}
                className={cn(!type && 'bg-primary')}
              >
                Все
              </Button>
              {contentTypes.map((ct) => (
                <Button
                  key={ct.value}
                  variant={type === ct.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeFilter(ct.value)}
                  className={cn(type === ct.value && 'bg-primary')}
                >
                  <ct.icon className="w-4 h-4 mr-1" />
                  {ct.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Active filters */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground">Фильтры:</span>
              {search && (
                <Badge variant="secondary" className="gap-1">
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
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Сбросить все
              </Button>
            </div>
          )}

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
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
