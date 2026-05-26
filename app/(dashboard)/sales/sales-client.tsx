'use client';

import React, { useState } from 'react';
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
import { 
  DollarSign, 
  Search, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  clientName: string;
  petName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Refunded';
  itemDescription: string;
}

interface SalesClientProps {
  initialInvoices: Invoice[];
}

export default function SalesClient({ initialInvoices }: SalesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = initialInvoices.filter(inv => 
    inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.itemDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const totalBilling = initialInvoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingBilling = initialInvoices.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0);
  const averageTicket = initialInvoices.length > 0 ? (initialInvoices.reduce((acc, curr) => acc + curr.amount, 0) / initialInvoices.length) : 0;

  const getStatusStyles = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100/50';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border border-amber-100/50';
      case 'Refunded':
        return 'bg-neutral-50 text-neutral-400 border border-neutral-100';
    }
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
      case 'Pending':
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      case 'Refunded':
        return <XCircle className="h-3.5 w-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Billing & Sales</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage veterinary client invoices, billing statements, tax receipts, and payment flows.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button variant="outline" className="border-neutral-200/60 text-neutral-600 hover:text-neutral-900 gap-2 h-10 px-4 rounded-lg bg-white">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 rounded-lg">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-neutral-400 block uppercase tracking-wider">Paid Revenue</span>
            <span className="text-2xl font-bold text-neutral-900 mt-2 block">${totalBilling.toFixed(2)}</span>
            <span className="text-[10px] text-neutral-400 mt-1 block">Successfully processed transactions</span>
          </CardContent>
        </Card>
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-neutral-400 block uppercase tracking-wider">Pending Collection</span>
            <span className="text-2xl font-bold text-neutral-900 mt-2 block">${pendingBilling.toFixed(2)}</span>
            <span className="text-[10px] text-neutral-400 mt-1 block">Awaiting client payment approvals</span>
          </CardContent>
        </Card>
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-neutral-400 block uppercase tracking-wider">Average Invoice</span>
            <span className="text-2xl font-bold text-neutral-900 mt-2 block">${averageTicket.toFixed(2)}</span>
            <span className="text-[10px] text-neutral-400 mt-1 block">Average ticket value per patient visit</span>
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
                placeholder="Search by invoice ID, client, pet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="text-xs text-neutral-400 font-medium">
              Registered transactions: {filteredInvoices.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="hover:bg-transparent border-neutral-100">
                  <TableHead className="w-[120px] text-xs font-semibold text-neutral-500 h-10 px-6">Invoice ID</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Client</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Patient</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Description</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Billing Date</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Status</TableHead>
                  <TableHead className="w-[80px] text-xs font-semibold text-neutral-500 h-10 pr-6 text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-neutral-400">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-neutral-50/50 transition-colors border-neutral-100">
                      <TableCell className="px-6 py-4">
                        <span className="text-xs font-mono font-semibold text-neutral-600 uppercase">{inv.id}</span>
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
                          {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 font-bold text-neutral-900">
                        ${inv.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-none",
                          getStatusStyles(inv.status)
                        )}>
                          {getStatusIcon(inv.status)}
                          {inv.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right">
                        <Button variant="ghost" size="sm" className="text-xs text-neutral-600 hover:text-neutral-900 rounded-lg">
                          View
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
    </div>
  );
}
