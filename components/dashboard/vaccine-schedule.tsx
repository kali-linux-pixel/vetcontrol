import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Syringe, MessageSquare, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VaccineReminderExtended {
  id: string;
  petName: string;
  petSpecies: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  vaccineName: string;
  dueDate: string;
  ownerName: string;
  ownerPhone?: string;
  status: 'Pending' | 'Sent' | 'Overdue';
}

interface VaccineScheduleProps {
  reminders: VaccineReminderExtended[];
  onSendReminder?: (id: string) => void;
  sentIds?: string[];
}

export function VaccineSchedule({ reminders, onSendReminder, sentIds = [] }: VaccineScheduleProps) {
  const getSpeciesEmoji = (species: VaccineReminderExtended['petSpecies']) => {
    switch (species) {
      case 'dog': return '🐶';
      case 'cat': return '🐱';
      case 'rabbit': return '🐰';
      case 'bird': return '🦜';
      default: return '🐾';
    }
  };

  const handleWhatsAppRedirect = (reminder: VaccineReminderExtended) => {
    if (onSendReminder) {
      onSendReminder(reminder.id);
    }
    const rawPhone = reminder.ownerPhone || '';
    const phone = rawPhone.replace(/\D/g, '');
    const targetPhone = phone.length === 9 ? `51${phone}` : phone;
    
    const formattedDate = new Date(reminder.dueDate + 'T00:00:00').toLocaleDateString('es-PE', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });

    const text = encodeURIComponent(`Hola ${reminder.ownerName} 👋. Te recordamos que tu mascota ${reminder.petName} tiene programada su vacuna de "${reminder.vaccineName}" para el ${formattedDate}. Por favor confírmanos respondiendo a este mensaje para separar tu cita. ¡Gracias! 🐾`);
    
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
  };

  return (
    <Card className="border border-neutral-100 bg-white shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-50 text-purple-600 border border-purple-100">
            <Syringe className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-neutral-900">Vacunas Pendientes</CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Próximas inmunizaciones programadas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        {reminders.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-100 text-center">
            <p className="text-xs font-medium text-neutral-400">No hay recordatorios de vacunas pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => {
              const isSent = sentIds.includes(reminder.id) || reminder.status === 'Sent';
              const isOverdue = reminder.status === 'Overdue';

              const formattedDate = new Date(reminder.dueDate + 'T00:00:00').toLocaleDateString('es-PE', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });

              return (
                <div 
                  key={reminder.id}
                  className="flex items-center justify-between border-b border-neutral-50 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50 text-base border border-neutral-100">
                      {getSpeciesEmoji(reminder.petSpecies)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-semibold text-neutral-900 leading-none">{reminder.petName}</h4>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.2 text-[9px] font-bold leading-none border",
                          isOverdue 
                            ? "bg-rose-50 text-rose-700 border-rose-100" 
                            : isSent 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {isOverdue ? 'Vencida' : isSent ? 'Notificado' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1 font-medium">{reminder.vaccineName}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Fecha: {formattedDate} • Dueño: {reminder.ownerName}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleWhatsAppRedirect(reminder)}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg transition-colors border",
                      isSent
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100/50 hover:bg-emerald-100"
                        : "text-neutral-500 hover:text-emerald-600 border-neutral-100 hover:bg-emerald-50"
                    )}
                    title="Enviar recordatorio por WhatsApp"
                  >
                    {isSent ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">Notificar</span>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
