import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Moon, Sparkles, Trees } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { id: 'dark', name: 'Тёмная', icon: Moon, color: 'bg-zinc-800' },
  { id: 'glass', name: 'Стекло iOS', icon: Sparkles, color: 'bg-gradient-to-r from-purple-500/50 to-blue-500/50' },
  { id: 'midnight', name: 'Полночь', icon: Moon, color: 'bg-indigo-900' },
  { id: 'forest', name: 'Лес', icon: Trees, color: 'bg-emerald-900' },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="glass-button">
          <Palette className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card min-w-[160px]">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id as any)}
            className={cn(
              'flex items-center gap-3 cursor-pointer',
              theme === t.id && 'bg-primary/20'
            )}
          >
            <div className={cn('w-4 h-4 rounded-full', t.color)} />
            <t.icon className="w-4 h-4" />
            <span>{t.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
