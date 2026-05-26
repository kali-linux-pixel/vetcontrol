'use client';

import React, { useState, useTransition, useActionState } from 'react';
import { Pet, Client } from '@/types';
import { createPet, updatePet, deletePet } from '@/app/actions/pets';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

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
    showToast('Patient registered successfully.');
    return { success: true };
  };

  const handleEditSubmit = async (prevState: any, formData: FormData) => {
    if (!selectedPet) return { error: 'No patient selected.' };
    const res = await updatePet(selectedPet.id, prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsEditOpen(false);
    showToast('Patient record updated.');
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
        showToast('Patient record deleted.');
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

  const filteredPets = initialPets.filter(pet => {
    const matchesSearch = 
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecies = selectedSpecies === 'all' || pet.species === selectedSpecies;

    return matchesSearch && matchesSpecies;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Patient Registry</h2>
          <p className="text-sm text-neutral-500 mt-1">Access pet files, species records, age calculations, and owner links.</p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 self-start sm:self-auto rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Register Patient
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by pet name, breed, owner..."
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
              {species === 'all' ? 'All Patients' : `${species}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredPets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-neutral-400 border border-dashed border-neutral-100 rounded-xl bg-white">
            No patients registered.
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
                    <span>Age: <strong className="text-neutral-700">{pet.age}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                    <User className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="truncate">Owner: <strong className="text-neutral-700">{pet.ownerName}</strong></span>
                  </div>
                  {pet.lastVisit && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      <span>Last Visit: <strong className="text-neutral-700">{new Date(pet.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                    </div>
                  )}
                </div>
              </CardContent>

              <div className="px-5 pb-5 pt-0 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedPet(pet);
                    setIsEditOpen(true);
                  }}
                  className="flex-1 text-xs font-semibold h-8 border-neutral-200/60 rounded-lg hover:bg-neutral-50"
                >
                  Edit
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
            <DialogTitle className="text-base font-bold text-neutral-900">Register New Patient</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Add a new pet file linked to an owner client.</DialogDescription>
          </DialogHeader>
          <form action={addAction} className="space-y-4">
            {addState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{addState.error}</p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Pet Owner (Client)</label>
              <select 
                name="clientId" 
                required 
                className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                disabled={addPending}
              >
                <option value="">Select client owner...</option>
                {clientsList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Pet Name</label>
                <Input name="name" placeholder="Max" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Species</label>
                <select 
                  name="species" 
                  required 
                  className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                  disabled={addPending}
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="bird">Bird</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Breed</label>
                <Input name="breed" placeholder="Golden Retriever" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Age</label>
                <Input name="age" placeholder="2 years" required className="h-9 text-xs" disabled={addPending} />
              </div>
            </div>
            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-9 text-xs rounded-lg" disabled={addPending}>Cancel</Button>
              <Button type="submit" className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg gap-1.5" disabled={addPending}>
                {addPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Register Pet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Edit Patient File</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Modify details for this pet profile.</DialogDescription>
          </DialogHeader>
          <form action={editAction} className="space-y-4">
            {editState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{editState.error}</p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Pet Owner (Client)</label>
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
                <label className="text-xs font-semibold text-neutral-500">Pet Name</label>
                <Input name="name" defaultValue={selectedPet?.name} required className="h-9 text-xs" disabled={editPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Species</label>
                <select 
                  name="species" 
                  defaultValue={selectedPet?.species}
                  required 
                  className="flex h-9 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-1 text-xs outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/50 text-neutral-700 bg-white"
                  disabled={editPending}
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="bird">Bird</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Breed</label>
                <Input name="breed" defaultValue={selectedPet?.breed} required className="h-9 text-xs" disabled={editPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Age</label>
                <Input name="age" defaultValue={selectedPet?.age} required className="h-9 text-xs" disabled={editPending} />
              </div>
            </div>
            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-9 text-xs rounded-lg" disabled={editPending}>Cancel</Button>
              <Button type="submit" className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg gap-1.5" disabled={editPending}>
                {editPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600">Delete Patient Record</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Are you sure you want to remove <strong className="text-neutral-800">{selectedPet?.name}</strong> from your clinic registry? All historical appointment schedules for this pet will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} className="h-9 text-xs rounded-lg" disabled={isMutating}>Cancel</Button>
            <Button 
              type="button" 
              onClick={handleDeleteSubmit}
              className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg gap-1.5" 
              disabled={isMutating}
            >
              {isMutating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Delete
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
