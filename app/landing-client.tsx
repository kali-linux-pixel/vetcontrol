'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Calendar, 
  Users, 
  PawPrint, 
  Package, 
  BarChart3, 
  Bell, 
  Shield, 
  Check, 
  Plus, 
  Minus,
  MessageSquare,
  Sparkles,
  Menu,
  X,
  Heart,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingClient() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Calendar,
      title: 'Gestión de Citas',
      description: 'Optimiza la programación con un calendario multi-veterinario, reservas automatizadas de arrastrar y soltar, y seguimiento dinámico del estado.',
      badge: 'Tiempo real'
    },
    {
      icon: Package,
      title: 'Seguimiento de Inventario',
      description: 'Monitorea niveles de stock, SKUs y medicamentos críticos. VetControl detecta inventario bajo y genera listas de reabastecimiento.',
      badge: 'Alerta inteligente'
    },
    {
      icon: Bell,
      title: 'Recordatorios Automatizados',
      description: 'Mantén a salvo a tus mascotas y aumenta el retorno de clientes con recordatorios programados por correo y SMS para vacunas y chequeos.',
      badge: 'Piloto automático'
    },
    {
      icon: PawPrint,
      title: 'Expedientes Digitales de Mascotas',
      description: 'Almacena perfiles clínicos completos, historial detallado de propietarios, métricas de especies y resúmenes de visitas en un solo lugar seguro.',
      badge: 'Unificado'
    },
    {
      icon: BarChart3,
      title: 'Métricas y Reportes',
      description: 'Monitorea transacciones diarias, densidad de citas, datos demográficos de mascotas y rotación de medicamentos con un gráfico intuitivo.',
      badge: 'Métricas'
    },
    {
      icon: Shield,
      title: 'Seguridad Multi-inquilino Segura',
      description: 'Mantén un estricto aislamiento de los datos. Cada registro está delimitado a tu clínica con Control de Acceso Basado en Roles.',
      badge: 'Cumple HIPAA'
    }
  ];

  const pricingPlans = [
    {
      name: 'Plan Inicial',
      description: 'Ideal para veterinarios independientes y clínicas móviles.',
      price: billingPeriod === 'monthly' ? 49 : 39,
      features: [
        '1 Licencia de Veterinario',
        'Hasta 500 Mascotas Activas',
        'Calendario de Citas Estándar',
        'Historial Clínico Básico',
        'Recordatorios de Vacunas por Correo',
        'Soporte de la Comunidad'
      ],
      popular: false,
      cta: 'Comenzar con Plan Inicial'
    },
    {
      name: 'Plan Profesional',
      description: 'Diseñado para consultorios en crecimiento y clínicas locales.',
      price: billingPeriod === 'monthly' ? 99 : 79,
      features: [
        '5 Licencias de Veterinarios',
        'Mascotas y Clientes Ilimitados',
        'Calendario Avanzado Multi-Veterinario',
        'Alertas Inteligentes de Inventario y SKUs',
        'Recordatorios Automáticos por SMS y Correo',
        'Métricas y Gráficos de Ingresos',
        'Soporte Prioritario (24/7)'
      ],
      popular: true,
      cta: 'Probar Profesional Gratis'
    },
    {
      name: 'Plan Enterprise',
      description: 'Control empresarial para cadenas de hospitales veterinarios.',
      price: 'Personalizado',
      features: [
        'Licencias Ilimitadas',
        'Sincronización de Sedes Múltiples',
        'Instancia de Base de Datos Dedicada',
        'Integraciones Personalizadas con APIs EHR',
        'Garantía de SLA y Gestor Dedicado',
        'Capacitación Presencial para el Equipo'
      ],
      popular: false,
      cta: 'Contactar a Ventas'
    }
  ];

  const FAQs = [
    {
      q: '¿Cómo protege los registros clínicos la arquitectura multi-inquilino?',
      a: 'VetControl utiliza un sistema multi-inquilino blindado. Las filas de la base de datos para perfiles, clientes, mascotas, citas e inventario están delimitadas estrictamente por un ID de organización seguro. Esto garantiza que los registros de tu clínica estén completamente aislados y privados.'
    },
    {
      q: '¿Podemos importar nuestros archivos clínicos existentes?',
      a: '¡Sí! VetControl proporciona una interfaz de importación sencilla para archivos CSV. Puedes importar tus listas de clientes, mascotas e inventario durante el registro, o contactar a nuestros especialistas para asistencia personalizada.'
    },
    {
      q: '¿Qué canales utiliza el sistema de recordatorios de vacunas?',
      a: 'El sistema puede enviar notificaciones automáticas por correo electrónico y SMS directamente a los propietarios. Los recordatorios se configuran en función del historial de vacunación y los próximos refuerzos.'
    },
    {
      q: '¿Hay un límite de expedientes de mascotas en el plan Profesional?',
      a: '¡Ninguno! Los planes Profesional y Enterprise ofrecen almacenamiento ilimitado de clientes y mascotas, permitiendo que tu clínica crezca sin preocuparte por límites de capacidad.'
    }
  ];

  const testimonials = [
    {
      quote: "VetControl ha revolucionado el funcionamiento de nuestra clínica. Solo los recordatorios automáticos de vacunas han aumentado las tasas de retorno de pacientes en un 34%. Es limpio, excepcionalmente rápido y completamente intuitivo.",
      author: "Dra. Sarah Connor, DVM",
      role: "Fundadora, Hospital Veterinario Cyberdyne",
      avatarInitials: "SC"
    },
    {
      quote: "Migramos de un sistema de escritorio antiguo a VetControl en menos de una hora. El seguimiento del inventario médico crítico, como vacunas y antibióticos, ahora está automatizado, evitando la escasez de stock.",
      author: "Dr. James Herriot",
      role: "Veterinario Principal, Clínica de Animales de Yorkshire",
      avatarInitials: "JH"
    }
  ];

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-emerald-100 selection:text-emerald-950 overflow-x-hidden">
      {/* Top Navigation */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-neutral-100/80 shadow-xs' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-white group-hover:scale-105 transition-transform duration-200 shadow-sm">
              <Shield className="h-5 w-5 text-emerald-400 fill-emerald-400/10" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-neutral-900 leading-none">VetControl</span>
              <span className="text-[9px] font-semibold text-emerald-600 tracking-wider uppercase leading-none mt-1">v2.0 PRO</span>
            </div>
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-500">
            <a href="#features" className="hover:text-neutral-900 transition-colors">Características</a>
            <a href="#preview" className="hover:text-neutral-900 transition-colors">Vista Previa</a>
            <a href="#pricing" className="hover:text-neutral-900 transition-colors">Precios</a>
            <a href="#faq" className="hover:text-neutral-900 transition-colors">FAQ</a>
          </nav>

          {/* Nav CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-semibold hover:bg-neutral-50 rounded-lg h-9.5 px-4 text-neutral-600 hover:text-neutral-900">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-neutral-950 hover:bg-neutral-900 text-white font-semibold rounded-lg text-sm h-9.5 px-4 shadow-sm transition-all">
                Comenzar Gratis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-white px-6 py-4 flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-955 text-white">
                  <Shield className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="font-bold text-neutral-900">VetControl</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-6 py-12 text-lg font-semibold text-neutral-600">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-900">Características</a>
              <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-900">Vista Previa</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-900">Precios</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-900">FAQ</a>
            </nav>

            <div className="mt-auto space-y-3 pb-8">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                <Button variant="outline" className="w-full h-11 text-base font-semibold border-neutral-200 text-neutral-800 rounded-xl">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                <Button className="w-full h-11 text-base font-semibold bg-neutral-950 text-white rounded-xl">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-radial from-emerald-50/20 via-white to-white overflow-hidden">
        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 -z-10" />
        
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/80 text-emerald-800 font-semibold text-xs mb-6"
          >
            <Sparkles className="h-3.5 w-3.5 fill-emerald-100" />
            <span>Conoce VetControl v2.0 para Web y Móvil</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-950 leading-[1.08] lg:text-7xl font-sans"
          >
            El Sistema Operativo para Clínicas <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Veterinarias Modernas</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-neutral-500 max-w-2xl mx-auto mt-6 leading-relaxed font-medium"
          >
            Un espacio de trabajo multi-inquilino de alto rendimiento diseñado para agilizar el historial clínico, coordinar horarios, automatizar alertas de vacunas y gestionar el stock médico.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-10"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-neutral-950 hover:bg-neutral-900 text-white font-semibold h-11 px-6 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all">
                Iniciar Prueba Gratuita
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#preview" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 font-semibold h-11 px-6 rounded-xl text-sm">
                Explorar Tablero / Panel
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Interactive Mock Dashboard Preview */}
      <section id="preview" className="pb-24 bg-white px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 pointer-events-none" />
            
            {/* Window bar */}
            <div className="flex items-center justify-between px-3 pb-3 border-b border-neutral-200/60 mb-3.5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-semibold bg-white border border-neutral-200/85 px-3 py-1 rounded-md shadow-xs">
                <Shield className="h-3 w-3 text-emerald-500" />
                <span>app.vetcontrol.io/dashboard (Encriptado)</span>
              </div>
              <div className="w-12" />
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="bg-white rounded-xl border border-neutral-100 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-4 min-h-[460px]">
              {/* Sidebar Mock */}
              <div className="hidden md:flex flex-col border-r border-neutral-100 p-4 bg-neutral-50/30">
                <div className="flex items-center gap-2 pb-6 border-b border-neutral-100">
                  <div className="h-7 w-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">
                    VC
                  </div>
                  <span className="font-bold text-xs text-neutral-900">VetControl</span>
                </div>
                <div className="space-y-1.5 py-6">
                  {['Tablero / Panel', 'Clientes', 'Mascotas', 'Citas', 'Inventario', 'Métricas'].map((name, i) => (
                    <div 
                      key={name} 
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${i === 0 ? 'bg-neutral-50 text-neutral-900' : 'text-neutral-400'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                      {name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content Area Mock */}
              <div className="md:col-span-3 p-5 space-y-5">
                {/* Mock header */}
                <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 leading-none">Clínica Veterinaria Centro</h3>
                    <p className="text-[10px] text-neutral-400 mt-1">Entorno multi-inquilino seguro</p>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                    EB
                  </div>
                </div>

                {/* Grid of cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total de Clientes', value: '412', change: '+12.4%', color: 'text-emerald-600' },
                    { label: 'Mascotas Activas', value: '894', change: '+8.1%', color: 'text-emerald-600' },
                    { label: 'Citas de Hoy', value: '17', change: '+15.2%', color: 'text-emerald-600' }
                  ].map((stat, i) => (
                    <div key={i} className="p-3 border border-neutral-100 rounded-lg bg-neutral-50/50 shadow-2xs">
                      <p className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider">{stat.label}</p>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-lg font-black text-neutral-900">{stat.value}</span>
                        <span className="text-[9px] font-bold text-emerald-600">{stat.change}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table and Chart mockups side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Appointment Mock List */}
                  <div className="p-3.5 border border-neutral-100 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-neutral-800">Próximas Citas</span>
                      <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">En vivo</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { time: '09:00 AM', pet: 'Max (Pastor Alemán)', type: 'Consulta', status: 'Checked-in' },
                        { time: '10:30 AM', pet: 'Milo (Gato Mestizo)', type: 'Cirugía', status: 'In-Progress' },
                        { time: '01:15 PM', pet: 'Ace (Gran Danés)', type: 'Chequeo General', status: 'Scheduled' }
                      ].map((apt, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-neutral-50/70 border border-neutral-100/50">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-neutral-800">{apt.pet}</p>
                            <p className="text-[8px] text-neutral-400 font-medium">{apt.type === 'Consultation' ? 'Consulta' : apt.type === 'Surgery' ? 'Cirugía' : 'Chequeo'} • {apt.time}</p>
                          </div>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${apt.status === 'Checked-in' ? 'bg-emerald-50 text-emerald-700' : apt.status === 'In-Progress' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-600'}`}>
                            {apt.status === 'Checked-in' ? 'En Espera' : apt.status === 'In-Progress' ? 'En Curso' : 'Programada'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sparkline chart mock */}
                  <div className="p-3.5 border border-neutral-100 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-neutral-800">Rendimiento Semanal</span>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-600">
                          <TrendingUp className="h-3 w-3" />
                          <span>+23.4% Ingresos</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-neutral-400 mt-0.5">Diagnóstico de transacciones clínicas</p>
                    </div>

                    {/* SVG Sparkline */}
                    <div className="h-20 w-full pt-4">
                      <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area */}
                        <path 
                          d="M0,25 Q15,12 30,18 T60,5 T90,8 L100,6 L100,30 L0,30 Z" 
                          fill="url(#chartGradient)"
                        />
                        {/* Line */}
                        <path 
                          d="M0,25 Q15,12 30,18 T60,5 T90,8 L100,6" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="1.5" 
                          strokeLinecap="round"
                        />
                        {/* Dots */}
                        <circle cx="100" cy="6" r="2" fill="#10b981" />
                        <circle cx="60" cy="5" r="2" fill="#10b981" />
                      </svg>
                    </div>

                    <div className="flex justify-between text-[8px] text-neutral-400 font-semibold pt-2 border-t border-neutral-50">
                      <span>Lun</span>
                      <span>Mié</span>
                      <span>Vie</span>
                      <span>Hoy</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="py-24 bg-neutral-50/50 border-y border-neutral-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Características de Nivel Empresarial</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">Todo lo que tu clínica necesita. Sin complicaciones.</h2>
            <p className="text-sm sm:text-base text-neutral-500 mt-4 leading-relaxed">Eliminamos las interfaces lentas del software antiguo para crear un espacio de trabajo ágil diseñado para el ritmo y la eficiencia.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  key={index}
                  className="group bg-white rounded-2xl border border-neutral-100 p-6 shadow-2xs hover:shadow-xs transition-all hover:-translate-y-0.5"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-neutral-900">{feat.title}</h3>
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {feat.badge}
                    </span>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-neutral-500 mt-3 leading-relaxed">
                    {feat.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">De Confianza por Veterinarios</span>
            <h2 className="text-3xl font-extrabold text-neutral-900 mt-2 tracking-tight">Aprobado por directores clínicos.</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-neutral-50/50 border border-neutral-100 flex flex-col justify-between shadow-2xs">
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, index) => (
                      <span key={index} className="text-emerald-500 text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-100/60">
                  <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs select-none">
                    {t.avatarInitials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{t.author}</h4>
                    <p className="text-[10px] text-neutral-400 font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-neutral-50/50 border-t border-neutral-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Precios Simples y Transparentes</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">Diseñado para crecer con tu clínica.</h2>
            <p className="text-sm text-neutral-500 mt-4 leading-relaxed">Comienza a operar en minutos. No se requiere tarjeta de crédito para probar.</p>

            {/* Toggle monthly / annual */}
            <div className="inline-flex items-center bg-white border border-neutral-200 p-1 rounded-xl mt-8 shadow-2xs">
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${billingPeriod === 'monthly' ? 'bg-neutral-950 text-white' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                Facturación mensual
              </button>
              <button 
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${billingPeriod === 'annual' ? 'bg-neutral-950 text-white' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                Facturación anual
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">Ahorra 20%</span>
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
            {pricingPlans.map((plan, i) => (
              <div 
                key={i}
                className={`relative bg-white border rounded-2xl p-6 flex flex-col justify-between shadow-2xs ${plan.popular ? 'border-emerald-500 ring-1 ring-emerald-500/25' : 'border-neutral-200/80'}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 right-6 text-[9px] font-bold uppercase tracking-widest bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
                    Más Popular
                  </span>
                )}
                
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 leading-none">{plan.name}</h3>
                    <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2">
                    <span className="text-3xl sm:text-4xl font-black text-neutral-900">
                      {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                    </span>
                    {typeof plan.price === 'number' && (
                      <span className="text-xs text-neutral-400 font-semibold">/ mes</span>
                    )}
                  </div>

                  <div className="border-t border-neutral-100 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Características incluidas:</p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feat, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-xs text-neutral-600 font-medium">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <Link href="/login">
                    <Button 
                      className={`w-full h-10 text-xs font-semibold rounded-xl ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'bg-neutral-950 hover:bg-neutral-900 text-white'}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white border-t border-neutral-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Preguntas Frecuentes</span>
            <h2 className="text-3xl font-extrabold text-neutral-900 mt-2 tracking-tight">¿Tienes preguntas? Tenemos respuestas.</h2>
          </div>

          <div className="space-y-3.5">
            {FAQs.map((faq, i) => (
              <div 
                key={i} 
                className="border border-neutral-200/60 rounded-xl overflow-hidden bg-white shadow-2xs transition-colors duration-150"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-4 font-semibold text-neutral-800 hover:text-neutral-950 text-left text-xs sm:text-sm select-none"
                >
                  <span>{faq.q}</span>
                  {faqOpen === i ? (
                    <Minus className="h-4 w-4 text-neutral-400 shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-neutral-400 shrink-0" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 text-xs sm:text-sm text-neutral-500 leading-relaxed border-t border-neutral-50/50 pt-2">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-neutral-950 text-white relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-5 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-900/60 px-3 py-1 rounded-full">
            Modernízate Hoy
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">¿Listo para actualizar tu práctica veterinaria?</h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Crea tu cuenta en menos de 2 minutos. Comienza a gestionar citas, recordatorios automáticos de vacunas y seguimiento de inventario hoy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white hover:bg-neutral-100 text-neutral-900 font-semibold h-11 px-6 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md">
                Registrar Cuenta de Clínica
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <a href="https://wa.me/51948097148?text=Hola%20%F0%9F%91%8B%20estoy%20interesado%20en%20VetControl%20para%20mi%20veterinaria." target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:text-white text-neutral-300 font-semibold h-11 px-6 rounded-xl text-xs flex items-center justify-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400/10" />
                Hablar con un Especialista
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-100 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white">
                <Shield className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-bold text-sm text-neutral-900">VetControl</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">
              La plataforma de gestión de consultorios veterinarios de alto rendimiento. Diseñada para la eficiencia, escalabilidad y seguridad multi-inquilino.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Producto</h4>
            <ul className="space-y-2 text-xs font-semibold text-neutral-500">
              <li><a href="#features" className="hover:text-neutral-900">Características</a></li>
              <li><a href="#preview" className="hover:text-neutral-900">Vista Previa</a></li>
              <li><a href="#pricing" className="hover:text-neutral-900">Planes de Precios</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Recursos</h4>
            <ul className="space-y-2 text-xs font-semibold text-neutral-500">
              <li><a href="#faq" className="hover:text-neutral-900">FAQ</a></li>
              <li><a href="#" className="hover:text-neutral-900">Notas de Versión</a></li>
              <li><a href="#" className="hover:text-neutral-900">API para Desarrolladores</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Legal</h4>
            <ul className="space-y-2 text-xs font-semibold text-neutral-500">
              <li><a href="#" className="hover:text-neutral-900">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-neutral-900">Términos de Servicio</a></li>
              <li><a href="#" className="hover:text-neutral-900">Alcance de Seguridad</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-neutral-400 font-semibold gap-4">
          <p>© 2026 VetControl Systems Inc. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Creado para el cuidado animal moderno con <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> globalmente.
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/51948097148?text=Hola%20%F0%9F%91%8B%20estoy%20interesado%20en%20VetControl%20para%20mi%20veterinaria."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-px transition-all font-semibold text-xs leading-none select-none"
      >
        <MessageSquare className="h-4 w-4 fill-white/10" />
        <span>Chatea por WhatsApp</span>
      </a>
    </div>
  );
}
