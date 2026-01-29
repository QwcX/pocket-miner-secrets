import { Layout } from '@/components/layout/Layout';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { useProjects, useProjectRatings } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { OnlineUsersWidget } from '@/components/OnlineUsersWidget';
import { 
  ArrowRight, 
  Blocks, 
  Puzzle, 
  Map, 
  Palette,
  Package,
  Settings,
  TrendingUp,
  Clock,
  Star,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const categories = [
  { 
    name: 'Сборки', 
    icon: Package, 
    href: '/browse?type=build',
    description: 'Готовые сборки с модами и настройками',
    color: 'bg-minecraft-red/20 text-minecraft-red border-minecraft-red/30',
  },
  { 
    name: 'Плагины', 
    icon: Puzzle, 
    href: '/browse?type=plugin',
    description: 'Серверные плагины для Bukkit, Spigot, Paper',
    color: 'bg-minecraft-green/20 text-minecraft-green border-minecraft-green/30',
  },
  { 
    name: 'Моды', 
    icon: Blocks, 
    href: '/browse?type=mod',
    description: 'Модификации для Forge и Fabric',
    color: 'bg-minecraft-purple/20 text-minecraft-purple border-minecraft-purple/30',
  },
  { 
    name: 'Карты', 
    icon: Map, 
    href: '/browse?type=map',
    description: 'Готовые миры и постройки',
    color: 'bg-minecraft-gold/20 text-minecraft-gold border-minecraft-gold/30',
  },
  { 
    name: 'Ресурспаки', 
    icon: Palette, 
    href: '/browse?type=resourcepack',
    description: 'Текстуры, звуки и модели',
    color: 'bg-minecraft-diamond/20 text-minecraft-diamond border-minecraft-diamond/30',
  },
  { 
    name: 'Конфиги', 
    icon: Settings, 
    href: '/browse?type=config',
    description: 'Настройки серверов и клиентов',
    color: 'bg-minecraft-gray/20 text-minecraft-gray border-minecraft-gray/30',
  },
];

const Index = () => {
  const { data: featuredProjects = [], isLoading: loadingFeatured } = useProjects({ 
    featured: true, 
    limit: 8 
  });
  
  const { data: recentProjects = [], isLoading: loadingRecent } = useProjects({ 
    limit: 8 
  });

  const projectIds = [...featuredProjects, ...recentProjects].map(p => p.id);
  const { data: ratings = {} } = useProjectRatings(projectIds);

  return (
    <>
      <Helmet>
        <title>NeuroLeak - Minecraft Сборки, Плагины, Моды, Карты</title>
        <meta 
          name="description" 
          content="NeuroLeak - крупнейшая платформа для обмена Minecraft контентом. Скачивайте сборки, плагины, моды, карты и ресурспаки бесплатно." 
        />
      </Helmet>

      <Layout>
        {/* Hero Section */}
        <section className="relative py-10 sm:py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          
          <div className="container relative px-3 sm:px-4">
            <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
              <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                <Star className="w-3 h-3 mr-1 fill-current" />
                <span className="hidden xs:inline">Крупнейшая база Minecraft контента</span>
                <span className="xs:hidden">Minecraft контент</span>
              </Badge>
              
              <h1 className="font-display text-xl xs:text-2xl sm:text-3xl md:text-4xl text-foreground leading-relaxed">
                <span className="text-gradient">NEUROLEAK</span>
              </h1>
              
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                Делитесь своими сборками, плагинами, модами, картами и ресурспаками. 
                Скачивайте лучший контент от сообщества.
              </p>
              
              <div className="flex flex-col xs:flex-row justify-center gap-3 sm:gap-4 px-4 xs:px-0">
                <Button asChild size="default" className="bg-primary hover:bg-primary/90 glow-primary w-full xs:w-auto">
                  <Link to="/browse">
                    Смотреть каталог
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="default" className="w-full xs:w-auto">
                  <Link to="/upload">
                    Загрузить проект
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories + Activity Widget */}
        <section className="py-6 sm:py-8 md:py-12 bg-card/50">
          <div className="container px-3 sm:px-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Categories */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      to={category.href}
                      className="group p-3 sm:p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 card-hover"
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4 border ${category.color}`}>
                        <category.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Activity Widget */}
              <div className="lg:col-span-1 order-first lg:order-last">
                <OnlineUsersWidget />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Projects */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container px-3 sm:px-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">Популярное</h2>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                <Link to="/browse?sort=popular">
                  <span className="hidden xs:inline">Смотреть все</span>
                  <span className="xs:hidden">Все</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            
            <ProjectGrid 
              projects={featuredProjects} 
              loading={loadingFeatured}
              ratings={ratings}
            />
          </div>
        </section>

        {/* Recent Projects */}
        <section className="py-8 sm:py-12 md:py-16 bg-card/30">
          <div className="container px-3 sm:px-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">Новые загрузки</h2>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                <Link to="/browse?sort=recent">
                  <span className="hidden xs:inline">Смотреть все</span>
                  <span className="xs:hidden">Все</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            
            <ProjectGrid 
              projects={recentProjects} 
              loading={loadingRecent}
              ratings={ratings}
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 sm:py-16 md:py-20">
          <div className="container px-3 sm:px-4">
            <div className="relative p-5 sm:p-8 md:p-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border border-primary/30 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
              
              <div className="relative text-center max-w-2xl mx-auto">
                <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold text-foreground mb-2 sm:mb-4">
                  Готовы поделиться своим проектом?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  Присоединяйтесь к сообществу и загружайте свои сборки, плагины, моды, карты и ресурспаки
                </p>
                <Button asChild size="default" className="bg-primary hover:bg-primary/90 w-full xs:w-auto">
                  <Link to="/auth?mode=signup">
                    Создать аккаунт
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default Index;