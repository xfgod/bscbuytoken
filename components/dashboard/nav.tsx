'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Code,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('merchantApiKey');
    localStorage.removeItem('merchantName');
    router.push('/');
  };

  const navItems = [
    {
      label: t.nav.dashboard,
      labelZh: '仪表板',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: t.nav.orders,
      labelZh: '订单',
      icon: ShoppingCart,
      href: '/dashboard/orders',
    },
    {
      label: t.nav.wallets,
      labelZh: '钱包',
      icon: Wallet,
      href: '/dashboard/wallets',
    },
    {
      label: t.nav.api,
      labelZh: 'API',
      icon: Code,
      href: '/dashboard/api',
    },
    {
      label: t.nav.settings,
      labelZh: '设置',
      icon: Settings,
      href: '/dashboard/settings',
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <h2 className="font-bold text-foreground">
                BSC Gateway
              </h2>
              <p className="text-xs text-muted-foreground">{t.nav.paymentSystem}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Promo Card */}
        <div className="p-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">x402 Protocol</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Enable AI agent payments with x402 support.
            </p>
            <p className="text-xs text-muted-foreground">
              启用AI代理支付x402支持。
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full gap-2 text-foreground border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
          >
            <LogOut className="w-4 h-4" />
            {t.nav.logout} / 退出
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-card border-border shadow-lg"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <h2 className="font-bold text-foreground">BSC Gateway</h2>
              <p className="text-xs text-muted-foreground">{t.nav.paymentSystem}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full gap-2 text-foreground border-border hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4" />
            {t.nav.logout} / 退出
          </Button>
        </div>
      </aside>
    </>
  );
}
