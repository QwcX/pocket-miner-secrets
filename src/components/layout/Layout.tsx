import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageBreadcrumbs } from './Breadcrumbs';
import { Snowflakes, useSnowflakes } from '@/components/Snowflakes';

interface LayoutProps {
  children: ReactNode;
  hideBreadcrumbs?: boolean;
}

export function Layout({ children, hideBreadcrumbs = false }: LayoutProps) {
  const { enabled: snowflakesEnabled, toggle: toggleSnowflakes } = useSnowflakes();

  return (
    <div className="min-h-screen flex flex-col">
      {snowflakesEnabled && <Snowflakes />}
      <Header snowflakesEnabled={snowflakesEnabled} onToggleSnowflakes={toggleSnowflakes} />
      {!hideBreadcrumbs && <PageBreadcrumbs />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
