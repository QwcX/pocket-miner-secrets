import { Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SnowflakeToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export const SnowflakeToggle = ({ enabled, onToggle }: SnowflakeToggleProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={`transition-colors ${enabled ? 'text-sky-400' : 'text-muted-foreground'}`}
        >
          <Snowflake className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {enabled ? 'Выключить снежинки' : 'Включить снежинки'}
      </TooltipContent>
    </Tooltip>
  );
};
