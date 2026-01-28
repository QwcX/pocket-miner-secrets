import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// Route to label mapping
const routeLabels: Record<string, string> = {
  '/': 'Главная',
  '/browse': 'Каталог',
  '/upload': 'Загрузка',
  '/my-projects': 'Мои проекты',
  '/profile': 'Профиль',
  '/moderation': 'Модерация',
  '/moderation/logs': 'Логи модерации',
  '/leaderboards': 'Топы',
  '/messages': 'Сообщения',
  '/admin': 'Админ-панель',
  '/support': 'Техподдержка',
  '/donate': 'Донат',
  '/forum': 'Форум',
  '/seller-requests': 'Заявки на покупку',
  '/chat': 'Чат',
  '/chat/moderation': 'Модерация чата',
  '/about': 'О проекте',
  '/faq': 'FAQ',
  '/rules': 'Правила',
  '/contact': 'Контакты',
  '/auth': 'Авторизация',
  '/dashboard': 'Дашборд автора',
};

// Dynamic route patterns
const getDynamicRouteLabel = (pathname: string): string | null => {
  if (pathname.startsWith('/project/')) return 'Проект';
  if (pathname.startsWith('/user/')) return 'Профиль пользователя';
  if (pathname.startsWith('/forum/') && pathname !== '/forum') return 'Вопрос';
  if (pathname.startsWith('/order/')) return 'Заказ';
  if (pathname.startsWith('/messages/')) return 'Диалог';
  return null;
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

export function Breadcrumbs() {
  const location = useLocation();
  const pathname = location.pathname;

  // Don't show breadcrumbs on home page
  if (pathname === '/') return null;

  const pathParts = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with Home
  breadcrumbs.push({ label: 'Главная', href: '/', isLast: false });

  // Build breadcrumb trail
  let currentPath = '';
  pathParts.forEach((part, index) => {
    currentPath += `/${part}`;
    const isLast = index === pathParts.length - 1;
    
    // Check for static route label
    let label = routeLabels[currentPath];
    
    // Check for dynamic route label
    if (!label) {
      label = getDynamicRouteLabel(currentPath) || part;
    }

    breadcrumbs.push({ label, href: currentPath, isLast });
  });

  // Update last item
  if (breadcrumbs.length > 1) {
    breadcrumbs[breadcrumbs.length - 1].isLast = true;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1 whitespace-nowrap">
          {index === 0 ? (
            <Link 
              to={crumb.href} 
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{crumb.label}</span>
            </Link>
          ) : crumb.isLast ? (
            <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-[250px]">
              {crumb.label}
            </span>
          ) : (
            <Link 
              to={crumb.href} 
              className="hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-[150px]"
            >
              {crumb.label}
            </Link>
          )}
          
          {!crumb.isLast && (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
          )}
        </div>
      ))}
    </nav>
  );
}

// A version that sits inside the Layout, below header
export function PageBreadcrumbs({ className }: { className?: string }) {
  const location = useLocation();
  
  // Don't show on home page
  if (location.pathname === '/') return null;

  return (
    <div className={cn("container px-3 sm:px-4 py-2 border-b border-border/50 bg-card/30", className)}>
      <Breadcrumbs />
    </div>
  );
}
