import React from 'react';
import { InventoryItem } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryAlertCardProps {
  items: InventoryItem[];
  onReorder?: (id: string) => void;
  reorderedIds?: string[];
}

export function InventoryAlertCard({ items, onReorder, reorderedIds = [] }: InventoryAlertCardProps) {
  const lowStockItems = items.filter(item => item.stock <= item.minStock);

  return (
    <Card className="border border-neutral-100 bg-white shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-100">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-neutral-900">Inventory Alerts</CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              {lowStockItems.length} items are running below threshold
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        {lowStockItems.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-100 text-center">
            <p className="text-xs font-medium text-neutral-400">All stock levels are optimal</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lowStockItems.map((item) => {
              const stockPercentage = Math.max(0, Math.min(100, (item.stock / item.minStock) * 100));
              const isCritical = stockPercentage < 25;
              const isReordered = reorderedIds.includes(item.id);

              return (
                <div 
                  key={item.id} 
                  className="group flex flex-col gap-2 rounded-lg border border-neutral-50 p-3 hover:border-neutral-100/80 hover:bg-neutral-50/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">SKU: {item.sku}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant={isReordered ? "outline" : "default"}
                      disabled={isReordered}
                      onClick={() => onReorder?.(item.id)}
                      className={cn(
                        "h-7 text-xs font-medium px-2.5 transition-all duration-200 gap-1",
                        isReordered 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100/50 hover:bg-emerald-50 cursor-default" 
                          : "bg-neutral-900 text-white hover:bg-neutral-800"
                      )}
                    >
                      {isReordered ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Ordered
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Restock
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="mt-1">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className={cn(
                        "font-medium",
                        isCritical ? "text-rose-600" : "text-amber-600"
                      )}>
                        {item.stock} / {item.minStock} {item.unit}
                      </span>
                      <span className="text-neutral-400 font-normal">
                        {Math.round(stockPercentage)}% capacity
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isCritical ? "bg-rose-500" : "bg-amber-500"
                        )}
                        style={{ width: `${stockPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
