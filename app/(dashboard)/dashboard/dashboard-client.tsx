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
}

export default function DashboardClient({
  clientsCount,
  petsCount,
  initialAppointments,
  initialInventoryItems,
  revenueData
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
        showToast(`Appointment marked as ${newStatus}`);
      }
    });
  };

  // Simulated restock trigger
  const handleReorder = (id: string) => {
    setReorderedIds(prev => [...prev, id]);
    const item = initialInventoryItems.find(i => i.id === id);
    showToast(`Simulated restock order sent for ${item?.name || 'product'}`);
  };

  // Simulated vaccine reminder trigger
  const handleSendReminder = (id: string) => {
    setSentReminderIds(prev => [...prev, id]);
    showToast('Vaccination reminder sent to owner email');
  };

  // Count active appointments and low stock items
  const activeAppointmentsCount = initialAppointments.filter(a => a.status !== 'Cancelled').length;
  const lowStockCount = initialInventoryItems.filter(item => item.stock <= item.minStock).length - reorderedIds.length;

  // Mock reminders (since we don't have a table, we query from pets or default back to mock)
  const vaccineReminders = [
    {
      id: 'v1',
      petName: 'Max',
      petSpecies: 'dog' as const,
      vaccineName: 'DHPP (Distemper/Parvo)',
      dueDate: '2026-06-02',
      ownerName: 'Sarah Connor',
      ownerEmail: 'sarah.c@sky.net',
      status: 'Pending' as const,
    },
    {
      id: 'v3',
      petName: 'Ace',
      petSpecies: 'dog' as const,
      vaccineName: 'Bordetella (Kennel Cough)',
      dueDate: '2026-05-20',
      ownerName: 'Bruce Wayne',
      ownerEmail: 'bruce@waynecorp.com',
      status: 'Overdue' as const,
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in relative">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Dashboard</h2>
          <p className="text-sm text-neutral-500 mt-1">Operational diagnostics and multi-tenant ledger synchronization.</p>
        </div>
      </div>

      {/* Onboarding Checklist Card */}
      {(() => {
        const hasClients = clientsCount > 0;
        const hasPets = petsCount > 0;
        const hasAppointments = initialAppointments.length > 0;
        
        const steps = [
          { id: 1, label: 'Create Clinic Tenant Account', isCompleted: true, href: '#' },
          { id: 2, label: 'Register Your First Client', isCompleted: hasClients, href: '/clients' },
          { id: 3, label: 'Create Patient Pet Profile', isCompleted: hasPets, href: '/pets' },
          { id: 4, label: 'Schedule First Consultation', isCompleted: hasAppointments, href: '/appointments' },
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
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Onboarding Checklist</span>
                  <span className="text-xs font-bold text-neutral-400">{completedSteps} of {steps.length} completed</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Welcome to VetControl! Let's set up your practice.</h3>
                <p className="text-xs text-neutral-500 max-w-xl">Follow these quick start steps to configure your clinic and manage your first patient bookings.</p>
              </div>
              
              {/* Progress Circle or Bar */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-bold text-neutral-400">Clinic Setup Progress</p>
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
                    <span className="text-[10px] font-bold text-neutral-400">Step 0{step.id}</span>
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
                        Get Started →
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
          title="Total Clients"
          value={clientsCount}
          icon={<Users className="h-4.5 w-4.5" />}
          trend={{ value: 12.5, label: "from last month", isPositive: true }}
        />
        <StatCard
          title="Active Patients"
          value={petsCount}
          icon={<PawPrint className="h-4.5 w-4.5" />}
          trend={{ value: 8.2, label: "from last month", isPositive: true }}
        />
        <StatCard
          title="Appointments Today"
          value={activeAppointmentsCount}
          icon={<Calendar className="h-4.5 w-4.5" />}
          trend={{ value: 15.3, label: "vs yesterday", isPositive: true }}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          icon={<AlertTriangle className="h-4.5 w-4.5" />}
          trend={lowStockCount > 0 ? { value: lowStockCount, label: "items restock needed", isPositive: false } : undefined}
          description={lowStockCount === 0 ? "All items fully stocked" : undefined}
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
            reminders={vaccineReminders} 
            onSendReminder={handleSendReminder}
            sentIds={sentReminderIds}
          />
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
