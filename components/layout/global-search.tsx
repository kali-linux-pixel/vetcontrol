'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  User, 
  History, 
  Calendar, 
  Loader2, 
  X, 
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { globalSearch } from '@/app/actions/clients';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    clients: any[];
    pets: any[];
  }>({ clients: [], pets: [] });
  
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flattened results for keyboard navigation
  const flatResults = [
    ...results.clients.map(c => ({ type: 'client', data: c })),
    ...results.pets.map(p => ({ type: 'pet', data: p }))
  ];

  // Shortcut Ctrl+K / Cmd+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ clients: [], pets: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await globalSearch(query);
        if (res && !('error' in res)) {
          setResults({
            clients: res.clients || [],
            pets: res.pets || []
          });
        }
      } catch (err) {
        console.error("Error in global search autocomplete:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
        handleNavigate(flatResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleNavigate = (item: { type: string; data: any }, action?: 'profile' | 'history' | 'appointment') => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);

    if (item.type === 'client') {
      if (action === 'appointment') {
        router.push(`/appointments?newForClient=${item.data.id}`);
      } else {
        router.push(`/clients?search=${item.data.dni || item.data.phone || item.data.name}`);
      }
    } else if (item.type === 'pet') {
      if (action === 'history') {
        router.push(`/pets?search=${item.data.name}&openHistory=true`);
      } else if (action === 'appointment') {
        router.push(`/appointments?petId=${item.data.id}`);
      } else {
        router.push(`/pets?search=${item.data.name}`);
      }
    }
  };

  const getSpeciesEmoji = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog':
      case 'perro': return '🐶';
      case 'cat':
      case 'gato': return '🐱';
      case 'bird':
      case 'ave':
      case 'pájaro': return '🦜';
      case 'rabbit':
      case 'conejo': return '🐰';
      default: return '🐾';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full sm:max-w-xs md:max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar cliente, mascota, DNI o celular..."
          className="pl-9 pr-10 h-9 w-full bg-neutral-50/50 hover:bg-neutral-50 border-neutral-200/60 focus:bg-white text-xs rounded-lg transition-all duration-150 focus:ring-1 focus:ring-emerald-500/35 focus:border-emerald-500"
        />
        {query && (
          <button 
            onClick={() => {
              setQuery('');
              setResults({ clients: [], pets: [] });
            }}
            className="absolute right-8 top-2.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <kbd className="pointer-events-none absolute right-3 top-2.5 hidden h-4 select-none items-center gap-0.5 rounded border border-neutral-200 bg-white px-1.5 font-mono text-[9px] font-medium text-neutral-400 opacity-100 sm:flex">
          <span>⌘</span>K
        </kbd>
      </div>

      {/* Autocomplete Results Panel */}
      {isOpen && (query.trim().length >= 2 || loading) && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-[420px] overflow-y-auto rounded-xl border border-neutral-100 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {loading ? (
            <div className="py-8 px-4 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold">Buscando en historial y registros...</p>
            </div>
          ) : results.clients.length === 0 && results.pets.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-neutral-400 font-medium">
              No se encontraron coincidencias para "<span className="text-neutral-700 font-bold">{query}</span>"
            </div>
          ) : (
            <div className="space-y-3">
              {/* Clients Section */}
              {results.clients.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Propietarios / Clientes
                  </div>
                  {results.clients.map((client, idx) => {
                    const overallIndex = idx;
                    const isSelected = selectedIndex === overallIndex;
                    return (
                      <div
                        key={client.id}
                        onMouseEnter={() => setSelectedIndex(overallIndex)}
                        className={cn(
                          "group flex items-start justify-between rounded-lg p-2.5 cursor-pointer transition-colors duration-150",
                          isSelected ? "bg-neutral-50/80 border-l-2 border-emerald-500 pl-2" : "hover:bg-neutral-50/40"
                        )}
                        onClick={() => handleNavigate({ type: 'client', data: client })}
                      >
                        <div className="flex gap-2.5">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                            {client.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-800 leading-none group-hover:text-emerald-750 transition-colors">
                              {client.name}
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-1 leading-none">
                              {client.dni ? `DNI: ${client.dni} • ` : ''}Cel: {client.phone}
                            </p>
                            {client.pets && client.pets.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {client.pets.map((p: any) => (
                                  <span key={p.id} className="inline-flex items-center text-[9px] font-semibold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-sm">
                                    {getSpeciesEmoji(p.species)} {p.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick action shortcuts */}
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="Programar Cita"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate({ type: 'client', data: client }, 'appointment');
                            }}
                            className="p-1 hover:bg-emerald-100 rounded-md text-emerald-700 cursor-pointer"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Ver Perfil"
                            className="p-1 hover:bg-neutral-200 rounded-md text-neutral-600 cursor-pointer"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pets Section */}
              {results.pets.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Pacientes / Mascotas
                  </div>
                  {results.pets.map((pet, idx) => {
                    const overallIndex = results.clients.length + idx;
                    const isSelected = selectedIndex === overallIndex;
                    return (
                      <div
                        key={pet.id}
                        onMouseEnter={() => setSelectedIndex(overallIndex)}
                        className={cn(
                          "group flex items-start justify-between rounded-lg p-2.5 cursor-pointer transition-colors duration-150",
                          isSelected ? "bg-neutral-50/80 border-l-2 border-emerald-500 pl-2" : "hover:bg-neutral-50/40"
                        )}
                        onClick={() => handleNavigate({ type: 'pet', data: pet })}
                      >
                        <div className="flex gap-2.5">
                          <div className="text-base flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
                            {getSpeciesEmoji(pet.species)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-800 leading-none group-hover:text-amber-700 transition-colors">
                              {pet.name}
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-1 leading-none">
                              {pet.breed} • Dueño: <span className="font-semibold">{pet.clientName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Quick action shortcuts */}
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="Ver Historial Clínico"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate({ type: 'pet', data: pet }, 'history');
                            }}
                            className="p-1 hover:bg-emerald-100 rounded-md text-emerald-700 cursor-pointer flex items-center gap-0.5 px-1.5"
                          >
                            <History className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-bold">Historial</span>
                          </button>
                          <button
                            title="Programar Cita"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate({ type: 'pet', data: pet }, 'appointment');
                            }}
                            className="p-1 hover:bg-neutral-200 rounded-md text-neutral-600 cursor-pointer"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
