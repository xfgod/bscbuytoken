'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Zap, Lock, TrendingUp, Code, Wallet, Shield, 
  ArrowRight, ChevronRight, Sparkles, Globe2,
  CheckCircle, Clock, Cpu
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState<'landing' | 'login' | 'register'>('landing');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bscAddress: '',
    webhookUrl: '',
  });
  const [loginData, setLoginData] = useState({
    apiKey: '',
  });

  const features = [
    {
      icon: Zap,
      title: t.features.instantPayments,
      description: t.features.instantPaymentsDesc,
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Lock,
      title: t.features.secure,
      description: t.features.secureDesc,
      color: 'from-emerald-500 to-green-500',
    },
    {
      icon: TrendingUp,
      title: t.features.realTimeMonitoring,
      description: t.features.realTimeMonitoringDesc,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Code,
      title: t.features.simpleApi,
      description: t.features.simpleApiDesc,
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Wallet,
      title: t.features.multiToken,
      description: t.features.multiTokenDesc,
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Shield,
      title: t.features.x402Protocol,
      description: t.features.x402ProtocolDesc,
      color: 'from-indigo-500 to-blue-500',
    },
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime / 正常运行' },
    { value: '<3s', label: 'Confirmation / 确认时间' },
    { value: '0.1%', label: 'Fee / 费率' },
    { value: '24/7', label: 'Support / 支持' },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v1/merchants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bscAddress: formData.bscAddress,
          webhookUrl: formData.webhookUrl || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('merchantApiKey', data.merchant.apiKey);
        localStorage.setItem('merchantName', data.merchant.name);
        toast.success(t.auth.registerSuccess);
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        const error = await response.json();
        toast.error(error.error || t.auth.registrationFailed);
      }
    } catch (error) {
      toast.error(t.auth.registrationFailed);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v1/merchants/info', {
        headers: { 'X-API-Key': loginData.apiKey },
      });

      if (response.ok) {
        localStorage.setItem('merchantApiKey', loginData.apiKey);
        const data = await response.json();
        localStorage.setItem('merchantName', data.merchant.name);
        toast.success(t.auth.loginSuccess);
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        toast.error(t.auth.invalidApiKey);
      }
    } catch (error) {
      toast.error(t.auth.loginFailed);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Register Form
  if (step === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl" />
        </div>
        
        <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl relative z-10 animate-scale-in shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 animate-float">
                <span className="text-white font-bold text-2xl">B</span>
              </div>
            </div>
            <CardTitle className="text-2xl text-foreground">{t.auth.registerTitle}</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">创建账户 / Create Account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  {t.auth.businessName}
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.auth.businessNamePlaceholder}
                  required
                  className="border-border bg-background/50 text-foreground h-11 transition-all focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  {t.auth.email}
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t.auth.emailPlaceholder}
                  required
                  className="border-border bg-background/50 text-foreground h-11 transition-all focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  {t.auth.bscAddress}
                </label>
                <Input
                  value={formData.bscAddress}
                  onChange={(e) => setFormData({ ...formData, bscAddress: e.target.value })}
                  placeholder={t.auth.bscAddressPlaceholder}
                  required
                  className="border-border bg-background/50 text-foreground font-mono text-sm h-11 transition-all focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  {t.auth.webhookUrl}
                </label>
                <Input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder={t.auth.webhookUrlPlaceholder}
                  className="border-border bg-background/50 text-foreground h-11 transition-all focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 btn-glow font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.auth.creatingAccount}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {t.auth.createAccountButton}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">{t.common.or}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('login')}
                className="w-full h-11 border-border text-foreground hover:bg-secondary transition-all"
              >
                {t.auth.haveApiKey}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login Form
  if (step === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl" />
        </div>
        
        <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl relative z-10 animate-scale-in shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 animate-float">
                <span className="text-white font-bold text-2xl">B</span>
              </div>
            </div>
            <CardTitle className="text-2xl text-foreground">{t.auth.loginTitle}</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">登录 / Login</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  {t.auth.apiKey}
                </label>
                <Input
                  value={loginData.apiKey}
                  onChange={(e) => setLoginData({ apiKey: e.target.value })}
                  placeholder={t.auth.apiKeyPlaceholder}
                  required
                  className="border-border bg-background/50 text-foreground font-mono text-sm h-11 transition-all focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 btn-glow font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.auth.loggingIn}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {t.auth.loginButton}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">{t.common.or}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('register')}
                className="w-full h-11 border-border text-foreground hover:bg-secondary transition-all"
              >
                {t.auth.createNew}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <span className="font-bold text-foreground text-lg">BSC Gateway</span>
              <span className="text-muted-foreground text-xs block">支付网关</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              onClick={() => setStep('login')}
              className="text-foreground hover:bg-secondary hidden sm:flex"
            >
              {t.nav.login}
            </Button>
            <Button
              onClick={() => setStep('register')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 btn-glow"
            >
              {t.nav.register}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8 animate-fade-in-down">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-foreground">x402 Protocol Supported | 支持x402协议</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in-up text-balance">
              <span className="gradient-text">{t.home.title}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100 text-pretty leading-relaxed">
              {t.home.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
              <Button
                onClick={() => setStep('register')}
                size="lg"
                className="h-14 px-8 text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 btn-glow shadow-xl shadow-amber-500/25"
              >
                {t.home.getStarted}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg border-border text-foreground hover:bg-secondary"
              >
                {t.home.viewDocs}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in-up delay-300">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              {t.home.features}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to accept crypto payments on BSC
              <br />
              在BSC上接收加密货币支付所需的一切
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className={`border-border bg-card/50 backdrop-blur hover:border-amber-500/50 transition-all duration-300 card-hover animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works / 工作原理
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Code,
                title: 'Integrate API / 集成API',
                desc: 'Use our simple REST API to create payment orders / 使用简单的REST API创建支付订单',
              },
              {
                step: '02',
                icon: Clock,
                title: 'Monitor Payments / 监控支付',
                desc: 'We monitor the blockchain and detect payments automatically / 我们监控区块链并自动检测支付',
              },
              {
                step: '03',
                icon: CheckCircle,
                title: 'Receive Callback / 接收回调',
                desc: 'Get instant webhook notifications when payment is confirmed / 支付确认时立即收到Webhook通知',
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-6 shadow-lg shadow-amber-500/25">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 md:right-auto md:left-1/2 md:ml-8 w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border font-bold text-sm text-foreground">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                <Cpu className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-500">x402 Protocol</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                AI Agent Payments / AI代理支付
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Enable autonomous AI agents to make payments using the x402 protocol standard. 
                Perfect for AI-powered services that need programmatic payment capabilities.
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                启用自主AI代理使用x402协议标准进行支付。非常适合需要程序化支付能力的AI驱动服务。
              </p>
              <div className="flex flex-wrap gap-3">
                {['HTTP 402', 'Auto-pay', 'AI SDK', 'Streaming'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground border border-border">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-3xl" />
              <Card className="relative border-border bg-card/80 backdrop-blur">
                <CardContent className="p-6">
                  <pre className="text-xs md:text-sm font-mono text-muted-foreground overflow-x-auto">
{`// x402 Payment Request
POST /api/v1/x402/sessions

{
  "amount": "10.00",
  "currency": "USDT",
  "description": "AI API Call",
  "agentId": "ai-agent-001"
}

// Response: 402 Payment Required
{
  "paymentAddress": "0x...",
  "paymentRequired": true,
  "x402Version": "1.0"
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
        <div className="max-w-7xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            {t.home.readyTitle}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t.home.readySubtitle}
          </p>
          <Button
            onClick={() => setStep('register')}
            size="lg"
            className="h-14 px-10 text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 btn-glow shadow-xl shadow-amber-500/25"
          >
            {t.home.createAccount}
            <Sparkles className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <div>
                <span className="font-bold text-foreground">BSC Payment Gateway</span>
                <span className="text-muted-foreground text-xs block">支付网关</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Docs / 文档</a>
              <a href="#" className="hover:text-foreground transition-colors">API</a>
              <a href="#" className="hover:text-foreground transition-colors">Support / 支持</a>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 {t.home.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
