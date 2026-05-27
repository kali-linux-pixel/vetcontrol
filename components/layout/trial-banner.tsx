'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrialStatus } from '@/lib/subscription';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrialBannerProps {
  statusInfo: TrialStatus;
}

export function TrialBanner({ statusInfo }: TrialBannerProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isBillingPage = pathname === '/billing';
  const isSettingsPage = pathname === '/settings';

  useEffect(() => {
    // If trial is expired, restrict access to only /billing and /settings
    if (statusInfo.isExpired && !isBillingPage && !isSettingsPage) {
      router.push('/billing?reason=expired');
    }
  }, [statusInfo.isExpired, pathname, isBillingPage, isSettingsPage, router]);

  // If expired, render a critical alert banner at the top of the pages
  if (statusInfo.isExpired) {
    return (
      <div className="bg-rose-600 text-white px-4 py-3 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md z-50">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 text-rose-100 shrink-0" />
          <span>Tu prueba gratuita ha expirado. Actualiza tu plan para restaurar el acceso completo al historial de mascotas y a la programación de citas.</span>
        </div>
        {!isBillingPage && (
          <Link href="/billing" className="bg-white text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shrink-0 transition-colors">
            Actualizar Plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    );
  }

  // If active trial, show a premium countdown banner
  if (statusInfo.isTrial) {
    const isCritical = statusInfo.remainingDays <= 3;
    return (
      <div className={cn(
        "px-4 py-2 text-xs font-semibold flex items-center justify-between border-b transition-colors shadow-2xs select-none",
        isCritical 
          ? "bg-amber-50 border-amber-100 text-amber-900" 
          : "bg-emerald-50/50 border-emerald-100/50 text-emerald-900"
      )}>
        <div className="flex items-center gap-2">
          <Sparkles className={cn("h-4 w-4 shrink-0", isCritical ? "text-amber-500" : "text-emerald-500")} />
          <span>
            {isCritical 
              ? `Advertencia: Solo quedan ${statusInfo.remainingDays} días de tu prueba gratuita.` 
              : `Modo de Prueba: Quedan ${statusInfo.remainingDays} días de tu prueba gratuita.`}
          </span>
        </div>
        <Link 
          href="/billing" 
          className={cn(
            "px-2.5 py-1 rounded-md text-[10px] font-bold tracking-tight hover:underline flex items-center gap-0.5 transition-all",
            isCritical ? "text-amber-700 hover:text-amber-900" : "text-emerald-700 hover:text-emerald-900"
          )}
        >
          Desbloquear SaaS Completo
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return null;
}
