'use client';

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Bell, MessageSquare, Calendar, User, Info, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealtimeNotifierProps {
  clinicId: string;
}

interface NotificationToast {
  id: string;
  type: 'new_message' | 'appointment_confirmed' | 'appointment_cancelled' | 'new_client' | 'whatsapp_status';
  title: string;
  description: string;
  timestamp: Date;
}

export function RealtimeNotifier({ clinicId }: RealtimeNotifierProps) {
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!clinicId) return;

    // Connect to the bot server
    const botUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://vetcontrol-bot.onrender.com';

    console.log(`🔌 Connecting client realtime socket to: ${botUrl}`);
    const socket = io(botUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Realtime socket connected to bot backend.');
      socket.emit('join_clinic', clinicId);
    });

    socket.on('joined', (data) => {
      console.log('🏢 Multi-tenant channel joined:', data);
    });

    // Helper to push notification to list
    const pushNotification = (
      type: NotificationToast['type'],
      title: string,
      description: string
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: NotificationToast = {
        id,
        type,
        title,
        description,
        timestamp: new Date()
      };

      setToasts(prev => [newToast, ...prev].slice(0, 5)); // Keep last 5
      setUnreadCount(prev => prev + 1);

      // Play alert sound if supported
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.2;
        audio.play().catch(() => {});
      } catch (e) {}

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 6000);
    };

    // 1. New Message Event
    socket.on('new_message', (data) => {
      console.log('Realtime event: new_message', data);
      const isUser = data.role === 'user';
      if (isUser) {
        pushNotification(
          'new_message',
          'Nuevo mensaje de cliente 💬',
          `+${data.phone}: "${data.message}"`
        );
      }
    });

    // 2. Appointment Confirmed Event
    socket.on('appointment_confirmed', (data) => {
      console.log('Realtime event: appointment_confirmed', data);
      pushNotification(
        'appointment_confirmed',
        'Cita Confirmada 📅',
        `${data.clientName} confirmó para ${data.petName} a las ${data.appointment?.time || ''}`
      );
    });

    // 3. Appointment Cancelled Event
    socket.on('appointment_cancelled', (data) => {
      console.log('Realtime event: appointment_cancelled', data);
      pushNotification(
        'appointment_cancelled',
        'Cita Cancelada ❌',
        `Un cliente ha cancelado su cita agendada.`
      );
    });

    // 4. New Client Event
    socket.on('new_client', (data) => {
      console.log('Realtime event: new_client', data);
      pushNotification(
        'new_client',
        'Nuevo Cliente Registrado 👤',
        `Cliente +${data.client.phone.slice(-9)} registrado en el sistema.`
      );
    });

    // 5. WhatsApp Status Event
    socket.on('whatsapp_status', (data) => {
      console.log('Realtime event: whatsapp_status', data);
      const statusLabels: Record<string, string> = {
        connected: 'Conectado exitosamente',
        disconnected: 'Desconectado',
        qr: 'Nuevo código QR listo para escanear'
      };
      pushNotification(
        'whatsapp_status',
        'Estado de WhatsApp 📱',
        statusLabels[data.status] || `Estado cambiado a: ${data.status}`
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [clinicId]);

  return (
    <>
      {/* Floating Notifications Drawer in Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const typeConfig = {
            new_message: {
              icon: <MessageSquare className="h-4 w-4 text-emerald-600" />,
              border: 'border-emerald-150',
              bg: 'bg-emerald-50/95',
              bar: 'bg-emerald-500'
            },
            appointment_confirmed: {
              icon: <Check className="h-4 w-4 text-teal-600" />,
              border: 'border-teal-150',
              bg: 'bg-teal-50/95',
              bar: 'bg-teal-500'
            },
            appointment_cancelled: {
              icon: <X className="h-4 w-4 text-rose-600" />,
              border: 'border-rose-150',
              bg: 'bg-rose-50/95',
              bar: 'bg-rose-500'
            },
            new_client: {
              icon: <User className="h-4 w-4 text-violet-600" />,
              border: 'border-violet-150',
              bg: 'bg-violet-50/95',
              bar: 'bg-violet-500'
            },
            whatsapp_status: {
              icon: <Info className="h-4 w-4 text-amber-600" />,
              border: 'border-amber-150',
              bg: 'bg-amber-50/95',
              bar: 'bg-amber-500'
            }
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-xs transition-all duration-300 transform translate-y-0 animate-slide-in-right",
                typeConfig.bg,
                typeConfig.border
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-black/5 bg-white/80 shadow-2xs">
                {typeConfig.icon}
              </div>
              <div className="flex-1 space-y-0.5">
                <h4 className="text-xs font-bold text-neutral-900">{toast.title}</h4>
                <p className="text-[10px] text-neutral-600 leading-normal line-clamp-2">{toast.description}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="shrink-0 text-neutral-400 hover:text-neutral-600 p-0.5 rounded-full hover:bg-neutral-100/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}
