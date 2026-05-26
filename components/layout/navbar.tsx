'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  Check, 
  Info,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from './sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onSearchChange?: (val: string) => void;
}

export function Navbar({ onSearchChange }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Stock Alert',
      message: 'Amoxicillin Tablets are running below critical levels.',
      time: '10 mins ago',
      read: false,
      type: 'warning'
    },
    {
      id: 2,
      title: 'New Patient Registration',
      message: 'Bella (Golden Retriever) owner Sarah Connor registered.',
      time: '2 hours ago',
      read: false,
      type: 'info'
    },
    {
      id: 3,
      title: 'Vaccine Overdue',
      message: 'Rabies Booster for Ace (Great Dane) is overdue.',
      time: '1 day ago',
      read: true,
      type: 'error'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Dashboard';
    const segment = path.split('/')[1];
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-neutral-100 bg-white px-4 md:px-8">
        {/* Left Side: Mobile Menu Button & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden h-9 w-9 text-neutral-500 hover:text-neutral-900 rounded-lg"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-500">
            <span className="text-neutral-400">VetControl</span>
            <ChevronRight className="h-3.5 w-3.5 text-neutral-300" />
            <span className="text-neutral-900 font-semibold">{getPageTitle(pathname)}</span>
          </div>
        </div>

        {/* Right Side: Search, Notifications & Profile */}
        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div className="relative hidden sm:block w-64 md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              type="search"
              placeholder="Search patients, clients..."
              className="pl-9 pr-12 h-9 w-full bg-neutral-50/50 hover:bg-neutral-50 border-neutral-200/60 focus:bg-white text-xs rounded-lg transition-colors duration-150"
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            <kbd className="pointer-events-none absolute right-3 top-2.5 hidden h-4 select-none items-center gap-0.5 rounded border border-neutral-200 bg-white px-1.5 font-mono text-[9px] font-medium text-neutral-400 opacity-100 sm:flex">
              <span>⌘</span>K
            </kbd>
          </div>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-neutral-500 hover:text-neutral-900 rounded-lg border border-neutral-100 hover:bg-neutral-50"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px] p-2 border border-neutral-100 shadow-xl">
              <div className="flex items-center justify-between px-3 py-1.5">
                <DropdownMenuLabel className="text-xs font-bold text-neutral-800 p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator className="bg-neutral-50 my-1" />
              <div className="max-h-[250px] overflow-y-auto space-y-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400 font-medium">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem 
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg p-2 cursor-pointer transition-colors duration-150 focus:bg-neutral-50/50",
                        !notif.read ? "bg-neutral-50/20" : ""
                      )}
                    >
                      <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1 space-y-0.5">
                        <p className={cn(
                          "text-xs text-neutral-900 leading-tight",
                          !notif.read ? "font-semibold" : "font-medium"
                        )}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-neutral-500 leading-normal">{notif.message}</p>
                        <p className="text-[9px] text-neutral-400 font-medium">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 self-center mt-1" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Quick Access */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 font-semibold text-xs text-white shadow-inner select-none cursor-pointer">
            EB
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-neutral-900/40 backdrop-blur-xs transition-opacity duration-200">
          <div 
            className="absolute inset-0" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="relative flex w-full max-w-[280px] flex-col bg-white animate-in slide-in-from-left duration-200 ease-out shadow-2xl">
            <div className="absolute right-4 top-4 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 text-neutral-500 hover:text-neutral-900 rounded-lg"
              >
                <X className="h-4.5 w-4.5" />
                <span className="sr-only">Close sidebar</span>
              </Button>
            </div>
            <Sidebar className="w-full border-r-0" onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
