import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';
import { 
  Crown, 
  Diamond, 
  Gem,
  Leaf,
  Medal,
  Shield,
  Star,
  Zap,
  Palette,
  Smile,
  Clock,
  MessageSquare,
  Upload,
  Sparkles,
  Heart,
  CheckCircle
} from 'lucide-react';
import { DONOR_BENEFITS, DonorBenefitConfig } from '@/lib/donorBenefits';
import { DonorTier, DONOR_TIER_LABELS } from '@/types/database';

const TIER_ORDER: DonorTier[] = ['iron', 'bronze', 'silver', 'gold', 'diamond', 'emerald', 'sponsor'];

const TIER_ICONS: Record<DonorTier, React.ReactNode> = {
  none: null,
  iron: <Shield className="h-8 w-8" />,
  bronze: <Medal className="h-8 w-8" />,
  silver: <Star className="h-8 w-8" />,
  gold: <Crown className="h-8 w-8" />,
  diamond: <Diamond className="h-8 w-8" />,
  emerald: <Leaf className="h-8 w-8" />,
  sponsor: <Gem className="h-8 w-8" />
};

const TIER_GRADIENTS: Record<DonorTier, string> = {
  none: '',
  iron: 'from-gray-400 to-gray-600',
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-amber-500',
  diamond: 'from-cyan-400 to-blue-500',
  emerald: 'from-emerald-400 to-green-600',
  sponsor: 'from-purple-500 to-pink-500'
};

const TIER_BORDERS: Record<DonorTier, string> = {
  none: '',
  iron: 'border-gray-500',
  bronze: 'border-amber-700',
  silver: 'border-gray-400',
  gold: 'border-yellow-500',
  diamond: 'border-cyan-400',
  emerald: 'border-emerald-500',
  sponsor: 'border-purple-500'
};

const TIER_SHADOWS: Record<DonorTier, string> = {
  none: '',
  iron: 'shadow-gray-500/20',
  bronze: 'shadow-amber-700/20',
  silver: 'shadow-gray-400/20',
  gold: 'shadow-yellow-500/30',
  diamond: 'shadow-cyan-400/30',
  emerald: 'shadow-emerald-500/30',
  sponsor: 'shadow-purple-500/40'
};

interface BenefitItemProps {
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
}

function BenefitItem({ icon, text, highlight }: BenefitItemProps) {
  return (
    <div className={`flex items-center gap-2 ${highlight ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
      <div className="flex-shrink-0">{icon}</div>
      <span className="text-sm">{text}</span>
    </div>
  );
}

function TierCard({ tier, benefits, index }: { tier: DonorTier; benefits: DonorBenefitConfig; index: number }) {
  const isPopular = tier === 'gold' || tier === 'diamond';
  
  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:scale-105 border-2 ${TIER_BORDERS[tier]} shadow-lg ${TIER_SHADOWS[tier]} ${
        isPopular ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
    >
      {isPopular && (
        <div className="absolute -top-1 -right-1">
          <Badge className="bg-primary text-primary-foreground">
            <Sparkles className="h-3 w-3 mr-1" />
            Популярный
          </Badge>
        </div>
      )}
      
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${TIER_GRADIENTS[tier]} p-6 text-white`}>
        <div className="flex items-center gap-3">
          {TIER_ICONS[tier]}
          <div>
            <h3 className="text-2xl font-bold">{DONOR_TIER_LABELS[tier]}</h3>
            <p className="text-white/80 text-sm">Уровень {index + 1}</p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          {benefits.canCustomizeNickname && (
            <BenefitItem 
              icon={<Palette className="h-4 w-4 text-primary" />} 
              text="Цветной никнейм" 
              highlight 
            />
          )}
          
          {benefits.canSetProfileEmoji && (
            <BenefitItem 
              icon={<Smile className="h-4 w-4 text-primary" />} 
              text="Эмодзи в профиле" 
              highlight 
            />
          )}
          
          {benefits.canUploadCustomEmoji && (
            <BenefitItem 
              icon={<Upload className="h-4 w-4 text-primary" />} 
              text="Загрузка своих эмодзи" 
              highlight 
            />
          )}
          
          {benefits.rateLimitMultiplier < 1 && (
            <BenefitItem 
              icon={<Clock className="h-4 w-4 text-primary" />} 
              text={`-${Math.round((1 - benefits.rateLimitMultiplier) * 100)}% к ожиданию`} 
              highlight
            />
          )}
          
          {benefits.supportPriority > 0 && (
            <BenefitItem 
              icon={<MessageSquare className="h-4 w-4 text-primary" />} 
              text={`Приоритет поддержки +${benefits.supportPriority}`} 
              highlight
            />
          )}
          
          {benefits.maxProjectsPerDay > 5 && (
            <BenefitItem 
              icon={<Zap className="h-4 w-4 text-primary" />} 
              text={`До ${benefits.maxProjectsPerDay} проектов/день`}
              highlight
            />
          )}
        </div>
        
        {index > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Включает все бонусы {DONOR_TIER_LABELS[TIER_ORDER[index - 1]]}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Donate() {
  return (
    <>
    <Helmet>
      <title>Донат | NeuroLeak</title>
      <meta name="description" content="Поддержите NeuroLeak и получите эксклюзивные привилегии" />
    </Helmet>
    <Layout>
      <div className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            <Heart className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Поддержите проект
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Станьте частью нашего сообщества и получите эксклюзивные преимущества
          </p>
        </div>

        {/* Benefits Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          <Card className="text-center p-4 hover:shadow-lg transition-shadow">
            <Palette className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Цветные ники</p>
            <p className="text-xs text-muted-foreground">от Iron</p>
          </Card>
          <Card className="text-center p-4 hover:shadow-lg transition-shadow">
            <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Меньше ожидания</p>
            <p className="text-xs text-muted-foreground">от Iron -10%</p>
          </Card>
          <Card className="text-center p-4 hover:shadow-lg transition-shadow">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Приоритет поддержки</p>
            <p className="text-xs text-muted-foreground">от Iron +1</p>
          </Card>
          <Card className="text-center p-4 hover:shadow-lg transition-shadow">
            <Smile className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Эмодзи профиля</p>
            <p className="text-xs text-muted-foreground">от Gold</p>
          </Card>
          <Card className="text-center p-4 hover:shadow-lg transition-shadow">
            <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Больше проектов</p>
            <p className="text-xs text-muted-foreground">от Diamond</p>
          </Card>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {TIER_ORDER.map((tier, index) => (
            <TierCard 
              key={tier} 
              tier={tier} 
              benefits={DONOR_BENEFITS[tier]} 
              index={index}
            />
          ))}
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="text-center py-12">
            <Gem className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Хотите получить донат-статус?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Свяжитесь с администрацией через систему техподдержки или напишите нам в Discord
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="/support">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Написать в поддержку
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8">Частые вопросы</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Как получить донат-статус?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Напишите в техподдержку или свяжитесь с администрацией. Мы обсудим условия и активируем ваш статус.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Бонусы суммируются?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Да! Каждый следующий уровень включает все бонусы предыдущих уровней плюс новые привилегии.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Статус навсегда?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Зависит от условий. Некоторые статусы выдаются навсегда, другие имеют срок действия.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Можно ли повысить уровень?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Конечно! Вы всегда можете повысить свой донат-статус, доплатив разницу.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
    </>
  );
}