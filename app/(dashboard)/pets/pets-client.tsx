'use client';

import React, { useState, useEffect, useTransition, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pet, Client } from '@/types';
import { createPet, updatePet, deletePet } from '@/app/actions/pets';
import { createClinicalRecord, getClinicalRecords } from '@/app/actions/clinical-records';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Calendar, User, Info, FileSpreadsheet, Edit, Trash2, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PetsClientProps {
  initialPets: Pet[];
  clientsList: { id: string; name: string }[];
}

export default function PetsClient({ initialPets, clientsList }: PetsClientProps) {
  const searchParams = useSearchParams();
  const urlSearch = searchParams?.get('search');
  const openHistoryParam = searchParams?.get('openHistory');

  const [searchQuery, setSearchQuery] = useState(urlSearch || '');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
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
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Clinical history states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Auto-open history modal if specified in URL
  useEffect(() => {
    if (openHistoryParam === 'true' && urlSearch) {
      const matchedPet = initialPets.find(
        (p) => p.name.toLowerCase() === urlSearch.toLowerCase()
      );
      if (matchedPet) {
        setSelectedPet(matchedPet);
        setIsHistoryOpen(true);
        fetchHistory(matchedPet.id);
      }
    }
  }, [openHistoryParam, urlSearch, initialPets]);

  const fetchHistory = async (petId: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await getClinicalRecords(petId);
      if (res.records) {
        setHistoryRecords(res.records);
      } else {
        setHistoryRecords([]);
      }
    } catch (err) {
      console.error(err);
      showToast("Error al cargar el historial clínico.", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleAddRecordSubmit = async (prevState: any, formData: FormData) => {
    if (!selectedPet) return { error: "Mascota no seleccionada." };
    formData.append('petId', selectedPet.id);
    const res = await createClinicalRecord(prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    // Success: reload history timeline
    await fetchHistory(selectedPet.id);
    showToast("Consulta registrada en el historial clínico.");
    return { success: true };
  };

  const [addRecordState, addRecordAction, addRecordPending] = useActionState(handleAddRecordSubmit, null);

  const [isMutating, startTransition] = useTransition();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddSubmit = async (prevState: any, formData: FormData) => {
    const res = await createPet(prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsAddOpen(false);
    showToast('Mascota registrada exitosamente.');
    return { success: true };
  };

  const handleEditSubmit = async (prevState: any, formData: FormData) => {
    if (!selectedPet) return { error: 'Ninguna mascota seleccionada.' };
    const res = await updatePet(selectedPet.id, prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsEditOpen(false);
    showToast('Historial de la mascota actualizado.');
    return { success: true };
  };

  const handleDeleteSubmit = async () => {
    if (!selectedPet) return;
    startTransition(async () => {
      const res = await deletePet(selectedPet.id);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        setIsDeleteOpen(false);
        showToast('Historial de la mascota eliminado.');
      }
    });
  };

  const [addState, addAction, addPending] = useActionState(handleAddSubmit, null);
  const [editState, editAction, editPending] = useActionState(handleEditSubmit, null);

  const getSpeciesEmoji = (species: Pet['species']) => {
    switch (species) {
      case 'dog': return '🐶';
      case 'cat': return '🐱';
      case 'rabbit': return '🐰';
      case 'bird': return '🦜';
      default: return '🐾';
    }
  };

  const getSpeciesLabel = (species: string) => {
    switch (species) {
      case 'all': return 'Todas las Mascotas';
      case 'dog': return 'Perros';
      case 'cat': return 'Gatos';
      case 'rabbit': return 'Conejos';
      case 'other': return 'Otros';
      default: return species;
    }
  };

  const filteredPets = initialPets.filter(pet => {
    const matchesSearch = 
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecies = selectedSpecies === 'all' || pet.species === selectedSpecies;

    return matchesSearch && matchesSpecies;
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Registro de Mascotas</h2>
          <p className="text-sm text-neutral-500 mt-1">Accede a expedientes de mascotas, registros de especies, cálculo de edades y enlaces de propietarios.</p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 self-start sm:self-auto rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Registrar Mascota
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Buscar por nombre de mascota, raza, propietario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
          {['all', 'dog', 'cat', 'rabbit', 'other'].map((species) => (
            <button
              key={species}
              onClick={() => setSelectedSpecies(species)}
              className={cn(
                "h-8 text-xs font-semibold px-3 py-1 rounded-lg border transition-all duration-150 capitalize",
                selectedSpecies === species
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-200/60 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              {getSpeciesLabel(species)}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredPets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-neutral-400 border border-dashed border-neutral-100 rounded-xl bg-white">
            No hay mascotas registradas.
          </div>
        ) : (
          filteredPets.map((pet) => (
            <Card 
              key={pet.id} 
              className="border border-neutral-100 bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
            >
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-2xl border border-neutral-200/50 shadow-2xs">
                    {getSpeciesEmoji(pet.species)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors leading-tight truncate">
                      {pet.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-none font-medium capitalize truncate">
                      {pet.breed}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-neutral-50 pt-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                    <Info className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Edad: <strong className="text-neutral-700">{pet.age}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                    <User className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="truncate">Propietario: <strong className="text-neutral-700">{pet.ownerName}</strong></span>
                  </div>
                  {pet.lastVisit && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      <span>Última Visita: <strong className="text-neutral-700">{new Date(pet.lastVisit).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                    </div>
                  )}
                </div>
              </CardContent>

              <div className="px-5 pb-5 pt-0 flex gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedPet(pet);
                    setIsHistoryOpen(true);
                    fetchHistory(pet.id);
                  }}
                  className="flex-1 text-xs font-bold h-8 bg-emerald-50 border-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-100 hover:text-emerald-900 gap-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Ver Historial
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedPet(pet);
                    setIsEditOpen(true);
                  }}
                  className="px-2.5 h-8 border-neutral-200/60 rounded-lg hover:bg-neutral-50 text-neutral-500"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedPet(pet);
                    setIsDeleteOpen(true);
                  }}
                  className="px-2.5 h-8 border-neutral-200/60 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-neutral-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Registrar Nueva Mascota</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Agrega un nuevo expediente de mascota vinculado a un cliente propietario.</DialogDescription>
          </DialogHeader>
          <form action={addAction} className="space-y-4">
            {addState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{addState.error}</p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Propietario de la Mascota (Cliente)</label>
              <select 
                name="clientId" 
                required 
                className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                disabled={addPending}
              >
                <option value="">Seleccionar cliente propietario...</option>
                {clientsList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Nombre de la Mascota</label>
                <Input name="name" placeholder="Max" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Especie</label>
                <select 
                  name="species" 
                  required 
                  className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                  disabled={addPending}
                >
                  <option value="dog">Perro</option>
                  <option value="cat">Gato</option>
                  <option value="rabbit">Conejo</option>
                  <option value="bird">Ave</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Raza</label>
                <Input name="breed" placeholder="Golden Retriever" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Edad</label>
                <Input name="age" placeholder="2 años" required className="h-9 text-xs" disabled={addPending} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Sexo (Opcional)</label>
                <select 
                  name="sex" 
                  className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                  disabled={addPending}
                >
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Peso (Opcional)</label>
                <Input name="weight" placeholder="12 kg" className="h-9 text-xs" disabled={addPending} />
              </div>
            </div>
            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-9 text-xs rounded-lg" disabled={addPending}>Cancelar</Button>
              <Button type="submit" className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg gap-1.5" disabled={addPending}>
                {addPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Registrar Mascota
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Editar Expediente de Mascota</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Modifica los detalles de este perfil de mascota.</DialogDescription>
          </DialogHeader>
          <form action={editAction} className="space-y-4">
            {editState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{editState.error}</p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Propietario de la Mascota (Cliente)</label>
              <select 
                name="clientId" 
                defaultValue={selectedPet?.ownerId}
                required 
                className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                disabled={editPending}
              >
                {clientsList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Nombre de la Mascota</label>
                <Input name="name" defaultValue={selectedPet?.name} required className="h-9 text-xs" disabled={editPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Especie</label>
                <select 
                  name="species" 
                  defaultValue={selectedPet?.species}
                  required 
                  className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                  disabled={editPending}
                >
                  <option value="dog">Perro</option>
                  <option value="cat">Gato</option>
                  <option value="rabbit">Conejo</option>
                  <option value="bird">Ave</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Raza</label>
                <Input name="breed" defaultValue={selectedPet?.breed} required className="h-9 text-xs" disabled={editPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Edad</label>
                <Input name="age" defaultValue={selectedPet?.age} required className="h-9 text-xs" disabled={editPending} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Sexo (Opcional)</label>
                <select 
                  name="sex" 
                  defaultValue={selectedPet?.sex || 'Macho'}
                  className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                  disabled={editPending}
                >
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Peso (Opcional)</label>
                <Input name="weight" defaultValue={selectedPet?.weight} placeholder="12 kg" className="h-9 text-xs" disabled={editPending} />
              </div>
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
            <DialogTitle className="text-base font-bold text-rose-600">Eliminar Expediente de Mascota</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              ¿Estás seguro de que deseas eliminar a <strong className="text-neutral-800">{selectedPet?.name}</strong> del registro de tu clínica? Se eliminarán todos los historiales y programaciones de citas para esta mascota.
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

      {/* CLINICAL HISTORY DIALOG */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-4xl bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xl border border-emerald-100 shadow-2xs">
                {selectedPet && getSpeciesEmoji(selectedPet.species)}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-neutral-900">Historial Clínico: {selectedPet?.name}</DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  Expediente médico completo de la mascota de {selectedPet?.ownerName} ({selectedPet?.breed}).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Left side: Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Historial de Consultas</h4>
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="text-center py-16 text-neutral-450 border border-dashed border-neutral-150 rounded-lg bg-neutral-50/30">
                  No hay registros clínicos registrados anteriormente.
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                  {historyRecords.map((rec) => (
                    <div key={rec.id} className="relative pl-4 border-l-2 border-emerald-500 py-1 space-y-1 bg-neutral-50/50 rounded-r-lg p-3">
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold">
                        <span>📅 {new Date(rec.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {rec.weight && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">⚖️ {rec.weight}</span>}
                      </div>
                      <div className="text-xs text-neutral-600 space-y-1.5 mt-1">
                        {rec.vaccines && <p>💉 <strong>Vacunas:</strong> {rec.vaccines}</p>}
                        {rec.allergies && <p>⚠️ <strong>Alergias:</strong> {rec.allergies}</p>}
                        {rec.diseases && <p>🦠 <strong>Enfermedades:</strong> {rec.diseases}</p>}
                        {rec.operations && <p>🩺 <strong>Operaciones:</strong> {rec.operations}</p>}
                        {rec.medicaments && <p>💊 <strong>Medicamentos:</strong> {rec.medicaments}</p>}
                        {rec.notes && <p className="italic text-neutral-700 bg-white border border-neutral-100 rounded-md p-2 mt-1 shadow-2xs whitespace-pre-wrap">📝 {rec.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right side: Add Record Form */}
            <div className="space-y-3 bg-neutral-50/40 border border-neutral-150 rounded-lg p-4">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider pb-1 border-b border-neutral-100">Nueva Entrada Médica</h4>
              <form action={addRecordAction} className="space-y-3">
                {addRecordState?.error && (
                  <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2 rounded-lg">{addRecordState.error}</p>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">Peso actual</label>
                    <Input name="weight" placeholder="10.5 kg" className="h-8 text-xs bg-white" disabled={addRecordPending} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">Vacunas aplicadas</label>
                    <Input name="vaccines" placeholder="Quíntuple / Rabia" className="h-8 text-xs bg-white" disabled={addRecordPending} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">Alergias identificadas</label>
                    <Input name="allergies" placeholder="Penicilina" className="h-8 text-xs bg-white" disabled={addRecordPending} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">Enfermedades crónicas</label>
                    <Input name="diseases" placeholder="Otitis / Dermatitis" className="h-8 text-xs bg-white" disabled={addRecordPending} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">Cirugías / Operaciones</label>
                    <Input name="operations" placeholder="Esterilización" className="h-8 text-xs bg-white" disabled={addRecordPending} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">Medicamentos prescritos</label>
                    <Input name="medicaments" placeholder="Apoquel / Cefalexina" className="h-8 text-xs bg-white" disabled={addRecordPending} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500">Observaciones y Notas *</label>
                  <textarea 
                    name="notes" 
                    required
                    placeholder="Escribe el diagnóstico, evolución, síntomas y plan de tratamiento..."
                    className="flex min-h-[90px] w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-emerald-500/20 text-neutral-700 resize-none"
                    disabled={addRecordPending}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="submit" 
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1.5 w-full md:w-auto"
                    disabled={addRecordPending}
                  >
                    {addRecordPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    Guardar Consulta
                  </Button>
                </div>
              </form>
            </div>
          </div>
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
