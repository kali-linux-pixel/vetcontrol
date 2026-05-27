'use client';

import React, { useState, useTransition, useActionState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  AlertCircle, 
  ToggleLeft, 
  Save, 
  RotateCw, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  Settings, 
  History, 
  Info,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { saveWhatsAppConfig, resendWhatsAppMessage, deleteQueueMessage } from '@/app/actions/whatsapp';

interface WhatsAppConfig {
  whatsappEnabled: boolean;
  whatsappPhone: string;
  whatsappProvider: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessId: string;
  whatsappAccessToken: string;
  
  templateConfirmation: string;
  templateReminder: string;
  templateVaccine: string;
  templateFollowup: string;
  templateDeworming: string;
  templateCancelled: string;

  autoConfirmationEnabled: boolean;
  autoReminderEnabled: boolean;
  autoVaccineEnabled: boolean;
  autoFollowupEnabled: boolean;
  autoDewormingEnabled: boolean;
}

interface WhatsAppLog {
  id: string;
  phone: string;
  message: string;
  status: string;
  errorMessage: string | null;
  attempts: number;
  scheduledAt: string;
  sentAt: string | null;
  createdAt: string;
}

interface WhatsappClientProps {
  initialConfig: WhatsAppConfig;
  initialQueue: any[];
}

export default function WhatsappClient({ initialConfig, initialQueue }: WhatsappClientProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'queue' | 'templates'>('metrics');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [config, setConfig] = useState<WhatsAppConfig>(initialConfig);
  const [queue, setQueue] = useState<WhatsAppLog[]>(initialQueue as any[]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isPending, startTransition] = useTransition();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Handle toggle helper
  const handleConfigToggle = (key: keyof WhatsAppConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 2. Handle input helper
  const handleConfigChange = (key: keyof WhatsAppConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 3. Save Config action
  const handleSaveAction = async (prevState: any, formData: FormData) => {
    // Append current states of toggles
    formData.append('whatsappEnabled', config.whatsappEnabled ? 'true' : 'false');
    formData.append('autoConfirmationEnabled', config.autoConfirmationEnabled ? 'true' : 'false');
    formData.append('autoReminderEnabled', config.autoReminderEnabled ? 'true' : 'false');
    formData.append('autoVaccineEnabled', config.autoVaccineEnabled ? 'true' : 'false');
    formData.append('autoFollowupEnabled', config.autoFollowupEnabled ? 'true' : 'false');
    formData.append('autoDewormingEnabled', config.autoDewormingEnabled ? 'true' : 'false');
    
    // Save to server
    const res = await saveWhatsAppConfig(prevState, formData);
    if (res?.error) {
      showToast(res.error, 'error');
      return { error: res.error };
    }
    
    showToast('Configuración del canal WhatsApp actualizada exitosamente.');
    return { success: true };
  };

  const [saveState, saveAction, savePending] = useActionState(handleSaveAction, null);

  // 4. Manual message resend
  const handleResend = async (id: string) => {
    startTransition(async () => {
      // Optimistic transition
      setQueue(prev => prev.map(m => m.id === id ? { ...m, status: 'pending', attempts: m.attempts + 1 } : m));
      
      const res = await resendWhatsAppMessage(id);
      if (res?.error) {
        showToast(res.error, 'error');
        // Refresh local queue status from DB
        setQueue(prev => prev.map(m => m.id === id ? { ...m, status: 'error', errorMessage: res.error || 'Fallo de reenvío' } : m));
      } else {
        showToast('Mensaje de WhatsApp reenviado con éxito.');
        setQueue(prev => prev.map(m => m.id === id ? { ...m, status: 'delivered', sentAt: new Date().toISOString() } : m));
      }
    });
  };

  // 5. Delete queue log message
  const handleDeleteLog = async (id: string) => {
    startTransition(async () => {
      const res = await deleteQueueMessage(id);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Mensaje eliminado del historial.');
        setQueue(prev => prev.filter(m => m.id !== id));
      }
    });
  };

  // Metrics calculations
  const totalCount = queue.length;
  const deliveredCount = queue.filter(m => m.status === 'delivered' || m.status === 'sent').length;
  const pendingCount = queue.filter(m => m.status === 'pending').length;
  const errorCount = queue.filter(m => m.status === 'error').length;
  const successRate = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 100;

  // Filter logs list
  const filteredQueue = queue.filter(msg => {
    if (statusFilter === 'all') return true;
    return msg.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in relative max-w-6xl">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Automatización de WhatsApp</h2>
          <p className="text-sm text-neutral-500 mt-1">Conecta tu línea Meta Cloud API o Twilio y gestiona notificaciones automatizadas por cada sucursal.</p>
        </div>
      </div>

      {/* Tabs list switcher */}
      <div className="flex border-b border-neutral-100 text-xs font-semibold text-neutral-500 gap-6">
        <button
          onClick={() => setActiveTab('metrics')}
          className={cn(
            "pb-3 relative flex items-center gap-1.5 cursor-pointer border-0 bg-transparent outline-hidden font-semibold transition-all",
            activeTab === 'metrics' ? "text-neutral-900 font-bold border-b-2 border-emerald-650" : "hover:text-neutral-800"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Automatizaciones & Métricas
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={cn(
            "pb-3 relative flex items-center gap-1.5 cursor-pointer border-0 bg-transparent outline-hidden font-semibold transition-all",
            activeTab === 'queue' ? "text-neutral-900 font-bold border-b-2 border-emerald-650" : "hover:text-neutral-800"
          )}
        >
          <History className="h-4 w-4" />
          Cola de Mensajes & Logs
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            "pb-3 relative flex items-center gap-1.5 cursor-pointer border-0 bg-transparent outline-hidden font-semibold transition-all",
            activeTab === 'templates' ? "text-neutral-900 font-bold border-b-2 border-emerald-650" : "hover:text-neutral-800"
          )}
        >
          <Settings className="h-4 w-4" />
          Canal de WhatsApp & Plantillas
        </button>
      </div>

      {/* TAB 1: METRICS AND AUTOMATIONS */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Global Enable Alert Banner */}
          <div className={cn(
            "p-4 rounded-xl border flex items-center justify-between gap-4 text-xs font-semibold",
            config.whatsappEnabled 
              ? "bg-emerald-50 border-emerald-150 text-emerald-800" 
              : "bg-amber-50 border-amber-150 text-amber-800"
          )}>
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center border",
                config.whatsappEnabled ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-amber-100 border-amber-200 text-amber-700"
              )}>
                {config.whatsappEnabled ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </div>
              <div>
                <p className="font-bold">Canal WhatsApp: {config.whatsappEnabled ? 'ACTIVADO' : 'INACTIVO'}</p>
                <p className="text-[10px] text-neutral-500 font-normal mt-0.5">
                  {config.whatsappEnabled 
                    ? `Enviando notificaciones automáticas usando el proveedor: ${config.whatsappProvider === 'cloud_api' ? 'Meta Cloud API' : config.whatsappProvider === 'twilio' ? 'Twilio' : 'Modo Simulado'}.`
                    : 'Los mensajes automáticos generados por eventos se encolan como "Pendiente" y no se enviarán hasta que actives el canal.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleConfigToggle('whatsappEnabled')}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                config.whatsappEnabled ? "bg-emerald-600" : "bg-neutral-200"
              )}
            >
              <span className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                config.whatsappEnabled ? "translate-x-4" : "translate-x-0"
              )} />
            </button>
          </div>

          {/* Metric cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="border border-neutral-100 bg-white shadow-xs">
              <CardContent className="p-4 flex flex-col justify-between h-20">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tasa de Éxito</span>
                <span className="text-xl font-black text-neutral-800">{successRate}%</span>
              </CardContent>
            </Card>
            <Card className="border border-neutral-100 bg-white shadow-xs">
              <CardContent className="p-4 flex flex-col justify-between h-20">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Entregados / Enviados</span>
                <span className="text-xl font-black text-neutral-800">{deliveredCount}</span>
              </CardContent>
            </Card>
            <Card className="border border-neutral-100 bg-white shadow-xs">
              <CardContent className="p-4 flex flex-col justify-between h-20">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Pendientes en Cola</span>
                <span className="text-xl font-black text-neutral-800">{pendingCount}</span>
              </CardContent>
            </Card>
            <Card className="border border-neutral-100 bg-white shadow-xs">
              <CardContent className="p-4 flex flex-col justify-between h-20">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Errores de API</span>
                <span className="text-xl font-black text-neutral-800 text-rose-650">{errorCount}</span>
              </CardContent>
            </Card>
          </div>

          {/* Automations list grid toggles */}
          <Card className="border border-neutral-100 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-neutral-50 flex flex-row items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ToggleLeft className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-neutral-900">Automatizaciones Clínicas</CardTitle>
                <CardDescription className="text-xs text-neutral-500">Configura qué eventos en VetControl deben encolar y enviar mensajes de WhatsApp automáticamente.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 divide-y divide-neutral-50 space-y-4">
              {/* Auto Confirmation */}
              <div className="flex items-center justify-between pb-4 first:pt-0">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-neutral-850">Confirmación de Cita Agendada</h4>
                  <p className="text-[10px] text-neutral-450">Envía un WhatsApp inmediatamente cuando el recepcionista programa una nueva cita (o por reserva online).</p>
                </div>
                <button
                  onClick={() => handleConfigToggle('autoConfirmationEnabled')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    config.autoConfirmationEnabled ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    config.autoConfirmationEnabled ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Auto Reminder */}
              <div className="flex items-center justify-between py-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-neutral-850">Recordatorios de Citas Programadas</h4>
                  <p className="text-[10px] text-neutral-450">Encola un aviso recordatorio automático 24 horas antes del horario reservado del turno.</p>
                </div>
                <button
                  onClick={() => handleConfigToggle('autoReminderEnabled')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    config.autoReminderEnabled ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    config.autoReminderEnabled ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Auto Vaccine */}
              <div className="flex items-center justify-between py-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-neutral-850">Alertas de Vacunas Vencidas / Por Vencer</h4>
                  <p className="text-[10px] text-neutral-450">Avisa a los dueños cuando a su mascota le corresponde aplicar su vacuna anual de rabia o quíntuple.</p>
                </div>
                <button
                  onClick={() => handleConfigToggle('autoVaccineEnabled')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    config.autoVaccineEnabled ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    config.autoVaccineEnabled ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Auto Followup */}
              <div className="flex items-center justify-between py-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-neutral-850">Seguimiento Post-Consulta Médica</h4>
                  <p className="text-[10px] text-neutral-450">Envía un mensaje de salud 3 días después de una consulta clínica de urgencia o cirugía para monitorear evolución.</p>
                </div>
                <button
                  onClick={() => handleConfigToggle('autoFollowupEnabled')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    config.autoFollowupEnabled ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    config.autoFollowupEnabled ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Auto Deworming */}
              <div className="flex items-center justify-between pt-4 last:pb-0">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-neutral-850">Recordatorios de Desparasitación Pendiente</h4>
                  <p className="text-[10px] text-neutral-450">Envía un aviso preventivo para la aplicación trimestral del antiparasitario interno o externo de su mascota.</p>
                </div>
                <button
                  onClick={() => handleConfigToggle('autoDewormingEnabled')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    config.autoDewormingEnabled ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    config.autoDewormingEnabled ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: MESSAGE QUEUE & LOGS */}
      {activeTab === 'queue' && (
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardHeader className="pb-4 border-b border-neutral-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900">Cola de Mensajes & Logs</CardTitle>
              <CardDescription className="text-xs text-neutral-500">Monitorea los mensajes en curso, reintenta envíos fallidos y borra registros históricos.</CardDescription>
            </div>
            
            <div className="flex gap-1.5 self-start sm:self-auto">
              {['all', 'pending', 'delivered', 'error'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "h-7 text-[10px] font-bold px-2.5 rounded-lg border transition-all capitalize",
                    statusFilter === status 
                      ? "bg-neutral-900 text-white border-neutral-900" 
                      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  {status === 'all' ? 'Todos' : status === 'pending' ? 'Pendiente' : status === 'delivered' ? 'Entregado' : 'Fallo/Error'}
                </button>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    <th className="p-4 px-6">Destinatario / Celular</th>
                    <th className="p-4">Contenido del Mensaje</th>
                    <th className="p-4">Fecha y Hora</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-center">Intentos</th>
                    <th className="p-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-neutral-400 italic">
                        No hay mensajes en cola que coincidan con este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50/20 transition-colors">
                        <td className="p-4 px-6 font-semibold text-neutral-800 text-[11px]">
                          +{log.phone}
                        </td>
                        <td className="p-4 max-w-[280px]">
                          <p className="line-clamp-2 text-neutral-600 text-[11px]" title={log.message}>
                            {log.message}
                          </p>
                          {log.errorMessage && (
                            <span className="text-[9px] text-rose-650 font-bold block mt-1">
                              ⚠️ Error: {log.errorMessage}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-neutral-500 text-[10.5px]">
                          {new Date(log.createdAt).toLocaleDateString('es-PE', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-tight",
                            log.status === 'delivered' || log.status === 'sent'
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : log.status === 'pending'
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          )}>
                            {log.status === 'delivered' ? 'Entregado' : log.status === 'sent' ? 'Enviado' : log.status === 'pending' ? 'Pendiente' : 'Error'}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-neutral-700">
                          {log.attempts}
                        </td>
                        <td className="p-4 px-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(log.id)}
                              className="h-7 px-2 border-neutral-200 text-neutral-600 hover:text-emerald-700 text-[10px] font-bold rounded-lg flex items-center gap-1 bg-white cursor-pointer"
                              disabled={isPending || log.status === 'pending'}
                            >
                              <RotateCw className={cn("h-3 w-3", isPending && "animate-spin")} />
                              Reenviar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLog(log.id)}
                              className="h-7 px-2 border-neutral-200 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer bg-white"
                              disabled={isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: SETTINGS AND CUSTOM TEMPLATES */}
      {activeTab === 'templates' && (
        <form action={saveAction} className="space-y-6">
          {saveState?.error && (
            <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">
              {saveState.error}
            </p>
          )}

          {/* Credentials panel */}
          <Card className="border border-neutral-100 bg-white shadow-xs">
            <CardHeader className="pb-4 border-b border-neutral-50 flex flex-row items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-50 text-neutral-600 border border-neutral-200/50">
                <Settings className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-neutral-900">Configuración del Proveedor WhatsApp</CardTitle>
                <CardDescription className="text-xs text-neutral-500">Conecta tu número oficial a través de la API en la nube de Meta o la integración con Twilio.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-neutral-500">Proveedor de API de WhatsApp</label>
                  <select
                    name="whatsappProvider"
                    value={config.whatsappProvider}
                    onChange={(e) => handleConfigChange('whatsappProvider', e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                  >
                    <option value="mock">Modo Simulación / Demos (No requiere credenciales)</option>
                    <option value="cloud_api">WhatsApp Cloud API (Meta Oficial)</option>
                    <option value="twilio">Twilio WhatsApp API</option>
                  </select>
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-neutral-500">Número de WhatsApp Emisor</label>
                  <Input 
                    name="whatsappPhone" 
                    value={config.whatsappPhone}
                    onChange={(e) => handleConfigChange('whatsappPhone', e.target.value)}
                    placeholder="+51987654321" 
                    className="h-9 text-xs" 
                  />
                </div>

                {config.whatsappProvider === 'cloud_api' && (
                  <>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-xs font-semibold text-neutral-500">ID del Número de Teléfono (Phone Number ID)</label>
                      <Input 
                        name="whatsappPhoneNumberId" 
                        value={config.whatsappPhoneNumberId}
                        onChange={(e) => handleConfigChange('whatsappPhoneNumberId', e.target.value)}
                        placeholder="1092837482910" 
                        className="h-9 text-xs" 
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-xs font-semibold text-neutral-500">ID de Cuenta Comercial (Business Account ID)</label>
                      <Input 
                        name="whatsappBusinessId" 
                        value={config.whatsappBusinessId}
                        onChange={(e) => handleConfigChange('whatsappBusinessId', e.target.value)}
                        placeholder="9827364810293" 
                        className="h-9 text-xs" 
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-semibold text-neutral-500">Token de Acceso Permanente (Permanent Access Token)</label>
                      <Input 
                        name="whatsappAccessToken" 
                        type="password"
                        value={config.whatsappAccessToken}
                        onChange={(e) => handleConfigChange('whatsappAccessToken', e.target.value)}
                        placeholder="EAABw..." 
                        className="h-9 text-xs" 
                      />
                    </div>
                  </>
                )}

                {config.whatsappProvider === 'twilio' && (
                  <>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-xs font-semibold text-neutral-500">Twilio Account SID</label>
                      <Input 
                        name="whatsappPhoneNumberId" // reuse PhoneNumberId field mapping
                        value={config.whatsappPhoneNumberId}
                        onChange={(e) => handleConfigChange('whatsappPhoneNumberId', e.target.value)}
                        placeholder="ACa1b2c3d4..." 
                        className="h-9 text-xs" 
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-xs font-semibold text-neutral-500">Twilio Auth Token</label>
                      <Input 
                        name="whatsappAccessToken" // reuse AccessToken field mapping
                        type="password"
                        value={config.whatsappAccessToken}
                        onChange={(e) => handleConfigChange('whatsappAccessToken', e.target.value)}
                        placeholder="AuthToken" 
                        className="h-9 text-xs" 
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Templates custom editing */}
          <Card className="border border-neutral-100 bg-white shadow-xs">
            <CardHeader className="pb-4 border-b border-neutral-50 flex flex-row items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-neutral-900">Configuración de Plantillas Dinámicas</CardTitle>
                <CardDescription className="text-xs text-neutral-500">Modifica la redacción de los recordatorios. El sistema reemplazará los valores en llaves dinámicamente.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Left side: Guide Box */}
                <div className="md:col-span-1 space-y-4">
                  <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-4 text-xs font-medium space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-800 pb-1 border-b border-neutral-100">
                      <Info className="h-3.5 w-3.5 text-emerald-650" />
                      <span>Guía de Placeholders</span>
                    </div>
                    <p className="text-[10.5px] text-neutral-450 leading-relaxed">Usa las siguientes variables encerradas entre dos llaves para rellenar los datos de cada cliente de forma automática:</p>
                    <div className="space-y-1.5 divide-y divide-neutral-100/50">
                      <div className="pt-1.5 flex justify-between"><code className="text-emerald-700 bg-emerald-50 font-bold px-1 rounded">{"{{dueño}}"}</code> <span className="text-neutral-450 text-[10px]">Nombre del propietario</span></div>
                      <div className="pt-1.5 flex justify-between"><code className="text-emerald-700 bg-emerald-50 font-bold px-1 rounded">{"{{mascota}}"}</code> <span className="text-neutral-450 text-[10px]">Nombre de la mascota</span></div>
                      <div className="pt-1.5 flex justify-between"><code className="text-emerald-700 bg-emerald-50 font-bold px-1 rounded">{"{{fecha}}"}</code> <span className="text-neutral-450 text-[10px]">Fecha programada</span></div>
                      <div className="pt-1.5 flex justify-between"><code className="text-emerald-700 bg-emerald-50 font-bold px-1 rounded">{"{{hora}}"}</code> <span className="text-neutral-450 text-[10px]">Hora programada</span></div>
                      <div className="pt-1.5 flex justify-between"><code className="text-emerald-700 bg-emerald-50 font-bold px-1 rounded">{"{{veterinario}}"}</code> <span className="text-neutral-450 text-[10px]">Veterinario tratante</span></div>
                      <div className="pt-1.5 flex justify-between"><code className="text-emerald-700 bg-emerald-50 font-bold px-1 rounded">{"{{vacuna}}"}</code> <span className="text-neutral-450 text-[10px]">Vacuna o tratamiento</span></div>
                      <div className="pt-1.5 flex justify-between"><code className="text-emerald-700 bg-emerald-50 font-bold px-1 rounded">{"{{clínica}}"}</code> <span className="text-neutral-450 text-[10px]">Nombre de tu clínica</span></div>
                    </div>
                  </div>
                </div>

                {/* Right side: Input textareas */}
                <div className="md:col-span-2 space-y-4">
                  {/* Template Confirmation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">1. Plantilla de Confirmación de Cita</label>
                    <textarea 
                      name="templateConfirmation" 
                      value={config.templateConfirmation}
                      onChange={(e) => handleConfigChange('templateConfirmation', e.target.value)}
                      className="flex min-h-[70px] w-full rounded-lg border border-neutral-250 bg-white px-3 py-2 text-xs text-neutral-700 resize-none"
                    />
                  </div>

                  {/* Template Reminder */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">2. Plantilla de Recordatorio de Cita</label>
                    <textarea 
                      name="templateReminder" 
                      value={config.templateReminder}
                      onChange={(e) => handleConfigChange('templateReminder', e.target.value)}
                      className="flex min-h-[70px] w-full rounded-lg border border-neutral-250 bg-white px-3 py-2 text-xs text-neutral-700 resize-none"
                    />
                  </div>

                  {/* Template Vaccine */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">3. Plantilla de Vacuna Pendiente</label>
                    <textarea 
                      name="templateVaccine" 
                      value={config.templateVaccine}
                      onChange={(e) => handleConfigChange('templateVaccine', e.target.value)}
                      className="flex min-h-[70px] w-full rounded-lg border border-neutral-250 bg-white px-3 py-2 text-xs text-neutral-700 resize-none"
                    />
                  </div>

                  {/* Template Followup */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">4. Plantilla de Seguimiento Post-Consulta</label>
                    <textarea 
                      name="templateFollowup" 
                      value={config.templateFollowup}
                      onChange={(e) => handleConfigChange('templateFollowup', e.target.value)}
                      className="flex min-h-[70px] w-full rounded-lg border border-neutral-250 bg-white px-3 py-2 text-xs text-neutral-700 resize-none"
                    />
                  </div>

                  {/* Template Deworming */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">5. Plantilla de Desparasitación Pendiente</label>
                    <textarea 
                      name="templateDeworming" 
                      value={config.templateDeworming}
                      onChange={(e) => handleConfigChange('templateDeworming', e.target.value)}
                      className="flex min-h-[70px] w-full rounded-lg border border-neutral-250 bg-white px-3 py-2 text-xs text-neutral-700 resize-none"
                    />
                  </div>

                  {/* Template Cancelled */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">6. Plantilla de Cita Cancelada</label>
                    <textarea 
                      name="templateCancelled" 
                      value={config.templateCancelled}
                      onChange={(e) => handleConfigChange('templateCancelled', e.target.value)}
                      className="flex min-h-[70px] w-full rounded-lg border border-neutral-250 bg-white px-3 py-2 text-xs text-neutral-700 resize-none"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs h-10 px-4 font-semibold gap-1.5 shadow-sm transition-all cursor-pointer"
              disabled={savePending}
            >
              {savePending && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
              {!savePending && <Save className="h-4.5 w-4.5" />}
              Guardar Configuración
            </Button>
          </div>
        </form>
      )}

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
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-650">
              <X className="h-3 w-3" />
            </div>
          )}
          <p className="text-xs font-semibold">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
