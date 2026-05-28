'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/app/actions/auth';
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
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  className?: string;
  onCloseMobile?: () => void;
  profileName?: string;
  clinicName?: string;
}

export function Sidebar({ 
  className, 
  onCloseMobile,
  profileName = 'Dr. E. Blackwell',
  clinicName = 'VetControl Downtown'
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Tablero / Panel', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Mascotas', href: '/pets', icon: PawPrint },
    { name: 'Citas', href: '/appointments', icon: Calendar },
    { name: 'Inventario', href: '/inventory', icon: Package },
    { name: 'Ventas / Facturación', href: '/sales', icon: DollarSign },
    { name: 'Chats en Vivo', href: '/chat', icon: MessageSquare },
    { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare },
    { name: 'Planes y Facturación', href: '/billing', icon: CreditCard },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ];


  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
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
          <p className="text-[10px] font-medium text-emerald-600 tracking-wider uppercase leading-none mt-0.5">Plataforma SaaS</p>
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

      {/* Footer Profile Dropdown */}
      <div className="border-t border-neutral-100 pt-4 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button 
                type="button"
                className="flex items-center justify-between rounded-lg p-2 hover:bg-neutral-50 transition-colors duration-150 group cursor-pointer w-full border-0 outline-hidden bg-transparent text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200/50 font-bold text-sm text-neutral-700">
                    {getInitials(profileName)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-neutral-800 leading-tight">{profileName}</span>
                    <span className="text-[10px] text-neutral-400 font-medium leading-none mt-1">{clinicName}</span>
                  </div>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-600" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-[200px] border border-neutral-100 shadow-lg">
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-xs cursor-pointer flex items-center gap-2 text-rose-600 focus:text-rose-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
