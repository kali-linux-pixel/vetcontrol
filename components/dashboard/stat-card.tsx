import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden border border-neutral-100 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-500">{title}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-50 text-neutral-600 transition-colors group-hover:bg-neutral-100">
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-semibold tracking-tight text-neutral-900">{value}</span>
        </div>
        {(trend || description) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {trend && (
              <span className={cn(
                "inline-flex items-center gap-0.5 font-medium rounded-full px-1.5 py-0.5",
                trend.isPositive 
                  ? "bg-emerald-50 text-emerald-700" 
                  : "bg-rose-50 text-rose-700"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}%
              </span>
            )}
            {trend && <span className="text-neutral-400">{trend.label}</span>}
            {!trend && description && <span className="text-neutral-500">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
