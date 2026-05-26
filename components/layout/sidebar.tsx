'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Calendar,
  Package,
  DollarSign,
  Settings,
  Shield,
  ChevronsUpDown,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

export function Sidebar({ className, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Pets', href: '/pets', icon: PawPrint },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Sales', href: '/sales', icon: DollarSign },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn(
      "flex h-full w-[260px] flex-col border-r border-neutral-100 bg-white px-4 py-6",
      className
    )}>
      {/* Branding */}
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white shadow-md">
          <Shield className="h-4.5 w-4.5 text-emerald-400 fill-emerald-400/10" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-neutral-950">VetControl</h1>
          <p className="text-[10px] font-medium text-emerald-600 tracking-wider uppercase leading-none mt-0.5">SaaS Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 py-4">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-neutral-50 text-neutral-900 font-semibold"
                  : "text-neutral-500 hover:bg-neutral-50/50 hover:text-neutral-900"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 transition-colors",
                active 
                  ? "text-emerald-600" 
                  : "text-neutral-400 group-hover:text-neutral-900"
              )} />
              {item.name}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="border-t border-neutral-100 pt-4 mt-auto">
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-neutral-50 transition-colors duration-150 group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200/50 font-bold text-sm text-neutral-700">
              EB
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-neutral-800 leading-tight">Dr. E. Blackwell</span>
              <span className="text-[10px] text-neutral-400 font-medium leading-none mt-1">Downtown Clinic</span>
            </div>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-600" />
        </div>
      </div>
    </aside>
  );
}
