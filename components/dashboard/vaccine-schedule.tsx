import React from 'react';
import { VaccineReminder } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Syringe, Send, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VaccineScheduleProps {
  reminders: VaccineReminder[];
  onSendReminder?: (id: string) => void;
  sentIds?: string[];
}

export function VaccineSchedule({ reminders, onSendReminder, sentIds = [] }: VaccineScheduleProps) {
  const getSpeciesEmoji = (species: VaccineReminder['petSpecies']) => {
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
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-50 text-purple-600 border border-purple-100">
            <Syringe className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-neutral-900">Upcoming Vaccines</CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Immunization reminders scheduled for this month
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        {reminders.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-100 text-center">
            <p className="text-xs font-medium text-neutral-400">No immunization reminders pending</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => {
              const isSent = sentIds.includes(reminder.id) || reminder.status === 'Sent';
              const isOverdue = reminder.status === 'Overdue';

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
                        <h4 className="text-sm font-medium text-neutral-900 leading-none">{reminder.petName}</h4>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-semibold leading-none border",
                          isOverdue 
                            ? "bg-rose-50 text-rose-700 border-rose-100" 
                            : isSent 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : "bg-blue-50 text-blue-700 border-blue-100"
                        )}>
                          {isOverdue ? 'Overdue' : isSent ? 'Sent' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1 font-medium">{reminder.vaccineName}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Due: {new Date(reminder.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • Owner: {reminder.ownerName}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => !isSent && onSendReminder?.(reminder.id)}
                    disabled={isSent}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg transition-colors border",
                      isSent
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100/50 cursor-default"
                        : "text-neutral-500 hover:text-neutral-900 border-neutral-100 hover:bg-neutral-50"
                    )}
                  >
                    {isSent ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">Notify Owner</span>
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
