'use client';

import React, { useState } from 'react';
import { mockAppointments } from '@/lib/mock-data';
import { Appointment } from '@/types';
import { AppointmentTable } from '@/components/dashboard/appointment-table';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [searchQuery, setSearchQuery] = useState('');

  const handleStatusChange = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
    );
  };

  // Group appointments into Today, Tomorrow, and Future
  const todayStr = '2026-05-26';
  const tomorrowStr = '2026-05-27';

  const filteredAppointments = appointments.filter(apt => 
    apt.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.veterinarian.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayAppointments = filteredAppointments.filter(apt => apt.date === todayStr);
  const tomorrowAppointments = filteredAppointments.filter(apt => apt.date === tomorrowStr);
  const otherAppointments = filteredAppointments.filter(apt => apt.date !== todayStr && apt.date !== tomorrowStr);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Appointments Scheduler</h2>
          <p className="text-sm text-neutral-500 mt-1">Book, update, and manage clinic visits, surgery schedules, and consultation rosters.</p>
        </div>
        <Button className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 self-start sm:self-auto rounded-lg">
          <Plus className="h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by pet, owner, vet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-neutral-400 font-medium sm:ml-auto">
          Active calendar bookings: {filteredAppointments.length}
        </div>
      </div>

      {/* Lists divided by Timeframes */}
      <div className="space-y-8">
        {/* Today's Appointments */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 px-1">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <h3>Today • May 26, 2026</h3>
            <span className="text-xs font-normal text-neutral-400">({todayAppointments.length} bookings)</span>
          </div>
          <AppointmentTable 
            appointments={todayAppointments} 
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Tomorrow's Appointments */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 px-1">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            <h3>Tomorrow • May 27, 2026</h3>
            <span className="text-xs font-normal text-neutral-400">({tomorrowAppointments.length} bookings)</span>
          </div>
          <AppointmentTable 
            appointments={tomorrowAppointments} 
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Past or Other Appointments */}
        {otherAppointments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 px-1">
              <CalendarDays className="h-4 w-4 text-neutral-500" />
              <h3>Other / Historical Bookings</h3>
              <span className="text-xs font-normal text-neutral-400">({otherAppointments.length} bookings)</span>
            </div>
            <AppointmentTable 
              appointments={otherAppointments} 
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
