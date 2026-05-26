import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Shield, MessageSquare, ArrowRight, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Pricing Plans - VetControl Practice Management',
  description: 'Choose the perfect practice management plan for your veterinary clinic. Transparent pricing with no setup fees or contracts.',
};

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter Plan',
      price: '$9',
      billing: 'per month',
      desc: 'Essential toolset for mobile vets and independent practices.',
      features: [
        '1 Practitioner Account',
        'Up to 500 Patient Files',
        'Appointment Scheduler Calendar',
        'Basic Patient Records',
        'Email Reminders Support',
        'Self-Serve Help Desk'
      ],
      cta: 'Start Free Trial',
      href: '/signup',
      highlighted: false
    },
    {
      name: 'Professional Plan',
      price: '$19',
      billing: 'per month',
      desc: 'Full-featured practice management for growing animal hospitals.',
      features: [
        '5 Veterinarian Accounts',
        'Unlimited Active Patients',
        'Smart Medicine Inventory Alerts',
        'Automated WhatsApp reminders',
        'SMS/Email Booking validations',
        'Comprehensive Practice Analytics',
        'Priority SLA Support'
      ],
      cta: 'Start Free Trial',
      href: '/signup',
      highlighted: true
    }
  ];

  const comparison = [
    { feature: 'Practitioner Accounts', starter: '1 License', professional: '5 Licenses' },
    { feature: 'Active Patient Profiles', starter: 'Up to 500', professional: 'Unlimited' },
    { feature: 'Scheduler Calendar', starter: '✓ (Basic)', professional: '✓ (Advanced Multi-Vet)' },
    { feature: 'Clinical Records & Notes', starter: '✓', professional: '✓' },
    { feature: 'Smart Inventory & SKUs', starter: '✗', professional: '✓' },
    { feature: 'WhatsApp Reminders', starter: '✗', professional: '✓' },
    { feature: 'SLA Support Priority', starter: 'Standard Email', professional: '24/7 Priority Support' },
  ];

  const FAQs = [
    {
      q: 'Is there a setup fee or lock-in contract?',
      a: 'Absolutely not. You pay month-to-month, and you can cancel or change your practice subscription tier at any time without extra fees.'
    },
    {
      q: 'How do automated WhatsApp reminders work?',
      a: 'Professional plan accounts can configure automated vaccination and appointment follow-up reminders. The system automatically drafts and schedules them via API to trigger owner messaging notifications.'
    },
    {
      q: 'Can I add more veterinarians to the Professional plan?',
      a: 'Yes! The Professional plan includes 5 veterinarian seats by default. If your animal hospital requires additional staff licenses, contact support for custom additions.'
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
              <span className="text-[9px] font-semibold text-emerald-600 tracking-wider uppercase leading-none mt-1">SaaS Platform</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-500">
            <Link href="/#features" className="hover:text-neutral-900">Features</Link>
            <Link href="/#preview" className="hover:text-neutral-900">Preview</Link>
            <Link href="/pricing" className="text-neutral-900">Pricing</Link>
            <Link href="/#faq" className="hover:text-neutral-900">FAQ</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-semibold hover:bg-neutral-50 rounded-lg h-9.5 px-4 text-neutral-600 hover:text-neutral-900">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-neutral-950 hover:bg-neutral-900 text-white font-semibold rounded-lg text-sm h-9.5 px-4 shadow-sm transition-all cursor-pointer">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="pt-20 pb-12 bg-radial from-emerald-50/20 via-white to-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-950 leading-tight">
            Transparent Pricing for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Modern Animal Care</span>.
          </h1>
          <p className="text-base text-neutral-500 max-w-xl mx-auto mt-4 leading-relaxed font-medium">
            Start with our 14-day free trial. Upgrade or cancel anytime. Choose the plan that fits your veterinary practice scope.
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
                  Recommended
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Included features:</p>
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
            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Detailed Feature Comparison</h2>
            <p className="text-xs text-neutral-400 mt-2">See exactly what you get at each subscription tier.</p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="p-4 px-6">Feature</th>
                  <th className="p-4">Starter</th>
                  <th className="p-4 px-6 text-right">Professional</th>
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
            <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Pricing FAQs</h2>
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
          <p>© 2026 VetControl Systems Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for modern animal care with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> globally.
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
        <span>Chat on WhatsApp</span>
      </a>
    </div>
  );
}
