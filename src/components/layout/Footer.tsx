import { Link } from 'react-router-dom';
import { Blocks, Github, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-8 sm:py-10 md:py-12 px-3 sm:px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded flex items-center justify-center">
                <Blocks className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-[10px] sm:text-xs text-primary">NeuroLeak</span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Крупнейшая платформа для обмена Minecraft контентом. 
              Делитесь своими сборками, плагинами, модами, картами и ресурспаками.
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Категории</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
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
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Информация</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
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
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Сообщество</h3>
            <div className="flex items-center gap-3 sm:gap-4">
              <a
                href="#"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href="#"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} NeuroLeak. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
