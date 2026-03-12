'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Eye, EyeOff, Trash2, Key, Code, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/context';

interface APIKey {
  id: string;
  name: string;
  lastUsed: string;
  isActive: boolean;
  createdAt: string;
}

interface APIKeysSectionProps {
  apiKey: string;
}

export function APIKeysSection({ apiKey }: APIKeysSectionProps) {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchApiKeys();
  }, [apiKey]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/merchants/api-keys', {
        headers: { 'X-API-Key': apiKey },
      });

      if (response.ok) {
        const data = await response.json();
        setKeys(data.keys);
      } else {
        toast.error('Failed to fetch API keys');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error fetching API keys');
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t.common.copied);
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5 text-pink-500" />
          {t.apiKeys.title}
        </CardTitle>
        <Button
          size="sm"
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.apiKeys.newApiKey}
        </Button>
      </CardHeader>

      <CardContent>
        {keys.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 flex items-center justify-center border border-pink-500/20">
              <Key className="w-8 h-8 text-pink-500" />
            </div>
            <p className="text-muted-foreground">
              {t.apiKeys.noKeys}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              暂无API密钥。创建一个以集成到您的应用程序。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-foreground font-semibold">
                    {t.apiKeys.name} / 名称
                  </TableHead>
                  <TableHead className="text-foreground font-semibold">
                    {t.apiKeys.status} / 状态
                  </TableHead>
                  <TableHead className="text-foreground font-semibold">
                    {t.apiKeys.lastUsed} / 最后使用
                  </TableHead>
                  <TableHead className="text-foreground font-semibold">
                    {t.apiKeys.created} / 创建时间
                  </TableHead>
                  <TableHead className="text-foreground font-semibold text-right">
                    {t.apiKeys.actions} / 操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key, index) => (
                  <TableRow
                    key={key.id}
                    className="border-border hover:bg-secondary/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                          <Key className="w-4 h-4 text-pink-500" />
                        </div>
                        <span className="font-semibold text-foreground">{key.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          key.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
                        }
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${key.isActive ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        {key.isActive ? `${t.apiKeys.active} / 活跃` : `${t.apiKeys.inactive} / 未激活`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.lastUsed
                        ? new Date(key.lastUsed).toLocaleDateString()
                        : `${t.apiKeys.never} / 从未`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          {visibleKeys[key.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* API Documentation Section */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Code className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold">{t.apiKeys.integrationTitle} / API集成</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.apiKeys.integrationDesc}
          </p>
          <p className="text-sm text-muted-foreground">
            在所有请求的X-API-Key头中包含您的API密钥：
          </p>
          
          <div className="relative">
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">bash</span>
            </div>
            <pre className="bg-secondary/50 border border-border p-4 pt-10 rounded-xl text-sm font-mono text-foreground overflow-x-auto">
{`curl -X POST https://your-domain.com/api/v1/orders \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "10.00",
    "currency": "USDT",
    "orderNumber": "ORDER-001"
  }'`}
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8"
              onClick={() => copyToClipboard(`curl -X POST https://your-domain.com/api/v1/orders \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": "10.00", "currency": "USDT", "orderNumber": "ORDER-001"}'`)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { endpoint: 'POST /api/v1/orders', desc: 'Create Order / 创建订单' },
              { endpoint: 'GET /api/v1/orders/:id', desc: 'Get Order / 查询订单' },
              { endpoint: 'GET /api/v1/wallets', desc: 'List Wallets / 钱包列表' },
            ].map((item) => (
              <div key={item.endpoint} className="p-3 rounded-lg bg-secondary/30 border border-border">
                <code className="text-xs text-amber-500">{item.endpoint}</code>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
