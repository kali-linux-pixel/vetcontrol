import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Shield, MessageSquare, ArrowRight, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Planes de Precios - VetControl Gestión Veterinaria',
  description: 'Elige el plan de gestión perfecto para tu clínica veterinaria. Precios transparentes sin tarifas de configuración ni contratos.',
};

export default function PricingPage() {
  const plans = [
    {
      name: 'Plan Inicial',
      price: '$9',
      billing: 'por mes',
      desc: 'Conjunto de herramientas esencial para veterinarios a domicilio y consultorios independientes.',
      features: [
        '1 Cuenta de Veterinario',
        'Hasta 500 Expedientes de Mascotas',
        'Calendario de Citas',
        'Historial Clínico Básico',
        'Recordatorios por Correo Electrónico',
        'Centro de Ayuda de Autoservicio'
      ],
      cta: 'Iniciar Prueba Gratuita',
      href: '/signup',
      highlighted: false
    },
    {
      name: 'Plan Profesional',
      price: '$19',
      billing: 'por mes',
      desc: 'Gestión integral con todas las funciones para hospitales veterinarios en crecimiento.',
      features: [
        '5 Cuentas de Veterinarios',
        'Mascotas Activas Ilimitadas',
        'Alertas Inteligentes de Inventario de Medicamentos',
        'Recordatorios automáticos por WhatsApp',
        'Validaciones de citas por SMS/Correo',
        'Métricas Completas del Consultorio',
        'Soporte Prioritario con SLA'
      ],
      cta: 'Iniciar Prueba Gratuita',
      href: '/signup',
      highlighted: true
    }
  ];

  const comparison = [
    { feature: 'Cuentas de Veterinarios', starter: '1 Licencia', professional: '5 Licencias' },
    { feature: 'Perfiles de Mascotas Activos', starter: 'Hasta 500', professional: 'Ilimitado' },
    { feature: 'Calendario de Citas', starter: '✓ (Básico)', professional: '✓ (Avanzado Multi-Veterinario)' },
    { feature: 'Historial Clínico y Notas', starter: '✓', professional: '✓' },
    { feature: 'Inventario Inteligente y SKUs', starter: '✗', professional: '✓' },
    { feature: 'Recordatorios por WhatsApp', starter: '✗', professional: '✓' },
    { feature: 'Prioridad de Soporte SLA', starter: 'Correo Estándar', professional: 'Soporte Prioritario 24/7' },
  ];

  const FAQs = [
    {
      q: '¿Hay alguna tarifa de configuración o contrato de permanencia?',
      a: 'Absolutamente no. Pagas mes a mes, y puedes cancelar o cambiar el nivel de suscripción de tu veterinaria en cualquier momento sin cargos adicionales.'
    },
    {
      q: '¿Cómo funcionan los recordatorios automáticos por WhatsApp?',
      a: 'Las cuentas del plan Profesional pueden configurar recordatorios automáticos de vacunación y seguimiento de citas. El sistema los redacta y programa automáticamente vía API para enviar notificaciones a los propietarios.'
    },
    {
      q: '¿Puedo agregar más veterinarios al plan Profesional?',
      a: '¡Sí! El plan Profesional incluye 5 cuentas de veterinarios por defecto. Si tu hospital veterinario requiere licencias de personal adicionales, contacta a soporte para opciones personalizadas.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-emerald-100 selection:text-emerald-950 overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-955 text-white group-hover:scale-105 transition-transform duration-200">
              <Shield className="h-5 w-5 text-emerald-400 fill-emerald-400/10" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-neutral-900 leading-none">VetControl</span>
              <span className="text-[9px] font-semibold text-emerald-600 tracking-wider uppercase leading-none mt-1">Plataforma SaaS</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-500">
            <Link href="/#features" className="hover:text-neutral-900">Características</Link>
            <Link href="/#preview" className="hover:text-neutral-900">Vista Previa</Link>
            <Link href="/pricing" className="text-neutral-900">Precios</Link>
            <Link href="/#faq" className="hover:text-neutral-900">Preguntas Frecuentes</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-semibold hover:bg-neutral-50 rounded-lg h-9.5 px-4 text-neutral-600 hover:text-neutral-900">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-neutral-950 hover:bg-neutral-900 text-white font-semibold rounded-lg text-sm h-9.5 px-4 shadow-sm transition-all cursor-pointer">
                Comenzar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="pt-20 pb-12 bg-radial from-emerald-50/20 via-white to-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-950 leading-tight">
            Precios Transparentes para el <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Cuidado Animal Moderno</span>.
          </h1>
          <p className="text-base text-neutral-500 max-w-xl mx-auto mt-4 leading-relaxed font-medium">
            Comienza con nuestra prueba gratuita de 14 días. Actualiza o cancela cuando quieras. Elige el plan que se adapte al tamaño de tu veterinaria.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2 items-stretch pt-6">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`flex flex-col justify-between border bg-white rounded-2xl p-6 shadow-2xs relative ${plan.highlighted ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-neutral-200/80'}`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3.5 right-6 text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
                  Recomendado
                </span>
              )}
              
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1 py-1">
                  <span className="text-4xl font-black text-neutral-900">{plan.price}</span>
                  <span className="text-xs text-neutral-400 font-semibold">/ {plan.billing}</span>
                </div>

                <div className="border-t border-neutral-100 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Características incluidas:</p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-600 font-medium leading-none">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Link href={plan.href} className="w-full">
                  <Button 
                    className={`w-full h-10 text-xs font-semibold rounded-xl cursor-pointer ${plan.highlighted ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'bg-neutral-950 hover:bg-neutral-900 text-white'}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 bg-neutral-50/50 border-y border-neutral-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Comparativa Detallada de Características</h2>
            <p className="text-xs text-neutral-400 mt-2">Mira exactamente lo que obtienes en cada nivel de suscripción.</p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="p-4 px-6">Característica</th>
                  <th className="p-4">Inicial</th>
                  <th className="p-4 px-6 text-right">Profesional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {comparison.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/30 transition-colors">
                    <td className="p-4 px-6 font-semibold text-neutral-800">{row.feature}</td>
                    <td className="p-4 text-neutral-500">{row.starter}</td>
                    <td className="p-4 px-6 text-right text-neutral-900">{row.professional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Preguntas Frecuentes sobre Precios</h2>
          </div>
          <div className="space-y-6">
            {FAQs.map((faq, i) => (
              <div key={i} className="space-y-1.5 p-4 rounded-xl border border-neutral-100 bg-neutral-50/20">
                <h4 className="text-xs sm:text-sm font-bold text-neutral-800">{faq.q}</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-neutral-400 font-semibold gap-4">
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
