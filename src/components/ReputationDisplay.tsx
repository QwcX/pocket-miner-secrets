import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReputationDisplayProps {
  points: number;
  className?: string;
  showIcon?: boolean;
}

export function ReputationDisplay({ points, className, showIcon = true }: ReputationDisplayProps) {
  const isPositive = points >= 0;
  
  return (
    <div className={cn(
      'flex items-center gap-1 text-sm font-medium',
      isPositive ? 'text-minecraft-green' : 'text-destructive',
      className
    )}>
      {showIcon && (
        isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
      )}
      <span>{isPositive ? '+' : ''}{points}</span>
      <Star className="w-3 h-3 fill-current" />
    </div>
  );
}