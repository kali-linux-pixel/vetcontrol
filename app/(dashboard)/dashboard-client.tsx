'use client';

import React, { useState, useTransition } from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { AppointmentTable } from '@/components/dashboard/appointment-table';
import { InventoryAlertCard } from '@/components/dashboard/inventory-alert-card';
import { VaccineSchedule } from '@/components/dashboard/vaccine-schedule';
import { RevenueSummary } from '@/components/dashboard/revenue-summary';
import { Appointment, InventoryItem, RevenueData } from '@/types';
import { updateAppointmentStatus } from '@/app/actions/appointments';
import { Users, PawPrint, Calendar, AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 relative">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Dashboard</h2>
          <p className="text-sm text-neutral-500 mt-1">Operational diagnostics and multi-tenant ledger synchronization.</p>
        </div>
      </div>

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
