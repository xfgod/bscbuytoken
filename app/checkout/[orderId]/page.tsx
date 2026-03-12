'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, AlertCircle, Copy, ExternalLink, Wallet, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';

interface Order {
  id: string;
  orderNumber: string;
  amount: string;
  currency: string;
  status: string;
  paymentAddress: string;
  expiresAt: string;
  createdAt: string;
  transactions: any[];
}

export default function CheckoutPage() {
  const params = useParams();
  const { t } = useTranslation();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const statusConfig = {
    pending: {
      label: `${t.checkout.awaitingPayment} / 等待支付`,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    confirmed: {
      label: `${t.checkout.paymentReceived} / 已收到支付`,
      icon: Check,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    completed: {
      label: `${t.checkout.paymentConfirmed} / 支付已确认`,
      icon: Check,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    expired: {
      label: `${t.checkout.paymentExpired} / 支付已过期`,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
    failed: {
      label: `${t.checkout.paymentFailed} / 支付失败`,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
  };

  useEffect(() => {
    if (!orderId) return;
    
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/public/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data.order);
          
          if (data.order.paymentAddress) {
            const qrCanvas = await QRCode.toDataURL(
              data.order.paymentAddress,
              { 
                width: 280,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#ffffff',
                }
              }
            );
            setQrCode(qrCanvas);
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-secondary" />
            <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground">{t.checkout.loadingPayment}</p>
          <p className="text-muted-foreground text-sm">加载支付详情...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="border-border bg-card/80 backdrop-blur w-full max-w-md animate-scale-in">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t.checkout.orderNotFound}</h2>
            <h3 className="text-lg text-muted-foreground mb-4">未找到订单</h3>
            <p className="text-muted-foreground text-sm">
              {t.checkout.orderNotFoundDesc}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              您查找的订单不存在或已过期。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;
  const timeRemaining = new Date(order.expiresAt).getTime() - Date.now();
  const minutesRemaining = Math.max(0, Math.floor(timeRemaining / 60000));

  const copyAddress = () => {
    navigator.clipboard.writeText(order.paymentAddress);
    toast.success(t.checkout.addressCopied);
  };

  return (
    <div className="min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-border bg-card/80 backdrop-blur-xl w-full max-w-md shadow-2xl animate-scale-in relative z-10">
          {/* Status Header */}
          <CardHeader className={`text-center border-b border-border ${config.bgColor}`}>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${config.bgColor} border ${config.borderColor} mb-4 mx-auto`}>
              <Icon className={`w-8 h-8 ${config.color}`} />
            </div>
            <CardTitle className="text-foreground text-xl">{config.label}</CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Order Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">{t.checkout.orderNumber} 订单号:</span>
                <code className="font-mono text-sm bg-secondary px-2 py-1 rounded text-foreground">
                  {order.orderNumber}
                </code>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">{t.checkout.amount} 金额:</span>
                <span className="font-bold text-xl text-foreground">
                  {order.amount} <span className="text-amber-500">{order.currency}</span>
                </span>
              </div>
              {minutesRemaining > 0 && order.status === 'pending' && (
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">{t.checkout.expiresIn} 过期时间:</span>
                  <span className="font-semibold text-amber-500">
                    {minutesRemaining} {t.checkout.minutes} / 分钟
                  </span>
                </div>
              )}
            </div>

            {/* QR Code */}
            {order.paymentAddress && qrCode && order.status === 'pending' && (
              <div className="text-center animate-fade-in">
                <p className="text-sm text-muted-foreground mb-4">
                  {t.checkout.scanToPay}
                </p>
                <div className="relative inline-block">
                  <img
                    src={qrCode}
                    alt="Payment QR Code"
                    className="w-56 h-56 mx-auto rounded-xl border-4 border-secondary shadow-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">B</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Address */}
            {order.paymentAddress && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t.checkout.paymentAddress} 支付地址:</p>
                <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-xl border border-border">
                  <Wallet className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <code className="text-xs font-mono text-foreground flex-1 break-all">
                    {order.paymentAddress}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={copyAddress}
                    className="h-8 w-8 text-amber-500 hover:bg-amber-500/10 flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <a
                    href={`https://bscscan.com/address/${order.paymentAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 flex items-center justify-center text-amber-500 hover:bg-amber-500/10 rounded-md flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Instructions */}
            {order.status === 'pending' && (
              <div className="bg-secondary/30 border border-border p-4 rounded-xl space-y-3">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  {t.checkout.howToPay} 如何支付:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>{t.checkout.step1}</li>
                  <li className="text-muted-foreground">
                    打开您的BSC兼容钱包（MetaMask、Trust Wallet等）
                  </li>
                  <li>
                    {t.checkout.step2} <span className="font-semibold text-foreground">{order.amount} {order.currency}</span> {t.checkout.step2End}
                  </li>
                  <li className="text-muted-foreground">
                    发送正好 {order.amount} {order.currency} 到支付地址
                  </li>
                  <li>{t.checkout.step3}</li>
                  <li className="text-muted-foreground">等待确认（1-3个区块）</li>
                </ol>
              </div>
            )}

            {/* Success Message */}
            {(order.status === 'confirmed' || order.status === 'completed') && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <p className="text-emerald-500 font-semibold">
                    {t.checkout.paymentSuccess}
                  </p>
                </div>
                <p className="text-emerald-500/80 text-sm">
                  支付成功！
                </p>
                {order.transactions && order.transactions[0] && (
                  <div className="mt-3 pt-3 border-t border-emerald-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Transaction / 交易哈希:</p>
                    <code className="text-xs text-emerald-500 break-all font-mono">
                      {order.transactions[0].hash}
                    </code>
                  </div>
                )}
              </div>
            )}

            {/* Expired */}
            {order.status === 'expired' && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-500 font-semibold">
                    Order Expired / 订单已过期
                  </p>
                </div>
                <p className="text-red-500/80 text-sm">
                  {t.checkout.orderExpired}
                </p>
                <p className="text-red-500/80 text-sm mt-1">
                  此支付订单已过期。请创建新订单。
                </p>
              </div>
            )}

            {/* Help Text */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
              <p>
                {t.checkout.problemsPaying} / 支付遇到问题？{' '}
                <a href="mailto:support@example.com" className="text-amber-500 hover:underline">
                  {t.checkout.contactSupport} / 联系客服
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>Secured by BSC Payment Gateway / BSC支付网关保障安全</span>
        </div>
      </div>
    </div>
  );
}
