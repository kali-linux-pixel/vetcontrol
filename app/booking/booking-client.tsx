'use client';

import React, { useState, useTransition, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CalendarDays, ShieldAlert, Check, Loader2, ArrowRight, Calendar, MessageSquare, Phone } from 'lucide-react';
import { createPublicBooking } from '@/app/actions/public-booking';
import { cn } from '@/lib/utils';

interface BookingClientProps {
  clinicId: string;
  clinicName: string;
}

const translateType = (type: string) => {
  switch (type) {
    case 'Consultation': return 'Consulta General';
    case 'Surgery': return 'Cirugía / Operación';
    case 'Vaccination': return 'Vacunación';
    case 'Check-up': return 'Control Preventivo';
    case 'Dental': return 'Tratamiento Dental';
    case 'Grooming': return 'Estética / Baño';
    default: return type;
  }
};

export default function BookingClient({ clinicId, clinicName }: BookingClientProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    ownerName: string;
    petName: string;
    date: string;
    time: string;
    type: string;
  } | null>(null);

  const handleBookingSubmit = async (prevState: any, formData: FormData) => {
    // Call server action
    const res = await createPublicBooking(clinicId, prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    
    // Save details for success screen
    setSuccessData({
      ownerName: formData.get('ownerName') as string,
      petName: formData.get('petName') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      type: translateType(formData.get('type') as string),
    });
    
    setIsSuccess(true);
    return { success: true };
  };

  const [state, action, isPending] = useActionState(handleBookingSubmit, null);

  const openWhatsAppConfirmation = () => {
    if (!successData) return;
    // Redirect owner to send message to the clinic
    const text = `Hola, acabo de registrar una cita online para mi mascota ${successData.petName} en la clínica ${clinicName} para el ${successData.date} a las ${successData.time} (${successData.type}). ¡Gracias!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (isSuccess && successData) {
    return (
      <Card className="border border-neutral-100 bg-white shadow-xl rounded-2xl animate-fade-in">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-650 mx-auto border border-emerald-100 shadow-2xs">
            <Check className="h-7 w-7" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-neutral-900">¡Cita Reservada Exitosamente!</h3>
            <p className="text-xs text-neutral-400">
              Hemos registrado la solicitud de turno en el sistema de <strong className="text-neutral-700 font-semibold">{clinicName}</strong>.
            </p>
          </div>

          <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-4 text-xs text-left divide-y divide-neutral-100 font-medium text-neutral-600 space-y-2.5">
            <div className="flex justify-between items-center pb-2.5 pt-1.5">
              <span>Clínica:</span>
              <strong className="text-neutral-900 font-bold">{clinicName}</strong>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span>Propietario:</span>
              <strong className="text-neutral-900 font-bold">{successData.ownerName}</strong>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span>Mascota:</span>
              <strong className="text-neutral-900 font-bold">{successData.petName}</strong>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span>Fecha y Hora:</span>
              <strong className="text-neutral-900 font-bold">{successData.date} • {successData.time}</strong>
            </div>
            <div className="flex justify-between items-center pt-2.5 pb-1">
              <span>Servicio:</span>
              <strong className="text-neutral-900 font-bold">{successData.type}</strong>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Button
              onClick={openWhatsAppConfirmation}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-10 font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
              Notificar por WhatsApp
            </Button>
            <p className="text-[10px] text-neutral-400 italic">
              * Puedes compartir los datos de tu reserva con la veterinaria para confirmar con anticipación.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-neutral-100 bg-white shadow-xl rounded-2xl overflow-hidden animate-fade-in">
      <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 p-6">
        <CardTitle className="text-base font-extrabold text-neutral-900">Reserva tu Cita Médica</CardTitle>
        <CardDescription className="text-xs text-neutral-500 mt-1 leading-relaxed">
          Estás reservando en: <strong className="text-emerald-700 font-bold">{clinicName}</strong>. Completa tus datos y los de tu mascota a continuación.
        </CardDescription>
      </CardHeader>
      
      <form action={action} className="p-6 space-y-5">
        {state?.error && (
          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 rounded-xl font-semibold leading-relaxed">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-rose-650" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Dueño block */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-neutral-800 border-l-2 border-emerald-650 pl-2 leading-none">
            Información del Propietario (Dueño)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-[10.5px] font-bold text-neutral-500">Nombre Completo *</label>
              <Input name="ownerName" placeholder="Carlos Mendoza" required className="h-9 text-xs" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-neutral-500">Número de Celular *</label>
              <Input name="ownerPhone" placeholder="987654321" required className="h-9 text-xs" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-neutral-500">Número de DNI (Recomendado)</label>
              <Input name="ownerDni" placeholder="12345678" className="h-9 text-xs" disabled={isPending} />
            </div>
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-[10.5px] font-bold text-neutral-500">Dirección Domiciliaria (Opcional)</label>
              <Input name="ownerAddress" placeholder="Av. Larco 123, Miraflores" className="h-9 text-xs" disabled={isPending} />
            </div>
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-[10.5px] font-bold text-neutral-500">Correo Electrónico (Opcional)</label>
              <Input name="ownerEmail" type="email" placeholder="carlos@gmail.com" className="h-9 text-xs" disabled={isPending} />
            </div>
          </div>
        </div>

        {/* Mascota block */}
        <div className="space-y-3.5 pt-2">
          <h3 className="text-xs font-bold text-neutral-800 border-l-2 border-emerald-650 pl-2 leading-none">
            Información del Paciente (Mascota)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-neutral-500">Nombre Mascota *</label>
              <Input name="petName" placeholder="Toby" required className="h-9 text-xs" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-neutral-500">Especie *</label>
              <select
                name="petSpecies"
                required
                className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                disabled={isPending}
              >
                <option value="dog">Perro</option>
                <option value="cat">Gato</option>
                <option value="rabbit">Conejo</option>
                <option value="bird">Ave</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-neutral-500">Raza *</label>
              <Input name="petBreed" placeholder="Siberiano / Criollo" required className="h-9 text-xs" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-neutral-500">Edad Estimada *</label>
              <Input name="petAge" placeholder="2 años / 5 meses" required className="h-9 text-xs" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-neutral-500">Sexo</label>
              <select
                name="petSex"
                className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                disabled={isPending}
              >
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-neutral-500">Peso aproximado (Opcional)</label>
              <Input name="petWeight" placeholder="10.5 kg" className="h-9 text-xs" disabled={isPending} />
            </div>
          </div>
        </div>

        {/* Turno block */}
        <div className="space-y-3.5 pt-2">
          <h3 className="text-xs font-bold text-neutral-800 border-l-2 border-emerald-650 pl-2 leading-none">
            Detalles de la Cita
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-[10.5px] font-bold text-neutral-500">Motivo de Cita / Servicio *</label>
              <select
                name="type"
                required
                className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                disabled={isPending}
              >
                <option value="Consultation">Consulta Médica</option>
                <option value="Surgery">Cirugía / Esterilización</option>
                <option value="Vaccination">Vacunación</option>
                <option value="Check-up">Chequeo General Preventivo</option>
                <option value="Dental">Profilaxis Dental</option>
                <option value="Grooming">Estética / Baño y Corte</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-neutral-500">Fecha Deseada *</label>
              <Input name="date" type="date" required className="h-9 text-xs" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-neutral-500">Hora Deseada *</label>
              <Input name="time" placeholder="10:30 AM" required className="h-9 text-xs" disabled={isPending} />
            </div>
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-[10.5px] font-bold text-neutral-500">Síntomas / Notas para el doctor (Opcional)</label>
              <textarea
                name="notes"
                placeholder="Escribe brevemente si presenta algún síntoma, dolor o si requiere una vacuna específica..."
                className="flex min-h-[60px] w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-xs shadow-2xs transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-emerald-500/20 text-neutral-700 resize-none bg-white"
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row gap-2">
          <Button
            type="submit"
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs h-10 font-bold gap-1.5 shadow-sm transition-all cursor-pointer"
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar Solicitud de Cita
            {!isPending && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </form>
    </Card>
  );
}
