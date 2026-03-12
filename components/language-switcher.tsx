'use client';

import { useTranslation } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-foreground hover:bg-secondary"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{locale === 'en' ? 'EN' : '中文'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setLocale('en')}
          className="flex items-center justify-between cursor-pointer"
        >
          <span>English</span>
          {locale === 'en' && <Check className="h-4 w-4 text-accent" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('zh')}
          className="flex items-center justify-between cursor-pointer"
        >
          <span>中文</span>
          {locale === 'zh' && <Check className="h-4 w-4 text-accent" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
