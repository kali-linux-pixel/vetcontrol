'use client';

import React, { useState, useEffect, useTransition, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Client } from '@/types';
import { createClient, updateClient, deleteClient } from '@/app/actions/clients';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Mail, Phone, Calendar, UserPlus, Loader2, Edit, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
interface ClientsClientProps {
  initialClients: Client[];
}

export default function ClientsClient({ initialClients }: ClientsClientProps) {
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [isMutating, startTransition] = useTransition();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Actions states using useActionState
  const handleAddSubmit = async (prevState: any, formData: FormData) => {
    const res = await createClient(prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsAddOpen(false);
    showToast('Cliente agregado exitosamente.');
    return { success: true };
  };

  const handleEditSubmit = async (prevState: any, formData: FormData) => {
    if (!selectedClient) return { error: 'Ningún cliente seleccionado.' };
    const res = await updateClient(selectedClient.id, prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsEditOpen(false);
    showToast('Información del cliente actualizada.');
    return { success: true };
  };

  const handleDeleteSubmit = async () => {
    if (!selectedClient) return;
    startTransition(async () => {
      const res = await deleteClient(selectedClient.id);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        setIsDeleteOpen(false);
        showToast('Cliente eliminado exitosamente.');
      }
    });
  };

  const [addState, addAction, addPending] = useActionState(handleAddSubmit, null);
  const [editState, editAction, editPending] = useActionState(handleEditSubmit, null);

  const filteredClients = initialClients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    client.phone.includes(searchQuery) ||
    (client.dni && client.dni.includes(searchQuery))
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Directorio de Clientes</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestiona los clientes de la veterinaria, su información de contacto e historial de registro.</p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 self-start sm:self-auto rounded-lg"
        >
          <UserPlus className="h-4 w-4" />
          Agregar Cliente
        </Button>
      </div>

      {/* Directory Table Card */}
      <Card className="border border-neutral-100 bg-white shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre, correo o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="text-xs text-neutral-400 font-medium">
              Mostrando {filteredClients.length} de {initialClients.length} clientes
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="hover:bg-transparent border-neutral-100">
                  <TableHead className="w-[200px] text-xs font-semibold text-neutral-500 h-10 px-6">Nombre del Cliente</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">DNI</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Correo Electrónico</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Número de Teléfono</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Mascotas Registradas</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Fecha de Registro</TableHead>
                  <TableHead className="w-[120px] text-xs font-semibold text-neutral-500 h-10 pr-6 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-neutral-400">
                      No se encontraron clientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-neutral-50/50 transition-colors border-neutral-100">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 font-semibold text-sm text-neutral-600 border border-neutral-200/50">
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 leading-none">{client.name}</p>
                            <p className="text-[10px] text-neutral-400 mt-1 leading-none">ID: {client.id.substring(0, 8).toUpperCase()}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 font-mono text-xs text-neutral-700">
                        {client.dni || <span className="text-neutral-400 italic">No registrado</span>}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Mail className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="text-sm">{client.email || <span className="text-neutral-400 italic">No registrado</span>}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Phone className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="text-sm">{client.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-xs font-bold px-1.5">
                          {client.petsCount}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="text-sm">
                            {new Date(client.joinedDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="icon-xs"
                            onClick={() => {
                              setSelectedClient(client);
                              setIsEditOpen(true);
                            }}
                            className="h-8 w-8 hover:bg-neutral-50 rounded-lg text-neutral-500 hover:text-neutral-900"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-xs"
                            onClick={() => {
                              setSelectedClient(client);
                              setIsDeleteOpen(true);
                            }}
                            className="h-8 w-8 hover:bg-rose-50 rounded-lg text-neutral-500 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Agregar Nuevo Cliente</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Registra los datos de contacto para un nuevo perfil de propietario.</DialogDescription>
          </DialogHeader>
          <form action={addAction} className="space-y-4">
            {addState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{addState.error}</p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Nombre Completo del Cliente *</label>
              <Input name="name" placeholder="Juan Pérez" required className="h-9 text-xs" disabled={addPending} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">DNI (Perú) *</label>
                <Input name="dni" placeholder="12345678" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Número de Celular *</label>
                <Input name="phone" placeholder="987654321" required className="h-9 text-xs" disabled={addPending} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Dirección Domiciliaria</label>
              <Input name="address" placeholder="Av. Larco 123, Miraflores" className="h-9 text-xs" disabled={addPending} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Correo Electrónico</label>
              <Input name="email" type="email" placeholder="juan.perez@gmail.com" className="h-9 text-xs" disabled={addPending} />
            </div>
            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-9 text-xs rounded-lg" disabled={addPending}>Cancelar</Button>
              <Button type="submit" className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg gap-1.5" disabled={addPending}>
                {addPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Registrar Cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Editar Cliente</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Modifica la información del cliente registrado.</DialogDescription>
          </DialogHeader>
          <form action={editAction} className="space-y-4">
            {editState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{editState.error}</p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Nombre Completo del Cliente *</label>
              <Input name="name" defaultValue={selectedClient?.name} required className="h-9 text-xs" disabled={editPending} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">DNI (Perú) *</label>
                <Input name="dni" defaultValue={selectedClient?.dni} placeholder="12345678" required className="h-9 text-xs" disabled={editPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Número de Celular *</label>
                <Input name="phone" defaultValue={selectedClient?.phone} required className="h-9 text-xs" disabled={editPending} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Dirección Domiciliaria</label>
              <Input name="address" defaultValue={selectedClient?.address} placeholder="Av. Larco 123, Miraflores" className="h-9 text-xs" disabled={editPending} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Correo Electrónico</label>
              <Input name="email" type="email" defaultValue={selectedClient?.email} className="h-9 text-xs" disabled={editPending} />
            </div>
            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-9 text-xs rounded-lg" disabled={editPending}>Cancelar</Button>
              <Button type="submit" className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg gap-1.5" disabled={editPending}>
                {editPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600">Eliminar Perfil de Cliente</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              ¿Estás seguro de que deseas eliminar al cliente <strong className="text-neutral-800">{selectedClient?.name}</strong>? Esta acción eliminará en cascada todas las mascotas y citas asociadas y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} className="h-9 text-xs rounded-lg" disabled={isMutating}>Cancelar</Button>
            <Button 
              type="button" 
              onClick={handleDeleteSubmit}
              className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg gap-1.5" 
              disabled={isMutating}
            >
              {isMutating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirmar Eliminación
            </Button>
          </DialogFooter>
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
