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
import { Plus, RefreshCw, Wallet, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/context';

interface WalletData {
  id: string;
  address: string;
  derivationPath: string;
  balanceBNB: string;
  balanceUSDT: string;
  balanceUSDC: string;
  lastChecked: string;
  createdAt: string;
}

interface WalletsSectionProps {
  apiKey: string;
}

export function WalletsSection({ apiKey }: WalletsSectionProps) {
  const { t } = useTranslation();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, [apiKey]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/wallets', {
        headers: { 'X-API-Key': apiKey },
      });

      if (response.ok) {
        const data = await response.json();
        setWallets(data.wallets);
      } else {
        toast.error(t.wallets.failedFetch);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t.wallets.failedFetch);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/v1/wallets', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast.success(t.wallets.walletCreated);
        await fetchWallets();
      } else {
        toast.error(t.wallets.failedCreate);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t.wallets.failedCreate);
    } finally {
      setCreating(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success(t.common.copied);
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-violet-500" />
          {t.wallets.title}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWallets}
            disabled={loading}
            className="border-border gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t.common.refresh}
          </Button>
          <Button
            size="sm"
            onClick={createWallet}
            disabled={creating}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 gap-2"
          >
            {creating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {t.wallets.newWallet}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {wallets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center border border-violet-500/20">
              <Wallet className="w-8 h-8 text-violet-500" />
            </div>
            <p className="text-muted-foreground mb-2">
              {t.wallets.noWallets}
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              暂无钱包。创建一个以开始接收支付。
            </p>
            <Button
              onClick={createWallet}
              disabled={creating}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 gap-2"
            >
              <Plus className="w-4 h-4" />
              {t.wallets.createFirst}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-foreground font-semibold">
                    {t.wallets.address} / 地址
                  </TableHead>
                  <TableHead className="text-foreground font-semibold hidden md:table-cell">
                    {t.wallets.derivationPath} / 派生路径
                  </TableHead>
                  <TableHead className="text-foreground font-semibold text-right">
                    {t.wallets.bnbBalance}
                  </TableHead>
                  <TableHead className="text-foreground font-semibold text-right">
                    {t.wallets.usdtBalance}
                  </TableHead>
                  <TableHead className="text-foreground font-semibold text-right">
                    {t.wallets.usdcBalance}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet, index) => (
                  <TableRow
                    key={wallet.id}
                    className="border-border hover:bg-secondary/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-violet-500" />
                        </div>
                        <code className="font-mono text-sm bg-secondary px-2 py-1 rounded">
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyAddress(wallet.address)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <a
                          href={`https://bscscan.com/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-500 hover:text-amber-400"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                      {wallet.derivationPath}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-foreground">
                        {parseFloat(wallet.balanceBNB).toFixed(4)}
                      </span>
                      <span className="text-amber-500 text-xs ml-1">BNB</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-foreground">
                        {parseFloat(wallet.balanceUSDT).toFixed(2)}
                      </span>
                      <span className="text-emerald-500 text-xs ml-1">USDT</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-foreground">
                        {parseFloat(wallet.balanceUSDC).toFixed(2)}
                      </span>
                      <span className="text-blue-500 text-xs ml-1">USDC</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
