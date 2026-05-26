'use client';

import React, { useState } from 'react';
import { RevenueData } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RevenueSummaryProps {
  data: RevenueData[];
}

export function RevenueSummary({ data }: RevenueSummaryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate totals and statistics
  const totalRevenue = data.reduce((acc, curr) => acc + curr.amount, 0);
  const totalAppointments = data.reduce((acc, curr) => acc + curr.appointments, 0);
  const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

  // Chart setup
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const amounts = data.map(d => d.amount);
  const maxAmount = Math.max(...amounts) * 1.1; // 10% padding on top
  const minAmount = Math.min(...amounts) * 0.9; // 10% padding on bottom

  // Generate points
  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth;
    const y = svgHeight - padding.bottom - ((d.amount - minAmount) / (maxAmount - minAmount)) * chartHeight;
    return { x, y, data: d, index };
  });

  // SVG Line path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // SVG Area path (for gradient fill under the line)
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - padding.bottom} L ${points[0].x} ${svgHeight - padding.bottom} Z`
    : '';

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <Card className="border border-neutral-100 bg-white shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold text-neutral-900">Revenue Overview</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Daily billing performance for the current week
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100/50">
          <TrendingUp className="h-3.5 w-3.5" />
          +12.4% vs last week
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 border-b border-neutral-50 pb-5 mb-5">
          <div>
            <p className="text-xs text-neutral-400 font-medium">Total Billing</p>
            <p className="text-xl font-semibold text-neutral-900 mt-1">
              ${totalRevenue.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium">Appointments Done</p>
            <p className="text-xl font-semibold text-neutral-900 mt-1">
              {totalAppointments}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium">Average Ticket</p>
            <p className="text-xl font-semibold text-neutral-900 mt-1">
              ${Math.round(averageTicket).toLocaleString()}
            </p>
          </div>
        </div>

        {/* SVG Interactive Line Chart */}
        <div className="relative w-full overflow-hidden select-none">
          <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="w-full h-auto overflow-visible"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.627 0.194 149.213)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="oklch(0.627 0.194 149.213)" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((val, i) => {
              const y = padding.top + val * chartHeight;
              const amountLabel = Math.round(maxAmount - val * (maxAmount - minAmount));
              return (
                <g key={i} className="opacity-40">
                  <line 
                    x1={padding.left} 
                    y1={y} 
                    x2={svgWidth - padding.right} 
                    y2={y} 
                    stroke="var(--border)" 
                    strokeWidth="1" 
                    strokeDasharray="4 4"
                  />
                  <text 
                    x={padding.left - 12} 
                    y={y + 4} 
                    textAnchor="end" 
                    className="text-[10px] fill-neutral-400 font-medium"
                  >
                    ${amountLabel}
                  </text>
                </g>
              );
            })}

            {/* X Axis Labels */}
            {data.map((d, i) => {
              const x = padding.left + (i / (data.length - 1)) * chartWidth;
              return (
                <text
                  key={i}
                  x={x}
                  y={svgHeight - padding.bottom + 20}
                  textAnchor="middle"
                  className={cn(
                    "text-[10px] font-medium transition-colors duration-150",
                    hoveredIndex === i ? "fill-neutral-900 font-bold" : "fill-neutral-400"
                  )}
                >
                  {d.date.replace('May ', '')}
                </text>
              );
            })}

            {/* Area Path */}
            <path 
              d={areaPath} 
              fill="url(#chartGradient)"
            />

            {/* Line Path */}
            <path 
              d={linePath} 
              fill="none" 
              stroke="oklch(0.627 0.194 149.213)" 
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Vertical Guide Line on Hover */}
            {activePoint && (
              <line 
                x1={activePoint.x} 
                y1={padding.top} 
                x2={activePoint.x} 
                y2={svgHeight - padding.bottom} 
                stroke="oklch(0.627 0.194 149.213)" 
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="opacity-70"
              />
            )}

            {/* Data Points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                className={cn(
                  "transition-all duration-150 stroke-white",
                  hoveredIndex === i 
                    ? "fill-emerald-600 stroke-[2px]" 
                    : "fill-white stroke-neutral-300 stroke-[1.5px] hover:stroke-emerald-600 hover:fill-emerald-50 hover:r-[6px]"
                )}
              />
            ))}

            {/* Transparent columns for hovering logic */}
            {points.map((p, i) => {
              const colWidth = chartWidth / (data.length - 1);
              const xStart = p.x - colWidth / 2;
              return (
                <rect
                  key={i}
                  x={xStart}
                  y={padding.top}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Interactive Tooltip Card overlay inside container */}
          {activePoint && (
            <div 
              className="absolute bg-white border border-neutral-100 shadow-lg p-3 rounded-lg pointer-events-none transition-all duration-100 ease-out"
              style={{
                top: `${activePoint.y - 85}px`,
                left: `${Math.min(svgWidth - 145, Math.max(15, activePoint.x - 70))}px`,
                width: '140px'
              }}
            >
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                {activePoint.data.date}
              </p>
              <div className="mt-1 flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-neutral-900">
                  ${activePoint.data.amount.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">
                  {activePoint.data.appointments} appointments
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
