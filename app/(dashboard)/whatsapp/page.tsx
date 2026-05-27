import React from 'react';
import type { Metadata } from 'next';
import { createServerClient } from '@/src/lib/supabase';
import { redirect } from 'next/navigation';
import WhatsappClient from './whatsapp-client';
import { getWhatsAppConfig, getWhatsAppQueue } from '@/app/actions/whatsapp';

export const metadata: Metadata = {
  title: 'Módulo WhatsApp - VetControl',
  description: 'Gestiona alertas y recordatorios automáticos por WhatsApp para tus pacientes.',
};

export const dynamic = 'force-dynamic';

export default async function WhatsappPage() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch initial configs and queue data
  const configRes = await getWhatsAppConfig();
  const queueRes = await getWhatsAppQueue();

  if (configRes.error || !configRes.config) {
    return (
      <div className="p-6 bg-white rounded-xl border border-neutral-100 shadow-2xs text-center text-xs text-rose-650 font-semibold">
        Error al cargar configuración de WhatsApp: {configRes.error || 'Configuración no encontrada.'}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Diagnostics Header */}
      <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">Automatización Activa:</span>
          <span>Canal de mensajería listo para encolar recordatorios y alertas.</span>
        </div>
        <span className="text-[10px] text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded font-mono">WhatsApp Live</span>
      </div>

      <WhatsappClient 
        initialConfig={configRes.config} 
        initialQueue={queueRes.queue || []} 
      />
    </div>
  );
}
