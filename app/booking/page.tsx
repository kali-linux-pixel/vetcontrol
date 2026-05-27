import React from 'react';
import type { Metadata } from 'next';
import { createServerClient } from '@/src/lib/supabase';
import BookingClient from './booking-client';
import { Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reserva de Cita Online - VetControl',
  description: 'Reserva una consulta de forma directa y rápida para tu mascota.',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function isValidUUID(val: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

export default async function BookingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const clinicId = params.clinic as string;

  if (!clinicId || !isValidUUID(clinicId)) {
    return (
      <div className="min-h-screen bg-neutral-50/50 flex flex-col items-center justify-center p-6 text-neutral-900 font-sans">
        <div className="max-w-md w-full bg-white border border-neutral-100 shadow-xl rounded-2xl p-6 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-650 mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Enlace de Reserva Inválido</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Falta el identificador único de la veterinaria o el enlace es incorrecto. Por favor, solicita el link de reservas correcto a tu veterinaria de confianza.
          </p>
          <div className="pt-2">
            <Link href="/">
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer">
                Ir al inicio de VetControl
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch the organization details
  const supabase = await createServerClient();
  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', clinicId)
    .maybeSingle();

  if (error || !org) {
    return (
      <div className="min-h-screen bg-neutral-50/50 flex flex-col items-center justify-center p-6 text-neutral-900 font-sans">
        <div className="max-w-md w-full bg-white border border-neutral-100 shadow-xl rounded-2xl p-6 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-650 mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Veterinaria no Registrada</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            No se encontró ninguna clínica veterinaria activa que corresponda a este identificador en nuestro sistema VetControl.
          </p>
          <div className="pt-2">
            <Link href="/">
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer">
                Ir al inicio de VetControl
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col justify-between py-10 font-sans select-none">
      <div className="max-w-xl w-full mx-auto px-6">
        <div className="text-center mb-6 flex flex-col items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-950 text-white">
            <Shield className="h-4.5 w-4.5 text-emerald-400 fill-emerald-400/10" />
          </div>
          <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">Portal de Reservas Online</span>
        </div>

        <BookingClient clinicId={org.id} clinicName={org.name} />
      </div>

      <footer className="text-center pt-8 text-[9px] text-neutral-400 font-semibold">
        © 2026 VetControl. Reservas seguras de extremo a extremo.
      </footer>
    </div>
  );
}
