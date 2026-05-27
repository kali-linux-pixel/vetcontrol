'use client';

import React, { useState, useTransition } from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { AppointmentTable } from '@/components/dashboard/appointment-table';
import { InventoryAlertCard } from '@/components/dashboard/inventory-alert-card';
import { VaccineSchedule } from '@/components/dashboard/vaccine-schedule';
import { RevenueSummary } from '@/components/dashboard/revenue-summary';
import { Appointment, InventoryItem, RevenueData } from '@/types';
import { updateAppointmentStatus } from '@/app/actions/appointments';
import { Users, PawPrint, Calendar, AlertTriangle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardClientProps {
  clientsCount: number;
  petsCount: number;
  initialAppointments: Appointment[];
  initialInventoryItems: InventoryItem[];
  revenueData: RevenueData[];
  frequentClients: { name: string; phone: string; count: number; dni?: string }[];
  recurrentPets: { name: string; species: string; ownerName: string; count: number }[];
  upcomingVaccines: any[];
}

const translateStatus = (status: string) => {
  switch (status) {
    case 'Scheduled': return 'Programada';
    case 'Checked-in': return 'En Espera';
    case 'In-Progress': return 'En Curso';
    case 'Completed': return 'Completada';
    case 'Cancelled': return 'Cancelada';
    default: return status;
  }
};

export default function DashboardClient({
  clientsCount,
  petsCount,
  initialAppointments,
  initialInventoryItems,
  revenueData,
  frequentClients,
  recurrentPets,
  upcomingVaccines
}: DashboardClientProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // State-controlled tracking for restock and vaccine interactions
  const [reorderedIds, setReorderedIds] = useState<string[]>([]);
  const [sentReminderIds, setSentReminderIds] = useState<string[]>([]);

  // Mutate appointment status via Server Action
  const handleStatusChange = async (id: string, newStatus: Appointment['status']) => {
    startTransition(async () => {
      const res = await updateAppointmentStatus(id, newStatus);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Cita marcada como ${translateStatus(newStatus)}`);
      }
    });
  };

  // Simulated restock trigger
  const handleReorder = (id: string) => {
    setReorderedIds(prev => [...prev, id]);
    const item = initialInventoryItems.find(i => i.id === id);
    showToast(`Pedido de reabastecimiento simulado enviado para ${item?.name || 'producto'}`);
  };

  // Simulated vaccine reminder trigger
  const handleSendReminder = (id: string) => {
    setSentReminderIds(prev => [...prev, id]);
    showToast('Recordatorio de vacunación enviado exitosamente');
  };

  // Count active appointments and low stock items
  const activeAppointmentsCount = initialAppointments.filter(a => a.status !== 'Cancelled').length;
  const lowStockCount = initialInventoryItems.filter(item => item.stock <= item.minStock).length - reorderedIds.length;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in relative">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Tablero / Panel</h2>
          <p className="text-sm text-neutral-500 mt-1">Diagnóstico operativo y sincronización de facturación multi-inquilino.</p>
        </div>
      </div>

      {/* Onboarding Checklist Card */}
      {(() => {
        const hasClients = clientsCount > 0;
        const hasPets = petsCount > 0;
        const hasAppointments = initialAppointments.length > 0;
        
        const steps = [
          { id: 1, label: 'Crear Cuenta de Clínica', isCompleted: true, href: '#' },
          { id: 2, label: 'Registrar tu Primer Cliente', isCompleted: hasClients, href: '/clients' },
          { id: 3, label: 'Crear Perfil de Mascota', isCompleted: hasPets, href: '/pets' },
          { id: 4, label: 'Programar Primera Cita', isCompleted: hasAppointments, href: '/appointments' },
        ];
        
        const completedSteps = steps.filter(s => s.isCompleted).length;
        const progressPercentage = Math.round((completedSteps / steps.length) * 100);
        
        // Hide onboarding if 100% complete
        if (progressPercentage === 100) return null;

        return (
          <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Lista de Configuración</span>
                  <span className="text-xs font-bold text-neutral-400">{completedSteps} de {steps.length} completados</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900">¡Bienvenido a VetControl! Configuremos tu consultorio.</h3>
                <p className="text-xs text-neutral-500 max-w-xl">Sigue estos rápidos pasos para configurar tu clínica y gestionar tus primeras citas de mascotas.</p>
              </div>
              
              {/* Progress Circle or Bar */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-bold text-neutral-400">Progreso de Configuración</p>
                  <p className="text-xl font-black text-neutral-900">{progressPercentage}%</p>
                </div>
                <div className="w-16 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 mt-6">
              {steps.map((step) => (
                <div 
                  key={step.id} 
                  className={cn(
                    "p-3.5 border rounded-xl flex flex-col justify-between h-28 transition-all",
                    step.isCompleted 
                      ? "bg-neutral-50/50 border-neutral-100 text-neutral-500" 
                      : "bg-white border-neutral-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs group cursor-pointer"
                  )}
                  onClick={() => {
                    if (!step.isCompleted && step.href !== '#') {
                      window.location.href = step.href;
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-400">Paso 0{step.id}</span>
                    <span className={cn(
                      "h-4 w-4 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all",
                      step.isCompleted 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                        : "border-neutral-200 text-neutral-400 group-hover:border-emerald-500 group-hover:text-emerald-500"
                    )}>
                      {step.isCompleted ? '✓' : step.id}
                    </span>
                  </div>
                  
                  <div className="mt-auto">
                    <p className={cn(
                       "text-xs font-semibold leading-tight",
                      step.isCompleted ? "text-neutral-400 line-through" : "text-neutral-800 group-hover:text-emerald-700"
                    )}>
                      {step.label}
                    </p>
                    {!step.isCompleted && (
                      <span className="text-[9px] font-bold text-emerald-600 group-hover:underline mt-1 block">
                        Comenzar →
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Clientes"
          value={clientsCount}
          icon={<Users className="h-4.5 w-4.5" />}
          trend={{ value: 12.5, label: "desde el mes pasado", isPositive: true }}
        />
        <StatCard
          title="Mascotas Activas"
          value={petsCount}
          icon={<PawPrint className="h-4.5 w-4.5" />}
          trend={{ value: 8.2, label: "desde el mes pasado", isPositive: true }}
        />
        <StatCard
          title="Citas de Hoy"
          value={activeAppointmentsCount}
          icon={<Calendar className="h-4.5 w-4.5" />}
          trend={{ value: 15.3, label: "vs ayer", isPositive: true }}
        />
        <StatCard
          title="Alertas de Bajo Stock"
          value={lowStockCount}
          icon={<AlertTriangle className="h-4.5 w-4.5" />}
          trend={lowStockCount > 0 ? { value: lowStockCount, label: "artículos necesitan reabastecimiento", isPositive: false } : undefined}
          description={lowStockCount === 0 ? "Todos los artículos están en stock óptimo" : undefined}
          className={lowStockCount > 0 ? "border-rose-100 bg-rose-50/10" : ""}
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Revenue chart */}
          <RevenueSummary data={revenueData} />

          {/* Appointments table */}
          <AppointmentTable 
            appointments={initialAppointments} 
            onStatusChange={handleStatusChange}
          />
        </div>

        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <InventoryAlertCard 
            items={initialInventoryItems} 
            onReorder={handleReorder}
            reorderedIds={reorderedIds}
          />

          {/* Vaccine schedule */}
          <VaccineSchedule 
            reminders={upcomingVaccines} 
            onSendReminder={handleSendReminder}
            sentIds={sentReminderIds}
          />

          {/* Clientes y Mascotas Frecuentes */}
          <div className="bg-white border border-neutral-100 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-50">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-xs">
                ★
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-800">Recurrencia & Fidelidad</h4>
                <p className="text-[10px] text-neutral-400">Pacientes y dueños más recurrentes</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Clientes frecuentes */}
              <div>
                <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Clientes Frecuentes</h5>
                <div className="space-y-2">
                  {frequentClients.map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-neutral-800">{c.name}</p>
                        <p className="text-[9px] text-neutral-400">Cel: {c.phone} {c.dni && `• DNI: ${c.dni}`}</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        {c.count} {c.count === 1 ? 'cita' : 'citas'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mascotas recurrentes */}
              <div className="pt-2 border-t border-neutral-50">
                <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 font-mono">Mascotas Recurrentes</h5>
                <div className="space-y-2">
                  {recurrentPets.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-neutral-800">{p.name} {p.species === 'dog' ? '🐶' : p.species === 'cat' ? '🐱' : '🐾'}</p>
                        <p className="text-[9px] text-neutral-400">Dueño: {p.ownerName}</p>
                      </div>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        {p.count} {p.count === 1 ? 'visita' : 'visitas'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5 duration-200",
          toast.type === 'success' 
            ? "bg-white border-neutral-200 text-neutral-900" 
            : "bg-rose-50 border-rose-200 text-rose-700"
        )}>
          {toast.type === 'success' ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-3 w-3" />
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <X className="h-3 w-3" />
            </div>
          )}
          <p className="text-xs font-semibold">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
