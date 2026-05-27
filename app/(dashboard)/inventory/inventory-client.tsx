'use client';

import React, { useState, useTransition, useActionState } from 'react';
import { InventoryItem } from '@/types';
import { 
  restockInventoryItem, 
  createInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem, 
  exportInventoryCSV 
} from '@/app/actions/inventory';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, AlertTriangle, CheckCircle, RefreshCw, Check, X, Edit, Trash2, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryClientProps {
  initialItems: InventoryItem[];
}

export default function InventoryClient({ initialItems }: InventoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [isPending, startTransition] = useTransition();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRestock = async (id: string, minStock: number, currentStock: number) => {
    const amountToAdd = Math.max(50, minStock - currentStock + 10);
    const item = initialItems.find(i => i.id === id);

    startTransition(async () => {
      const res = await restockInventoryItem(id, amountToAdd);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Se reabastecieron ${amountToAdd} unidades de ${item?.name || 'producto'}.`);
      }
    });
  };

  const handleExportCSV = async () => {
    startTransition(async () => {
      const res = await exportInventoryCSV();
      if (res?.error) {
        showToast(res.error, 'error');
      } else if (res?.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Inventario exportado correctamente.');
      }
    });
  };

  // Form submission wrappers
  const handleAddSubmit = async (prevState: any, formData: FormData) => {
    const res = await createInventoryItem(prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsAddOpen(false);
    showToast('Producto agregado correctamente.');
    return { success: true };
  };

  const handleEditSubmit = async (prevState: any, formData: FormData) => {
    if (!selectedItem) return { error: 'Ningún producto seleccionado.' };
    const res = await updateInventoryItem(selectedItem.id, prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsEditOpen(false);
    showToast('Detalles del producto actualizados.');
    return { success: true };
  };

  const handleDeleteSubmit = async () => {
    if (!selectedItem) return;
    startTransition(async () => {
      const res = await deleteInventoryItem(selectedItem.id);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        setIsDeleteOpen(false);
        showToast('Producto eliminado correctamente.');
      }
    });
  };

  const [addState, addAction, addPending] = useActionState(handleAddSubmit, null);
  const [editState, editAction, editPending] = useActionState(handleEditSubmit, null);

  const filteredItems = initialItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Normalize comparison to support both schemas
    const categoryNorm = item.category ? item.category.toLowerCase() : '';
    const selectedCategoryNorm = selectedCategory.toLowerCase();
    
    const matchesCategory = selectedCategory === 'all' || 
      categoryNorm === selectedCategoryNorm ||
      (selectedCategoryNorm === 'medicamento' && categoryNorm === 'medication') ||
      (selectedCategoryNorm === 'comida' && categoryNorm === 'food') ||
      (selectedCategoryNorm === 'equipamiento' && categoryNorm === 'equipment') ||
      (selectedCategoryNorm === 'insumos' && categoryNorm === 'supplies');

    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category: string) => {
    const norm = category ? category.toLowerCase() : '';
    if (norm === 'medication' || norm === 'medicamento') return 'Medicamento';
    if (norm === 'food' || norm === 'comida') return 'Alimento';
    if (norm === 'equipment' || norm === 'equipamiento') return 'Equipo';
    if (norm === 'supplies' || norm === 'insumos') return 'Insumo';
    return category;
  };

  const getUnitLabel = (unit: string) => {
    const norm = unit ? unit.toLowerCase() : '';
    if (norm === 'tablets' || norm === 'tabletas') return 'tabletas';
    if (norm === 'vials' || norm === 'frascos') return 'frascos';
    if (norm === 'pieces' || norm === 'piezas' || norm === 'unidades') return 'unidades';
    return unit;
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Inventario y Suministros</h2>
          <p className="text-sm text-neutral-500 mt-1">Monitorea lotes de medicamentos, equipos clínicos, alimento y alertas de reabastecimiento.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button 
            onClick={handleExportCSV}
            variant="outline" 
            disabled={isPending}
            className="border-neutral-200 text-neutral-700 hover:bg-neutral-50 gap-2 h-10 px-4 rounded-lg text-xs cursor-pointer bg-white"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 rounded-lg text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Agregar Producto
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Buscar por nombre, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
          {[
            { id: 'all', label: 'Todo el Inventario' },
            { id: 'medicamento', label: 'Medicamentos' },
            { id: 'comida', label: 'Alimentos' },
            { id: 'equipamiento', label: 'Equipos' },
            { id: 'insumos', label: 'Insumos' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "h-8 text-xs font-semibold px-3 py-1 rounded-lg border transition-all duration-150 cursor-pointer",
                selectedCategory === cat.id
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-200/60 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="border border-neutral-100 bg-white shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="hover:bg-transparent border-neutral-100">
                  <TableHead className="w-[240px] text-xs font-semibold text-neutral-500 h-10 px-6">Detalles del Producto</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Código SKU</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Categoría</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Nivel de Stock</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Precio (Unit.)</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Estado de Alerta</TableHead>
                  <TableHead className="w-[220px] text-xs font-semibold text-neutral-500 h-10 pr-6 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-neutral-400">
                      No se encontraron productos en el inventario.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.stock <= item.minStock;
                    const stockPercentage = item.minStock > 0 ? Math.round((item.stock / item.minStock) * 100) : 100;

                    return (
                      <TableRow key={item.id} className="hover:bg-neutral-50/50 transition-colors border-neutral-100">
                        <TableCell className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 leading-none">{item.name}</p>
                            <p className="text-xs text-neutral-400 mt-1.5 leading-none">Unidades: {getUnitLabel(item.unit)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <code className="text-xs bg-neutral-50 border border-neutral-200/50 px-1.5 py-0.5 rounded-sm font-mono text-neutral-600">
                            {item.sku}
                          </code>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm text-neutral-600 font-medium">{getCategoryLabel(item.category)}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1 w-24">
                            <span className={cn(
                              "text-xs font-semibold",
                              isLow ? "text-rose-600" : "text-emerald-700"
                            )}>
                              {item.stock} / {item.minStock}
                            </span>
                            <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  isLow ? "bg-rose-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${Math.min(100, stockPercentage)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-semibold text-neutral-900">
                          ${parseFloat(item.price as any).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-100/50 animate-pulse">
                              <AlertTriangle className="h-3 w-3" />
                              Bajo Stock ({stockPercentage}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100/50">
                              <CheckCircle className="h-3 w-3" />
                              Óptimo
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={isPending}
                              onClick={() => handleRestock(item.id, item.minStock, item.stock)}
                              className="text-xs text-neutral-600 hover:text-emerald-600 rounded-lg hover:bg-emerald-50/50 flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <RefreshCw className={cn("h-3 w-3", isPending && "animate-spin")} />
                              Reabastecer
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                setSelectedItem(item);
                                setIsEditOpen(true);
                              }}
                              className="h-8 w-8 text-neutral-500 hover:text-neutral-900 rounded-lg cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDeleteOpen(true);
                              }}
                              className="h-8 w-8 text-neutral-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE PRODUCT DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Agregar Nuevo Producto</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Agrega un nuevo medicamento, alimento, equipo o insumo al inventario.</DialogDescription>
          </DialogHeader>
          <form action={addAction} className="space-y-4">
            {addState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{addState.error}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold text-neutral-500">Nombre del Producto</label>
                <Input name="name" placeholder="Amoxicilina 250mg Tabletas" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Código SKU</label>
                <Input name="sku" placeholder="MED-AMX-250" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Categoría</label>
                <select name="category" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" disabled={addPending}>
                  <option value="medicamento">Medicamento</option>
                  <option value="comida">Alimento</option>
                  <option value="equipamiento">Equipo</option>
                  <option value="insumos">Insumo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Stock Inicial</label>
                <Input name="stock" type="number" min="0" placeholder="100" defaultValue="0" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Stock Mínimo Alerta</label>
                <Input name="minStock" type="number" min="0" placeholder="20" defaultValue="20" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Unidad (ej. tabletas, frascos)</label>
                <Input name="unit" placeholder="tabletas" required className="h-9 text-xs" disabled={addPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Precio Unitario ($)</label>
                <Input name="price" type="number" step="0.01" min="0" placeholder="0.85" defaultValue="0.00" required className="h-9 text-xs" disabled={addPending} />
              </div>
            </div>
            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-9 text-xs rounded-lg" disabled={addPending}>Cancelar</Button>
              <Button type="submit" className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg gap-1.5" disabled={addPending}>
                {addPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Agregar Producto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT PRODUCT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Editar Producto</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Modifica los detalles o niveles de alerta del producto.</DialogDescription>
          </DialogHeader>
          <form action={editAction} className="space-y-4">
            {editState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{editState.error}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold text-neutral-500">Nombre del Producto</label>
                <Input name="name" defaultValue={selectedItem?.name || ''} required className="h-9 text-xs" disabled={editPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Código SKU</label>
                <Input name="sku" defaultValue={selectedItem?.sku || ''} required className="h-9 text-xs" disabled={editPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Categoría</label>
                <select name="category" defaultValue={selectedItem?.category || 'medicamento'} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" disabled={editPending}>
                  <option value="medicamento">Medicamento</option>
                  <option value="comida">Alimento</option>
                  <option value="equipamiento">Equipo</option>
                  <option value="insumos">Insumo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Nivel de Stock</label>
                <Input name="stock" type="number" min="0" defaultValue={selectedItem?.stock || 0} required className="h-9 text-xs" disabled={editPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Stock Mínimo Alerta</label>
                <Input name="minStock" type="number" min="0" defaultValue={selectedItem?.minStock || 0} required className="h-9 text-xs" disabled={editPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Unidad</label>
                <Input name="unit" defaultValue={selectedItem?.unit || ''} required className="h-9 text-xs" disabled={editPending} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Precio Unitario ($)</label>
                <Input name="price" type="number" step="0.01" min="0" defaultValue={selectedItem ? parseFloat(selectedItem.price as any) : 0.00} required className="h-9 text-xs" disabled={editPending} />
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
            <DialogTitle className="text-base font-bold text-rose-600">Eliminar Producto</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              ¿Está seguro de que desea eliminar {selectedItem?.name}? Esta acción no se puede deshacer y borrará el registro de inventario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="h-9 text-xs rounded-lg" disabled={isPending}>Cancelar</Button>
            <Button onClick={handleDeleteSubmit} className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg gap-1.5" disabled={isPending}>
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Eliminar Producto
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
