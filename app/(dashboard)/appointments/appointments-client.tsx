'use client';

import React, { useState, useEffect, useTransition, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Appointment } from '@/types';
import { createAppointmentSmart, updateAppointment, deleteAppointment, updateAppointmentStatus } from '@/app/actions/appointments';
import { searchClients } from '@/app/actions/clients';
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

const translateStatus = (status: string) => {
  switch (status) {
    case 'Scheduled': return 'Programada';
    case 'Checked-in': return 'En Espera';
    case 'In-Progress': return 'En Curso';
    case 'Completed': return 'Completada';
    case 'Cancelled': return 'Cancelada';
    default: return status;
  }
};

export default function AppointmentsClient({ initialAppointments, petsList }: AppointmentsClientProps) {
  const searchParams = useSearchParams();
  const urlSearch = searchParams?.get('search');

  const [searchQuery, setSearchQuery] = useState(urlSearch || '');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync state with URL search param if provided
  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const [isMutating, startTransition] = useTransition();

  // Smart Lookup states
  const [activeTab, setActiveTab] = useState<'search' | 'new'>('search');
  const [clientSearchText, setClientSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isNewPet, setIsNewPet] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState('');

  // Auto-open modal and pre-select client or pet on mount/URL change
  useEffect(() => {
    const clientParam = searchParams?.get('newForClient');
    const petParam = searchParams?.get('petId');

    if (clientParam) {
      const fetchAndSelectClient = async () => {
        try {
          const res = await searchClients(clientParam);
          if (res.clients && res.clients.length > 0) {
            const client = res.clients[0];
            setSelectedClient(client);
            setIsAddOpen(true);
            if (client.pets && client.pets.length > 0) {
              setSelectedPetId(client.pets[0].id);
              setIsNewPet(false);
            } else {
              setSelectedPetId('');
              setIsNewPet(true);
            }
          }
        } catch (err) {
          console.error("Error auto-selecting client from URL:", err);
        }
      };
      fetchAndSelectClient();
    } else if (petParam) {
      const matchedPet = petsList.find(p => p.id === petParam);
      if (matchedPet) {
        setIsAddOpen(true);
        setSelectedPetId(matchedPet.id);
        setIsNewPet(false);
        const fetchOwner = async () => {
          try {
            const res = await searchClients(matchedPet.ownerName);
            if (res.clients && res.clients.length > 0) {
              setSelectedClient(res.clients[0]);
            }
          } catch (err) {
            console.error("Error auto-selecting client from pet:", err);
          }
        };
        fetchOwner();
      }
    }
  }, [searchParams, petsList]);

  // Debounced search for clients
  useEffect(() => {
    if (clientSearchText.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearchingClients(true);
      try {
        const res = await searchClients(clientSearchText);
        if (res.clients) {
          setSearchResults(res.clients);
        }
      } catch (err) {
        console.error("Error searching clients in frontend:", err);
      } finally {
        setIsSearchingClients(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [clientSearchText]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddSubmit = async (prevState: any, formData: FormData) => {
    const res = await createAppointmentSmart(prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsAddOpen(false);
    // Reset smart lookup state
    setActiveTab('search');
    setSelectedClient(null);
    setClientSearchText('');
    setSearchResults([]);
    setIsNewPet(false);
    setSelectedPetId('');
    showToast('Cita programada exitosamente.');
    return { success: true };
  };

  const handleEditSubmit = async (prevState: any, formData: FormData) => {
    if (!selectedApt) return { error: 'Ninguna cita seleccionada.' };
    const res = await updateAppointment(selectedApt.id, prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsEditOpen(false);
    showToast('Detalles de la cita actualizados.');
    return { success: true };
  };

  const handleStatusChange = async (id: string, newStatus: Appointment['status']) => {
    startTransition(async () => {
      const res = await updateAppointmentStatus(id, newStatus);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Estado de la cita actualizado a ${translateStatus(newStatus)}`);
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
        showToast('Cita cancelada y eliminada.');
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
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Programación de Citas</h2>
          <p className="text-sm text-neutral-500 mt-1">Programa, actualiza y gestiona las visitas de la clínica, cirugías y consultas.</p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 self-start sm:self-auto rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Programar Cita
        </Button>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Buscar por mascota, propietario, veterinario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-neutral-400 font-medium sm:ml-auto">
          Citas activas en calendario: {filteredAppointments.length}
        </div>
      </div>

      {/* Lists divided by Timeframes */}
      <div className="space-y-8">
        {/* Today's Appointments */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 px-1">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <h3>Hoy • 26 de mayo, 2026</h3>
            <span className="text-xs font-normal text-neutral-400">({todayAppointments.length} citas)</span>
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
            <h3>Mañana • 27 de mayo, 2026</h3>
            <span className="text-xs font-normal text-neutral-400">({tomorrowAppointments.length} citas)</span>
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
              <h3>Otras Citas / Historial</h3>
              <span className="text-xs font-normal text-neutral-400">({otherAppointments.length} citas)</span>
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
        <DialogContent className="sm:max-w-lg bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Programar Nueva Cita</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Registra o busca un dueño y programa un horario de visita para un paciente.</DialogDescription>
          </DialogHeader>
          <form action={addAction} className="space-y-4">
            {addState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{addState.error}</p>
            )}

            {/* Hidden field helpers for Server Action */}
            <input type="hidden" name="isNewClient" value={activeTab === 'new' ? 'true' : 'false'} />
            <input type="hidden" name="clientId" value={selectedClient?.id || ''} />
            <input type="hidden" name="isNewPet" value={isNewPet ? 'true' : 'false'} />

            {/* Tab switch */}
            <div className="flex bg-neutral-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('search'); setSelectedClient(null); setIsNewPet(false); }}
                className={cn(
                  "flex-1 py-1.5 rounded-md transition-all cursor-pointer border-0 outline-hidden",
                  activeTab === 'search' ? "bg-white text-neutral-900 shadow-2xs font-bold" : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                Buscar Cliente Existente
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('new'); setSelectedClient(null); setIsNewPet(true); }}
                className={cn(
                  "flex-1 py-1.5 rounded-md transition-all cursor-pointer border-0 outline-hidden",
                  activeTab === 'new' ? "bg-white text-neutral-900 shadow-2xs font-bold" : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                Registrar Nuevo Cliente
              </button>
            </div>

            {/* Existing client lookup section */}
            {activeTab === 'search' && (
              <div className="space-y-3">
                {!selectedClient ? (
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold text-neutral-500">Buscar Cliente (DNI, Celular, Nombre)</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                      <Input
                        placeholder="Escribe DNI, celular o nombre..."
                        value={clientSearchText}
                        onChange={(e) => setClientSearchText(e.target.value)}
                        className="pl-9 h-9 text-xs"
                        disabled={addPending}
                      />
                      {isSearchingClients && (
                        <Loader2 className="absolute right-3 top-2.5 h-3.5 w-3.5 animate-spin text-neutral-400" />
                      )}
                    </div>
                    {searchResults.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1 divide-y divide-neutral-100">
                        {searchResults.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setSelectedClient(client);
                              setSearchResults([]);
                              setClientSearchText('');
                              if (client.pets && client.pets.length > 0) {
                                setSelectedPetId(client.pets[0].id);
                                setIsNewPet(false);
                              } else {
                                setSelectedPetId('');
                                setIsNewPet(true);
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 flex flex-col cursor-pointer border-0 bg-transparent"
                          >
                            <span className="font-semibold text-neutral-800">{client.name}</span>
                            <span className="text-[10px] text-neutral-400">
                              {client.dni ? `DNI: ${client.dni} • ` : ''}Celular: {client.phone} {client.email ? `• ${client.email}` : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {clientSearchText.trim().length >= 2 && searchResults.length === 0 && !isSearchingClients && (
                      <p className="text-[10px] text-neutral-400 italic">No se encontraron clientes que coincidan.</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-neutral-50 border border-neutral-150 rounded-lg p-3 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-neutral-800">{selectedClient.name}</p>
                      <p className="text-[10px] text-neutral-400">
                        {selectedClient.dni ? `DNI: ${selectedClient.dni} • ` : ''}Celular: {selectedClient.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedClient(null); setSelectedPetId(''); setIsNewPet(false); }}
                      className="text-[10px] text-rose-600 hover:underline border-0 bg-transparent cursor-pointer font-semibold"
                    >
                      Cambiar Cliente
                    </button>
                  </div>
                )}

                {selectedClient && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Mascota (Paciente)</label>
                    <select
                      name="petId"
                      value={isNewPet ? 'new_pet' : selectedPetId}
                      onChange={(e) => {
                        if (e.target.value === 'new_pet') {
                          setIsNewPet(true);
                          setSelectedPetId('');
                        } else {
                          setIsNewPet(false);
                          setSelectedPetId(e.target.value);
                        }
                      }}
                      className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                      disabled={addPending}
                    >
                      {selectedClient.pets && selectedClient.pets.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.breed || 'Mascota'})</option>
                      ))}
                      <option value="new_pet">➕ Registrar nueva mascota para este dueño</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* New owner inputs */}
            {activeTab === 'new' && (
              <div className="space-y-3 p-3 bg-neutral-50/50 rounded-lg border border-neutral-150">
                <h4 className="text-xs font-bold text-neutral-700 border-b border-neutral-100 pb-1">Datos del Dueño</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-semibold text-neutral-500">Nombre Completo del Dueño *</label>
                    <Input name="ownerName" placeholder="Carlos Mendoza" required={activeTab === 'new'} className="h-8 text-xs bg-white" disabled={addPending} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-500">Celular *</label>
                    <Input name="ownerPhone" placeholder="987654321" required={activeTab === 'new'} className="h-8 text-xs bg-white" disabled={addPending} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-500">DNI (Opcional)</label>
                    <Input name="ownerDni" placeholder="12345678" className="h-8 text-xs bg-white" disabled={addPending} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-semibold text-neutral-500">Dirección (Opcional)</label>
                    <Input name="ownerAddress" placeholder="Av. Larco 123, Miraflores" className="h-8 text-xs bg-white" disabled={addPending} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-semibold text-neutral-500">Correo Electrónico (Opcional)</label>
                    <Input name="ownerEmail" type="email" placeholder="carlos@gmail.com" className="h-8 text-xs bg-white" disabled={addPending} />
                  </div>
                </div>
              </div>
            )}

            {/* New pet inputs if adding one */}
            {isNewPet && (
              <div className="space-y-3 p-3 bg-neutral-50/50 rounded-lg border border-neutral-150">
                <h4 className="text-xs font-bold text-neutral-700 border-b border-neutral-100 pb-1">Datos de la Mascota</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-500">Nombre Mascota *</label>
                    <Input name="petName" placeholder="Toby" required={isNewPet} className="h-8 text-xs bg-white" disabled={addPending} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-500">Especie *</label>
                    <select
                      name="petSpecies"
                      required={isNewPet}
                      className="flex h-8 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                      disabled={addPending}
                    >
                      <option value="dog">Perro</option>
                      <option value="cat">Gato</option>
                      <option value="rabbit">Conejo</option>
                      <option value="bird">Ave</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-500">Raza *</label>
                    <Input name="petBreed" placeholder="Pug / Criollo" required={isNewPet} className="h-8 text-xs bg-white" disabled={addPending} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-500">Edad *</label>
                    <Input name="petAge" placeholder="2 años / 5 meses" required={isNewPet} className="h-8 text-xs bg-white" disabled={addPending} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-500">Sexo (Opcional)</label>
                    <select
                      name="petSex"
                      className="flex h-8 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                      disabled={addPending}
                    >
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-500">Peso (Opcional)</label>
                    <Input name="petWeight" placeholder="12 kg" className="h-8 text-xs bg-white" disabled={addPending} />
                  </div>
                </div>
              </div>
            )}

            {/* Standard Appointment fields */}
            <div className="space-y-3 border-t border-neutral-100 pt-3">
              <h4 className="text-xs font-bold text-neutral-700">Detalles del Turno</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Tipo de Servicio</label>
                  <select 
                    name="type" 
                    required 
                    className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                    disabled={addPending}
                  >
                    <option value="Consultation">Consulta</option>
                    <option value="Surgery">Cirugía</option>
                    <option value="Vaccination">Vacunación</option>
                    <option value="Check-up">Chequeo General</option>
                    <option value="Dental">Dental</option>
                    <option value="Grooming">Estética</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Médico Veterinario</label>
                  <Input name="veterinarian" placeholder="Dr. Elizabeth Blackwell" required className="h-9 text-xs bg-white" disabled={addPending} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Fecha de la Cita</label>
                  <Input name="date" type="date" defaultValue="2026-05-26" required className="h-9 text-xs bg-white" disabled={addPending} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Hora</label>
                  <Input name="time" placeholder="10:00 AM" required className="h-9 text-xs bg-white" disabled={addPending} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Notas de Diagnóstico/Síntoma (Opcional)</label>
                <textarea 
                  name="notes" 
                  placeholder="Motivo breve de la visita..."
                  className="flex min-h-[60px] w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-xs shadow-2xs transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50 text-neutral-700 bg-white resize-none"
                  disabled={addPending}
                />
              </div>
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-9 text-xs rounded-lg" disabled={addPending}>Cancelar</Button>
              <Button type="submit" className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg gap-1.5" disabled={addPending}>
                {addPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar Cita
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
