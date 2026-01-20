import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Palette, Smile, Zap, MessageSquare, ArrowLeft, ExternalLink } from 'lucide-react';

interface DonorUpsellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: 'nickname' | 'emoji' | 'customEmoji' | 'priority' | 'general';
}

const FEATURE_INFO = {
  nickname: {
    title: 'Цветной никнейм',
    description: 'Выделитесь среди других пользователей с уникальным цветным никнеймом!',
    icon: Palette,
    minTier: 'Iron'
  },
  emoji: {
    title: 'Эмодзи в профиле',
    description: 'Добавьте эмодзи рядом с вашим именем для ещё большей индивидуальности!',
    icon: Smile,
    minTier: 'Gold'
  },
  customEmoji: {
    title: 'Загрузка своих эмодзи',
    description: 'Загружайте собственные изображения как эмодзи профиля!',
    icon: Smile,
    minTier: 'Gold'
  },
  priority: {
    title: 'Приоритетная поддержка',
    description: 'Получайте ответы от модераторов быстрее других пользователей!',
    icon: MessageSquare,
    minTier: 'Iron'
  },
  general: {
    title: 'Донат-статус',
    description: 'Получите доступ к эксклюзивным функциям и поддержите проект!',
    icon: Crown,
    minTier: 'Iron'
  }
};

export function DonorUpsellDialog({ open, onOpenChange, feature }: DonorUpsellDialogProps) {
  const navigate = useNavigate();
  const info = FEATURE_INFO[feature];
  const Icon = info.icon;

  const handleGoToDonate = () => {
    onOpenChange(false);
    navigate('/donate');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">{info.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {info.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">Преимущества донат-статуса:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Цветной никнейм (от Iron)
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Меньше ограничений (от Iron)
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Приоритет в поддержке (от Iron)
              </li>
              <li className="flex items-center gap-2">
                <Smile className="h-4 w-4 text-primary" />
                Эмодзи в профиле (от Gold)
              </li>
              <li className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                И многое другое!
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            Минимальный уровень для этой функции: <span className="font-medium text-primary">{info.minTier}</span>
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Button onClick={handleGoToDonate} className="w-full sm:w-auto">
            <ExternalLink className="h-4 w-4 mr-2" />
            Узнать о донатах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
