import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Upload, 
  User, 
  LogOut, 
  Menu,
  X,
  Blocks,
  Puzzle,
  Map,
  Palette,
  Package,
  Settings,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const categories = [
  { name: 'Плагины', href: '/browse?type=plugin', icon: Puzzle },
  { name: 'Моды', href: '/browse?type=mod', icon: Blocks },
  { name: 'Карты', href: '/browse?type=map', icon: Map },
  { name: 'Ресурспаки', href: '/browse?type=resourcepack', icon: Palette },
  { name: 'Сборки', href: '/browse?type=build', icon: Package },
  { name: 'Конфиги', href: '/browse?type=config', icon: Settings },
];

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user is moderator or admin
  const { data: userRoles } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator', 'curator']);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasModeratorAccess = userRoles && userRoles.length > 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Blocks className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xs md:text-sm text-primary">
            MCLeak
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={category.href}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск плагинов, модов, карт..."
              className="pl-10 bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/upload')}
                className="hidden sm:flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden md:inline">Загрузить</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Профиль
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-projects')}>
                    <Blocks className="w-4 h-4 mr-2" />
                    Мои проекты
                  </DropdownMenuItem>
                  {hasModeratorAccess && (
                    <DropdownMenuItem onClick={() => navigate('/moderation')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Модерация
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex"
              >
                Войти
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/auth?mode=signup')}
                className="bg-primary hover:bg-primary/90"
              >
                Регистрация
              </Button>
            </>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'md:hidden border-t border-border overflow-hidden transition-all duration-300',
          mobileMenuOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="container py-4 space-y-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск..."
                className="pl-10 bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          
          <nav className="flex flex-col gap-2">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.href}
                className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
