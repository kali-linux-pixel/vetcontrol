'use client';

import React, { useState } from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { AppointmentTable } from '@/components/dashboard/appointment-table';
import { InventoryAlertCard } from '@/components/dashboard/inventory-alert-card';
import { VaccineSchedule } from '@/components/dashboard/vaccine-schedule';
import { RevenueSummary } from '@/components/dashboard/revenue-summary';
import { 
  mockAppointments, 
  mockInventoryItems, 
  mockVaccineReminders, 
  mockRevenueData 
} from '@/lib/mock-data';
import { Appointment } from '@/types';
import { Users, PawPrint, Calendar, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  // Stateful dashboard data to allow real-time interactions
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [reorderedIds, setReorderedIds] = useState<string[]>([]);
  const [sentReminderIds, setSentReminderIds] = useState<string[]>([]);

  // Update appointment status handler
  const handleStatusChange = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
    );
  };

  // Reorder low stock items handler
  const handleReorder = (id: string) => {
    setReorderedIds(prev => [...prev, id]);
  };

  // Send vaccine reminder handler
  const handleSendReminder = (id: string) => {
    setSentReminderIds(prev => [...prev, id]);
  };

  // Compute live statistics based on state
  const activeAppointmentsCount = appointments.filter(a => a.date === '2026-05-26' && a.status !== 'Cancelled').length;
  const lowStockCount = mockInventoryItems.filter(item => item.stock <= item.minStock).length - reorderedIds.length;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Welcome back, Dr. Blackwell</h2>
          <p className="text-sm text-neutral-500 mt-1">Here is what is happening at VetControl Downtown clinic today.</p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value="1,248"
          icon={<Users className="h-4.5 w-4.5" />}
          trend={{ value: 12.5, label: "from last month", isPositive: true }}
        />
        <StatCard
          title="Active Patients"
          value="892"
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

      {/* Main Grid: Revenue and Schedules */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Revenue and Appointment List */}
        <div className="space-y-6 lg:col-span-2">
          {/* Revenue chart widget */}
          <RevenueSummary data={mockRevenueData} />

          {/* Appointment list widget */}
          <AppointmentTable 
            appointments={appointments} 
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Right 1 Column: Inventory Alerts & Upcoming Vaccines */}
        <div className="space-y-6">
          {/* Low Stock Alerts widget */}
          <InventoryAlertCard 
            items={mockInventoryItems} 
            onReorder={handleReorder}
            reorderedIds={reorderedIds}
          />

          {/* Vaccine schedule widget */}
          <VaccineSchedule 
            reminders={mockVaccineReminders} 
            onSendReminder={handleSendReminder}
            sentIds={sentReminderIds}
          />
        </div>
      </div>
    </div>
  );
}
