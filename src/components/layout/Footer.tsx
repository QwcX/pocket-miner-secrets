import { Link } from 'react-router-dom';
import { Blocks, Github, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Blocks className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xs text-primary">TestLeak</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Крупнейшая платформа для обмена Minecraft контентом. 
              Делитесь своими сборками, плагинами, модами, картами и ресурспаками.
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Категории</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/browse?type=plugin" className="hover:text-foreground transition-colors">
                  Плагины
                </Link>
              </li>
              <li>
                <Link to="/browse?type=mod" className="hover:text-foreground transition-colors">
                  Моды
                </Link>
              </li>
              <li>
                <Link to="/browse?type=map" className="hover:text-foreground transition-colors">
                  Карты
                </Link>
              </li>
              <li>
                <Link to="/browse?type=resourcepack" className="hover:text-foreground transition-colors">
                  Ресурспаки
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Информация</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  О проекте
                </Link>
              </li>
              <li>
                <Link to="/rules" className="hover:text-foreground transition-colors">
                  Правила
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Сообщество</h3>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TestLeak. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
