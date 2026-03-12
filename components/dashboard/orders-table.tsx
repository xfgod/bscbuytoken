'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, Package, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  orderNumber: string;
  amount: string;
  currency: string;
  status: string;
  paymentAddress: string;
  paidAt: string;
  createdAt: string;
}

interface OrdersTableProps {
  orders: Order[];
  apiKey: string;
}

export function OrdersTable({ orders, apiKey }: OrdersTableProps) {
  const { t } = useTranslation();

  const statusConfig: Record<string, { label: string; labelZh: string; icon: any; color: string; dotColor: string }> = {
    pending: {
      label: 'Pending',
      labelZh: '待支付',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dotColor: 'bg-amber-500',
    },
    confirmed: {
      label: 'Confirmed',
      labelZh: '已确认',
      icon: CheckCircle,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dotColor: 'bg-emerald-500',
    },
    completed: {
      label: 'Completed',
      labelZh: '已完成',
      icon: CheckCircle,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      dotColor: 'bg-blue-500',
    },
    failed: {
      label: 'Failed',
      labelZh: '失败',
      icon: XCircle,
      color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      dotColor: 'bg-red-500',
    },
    expired: {
      label: 'Expired',
      labelZh: '已过期',
      icon: XCircle,
      color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
      dotColor: 'bg-gray-500',
    },
  };

  if (orders.length === 0) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            {t.orders.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {t.orders.noOrders}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              暂无订单。通过API创建您的第一个支付订单。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-500" />
          {t.orders.title}
        </CardTitle>
        <Button variant="outline" size="sm" className="text-xs">
          View All / 查看全部
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-foreground font-semibold">
                  {t.orders.orderNumber} / 订单号
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  {t.orders.amount} / 金额
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  {t.orders.status} / 状态
                </TableHead>
                <TableHead className="text-foreground font-semibold hidden md:table-cell">
                  {t.orders.paymentAddress} / 支付地址
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  {t.orders.created} / 创建时间
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order, index) => {
                const config = statusConfig[order.status] || statusConfig.pending;
                const Icon = config.icon;
                
                return (
                  <TableRow
                    key={order.id}
                    className="border-border hover:bg-secondary/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <code className="font-mono text-sm bg-secondary px-2 py-1 rounded text-foreground">
                        {order.orderNumber}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">
                        {order.amount}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        {order.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${config.color} gap-1.5 font-medium`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                        {config.label} / {config.labelZh}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {order.paymentAddress ? (
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs text-muted-foreground">
                            {order.paymentAddress.slice(0, 6)}...{order.paymentAddress.slice(-4)}
                          </code>
                          <a
                            href={`https://bscscan.com/address/${order.paymentAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
