'use client';

import React, { useState, useTransition, useActionState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  DollarSign, 
  Search, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Printer,
  Trash2,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createInvoice, updateInvoiceStatus, deleteInvoice, exportSalesCSV } from '@/app/actions/sales';

interface Invoice {
  id: string;
  clientName: string;
  petName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Refunded' | 'Pagado' | 'Pendiente' | 'Reembolsado';
  itemDescription: string;
}

interface DropdownItem {
  id: string;
  name: string;
}

interface PetDropdownItem extends DropdownItem {
  clientId: string;
}

interface SalesClientProps {
  initialInvoices: Invoice[];
  clients: DropdownItem[];
  pets: PetDropdownItem[];
}

export default function SalesClient({ initialInvoices, clients, pets }: SalesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Selected client for adding new invoice (to filter pet list)
  const [addClientId, setAddClientId] = useState<string>('');

  const [isPending, startTransition] = useTransition();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportCSV = async () => {
    startTransition(async () => {
      const res = await exportSalesCSV();
      if (res?.error) {
        showToast(res.error, 'error');
      } else if (res?.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `facturacion_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Reporte de ventas exportado correctamente.');
      }
    });
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateInvoiceStatus(id, newStatus);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`El estado de la factura ha sido actualizado a ${newStatus}.`);
        // Update local state if receipt modal is open
        if (selectedInvoice && selectedInvoice.id === id) {
          setSelectedInvoice({ ...selectedInvoice, status: newStatus as any });
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const res = await deleteInvoice(id);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        setIsReceiptOpen(false);
        showToast('Factura anulada correctamente.');
      }
    });
  };

  const handleAddSubmit = async (prevState: any, formData: FormData) => {
    const res = await createInvoice(prevState, formData);
    if (res?.error) {
      return { error: res.error };
    }
    setIsAddOpen(false);
    setAddClientId('');
    showToast('Factura creada y registrada.');
    return { success: true };
  };

  const [addState, addAction, addPending] = useActionState(handleAddSubmit, null);

  const filteredInvoices = initialInvoices.filter(inv => 
    inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.itemDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const totalBilling = initialInvoices.filter(i => i.status === 'Paid' || i.status === 'Pagado').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingBilling = initialInvoices.filter(i => i.status === 'Pending' || i.status === 'Pendiente').reduce((acc, curr) => acc + curr.amount, 0);
  const averageTicket = initialInvoices.length > 0 ? (initialInvoices.reduce((acc, curr) => acc + curr.amount, 0) / initialInvoices.length) : 0;

  const getStatusStyles = (status: Invoice['status']) => {
    const norm = status ? status.toLowerCase() : '';
    if (norm === 'paid' || norm === 'pagado') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-100/50';
    }
    if (norm === 'pending' || norm === 'pendiente') {
      return 'bg-amber-50 text-amber-700 border border-amber-100/50';
    }
    return 'bg-neutral-50 text-neutral-400 border border-neutral-100';
  };

  const getStatusIcon = (status: Invoice['status']) => {
    const norm = status ? status.toLowerCase() : '';
    if (norm === 'paid' || norm === 'pagado') {
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
    }
    if (norm === 'pending' || norm === 'pendiente') {
      return <Clock className="h-3.5 w-3.5 text-amber-600" />;
    }
    return <XCircle className="h-3.5 w-3.5 text-neutral-400" />;
  };

  const getStatusLabel = (status: Invoice['status']) => {
    const norm = status ? status.toLowerCase() : '';
    if (norm === 'paid' || norm === 'pagado') return 'Pagado';
    if (norm === 'pending' || norm === 'pendiente') return 'Pendiente';
    return 'Reembolsado';
  };

  // Filter pets list based on selected client in creation modal
  const filteredPets = pets.filter(pet => pet.clientId === addClientId);

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Ventas y Facturación</h2>
          <p className="text-sm text-neutral-500 mt-1">Administra comprobantes de cobro, historial de transacciones veterinarias y flujos de pago.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button 
            onClick={handleExportCSV}
            variant="outline" 
            disabled={isPending}
            className="border-neutral-200/60 text-neutral-600 hover:text-neutral-900 gap-2 h-10 px-4 rounded-lg bg-white cursor-pointer text-xs font-semibold"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 rounded-lg cursor-pointer text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Nueva Factura
          </Button>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-neutral-400 block uppercase tracking-wider">Ingresos Cobrados</span>
            <span className="text-2xl font-bold text-neutral-900 mt-2 block">${totalBilling.toFixed(2)}</span>
            <span className="text-[10px] text-neutral-400 mt-1 block">Transacciones liquidadas con éxito</span>
          </CardContent>
        </Card>
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-neutral-400 block uppercase tracking-wider">Pendiente de Cobro</span>
            <span className="text-2xl font-bold text-neutral-900 mt-2 block">${pendingBilling.toFixed(2)}</span>
            <span className="text-[10px] text-neutral-400 mt-1 block">Facturas emitidas pendientes de pago</span>
          </CardContent>
        </Card>
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-neutral-400 block uppercase tracking-wider">Ticket Promedio</span>
            <span className="text-2xl font-bold text-neutral-900 mt-2 block">${averageTicket.toFixed(2)}</span>
            <span className="text-[10px] text-neutral-400 mt-1 block">Valor promedio por visita de mascota</span>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Directory */}
      <Card className="border border-neutral-100 bg-white shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar por ID, cliente, mascota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="text-xs text-neutral-400 font-medium">
              Transacciones registradas: {filteredInvoices.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="hover:bg-transparent border-neutral-100">
                  <TableHead className="w-[180px] text-xs font-semibold text-neutral-500 h-10 px-6">ID Factura</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Cliente</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Paciente (Mascota)</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Concepto</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Fecha de Emisión</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Total</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Estado</TableHead>
                  <TableHead className="w-[80px] text-xs font-semibold text-neutral-500 h-10 pr-6 text-right">Recibo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-neutral-400">
                      No se encontraron transacciones.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-neutral-50/50 transition-colors border-neutral-100">
                      <TableCell className="px-6 py-4">
                        <span className="text-xs font-mono font-semibold text-neutral-500 truncate max-w-[120px] block">
                          {inv.id}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-neutral-800 text-sm">
                        {inv.clientName}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-neutral-600 font-medium">{inv.petName}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-neutral-500 truncate max-w-[200px] block">{inv.itemDescription}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-neutral-500">
                          {new Date(inv.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 font-bold text-neutral-900">
                        ${inv.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-none border",
                          getStatusStyles(inv.status)
                        )}>
                          {getStatusIcon(inv.status)}
                          {getStatusLabel(inv.status)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsReceiptOpen(true);
                          }}
                          className="text-xs text-neutral-600 hover:text-neutral-900 rounded-lg cursor-pointer font-semibold"
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* NEW INVOICE DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Emitir Nueva Factura</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Registra cobros por consultas, cirugías, vacunas, alimentos o venta de insumos.</DialogDescription>
          </DialogHeader>
          <form action={addAction} className="space-y-4">
            {addState?.error && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">{addState.error}</p>
            )}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Propietario / Cliente</label>
                <select 
                  name="clientId" 
                  value={addClientId}
                  onChange={(e) => setAddClientId(e.target.value)}
                  required 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={addPending}
                >
                  <option value="">-- Seleccionar Propietario --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Paciente (Mascota)</label>
                <select 
                  name="petId" 
                  required 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={addPending || !addClientId}
                >
                  <option value="">-- Seleccionar Paciente --</option>
                  {filteredPets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {!addClientId && (
                  <p className="text-[10px] text-neutral-400 mt-1">Selecciona primero un propietario para cargar sus mascotas.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Concepto del Servicio / Venta</label>
                <Input name="itemDescription" placeholder="Control General + Refuerzo de Vacuna" required className="h-9 text-xs" disabled={addPending} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Importe Total ($)</label>
                  <Input name="amount" type="number" step="0.01" min="0" placeholder="120.00" required className="h-9 text-xs" disabled={addPending} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Estado de Pago</label>
                  <select name="status" defaultValue="Pendiente" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring" disabled={addPending}>
                    <option value="Pagado">Pagado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Reembolsado">Reembolsado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Fecha de Facturación</label>
                <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-9 text-xs" disabled={addPending} />
              </div>
            </div>
            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-9 text-xs rounded-lg" disabled={addPending}>Cancelar</Button>
              <Button type="submit" className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg gap-1.5" disabled={addPending || !addClientId}>
                {addPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Crear Factura
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW RECEIPT DIALOG */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-neutral-100 shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader className="border-b border-neutral-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-neutral-900">Comprobante de Factura</DialogTitle>
                <DialogDescription className="text-xs text-neutral-500 font-mono mt-0.5">Folio: {selectedInvoice?.id}</DialogDescription>
              </div>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-none border",
                selectedInvoice ? getStatusStyles(selectedInvoice.status) : ""
              )}>
                {selectedInvoice ? getStatusIcon(selectedInvoice.status) : null}
                {selectedInvoice ? getStatusLabel(selectedInvoice.status) : ''}
              </span>
            </div>
          </DialogHeader>

          {/* Receipt Content Layout */}
          <div className="space-y-4 py-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">Facturado a</p>
                <p className="text-sm font-bold text-neutral-800 mt-1">{selectedInvoice?.clientName}</p>
                <p className="text-neutral-500 mt-0.5">Paciente (Mascota): {selectedInvoice?.petName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">Fecha de Emisión</p>
                <p className="text-sm font-semibold text-neutral-800 mt-1">
                  {selectedInvoice && new Date(selectedInvoice.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="border border-neutral-100 rounded-lg overflow-hidden bg-neutral-50/50 p-4 space-y-3">
              <div className="flex justify-between font-semibold text-neutral-500 pb-1 border-b border-neutral-100">
                <span>Concepto / Descripción</span>
                <span>Total</span>
              </div>
              <div className="flex justify-between items-start text-neutral-800">
                <span className="font-medium">{selectedInvoice?.itemDescription}</span>
                <span className="font-bold">${selectedInvoice?.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-500">Actualizar Estado:</span>
                <select 
                  value={selectedInvoice?.status || 'Pendiente'} 
                  onChange={(e) => selectedInvoice && handleStatusUpdate(selectedInvoice.id, e.target.value)}
                  disabled={isPending}
                  className="rounded-md border border-neutral-200 px-2 py-0.5 text-xs bg-white focus:outline-hidden cursor-pointer"
                >
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Reembolsado">Reembolsado</option>
                </select>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400 leading-none">Total General</p>
                <p className="text-xl font-black text-neutral-900 mt-1">${selectedInvoice?.amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-neutral-100 pt-4 flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                const win = window.open('', '_blank');
                if (win && selectedInvoice) {
                  win.document.write(`
                    <html>
                      <head>
                        <title>Recibo ${selectedInvoice.id}</title>
                        <style>
                          body { font-family: sans-serif; padding: 40px; color: #333; }
                          .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
                          .title { font-size: 24px; font-weight: bold; }
                          .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                          .table th, .table td { border: 1px solid #eee; padding: 12px; text-align: left; }
                          .table th { background: #f9f9f9; }
                          .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; }
                        </style>
                      </head>
                      <body onload="window.print()">
                        <div class="header">
                          <div class="title">Recibo de Facturación - VetControl</div>
                          <p>Folio: ${selectedInvoice.id}</p>
                          <p>Fecha: ${new Date(selectedInvoice.date).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div class="row">
                          <div>
                            <strong>Facturado a:</strong><br>
                            ${selectedInvoice.clientName}<br>
                            Paciente: ${selectedInvoice.petName}
                          </div>
                          <div>
                            <strong>Estado:</strong> ${getStatusLabel(selectedInvoice.status)}
                          </div>
                        </div>
                        <table class="table">
                          <thead>
                            <tr>
                              <th>Concepto</th>
                              <th>Importe</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>${selectedInvoice.itemDescription}</td>
                              <td>$${selectedInvoice.amount.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                        <div class="total">Total General: $${selectedInvoice.amount.toFixed(2)}</div>
                      </body>
                    </html>
                  `);
                  win.document.close();
                }
              }}
              className="h-9 text-xs rounded-lg gap-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir Recibo
            </Button>
            <Button 
              variant="outline" 
              onClick={() => selectedInvoice && handleDelete(selectedInvoice.id)}
              className="h-9 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg gap-1.5 ml-auto cursor-pointer"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Anular Factura
            </Button>
            <Button onClick={() => setIsReceiptOpen(false)} className="h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg cursor-pointer" disabled={isPending}>Cerrar</Button>
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
