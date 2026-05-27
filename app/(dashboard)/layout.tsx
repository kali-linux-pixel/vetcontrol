import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { createServerClient } from '@/src/lib/supabase';
import { redirect } from 'next/navigation';
import { getSubscriptionStatus } from '@/lib/subscription';
import { TrialBanner } from '@/components/layout/trial-banner';

import { getProfileOrEnsure } from '@/lib/auth-utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createServerClient();

  // Protect on server-rendering
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  // Fetch user profile and organization info (heals profile/organization automatically if missing)
  let profileName = 'Dr. E. Blackwell';
  let clinicName = 'VetControl Downtown';

  try {
    const { profile } = await getProfileOrEnsure();
    if (profile) {
      if (profile.full_name) {
        profileName = profile.full_name;
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single();

      if (org?.name) {
        clinicName = org.name;
      }
    }
  } catch (err) {
    // Graceful fallback to defaults
    console.error('Layout: Failed to ensure user profile/org:', err);
  }

  // Fetch subscription trial info
  const statusInfo = await getSubscriptionStatus();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50/50 font-sans">
      {/* Sidebar - Desktop Only */}
      <Sidebar 
        className="hidden md:flex flex-shrink-0" 
        profileName={profileName}
        clinicName={clinicName}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky Trial Expiration Banner */}
        <TrialBanner statusInfo={statusInfo} />

        {/* Navbar */}
        <Navbar profileName={profileName} />

        {/* Scrollable Page Wrapper */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
