'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Wallet,
  Settings,
  TrendingUp,
  Check,
  Package,
  Key,
  Sparkles,
} from 'lucide-react';
import { DashboardNav } from '@/components/dashboard/nav';
import { OrdersTable } from '@/components/dashboard/orders-table';
import { WalletsSection } from '@/components/dashboard/wallets-section';
import { APIKeysSection } from '@/components/dashboard/api-keys-section';
import { useTranslation } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';

interface MerchantStats {
  totalOrders: number;
  completedOrders: number;
  totalVolume: string;
  totalWallets: number;
  totalApiKeys: number;
}

interface MerchantData {
  id: string;
  name: string;
  email: string;
  stats: MerchantStats;
}

const CHART_COLORS = ['#f39c12', '#3b82f6', '#10b981', '#8b5cf6'];

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('merchantApiKey');
    if (!storedKey) {
      router.push('/');
      return;
    }

    setApiKey(storedKey);
    fetchMerchantData(storedKey);
    fetchOrders(storedKey);
  }, [router]);

  const fetchMerchantData = async (key: string) => {
    try {
      const response = await fetch('/api/v1/merchants/info', {
        headers: { 'X-API-Key': key },
      });

      if (response.ok) {
        const data = await response.json();
        setMerchantData(data.merchant);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching merchant data:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (key: string) => {
    try {
      const response = await fetch('/api/v1/orders?limit=10', {
        headers: { 'X-API-Key': key },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-secondary" />
            <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground">{t.dashboard.loadingDashboard}</p>
        </div>
      </div>
    );
  }

  if (!merchantData) {
    return null;
  }

  const revenueData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 2500 },
  ];

  const statusData = [
    { name: t.orders.completed, value: merchantData.stats.completedOrders || 1 },
    { name: t.orders.pending, value: Math.max(0, merchantData.stats.totalOrders - merchantData.stats.completedOrders) || 1 },
  ];

  const statsCards = [
    {
      title: t.dashboard.totalOrders,
      value: merchantData.stats.totalOrders,
      subtitle: t.dashboard.allTimeTransactions,
      icon: Package,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: t.dashboard.completed,
      value: merchantData.stats.completedOrders,
      subtitle: t.dashboard.successfullyProcessed,
      icon: Check,
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: t.dashboard.totalVolume,
      value: merchantData.stats.totalVolume || '$0',
      subtitle: t.dashboard.combinedAmount,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: t.dashboard.wallets,
      value: merchantData.stats.totalWallets,
      subtitle: t.dashboard.activePaymentWallets,
      icon: Wallet,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      title: t.dashboard.apiKeys,
      value: merchantData.stats.totalApiKeys,
      subtitle: t.dashboard.activeIntegrations,
      icon: Key,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10',
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />

      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                System Online / 系统在线
              </span>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h1 className="text-3xl font-bold text-foreground">
                {t.dashboard.welcome}, {merchantData.name}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {t.dashboard.welcomeSubtitle}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={stat.title} 
                  className="border-border bg-card/50 backdrop-blur card-hover animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 text-foreground`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subtitle}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 border-border bg-card/50 backdrop-blur animate-fade-in-up delay-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  {t.dashboard.transactionTrend}
                </CardTitle>
                <CardDescription>
                  {t.dashboard.weeklyVolume}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      labelStyle={{ color: 'var(--foreground)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f39c12"
                      strokeWidth={3}
                      dot={{ fill: '#f39c12', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#f39c12' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/50 backdrop-blur animate-fade-in-up delay-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  {t.dashboard.orderStatus}
                </CardTitle>
                <CardDescription>
                  {t.dashboard.completionRate}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="px-6 pb-4 flex justify-center gap-6">
                {statusData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index] }}
                    />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Tabs Section */}
          <div className="animate-fade-in-up delay-400">
            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList className="bg-card border border-border p-1">
                <TabsTrigger 
                  value="orders"
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                >
                  {t.dashboard.recentOrders}
                </TabsTrigger>
                <TabsTrigger 
                  value="wallets"
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                >
                  {t.dashboard.wallets}
                </TabsTrigger>
                <TabsTrigger 
                  value="api"
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                >
                  {t.dashboard.apiKeys}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                <OrdersTable orders={orders} apiKey={apiKey} />
              </TabsContent>

              <TabsContent value="wallets">
                <WalletsSection apiKey={apiKey} />
              </TabsContent>

              <TabsContent value="api">
                <APIKeysSection apiKey={apiKey} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
