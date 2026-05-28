'use client';

import React, { useState, useEffect, useRef } from 'react';
import { socket } from '@/src/lib/socket';
import { 
  Search, MessageSquare, Send, Calendar, User, PawPrint, 
  Settings, Loader2, Sparkles, UserCheck, Shield, BookOpen, 
  Clock, Check, CheckCheck, RefreshCw, Paperclip, FileText, Image as ImageIcon, Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatClientProps {
  clinicId: string;
}

interface Conversation {
  phone: string;
  last_message: string;
  last_message_role: 'user' | 'assistant';
  last_message_status: 'sent' | 'delivered' | 'read';
  last_message_time: string;
  client_name: string | null;
  client_id: string | null;
  conversation_mode: 'ai' | 'human';
  unread_count: number;
  last_seen_at?: string;
}

interface Message {
  id: string;
  phone: string;
  message: string;
  role: 'user' | 'assistant';
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  weight: string | null;
}

interface Appointment {
  id: string;
  pet_id: string;
  pet_name: string;
  date: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'Checked-in' | 'In-Progress' | 'Completed' | 'Cancelled';
  notes: string | null;
  veterinarian: string;
}

export default function ChatClient({ clinicId }: ChatClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // CRM Profile Details
  const [profileLoading, setProfileLoading] = useState(false);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [internalNotes, setInternalNotes] = useState('');
  
  // State indicators
  const [loading, setLoading] = useState(true);
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'qr'>('connected');
  const [searchQuery, setSearchQuery] = useState('');
  const [typingState, setTypingState] = useState<{ [phone: string]: boolean }>({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Dynamic API Host base
  const apiHost = process.env.NEXT_PUBLIC_API_URL || 'https://vetcontrol-bot.onrender.com';

  // 1. Fetch conversations list
  const fetchConversations = async () => {
    try {
      const response = await fetch(`${apiHost}/api/conversations/${clinicId}`);
      const resData = await response.json();
      if (resData.success && resData.data) {
        setConversations(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch specific thread message history
  const fetchMessages = async (phone: string) => {
    try {
      const response = await fetch(`${apiHost}/api/messages/${clinicId}/${phone}`);
      const resData = await response.json();
      if (resData.success && resData.data) {
        setMessages(resData.data);
        
        // Notify socket that agent saw this conversation
        socket.emit('message_seen', { clinicId, phone });
        
        // Decrease unread count locally
        setConversations(prev => prev.map(c => c.phone === phone ? { ...c, unread_count: 0 } : c));
      }
    } catch (err) {
      console.error(`Failed to fetch messages for +${phone}:`, err);
    }
  };

  // 3. Fetch detailed client, pets, and appointments CRM profile
  const fetchCRMProfile = async (clientId: string) => {
    setProfileLoading(true);
    try {
      const response = await fetch(`${apiHost}/api/client/profile/${clinicId}/${clientId}`);
      const resData = await response.json();
      if (resData.success && resData.data) {
        setClientProfile(resData.data.client);
        setPets(resData.data.pets);
        setAppointments(resData.data.appointments);
        setInternalNotes(resData.data.client.internal_notes || '');
      }
    } catch (err) {
      console.error('Failed to fetch CRM profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch conversations on load and poll periodically
  useEffect(() => {
    fetchConversations();
    
    // Check whatsapp connection status
    fetch(`${apiHost}/api/session/status/${clinicId}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setWhatsappStatus(resData.status);
        }
      }).catch(() => setWhatsappStatus('disconnected'));

    // Join room on mount
    socket.emit('join_clinic', clinicId);

    // Live Socket Listeners
    socket.on('new_message', (data) => {
      // Refresh conversation list to get latest message and unread count
      fetchConversations();

      // If this message belongs to the currently open chat thread, append it
      if (selectedPhone && data.phone === selectedPhone) {
        const newMsg: Message = {
          id: Math.random().toString(),
          phone: data.phone,
          message: data.message,
          role: data.role,
          status: data.status || 'sent',
          created_at: data.createdAt || new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);

        // Auto trigger seen event if agent is viewing it
        if (data.role === 'user') {
          socket.emit('message_seen', { clinicId, phone: selectedPhone });
        }
      }
    });

    socket.on('typing_start', (data) => {
      if (data.phone) {
        setTypingState(prev => ({ ...prev, [data.phone]: true }));
      }
    });

    socket.on('typing_stop', (data) => {
      if (data.phone) {
        setTypingState(prev => ({ ...prev, [data.phone]: false }));
      }
    });

    socket.on('message_seen', (data) => {
      if (selectedPhone && data.phone === selectedPhone) {
        setMessages(prev => prev.map(m => m.role === 'assistant' ? { ...m, status: 'read' } : m));
      }
    });

    socket.on('conversation_taken', (data) => {
      setConversations(prev => prev.map(c => c.phone === data.phone ? { ...c, conversation_mode: 'human' } : c));
      if (clientProfile && selectedPhone === data.phone) {
        setClientProfile((prev: any) => prev ? { ...prev, conversation_mode: 'human' } : null);
      }
    });

    socket.on('conversation_ai_enabled', (data) => {
      setConversations(prev => prev.map(c => c.phone === data.phone ? { ...c, conversation_mode: 'ai' } : c));
      if (clientProfile && selectedPhone === data.phone) {
        setClientProfile((prev: any) => prev ? { ...prev, conversation_mode: 'ai' } : null);
      }
    });

    socket.on('whatsapp_status', (data) => {
      setWhatsappStatus(data.status);
    });

    return () => {
      socket.off('new_message');
      socket.off('typing_start');
      socket.off('typing_stop');
      socket.off('message_seen');
      socket.off('conversation_taken');
      socket.off('conversation_ai_enabled');
      socket.off('whatsapp_status');
    };
  }, [clinicId, selectedPhone, clientProfile]);

  // Scroll to bottom of message panel
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingState]);

  // Handle click on conversation item
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedPhone(conv.phone);
    fetchMessages(conv.phone);
    if (conv.client_id) {
      fetchCRMProfile(conv.client_id);
    } else {
      setClientProfile(null);
      setPets([]);
      setAppointments([]);
      setInternalNotes('');
    }
  };

  // Toggle Handoff between AI and Human mode
  const handleToggleMode = async (phone: string, currentMode: 'ai' | 'human') => {
    const nextMode = currentMode === 'ai' ? 'human' : 'ai';
    try {
      const response = await fetch(`${apiHost}/api/conversation/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, phone, mode: nextMode })
      });
      const resData = await response.json();
      if (resData.success) {
        setConversations(prev => prev.map(c => c.phone === phone ? { ...c, conversation_mode: nextMode } : c));
        if (clientProfile) {
          setClientProfile({ ...clientProfile, conversation_mode: nextMode });
        }
      }
    } catch (err) {
      console.error('Failed to toggle conversation mode:', err);
    }
  };

  // Save client internal notes
  const handleSaveNotes = async () => {
    if (!clientProfile) return;
    try {
      const response = await fetch(`${apiHost}/api/client/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, clientId: clientProfile.id, notes: internalNotes })
      });
      const resData = await response.json();
      if (resData.success) {
        setClientProfile({ ...clientProfile, internal_notes: internalNotes });
        alert('Notas guardadas exitosamente');
      }
    } catch (err) {
      console.error('Failed to save client notes:', err);
    }
  };

  // Handle typing inside message input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Emit typing_start event on websocket
    if (!isTyping && selectedPhone) {
      setIsTyping(true);
      socket.emit('typing_start', { clinicId, phone: selectedPhone, sender: 'agent' });
    }

    // Reset typing_stop timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedPhone) {
        socket.emit('typing_stop', { clinicId, phone: selectedPhone, sender: 'agent' });
      }
    }, 2000);
  };

  // Submit manual agent message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPhone) return;

    const messageText = inputText.trim();
    setInputText('');

    // Clear typing state immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    socket.emit('typing_stop', { clinicId, phone: selectedPhone, sender: 'agent' });

    try {
      // Optimistic append
      const optMsg: Message = {
        id: Math.random().toString(),
        phone: selectedPhone,
        message: messageText,
        role: 'assistant',
        status: 'sent',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, optMsg]);

      // Call API
      await fetch(`${apiHost}/api/message/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, phone: selectedPhone, message: messageText })
      });

      fetchConversations();
    } catch (err) {
      console.error('Failed to send manual message:', err);
    }
  };

  // Filter conversation list based on search bar
  const filteredConversations = conversations.filter(c => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = c.client_name?.toLowerCase().includes(searchLower) || false;
    const phoneMatch = c.phone.includes(searchLower);
    const msgMatch = c.last_message.toLowerCase().includes(searchLower);
    return nameMatch || phoneMatch || msgMatch;
  });

  const activeConversation = conversations.find(c => c.phone === selectedPhone);

  return (
    <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-white border border-neutral-100 rounded-2xl shadow-sm">
      
      {/* 1. LEFT SIDEBAR: CONVERSATION INDEX LIST */}
      <div className="w-80 flex flex-col border-r border-neutral-100 bg-neutral-50/30">
        
        {/* Connection status header bar */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-neutral-600" />
            <h3 className="text-sm font-bold text-neutral-900">Mensajes de WhatsApp</h3>
          </div>
          
          {/* AI Connection Badges */}
          <div className="flex items-center">
            {whatsappStatus === 'connected' ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse">
                🟢 Live
              </span>
            ) : whatsappStatus === 'qr' ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                🟡 QR Listo
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                🔴 Offline
              </span>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 bg-white">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar cliente, número, chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-100 rounded-lg py-2 pl-8 pr-4 text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* List of active chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-neutral-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              <span className="text-[10px] font-semibold">Cargando conversaciones...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400 font-medium">
              No se encontraron chats activos
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedPhone === conv.phone;
              const hasUnread = conv.unread_count > 0;
              const relativeTime = new Date(conv.last_message_time).toLocaleTimeString('es-PE', {
                hour: '2-digit', minute: '2-digit'
              });

              return (
                <div
                  key={conv.phone}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    "p-4 cursor-pointer flex gap-3 items-start hover:bg-neutral-50/80 transition-all border-l-3",
                    isSelected ? "bg-emerald-50/30 border-emerald-500" : "border-transparent"
                  )}
                >
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase shadow-2xs">
                    {conv.client_name ? conv.client_name.substring(0, 2) : 'WA'}
                    
                    {/* Tiny badge indicating AI mode state on avatar */}
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                      conv.conversation_mode === 'ai' ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">
                        {conv.client_name || `+${conv.phone}`}
                      </h4>
                      <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap">
                        {relativeTime}
                      </span>
                    </div>

                    <p className={cn(
                      "text-[10px] truncate mt-0.5 leading-normal",
                      hasUnread ? "text-neutral-900 font-extrabold" : "text-neutral-500"
                    )}>
                      {conv.last_message_role === 'assistant' ? 'Tú: ' : ''}{conv.last_message}
                    </p>

                    {/* Meta indicator footer tags */}
                    <div className="flex items-center justify-between mt-1">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                        conv.conversation_mode === 'ai' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {conv.conversation_mode === 'ai' ? '⚡ IA' : '👤 Humano'}
                      </span>

                      {hasUnread && (
                        <span className="bg-emerald-500 text-white text-[9px] font-black h-4 px-1.5 flex items-center justify-center rounded-full shadow-sm min-w-4">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CENTER PANEL: ACTIVE CHAT SCREEN */}
      <div className="flex-1 flex flex-col bg-neutral-50/20">
        {selectedPhone ? (
          <>
            {/* Header dashboard metadata */}
            <div className="p-4 border-b border-neutral-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center uppercase shadow-2xs">
                  {activeConversation?.client_name ? activeConversation.client_name.substring(0, 2) : 'WA'}
                </div>
                <div>
                  <h3 className="text-xs font-black text-neutral-900">
                    {activeConversation?.client_name || 'Cliente de WhatsApp'}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-bold mt-0.5">
                    +{selectedPhone}
                  </p>
                </div>
              </div>

              {/* Mode Alert Takeover Toggle Button */}
              <div className="flex items-center gap-3">
                {activeConversation?.conversation_mode === 'ai' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-emerald-500 animate-pulse" />
                      Valentina AI Activa
                    </span>
                    <button
                      onClick={() => handleToggleMode(selectedPhone, 'ai')}
                      className="text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Tomar Control (Handoff)
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-100 px-2 py-1 rounded-md flex items-center gap-1">
                      👤 Recepcionista Activo (IA en Pausa)
                    </span>
                    <button
                      onClick={() => handleToggleMode(selectedPhone, 'human')}
                      className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Activar Asistente IA
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat message bubbles scroll window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                const date = new Date(msg.created_at);
                const timeStr = date.toLocaleTimeString('es-PE', {
                  hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex w-full",
                      isAssistant ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-md rounded-2xl p-3 shadow-3xs leading-relaxed text-xs border relative",
                        isAssistant 
                          ? "bg-emerald-600 text-white border-emerald-550 rounded-tr-none" 
                          : "bg-white text-neutral-850 border-neutral-100 rounded-tl-none"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-75 font-semibold">
                        <span>{timeStr}</span>
                        {isAssistant && (
                          <span>
                            {msg.status === 'read' ? (
                              <CheckCheck className="h-3 w-3 text-sky-200" />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck className="h-3 w-3 text-white/80" />
                            ) : (
                              <Check className="h-3 w-3 text-white/50" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Realtime Typing Indicators bubble */}
              {typingState[selectedPhone] && (
                <div className="flex justify-start">
                  <div className="bg-white border border-neutral-100 text-neutral-500 rounded-2xl rounded-tl-none p-3 shadow-3xs text-xs flex items-center gap-2">
                    <span className="font-semibold">Cliente está escribiendo</span>
                    <span className="flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" />
                      <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Message Area */}
            <div className="p-4 border-t border-neutral-100 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                
                {/* Future attachment icons */}
                <div className="flex items-center gap-1 pr-2">
                  <button type="button" className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer" title="Adjuntar imagen">
                    <ImageIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer" title="Adjuntar documento">
                    <FileText className="h-4 w-4" />
                  </button>
                  <button type="button" className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer" title="Enviar nota de voz">
                    <Mic className="h-4 w-4" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder={
                    activeConversation?.conversation_mode === 'ai'
                      ? "IA activa. Tome control para chatear..."
                      : "Escribe tu respuesta aquí..."
                  }
                  value={inputText}
                  onChange={handleInputChange}
                  disabled={activeConversation?.conversation_mode === 'ai'}
                  className="flex-1 bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-2.5 text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all disabled:cursor-not-allowed disabled:bg-neutral-100"
                />
                
                <button
                  type="submit"
                  disabled={!inputText.trim() || activeConversation?.conversation_mode === 'ai'}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 text-white rounded-xl p-2.5 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400 text-center">
            <MessageSquare className="h-12 w-12 text-neutral-250 animate-bounce mb-3" />
            <h3 className="text-sm font-bold text-neutral-700">Bandeja Conversacional VetControl</h3>
            <p className="text-[10px] text-neutral-500 max-w-xs mt-1">Selecciona una conversación del listado lateral para ver el chat, programar citas o tomar el control de la IA.</p>
          </div>
        )}
      </div>

      {/* 3. RIGHT SIDEBAR: CRM PROFILES DISPLAY */}
      {selectedPhone && (
        <div className="w-80 border-l border-neutral-100 overflow-y-auto bg-neutral-50/20">
          {profileLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-neutral-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              <span className="text-[10px] font-semibold">Cargando perfil CRM...</span>
            </div>
          ) : clientProfile ? (
            <div className="p-4 space-y-5">
              
              {/* Owner Details Card */}
              <div className="bg-white border border-neutral-100 rounded-xl p-3.5 shadow-3xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-50">
                  <User className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-xs font-black text-neutral-900">Perfil del Dueño</h4>
                </div>
                
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-450 font-semibold">Nombre:</span>
                    <span className="text-neutral-850 font-bold truncate max-w-[120px]">{clientProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-450 font-semibold">DNI:</span>
                    <span className="text-neutral-850 font-bold">{clientProfile.dni || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-450 font-semibold">Teléfono:</span>
                    <span className="text-neutral-850 font-bold">+{clientProfile.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-450 font-semibold">Email:</span>
                    <span className="text-neutral-850 font-bold truncate max-w-[140px]">{clientProfile.email || 'N/A'}</span>
                  </div>
                </div>

                {/* Internal staff notes box */}
                <div className="pt-2 border-t border-neutral-50">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Notas Internas de Clínica</label>
                  <textarea
                    rows={3}
                    placeholder="Escribe notas clínicas privadas sobre el cliente..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full text-[10px] border border-neutral-100 rounded-lg p-2 bg-neutral-50/50 focus:outline-hidden focus:border-emerald-500 focus:bg-white resize-none"
                  />
                  <button
                    onClick={handleSaveNotes}
                    className="w-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] py-1.5 rounded-lg mt-2 cursor-pointer hover:bg-emerald-100 hover:text-emerald-800 transition-all"
                  >
                    Guardar Notas
                  </button>
                </div>
              </div>

              {/* Pets Profiles Cards List */}
              <div className="bg-white border border-neutral-100 rounded-xl p-3.5 shadow-3xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-50">
                  <PawPrint className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-xs font-black text-neutral-900">Mascotas</h4>
                </div>

                {pets.length === 0 ? (
                  <p className="text-[10px] text-neutral-450 font-semibold text-center py-2">Ninguna mascota registrada aún.</p>
                ) : (
                  <div className="space-y-3 divide-y divide-neutral-50">
                    {pets.map((pet, idx) => (
                      <div key={pet.id} className={cn("space-y-1.5 text-[10px]", idx > 0 ? "pt-3" : "")}>
                        <div className="flex justify-between items-center">
                          <span className="font-black text-neutral-850 text-xs">{pet.name}</span>
                          <span className="text-[9px] bg-neutral-150 font-extrabold uppercase px-1.5 py-0.5 rounded text-neutral-700">{pet.species === 'dog' ? '🐶 Perro' : pet.species === 'cat' ? '🐱 Gato' : '🐾 Otro'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-450 font-semibold">Raza:</span>
                          <span className="text-neutral-800 font-bold">{pet.breed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-450 font-semibold">Edad:</span>
                          <span className="text-neutral-800 font-bold">{pet.age}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-450 font-semibold">Sexo:</span>
                          <span className="text-neutral-800 font-bold">{pet.sex}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-450 font-semibold">Peso:</span>
                          <span className="text-neutral-800 font-bold">{pet.weight || 'Desconocido'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Client Appointments History List */}
              <div className="bg-white border border-neutral-100 rounded-xl p-3.5 shadow-3xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-50">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-xs font-black text-neutral-900">Historial de Citas</h4>
                </div>

                {appointments.length === 0 ? (
                  <p className="text-[10px] text-neutral-450 font-semibold text-center py-2">No se registran citas.</p>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto">
                    {appointments.map((appt) => {
                      const statusLabels = {
                        Scheduled: { bg: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Programada' },
                        'Checked-in': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Confirmada' },
                        'In-Progress': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'En curso' },
                        Completed: { bg: 'bg-neutral-50 text-neutral-700 border-neutral-100', label: 'Completada' },
                        Cancelled: { bg: 'bg-rose-50 text-rose-700 border-rose-100', label: 'Cancelada' }
                      }[appt.status] || { bg: 'bg-neutral-50 text-neutral-600 border-neutral-100', label: appt.status };

                      return (
                        <div key={appt.id} className="border border-neutral-50 rounded-lg p-2 bg-neutral-50/30 text-[9px] space-y-1">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-neutral-850 font-black">{appt.pet_name}</span>
                            <span className={cn("px-1.5 py-0.5 border rounded-sm font-extrabold text-[8px] uppercase", statusLabels.bg)}>
                              {statusLabels.label}
                            </span>
                          </div>
                          <div className="flex justify-between text-neutral-500 font-semibold">
                            <span>{appt.date} • {appt.time}</span>
                            <span>{appt.type}</span>
                          </div>
                          {appt.notes && (
                            <p className="text-neutral-450 italic truncate border-t border-neutral-50/50 pt-1 mt-1">
                              "{appt.notes}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-xs text-neutral-400 font-semibold">
              Seleccione un cliente para ver su perfil
            </div>
          )}
        </div>
      )}

    </div>
  );
}
