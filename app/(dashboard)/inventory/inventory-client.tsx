'use client';

import React, { useState, useTransition } from 'react';
import { InventoryItem } from '@/types';
import { restockInventoryItem } from '@/app/actions/inventory';
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
import { Search, Plus, AlertTriangle, CheckCircle, RefreshCw, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryClientProps {
  initialItems: InventoryItem[];
}

export default function InventoryClient({ initialItems }: InventoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [isPending, startTransition] = useTransition();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRestock = async (id: string, minStock: number, currentStock: number) => {
    // Restock to 150% of min stock or add 50 units
    const amountToAdd = Math.max(50, minStock - currentStock + 10);
    const item = initialItems.find(i => i.id === id);

    startTransition(async () => {
      const res = await restockInventoryItem(id, amountToAdd);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Restocked ${amountToAdd} units of ${item?.name || 'product'}`);
      }
    });
  };

  const filteredItems = initialItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Inventory & Supplies</h2>
          <p className="text-sm text-neutral-500 mt-1">Track medication batches, clinic equipment, pet feed stocks, and reorder alerts.</p>
        </div>
        <Button className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 self-start sm:self-auto rounded-lg">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-100 p-4 rounded-xl shadow-2xs">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by name, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
          {['all', 'Medication', 'Food', 'Equipment', 'Supplies'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "h-8 text-xs font-semibold px-3 py-1 rounded-lg border transition-all duration-150 capitalize",
                selectedCategory === category
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-200/60 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              {category === 'all' ? 'All Inventory' : category}
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
                  <TableHead className="w-[240px] text-xs font-semibold text-neutral-500 h-10 px-6">Product Details</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">SKU Code</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Stock Level</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Price (Unit)</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Alert Status</TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold text-neutral-500 h-10 pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-neutral-400">
                      No inventory items found.
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
                            <p className="text-xs text-neutral-400 mt-1.5 leading-none">Units tracked: {item.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <code className="text-xs bg-neutral-50 border border-neutral-200/50 px-1.5 py-0.5 rounded-sm font-mono text-neutral-600">
                            {item.sku}
                          </code>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm text-neutral-600 font-medium">{item.category}</span>
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
                          ${item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-100/50">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock ({stockPercentage}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100/50">
                              <CheckCircle className="h-3 w-3" />
                              Optimal
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 pr-6 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={isPending}
                            onClick={() => handleRestock(item.id, item.minStock, item.stock)}
                            className="text-xs text-neutral-600 hover:text-emerald-600 rounded-lg hover:bg-emerald-50/50 flex items-center gap-1 ml-auto"
                          >
                            <RefreshCw className={cn("h-3 w-3", isPending && "animate-spin")} />
                            Restock
                          </Button>
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
