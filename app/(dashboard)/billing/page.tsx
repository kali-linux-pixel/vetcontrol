import React from 'react';
import { getSubscriptionStatus } from '@/lib/subscription';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ShieldAlert, CreditCard, Sparkles, MessageSquare, History, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const statusInfo = await getSubscriptionStatus();

  const plans = [
    {
      name: 'Starter Plan',
      price: '$9/month',
      desc: 'Ideal for solo veterinarians and local clinics.',
      features: [
        '1 Practitioner Account',
        'Up to 500 Patient Files',
        'Appointment Scheduler Calendar',
        'Basic Patient Records',
        'Email Reminders Support',
        'Self-Serve Help Desk'
      ],
      key: 'starter'
    },
    {
      name: 'Professional Plan',
      price: '$19/month',
      desc: 'Our most popular plan for busy practice clinics.',
      features: [
        '5 Veterinarian Accounts',
        'Unlimited Active Patients',
        'Smart Medicine Inventory Alerts',
        'Automated WhatsApp reminders',
        'SMS/Email Booking validations',
        'Comprehensive Practice Analytics',
        'Priority SLA Support'
      ],
      key: 'professional',
      highlighted: true
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in font-sans">
      {/* Diagnostics Header */}
      <div className="mb-2 rounded-lg bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">System Diagnostics:</span>
          <span>Rendering Billing and Stripe integration interfaces.</span>
        </div>
        <span className="text-[10px] text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded font-mono">Live</span>
      </div>

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Billing & Subscriptions</h2>
        <p className="text-sm text-neutral-500 mt-1">Manage practice licenses, update payment credentials, and review clinical transactions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Left Side: Current Subscription Status */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border border-neutral-100 bg-white shadow-xs">
            <CardHeader className="pb-4 border-b border-neutral-50">
              <CardTitle className="text-sm font-bold text-neutral-900">Current Plan</CardTitle>
              <CardDescription className="text-xs text-neutral-500">Your practice subscription scope.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Active Plan</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {statusInfo.planName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Trial Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusInfo.isExpired ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-neutral-100 text-neutral-800'}`}>
                  {statusInfo.isExpired ? 'Expired' : `${statusInfo.remainingDays} days remaining`}
                </span>
              </div>

              {statusInfo.isTrial && (
                <div className="rounded-lg bg-neutral-50/50 border border-neutral-200/40 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-neutral-800 font-bold text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Free Trial System Active</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    You are currently using VetControl on a 14-day free trial. Upgrade to preserve all patients records, schedulers, and alerts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-neutral-100 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-neutral-50 flex flex-row items-center gap-2 space-y-0">
              <History className="h-4 w-4 text-neutral-500" />
              <div>
                <CardTitle className="text-sm font-bold text-neutral-900">Payment History</CardTitle>
                <CardDescription className="text-xs text-neutral-500">Recent statements.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5 text-center text-xs text-neutral-400 py-8 font-medium">
              No subscription invoices generated yet.
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Upgrade Options */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {plans.map((plan) => (
              <Card 
                key={plan.key} 
                className={`flex flex-col justify-between border bg-white shadow-xs overflow-hidden relative ${plan.highlighted ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-neutral-200/80'}`}
              >
                {plan.highlighted && (
                  <span className="absolute top-0 right-0 text-[8px] font-black uppercase tracking-widest bg-emerald-600 text-white px-2.5 py-1 rounded-bl-lg shadow-xs">
                    Recommended
                  </span>
                )}
                <div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-neutral-900">{plan.name}</CardTitle>
                    <CardDescription className="text-xs text-neutral-400">{plan.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 py-2 space-y-4">
                    <p className="text-2xl font-black text-neutral-900 leading-none">{plan.price}</p>
                    
                    <ul className="space-y-2.5 pt-3 border-t border-neutral-50">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-neutral-600 font-medium leading-none">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>
                <CardFooter className="p-5 pt-6 mt-auto">
                  <a 
                    href={`https://wa.me/51948097148?text=Hola%20%F0%9F%91%8B%20estoy%20interesado%20en%20adquirir%20el%20Plan%20${plan.name}%20de%20VetControl%20para%20mi%20veterinaria.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button 
                      className={`w-full text-xs font-semibold h-9.5 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 ${plan.highlighted ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'bg-neutral-900 hover:bg-neutral-800 text-white'}`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Upgrade to {plan.name}
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* WhatsApp Support Callout */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-900">Custom hospital requirement?</h4>
              <p className="text-[11px] text-emerald-700/80 leading-normal max-w-md">
                If you manage multiple local branches or require custom configurations and integrations, contact our support team.
              </p>
            </div>
            <a 
              href="https://wa.me/51948097148?text=Hola%20%F0%9F%91%8B%20somos%20una%20veterinaria%20grande%20y%20nos%20gustaria%20saber%20mas%20sobre%20el%20servicio%20enterprise%20de%20VetControl." 
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant="outline" className="border-emerald-200/80 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs h-9.5 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer">
                <MessageSquare className="h-3.5 w-3.5" />
                Contact Enterprise Support
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
