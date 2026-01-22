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
  Crown,
  MessageSquare,
  HelpCircle,
  LifeBuoy,
  ChevronDown,
  Sparkles,
  FileText,
  Ticket,
  Wrench,
  TrendingUp,
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
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SnowflakeToggle } from '@/components/SnowflakeToggle';

// Navigation structure like reference image
const navItems = [
  {
    name: 'РЕСУРСЫ',
    icon: Package,
    children: [
      { name: 'Плагины', href: '/browse?type=plugin', icon: Puzzle },
      { name: 'Моды', href: '/browse?type=mod', icon: Blocks },
      { name: 'Карты', href: '/browse?type=map', icon: Map },
      { name: 'Ресурспаки', href: '/browse?type=resourcepack', icon: Palette },
      { name: 'Сборки', href: '/browse?type=build', icon: Package },
      { name: 'Конфиги', href: '/browse?type=config', icon: Settings },
    ],
  },
  {
    name: 'ФОРУМЫ',
    icon: HelpCircle,
    href: '/forum',
    highlight: true,
  },
  {
    name: 'ЧТО НОВОГО',
    icon: Sparkles,
    href: '/browse?sort=newest',
  },
  {
    name: 'ТОПЫ',
    icon: TrendingUp,
    href: '/leaderboards',
  },
  {
    name: 'ТИКЕТЫ',
    icon: Ticket,
    href: '/support',
  },
];

interface HeaderProps {
  snowflakesEnabled?: boolean;
  onToggleSnowflakes?: () => void;
}

export function Header({ snowflakesEnabled = true, onToggleSnowflakes }: HeaderProps) {
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

  const hasModeratorAccess = userRoles?.some(r => r.role === 'moderator' || r.role === 'curator');
  const isAdmin = userRoles?.some(r => r.role === 'admin');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass-card">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded flex items-center justify-center">
            <Blocks className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-[10px] sm:text-xs md:text-sm text-primary">
            TestLeak
          </span>
        </Link>

        {/* Desktop Navigation - like reference image */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            item.children ? (
              <DropdownMenu key={item.name}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-xs font-medium text-muted-foreground hover:text-foreground gap-1 px-3 h-8"
                  >
                    {item.name}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {item.children.map((child) => (
                    <DropdownMenuItem key={child.name} onClick={() => navigate(child.href)}>
                      <child.icon className="w-4 h-4 mr-2" />
                      {child.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.name}
                to={item.href!}
                className={cn(
                  "text-xs font-medium px-3 py-2 rounded transition-colors",
                  item.highlight 
                    ? "text-primary hover:text-primary/80" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.name}
              </Link>
            )
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden xl:flex items-center gap-2 flex-1 max-w-sm mx-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск..."
              className="pl-10 bg-secondary border-border h-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Buy Donate button - more visible */}
          <Button
            size="sm"
            onClick={() => navigate('/donate')}
            className="hidden md:inline-flex gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium h-8 px-3"
          >
            <Crown className="w-4 h-4" />
            <span className="hidden lg:inline">Купить донат</span>
            <span className="lg:hidden">Донат</span>
          </Button>
          
          <div className="hidden sm:flex items-center gap-1">
            {onToggleSnowflakes && (
              <SnowflakeToggle enabled={snowflakesEnabled} onToggle={onToggleSnowflakes} />
            )}
            <ThemeSwitcher />
          </div>
          
          {user ? (
            <>
              <NotificationBell />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/messages')}
                className="glass-button w-8 h-8 sm:w-9 sm:h-9"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/upload')}
                className="hidden sm:flex glass-button w-8 h-8 sm:w-9 sm:h-9"
              >
                <Upload className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="glass-button w-8 h-8 sm:w-9 sm:h-9">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 glass-card">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Профиль
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-projects')}>
                    <Blocks className="w-4 h-4 mr-2" />
                    Мои проекты
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/upload')} className="sm:hidden">
                    <Upload className="w-4 h-4 mr-2" />
                    Загрузить
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/forum')}>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Форум помощи
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/support')}>
                    <LifeBuoy className="w-4 h-4 mr-2" />
                    Техподдержка
                  </DropdownMenuItem>
                  {hasModeratorAccess && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/moderation')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Модерация
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Crown className="w-4 h-4 mr-2" />
                      Админ-панель
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
                className="hidden sm:inline-flex text-xs h-8"
              >
                Войти
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/auth?mode=signup')}
                className="bg-primary hover:bg-primary/90 text-xs h-8 px-3"
              >
                <span className="hidden xs:inline">Регистрация</span>
                <span className="xs:hidden">Войти</span>
              </Button>
            </>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden w-8 h-8"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'lg:hidden border-t border-border overflow-hidden transition-all duration-300',
          mobileMenuOpen ? 'max-h-[600px]' : 'max-h-0'
        )}
      >
        <div className="container py-3 space-y-3 px-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск..."
                className="pl-10 bg-secondary border-border h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          
          {/* Mobile settings */}
          <div className="flex items-center gap-2 sm:hidden pb-2 border-b border-border/50">
            {onToggleSnowflakes && (
              <SnowflakeToggle enabled={snowflakesEnabled} onToggle={onToggleSnowflakes} />
            )}
            <ThemeSwitcher />
          </div>
          
          {/* Resources section */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-1">РЕСУРСЫ</p>
            <nav className="grid grid-cols-2 gap-2">
              {navItems[0].children?.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-2 p-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Other links */}
          <div className="grid grid-cols-2 gap-2">
            {navItems.slice(1).map((item) => (
              <Link
                key={item.name}
                to={item.href!}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg text-sm transition-colors",
                  item.highlight 
                    ? "text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30"
                    : "text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Mobile donate button */}
          <Link
            to="/donate"
            className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Crown className="w-4 h-4" />
            Купить донат
          </Link>
          
          {/* Mobile quick actions when not logged in */}
          {!user && (
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
                className="flex-1"
              >
                Войти
              </Button>
              <Button
                size="sm"
                onClick={() => { navigate('/auth?mode=signup'); setMobileMenuOpen(false); }}
                className="flex-1 bg-primary"
              >
                Регистрация
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
