import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Snowflakes, useSnowflakes } from '@/components/Snowflakes';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { enabled: snowflakesEnabled, toggle: toggleSnowflakes } = useSnowflakes();

  return (
    <div className="min-h-screen flex flex-col">
      {snowflakesEnabled && <Snowflakes />}
      <Header snowflakesEnabled={snowflakesEnabled} onToggleSnowflakes={toggleSnowflakes} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
