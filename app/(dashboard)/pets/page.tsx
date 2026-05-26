'use client';

import React, { useState } from 'react';
import { mockPets } from '@/lib/mock-data';
import { Pet } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Calendar, User, Info, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>(mockPets);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');

  const speciesList = ['all', 'dog', 'cat', 'rabbit', 'other'];

  const getSpeciesEmoji = (species: Pet['species']) => {
    switch (species) {
      case 'dog': return '🐶';
      case 'cat': return '🐱';
      case 'rabbit': return '🐰';
      case 'bird': return '🦜';
      default: return '🐾';
    }
  };

  const filteredPets = pets.filter(pet => {
    const matchesSearch = 
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecies = selectedSpecies === 'all' || pet.species === selectedSpecies;

    return matchesSearch && matchesSpecies;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Patient Registry</h2>
          <p className="text-sm text-neutral-500 mt-1">Access pet files, species records, age calculations, and owner links.</p>
        </div>
        <Button className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 self-start sm:self-auto rounded-lg">
          <Plus className="h-4 w-4" />
          Register Patient
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by pet name, breed, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Species Filters */}
        <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
          {speciesList.map((species) => (
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
            No patients found matching the filter criteria.
          </div>
        ) : (
          filteredPets.map((pet) => (
            <Card 
              key={pet.id} 
              className="border border-neutral-100 bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
            >
              <CardContent className="p-5 flex flex-col gap-4">
                {/* Pet Header info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-2xl border border-neutral-200/50 shadow-2xs">
                    {getSpeciesEmoji(pet.species)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors leading-tight">
                      {pet.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-none font-medium capitalize">
                      {pet.breed}
                    </p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 border-t border-neutral-50 pt-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                    <Info className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Age: <strong className="text-neutral-700">{pet.age}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                    <User className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Owner: <strong className="text-neutral-700">{pet.ownerName}</strong></span>
                  </div>
                  {pet.lastVisit && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      <span>Last Visit: <strong className="text-neutral-700">{new Date(pet.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Card Footer action button */}
              <div className="px-5 pb-5 pt-0 mt-auto border-t border-transparent">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 hover:bg-neutral-50 border-neutral-200/60 rounded-lg flex items-center justify-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-400" />
                  Medical Records
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
