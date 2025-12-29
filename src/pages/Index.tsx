import { Layout } from '@/components/layout/Layout';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { useProjects, useProjectRatings } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Blocks, 
  Puzzle, 
  Map, 
  Palette,
  TrendingUp,
  Clock,
  Star,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const categories = [
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
        <title>MCLeak - Minecraft Плагины, Моды, Карты и Ресурспаки</title>
        <meta 
          name="description" 
          content="Крупнейшая платформа для обмена Minecraft контентом. Скачивайте и загружайте плагины, моды, карты и ресурспаки бесплатно." 
        />
      </Helmet>

      <Layout>
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          
          <div className="container relative">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <Badge variant="outline" className="border-primary/50 text-primary">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Крупнейшая база Minecraft контента
              </Badge>
              
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground leading-relaxed">
                <span className="text-gradient">MCLEAK</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Делитесь своими плагинами, модами, картами и ресурспаками. 
                Скачивайте лучший контент от сообщества.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 glow-primary">
                  <Link to="/browse">
                    Смотреть каталог
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/upload">
                    Загрузить проект
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 bg-card/50">
          <div className="container">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.href}
                  className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 card-hover"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 border ${category.color}`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Projects */}
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Популярное</h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/browse?sort=popular">
                  Смотреть все
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
        <section className="py-16 bg-card/30">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Новые загрузки</h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/browse?sort=recent">
                  Смотреть все
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
        <section className="py-20">
          <div className="container">
            <div className="relative p-8 md:p-12 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border border-primary/30 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
              
              <div className="relative text-center max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  Готовы поделиться своим проектом?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Присоединяйтесь к сообществу и загружайте свои плагины, моды, карты и ресурспаки
                </p>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
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
