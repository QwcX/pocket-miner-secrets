import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Blocks, Download, Users, Shield, Rocket, Heart, 
  Code, Globe, Zap, Star 
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const stats = [
  { label: 'Проектов', value: '1000+', icon: Blocks },
  { label: 'Скачиваний', value: '50K+', icon: Download },
  { label: 'Пользователей', value: '5K+', icon: Users },
];

const features = [
  {
    icon: Shield,
    title: 'Безопасность',
    description: 'Все файлы проходят проверку модераторами перед публикацией'
  },
  {
    icon: Rocket,
    title: 'Скорость',
    description: 'Быстрые серверы для загрузки контента без ожидания'
  },
  {
    icon: Heart,
    title: 'Сообщество',
    description: 'Дружелюбное комьюнити единомышленников'
  },
  {
    icon: Code,
    title: 'Открытость',
    description: 'Прозрачная система модерации и правила'
  },
];

export default function About() {
  return (
    <>
      <Helmet>
        <title>О проекте | TestLeak</title>
        <meta name="description" content="TestLeak - крупнейшая платформа для обмена Minecraft контентом. Узнайте больше о нашем проекте." />
      </Helmet>
      
      <Layout>
        <div className="container py-8 px-4">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="outline" className="border-primary/50 text-primary mb-4">
              <Star className="w-3 h-3 mr-1 fill-current" />
              О проекте
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display text-foreground mb-4">
              Добро пожаловать в <span className="text-gradient">TestLeak</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Мы создаем лучшую платформу для обмена Minecraft контентом в русскоязычном сообществе
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-card border border-border">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Mission */}
          <Card className="mb-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Наша миссия
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                TestLeak создан для того, чтобы объединить создателей и игроков Minecraft. 
                Мы предоставляем удобную платформу для публикации и скачивания сборок, 
                плагинов, модов, карт и ресурспаков.
              </p>
              <p>
                Наша цель — сделать качественный контент доступным для всех, поддерживая 
                при этом авторов и создателей. Мы верим, что совместное творчество делает 
                игровой мир лучше.
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
              Почему TestLeak?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Команда
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Наша команда состоит из опытных разработчиков и модераторов, 
                которые работают над улучшением платформы каждый день. 
                Мы всегда открыты к предложениям и обратной связи от нашего сообщества.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
}
