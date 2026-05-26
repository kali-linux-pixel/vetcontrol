'use client';

import React, { useState, useTransition, useActionState } from 'react';
import { Appointment } from '@/types';
import { createAppointment, updateAppointment, deleteAppointment, updateAppointmentStatus } from '@/app/actions/appointments';
import { AppointmentTable } from '@/components/dashboard/appointment-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CalendarDays, Plus, Calendar, Search, Loader2, Edit, Trash2, Check, X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppointmentsClientProps {
  initialAppointments: Appointment[];
  petsList: { id: string; name: string; ownerName: string }[];
}

export default function AppointmentsClient({ initialAppointments, petsList }: AppointmentsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const [isMutating, startTransition] = useTransition();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddSubmit = async (prevState: any, formData: FormData) => {
    const res = await createAppointment(prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsAddOpen(false);
    showToast('Appointment booked successfully.');
    return { success: true };
  };

  const handleEditSubmit = async (prevState: any, formData: FormData) => {
    if (!selectedApt) return { error: 'No appointment selected.' };
    const res = await updateAppointment(selectedApt.id, prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsEditOpen(false);
    showToast('Appointment details updated.');
    return { success: true };
  };

  const handleStatusChange = async (id: string, newStatus: Appointment['status']) => {
    startTransition(async () => {
      const res = await updateAppointmentStatus(id, newStatus);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Appointment status updated to ${newStatus}`);
      }
    });
  };

  const handleDeleteSubmit = async () => {
    if (!selectedApt) return;
    startTransition(async () => {
      const res = await deleteAppointment(selectedApt.id);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        setIsDeleteOpen(false);
        showToast('Appointment cancelled and removed.');
      }
    });
  };

  const [addState, addAction, addPending] = useActionState(handleAddSubmit, null);
  const [editState, editAction, editPending] = useActionState(handleEditSubmit, null);

  // Group appointments into Today, Tomorrow, and Future
  const todayStr = '2026-05-26';
  const tomorrowStr = '2026-05-27';

  const filteredAppointments = initialAppointments.filter(apt => 
    apt.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.veterinarian.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayAppointments = filteredAppointments.filter(apt => apt.date === todayStr);
  const tomorrowAppointments = filteredAppointments.filter(apt => apt.date === tomorrowStr);
  const otherAppointments = filteredAppointments.filter(apt => apt.date !== todayStr && apt.date !== tomorrowStr);

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Appointments Scheduler</h2>
          <p className="text-sm text-neutral-500 mt-1">Book, update, and manage clinic visits, surgery schedules, and consultation rosters.</p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 self-start sm:self-auto rounded-lg"
        >
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

      {/* BOOK APPOINTMENT DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Book New Appointment</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Schedule a visit slot for a registered clinic patient.</DialogDescription>
          </DialogHeader>
          <form action={addAction} className="space-y-4">
            {addState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{addState.error}</p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Select Patient (Pet)</label>
              <select 
                name="petId" 
                required 
                className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                disabled={addPending}
              >
                <option value="">Choose patient...</option>
                {petsList.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.ownerName})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Service Type</label>
                <select 
                  name="type" 
                  required 
                  className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                  disabled={addPending}
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Check-up">Check-up</option>
                  <option value="Dental">Dental</option>
                  <option value="Grooming">Grooming</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Veterinarian Doctor</label>
                <Input name="veterinarian" placeholder="Dr. Elizabeth Blackwell" required className="h-9 text-xs" disabled={addPending} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Booking Date</label>
                <Input name="date" type="date" defaultValue="2026-05-26" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Slot Time</label>
                <Input name="time" placeholder="10:00 AM" required className="h-9 text-xs" disabled={addPending} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Diagnosis/Symptom Notes (Optional)</label>
              <textarea 
                name="notes" 
                placeholder="Brief reason for the visit..."
                className="flex min-h-[60px] w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-xs shadow-2xs transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50 text-neutral-700 bg-white resize-none"
                disabled={addPending}
              />
            </div>
            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-9 text-xs rounded-lg" disabled={addPending}>Cancel</Button>
              <Button type="submit" className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg gap-1.5" disabled={addPending}>
                {addPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5 duration-200",
          toast.type === 'success' ? "bg-white border-neutral-200 text-neutral-900" : "bg-rose-50 border-rose-200 text-rose-700"
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
