import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { BrowseFilters } from '@/components/projects/BrowseFilters';
import { useProjects, useProjectRatings } from '@/hooks/useProjects';
import { ContentType, CONTENT_TYPE_LABELS } from '@/types/database';
import { Helmet } from 'react-helmet-async';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL params into filter state
  const filters = useMemo(() => ({
    type: searchParams.get('type') as ContentType | null,
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    price: searchParams.get('price') || 'all',
    date: searchParams.get('date') || 'all',
    rating: searchParams.get('rating') || 'all',
    minecraftVersions: searchParams.get('mc')?.split(',').filter(Boolean) || [],
  }), [searchParams]);

  // Local search state for input
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Sync local search with URL
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const { data: allProjects = [], isLoading } = useProjects({ 
    type: filters.type || undefined, 
    search: filters.search || undefined,
    limit: 200,
  });

  // Apply client-side filters
  const filteredProjects = useMemo(() => {
    let projects = [...allProjects];

    // Price filter
    if (filters.price !== 'all') {
      projects = projects.filter(p => {
        if (filters.price === 'free') return p.price_type === 'free';
        if (filters.price === 'paid') return p.price_type === 'paid';
        if (filters.price === 'leak') return p.price_type === 'leak';
        return true;
      });
    }

    // Date filter
    if (filters.date !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (filters.date === 'day') cutoff.setDate(now.getDate() - 1);
      else if (filters.date === 'week') cutoff.setDate(now.getDate() - 7);
      else if (filters.date === 'month') cutoff.setMonth(now.getMonth() - 1);
      else if (filters.date === 'year') cutoff.setFullYear(now.getFullYear() - 1);
      
      projects = projects.filter(p => new Date(p.created_at) >= cutoff);
    }

    // Minecraft versions filter
    if (filters.minecraftVersions.length > 0) {
      projects = projects.filter(p => 
        p.minecraft_versions?.some(v => filters.minecraftVersions.includes(v))
      );
    }

    return projects;
  }, [allProjects, filters.price, filters.date, filters.minecraftVersions]);

  // Get project IDs for rating fetch
  const projectIds = filteredProjects.map(p => p.id);
  const { data: ratings = {} } = useProjectRatings(projectIds);

  // Apply rating filter and sort
  const sortedProjects = useMemo(() => {
    let projects = [...filteredProjects];

    // Rating filter
    if (filters.rating !== 'all') {
      const minRating = parseInt(filters.rating);
      projects = projects.filter(p => (ratings[p.id] || 0) >= minRating);
    }

    // Sort
    switch (filters.sort) {
      case 'popular':
        projects.sort((a, b) => (b.downloads_count + b.views_count) - (a.downloads_count + a.views_count));
        break;
      case 'downloads':
        projects.sort((a, b) => b.downloads_count - a.downloads_count);
        break;
      case 'rating':
        projects.sort((a, b) => (ratings[b.id] || 0) - (ratings[a.id] || 0));
        break;
      case 'newest':
      default:
        projects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return projects;
  }, [filteredProjects, filters.sort, filters.rating, ratings]);

  // Update URL when filters change
  const handleFiltersChange = (newFilters: typeof filters) => {
    const params = new URLSearchParams();
    
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
    if (newFilters.price !== 'all') params.set('price', newFilters.price);
    if (newFilters.date !== 'all') params.set('date', newFilters.date);
    if (newFilters.rating !== 'all') params.set('rating', newFilters.rating);
    if (newFilters.minecraftVersions.length > 0) {
      params.set('mc', newFilters.minecraftVersions.join(','));
    }

    setSearchParams(params);
    
    // Save to localStorage
    localStorage.setItem('browse-filters', JSON.stringify(newFilters));
  };

  const handleSearch = (query: string) => {
    handleFiltersChange({ ...filters, search: query });
  };

  const handleClear = () => {
    setSearchParams({});
    setLocalSearch('');
    localStorage.removeItem('browse-filters');
  };

  // Restore filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('browse-filters');
    if (savedFilters && !searchParams.toString()) {
      try {
        const parsed = JSON.parse(savedFilters);
        handleFiltersChange(parsed);
      } catch {
        // Ignore parse errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Helmet>
        <title>
          {filters.type ? CONTENT_TYPE_LABELS[filters.type] : 'Каталог'} | NeuroLeak
        </title>
        <meta 
          name="description" 
          content={`Скачать ${filters.type ? CONTENT_TYPE_LABELS[filters.type].toLowerCase() : 'сборки, плагины, моды, карты и ресурспаки'} для Minecraft бесплатно.`}
        />
      </Helmet>

      <Layout>
        <div className="container py-4 sm:py-6 md:py-8 px-3 sm:px-4">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
              {filters.type ? CONTENT_TYPE_LABELS[filters.type] : 'Каталог'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Найдите лучший контент для Minecraft
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <BrowseFilters
              filters={{ ...filters, search: localSearch }}
              onFiltersChange={(f) => {
                setLocalSearch(f.search);
                handleFiltersChange(f);
              }}
              onSearch={handleSearch}
              onClear={handleClear}
            />
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-4">
            Найдено: {sortedProjects.length} {sortedProjects.length === 1 ? 'проект' : 'проектов'}
          </p>

          {/* Grid */}
          <ProjectGrid 
            projects={sortedProjects} 
            loading={isLoading}
            ratings={ratings}
          />
        </div>
      </Layout>
    </>
  );
}
