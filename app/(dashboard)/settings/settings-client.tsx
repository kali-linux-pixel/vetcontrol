'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building, Users, BellRing, Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsClientProps {
  initialFullName: string;
  initialClinicName: string;
  initialEmail: string;
}

export default function SettingsClient({
  initialFullName,
  initialClinicName,
  initialEmail
}: SettingsClientProps) {
  const [successMsg, setSuccessMsg] = useState(false);
  
  const [clinicName, setClinicName] = useState(initialClinicName);
  const [fullName, setFullName] = useState(initialFullName);
  const [clinicEmail, setClinicEmail] = useState(initialEmail);
  const [clinicPhone, setClinicPhone] = useState('(555) 010-8900');
  
  const [vetList] = useState([
    { name: initialFullName, specialty: 'Práctica General, Medicina Felina', license: 'DVM-90184' },
    { name: 'Dr. James Herriot', specialty: 'Equinos y Animales Pequeños, Cirugía', license: 'DVM-20348' },
  ]);

  const [toggles, setToggles] = useState({
    emailVaccines: true,
    smsAppointments: true,
    alertInventory: true,
    autoReports: false,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Configuración de la Clínica</h2>
          <p className="text-sm text-neutral-500 mt-1">Configura los detalles del perfil, personal activo, horarios personalizados y reglas de notificación.</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 rounded-lg flex items-center"
        >
          {successMsg ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              Configuración Guardada
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Clinic Profile */}
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardHeader className="pb-4 border-b border-neutral-50 flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-neutral-600 border border-neutral-200/50">
              <Building className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900">Perfil de la Clínica</CardTitle>
              <CardDescription className="text-xs text-neutral-500">Metadatos públicos y canales de contacto para la comunicación con clientes.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Nombre de la Clínica</label>
                <Input 
                  value={clinicName} 
                  onChange={(e) => setClinicName(e.target.value)}
                  className="h-9 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Administrador de Personal</label>
                <Input 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-9 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Correo de Contacto</label>
                <Input 
                  type="email" 
                  value={clinicEmail} 
                  onChange={(e) => setClinicEmail(e.target.value)}
                  className="h-9 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Línea Telefónica</label>
                <Input 
                  value={clinicPhone} 
                  onChange={(e) => setClinicPhone(e.target.value)}
                  className="h-9 text-xs" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Directory */}
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardHeader className="pb-4 border-b border-neutral-50 flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-neutral-600 border border-neutral-200/50">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900">Veterinarios y Doctores</CardTitle>
              <CardDescription className="text-xs text-neutral-500">Gestiona los veterinarios registrados y sus licencias.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="divide-y divide-neutral-50">
              {vetList.map((vet, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900">{vet.name}</h4>
                    <p className="text-xs text-neutral-500 mt-1">{vet.specialty}</p>
                  </div>
                  <span className="text-xs bg-neutral-50 font-mono border border-neutral-200/50 text-neutral-600 px-2 py-0.5 rounded-sm">
                    {vet.license}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardHeader className="pb-4 border-b border-neutral-50 flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-neutral-600 border border-neutral-200/50">
              <BellRing className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900">Reglas de Automatización y Notificación</CardTitle>
              <CardDescription className="text-xs text-neutral-500">Configura las condiciones de activación para mensajes a clientes y advertencias de la clínica.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-50">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">Correo de Recordatorios de Vacunas</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Envía mensajes automáticos de recordatorio a los propietarios 7 días antes del vencimiento de la vacuna.</p>
                </div>
                <button 
                  onClick={() => handleToggle('emailVaccines')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    toggles.emailVaccines ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    toggles.emailVaccines ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-50">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">SMS de Confirmación de Citas</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Envía códigos de validación de citas a los números de teléfono móvil de los propietarios.</p>
                </div>
                <button 
                  onClick={() => handleToggle('smsAppointments')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    toggles.smsAppointments ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    toggles.smsAppointments ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-50">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">Alertas de Productos con Bajo Stock</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Activa notificaciones en el tablero cuando el stock del inventario caiga por debajo de la capacidad límite.</p>
                </div>
                <button 
                  onClick={() => handleToggle('alertInventory')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    toggles.alertInventory ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    toggles.alertInventory ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
