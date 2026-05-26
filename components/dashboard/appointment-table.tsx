import React from 'react';
import { Appointment } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight, MoreHorizontal } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface AppointmentTableProps {
  appointments: Appointment[];
  limit?: number;
  onViewAll?: () => void;
  onStatusChange?: (id: string, newStatus: Appointment['status']) => void;
}

export function AppointmentTable({ 
  appointments, 
  limit, 
  onViewAll,
  onStatusChange 
}: AppointmentTableProps) {
  const displayedAppointments = limit ? appointments.slice(0, limit) : appointments;

  const getStatusStyles = (status: Appointment['status']) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-50/80 text-blue-700 border border-blue-100/50';
      case 'Checked-in':
        return 'bg-indigo-50/80 text-indigo-700 border border-indigo-100/50';
      case 'In-Progress':
        return 'bg-amber-50/80 text-amber-700 border border-amber-100/50';
      case 'Completed':
        return 'bg-emerald-50/80 text-emerald-700 border border-emerald-100/50';
      case 'Cancelled':
        return 'bg-rose-50/80 text-rose-700 border border-rose-100/50';
      default:
        return 'bg-neutral-50 text-neutral-700 border border-neutral-100';
    }
  };

  const getTypeStyles = (type: Appointment['type']) => {
    switch (type) {
      case 'Consultation':
        return 'bg-teal-50 text-teal-800';
      case 'Surgery':
        return 'bg-fuchsia-50 text-fuchsia-800';
      case 'Vaccination':
        return 'bg-violet-50 text-violet-800';
      case 'Check-up':
        return 'bg-neutral-100 text-neutral-800';
      case 'Dental':
        return 'bg-sky-50 text-sky-800';
      case 'Grooming':
        return 'bg-amber-50 text-amber-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getSpeciesEmoji = (species: Appointment['petSpecies']) => {
    switch (species) {
      case 'dog': return '🐶';
      case 'cat': return '🐱';
      case 'rabbit': return '🐰';
      case 'bird': return '🦜';
      default: return '🐾';
    }
  };

  return (
    <Card className="border border-neutral-100 bg-white shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-neutral-900">Today's Appointments</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Monitor patients checked in or scheduled for today
          </CardDescription>
        </div>
        {onViewAll && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewAll} 
            className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1 h-8"
          >
            View schedule
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-50/50">
              <TableRow className="hover:bg-transparent border-neutral-100">
                <TableHead className="w-[180px] text-xs font-semibold text-neutral-500 h-10 px-6">Patient</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-500 h-10">Owner</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-500 h-10">Time</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-500 h-10">Type</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-500 h-10">Status</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-500 h-10">Veterinarian</TableHead>
                <TableHead className="w-[50px] text-xs font-semibold text-neutral-500 h-10 pr-6 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-neutral-400">
                    <Calendar className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                    No appointments scheduled for today.
                  </TableCell>
                </TableRow>
              ) : (
                displayedAppointments.map((apt) => (
                  <TableRow key={apt.id} className="group hover:bg-neutral-50/50 transition-colors border-neutral-100">
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-base shadow-2xs border border-neutral-200/50">
                          {getSpeciesEmoji(apt.petSpecies)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900 leading-none">{apt.petName}</p>
                          <p className="text-xs text-neutral-400 capitalize mt-1 leading-none">{apt.petSpecies}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className="text-sm text-neutral-600 font-medium">{apt.ownerName}</span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className="text-sm font-semibold text-neutral-900">{apt.time}</span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                        getTypeStyles(apt.type)
                      )}>
                        {apt.type}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tracking-tight",
                        getStatusStyles(apt.status)
                      )}>
                        {apt.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className="text-sm text-neutral-500 font-medium">{apt.veterinarian}</span>
                    </TableCell>
                    <TableCell className="py-3.5 pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px] border border-neutral-100 shadow-lg">
                          <DropdownMenuItem className="text-xs cursor-pointer">
                            View details
                          </DropdownMenuItem>
                          {onStatusChange && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(apt.id, 'Checked-in')}
                                className="text-xs cursor-pointer"
                              >
                                Mark as Checked-in
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(apt.id, 'In-Progress')}
                                className="text-xs cursor-pointer"
                              >
                                Mark as In-Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(apt.id, 'Completed')}
                                className="text-xs text-emerald-600 focus:text-emerald-700 cursor-pointer"
                              >
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(apt.id, 'Cancelled')}
                                className="text-xs text-rose-600 focus:text-rose-700 cursor-pointer"
                              >
                                Cancel Appointment
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
