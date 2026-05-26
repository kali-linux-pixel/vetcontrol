'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building, Users, BellRing, Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsClientProps {
  initialFullName: string;
  initialClinicName: string;
  initialEmail: string;
}

export default function SettingsClient({
  initialFullName,
  initialClinicName,
  initialEmail
}: SettingsClientProps) {
  const [successMsg, setSuccessMsg] = useState(false);
  
  const [clinicName, setClinicName] = useState(initialClinicName);
  const [fullName, setFullName] = useState(initialFullName);
  const [clinicEmail, setClinicEmail] = useState(initialEmail);
  const [clinicPhone, setClinicPhone] = useState('(555) 010-8900');
  
  const [vetList] = useState([
    { name: initialFullName, specialty: 'General Practice, Feline Medicine', license: 'DVM-90184' },
    { name: 'Dr. James Herriot', specialty: 'Equine & Small Animals, Surgery', license: 'DVM-20348' },
  ]);

  const [toggles, setToggles] = useState({
    emailVaccines: true,
    smsAppointments: true,
    alertInventory: true,
    autoReports: false,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Clinic Settings</h2>
          <p className="text-sm text-neutral-500 mt-1">Configure profile details, active staff, custom timetables, and notification rules.</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 rounded-lg flex items-center"
        >
          {successMsg ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              Saved Settings
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Clinic Profile */}
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardHeader className="pb-4 border-b border-neutral-50 flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-neutral-600 border border-neutral-200/50">
              <Building className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900">Clinic Profile</CardTitle>
              <CardDescription className="text-xs text-neutral-500">Public metadata and contact channels for client communications.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Clinic Name</label>
                <Input 
                  value={clinicName} 
                  onChange={(e) => setClinicName(e.target.value)}
                  className="h-9 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Staff Administrator</label>
                <Input 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-9 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Contact Email</label>
                <Input 
                  type="email" 
                  value={clinicEmail} 
                  onChange={(e) => setClinicEmail(e.target.value)}
                  className="h-9 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Phone Line</label>
                <Input 
                  value={clinicPhone} 
                  onChange={(e) => setClinicPhone(e.target.value)}
                  className="h-9 text-xs" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Directory */}
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardHeader className="pb-4 border-b border-neutral-50 flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-neutral-600 border border-neutral-200/50">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900">Veterinarians & Doctors</CardTitle>
              <CardDescription className="text-xs text-neutral-500">Manage registered veterinary practitioners and licensing logs.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="divide-y divide-neutral-50">
              {vetList.map((vet, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900">{vet.name}</h4>
                    <p className="text-xs text-neutral-500 mt-1">{vet.specialty}</p>
                  </div>
                  <span className="text-xs bg-neutral-50 font-mono border border-neutral-200/50 text-neutral-600 px-2 py-0.5 rounded-sm">
                    {vet.license}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border border-neutral-100 bg-white shadow-xs">
          <CardHeader className="pb-4 border-b border-neutral-50 flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-neutral-600 border border-neutral-200/50">
              <BellRing className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900">Automation & Notification Rules</CardTitle>
              <CardDescription className="text-xs text-neutral-500">Configure trigger conditions for client messaging and clinic warnings.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-50">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">Vaccine Reminders Email</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Send automated reminder messages to owners 7 days prior to vaccine expiration.</p>
                </div>
                <button 
                  onClick={() => handleToggle('emailVaccines')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    toggles.emailVaccines ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    toggles.emailVaccines ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-50">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">Appointment Confirmations SMS</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Send booking validation codes to patient owners mobile phone numbers.</p>
                </div>
                <button 
                  onClick={() => handleToggle('smsAppointments')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    toggles.smsAppointments ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    toggles.smsAppointments ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-50">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">Low Stock Product Alerts</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Trigger dashboard notifications when tracked inventory stock falls below target capacity.</p>
                </div>
                <button 
                  onClick={() => handleToggle('alertInventory')}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    toggles.alertInventory ? "bg-emerald-600" : "bg-neutral-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    toggles.alertInventory ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
