import { createServerClient } from '@/src/lib/supabase';

export interface TrialStatus {
  isTrial: boolean;
  remainingDays: number;
  isExpired: boolean;
  planName: string;
  status: string;
  clinicName: string;
}

export async function getSubscriptionStatus(): Promise<TrialStatus> {
  const defaultStatus: TrialStatus = {
    isTrial: true,
    remainingDays: 10,
    isExpired: false,
    planName: 'Free Trial',
    status: 'trialing',
    clinicName: 'VetControl Downtown',
  };

  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { ...defaultStatus, isExpired: true, remainingDays: 0 };
    }

    // 1. Fetch profile to find organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return defaultStatus;
    }

    // 2. Fetch organization created_at and trial_ends_at
    const { data: org } = await supabase
      .from('organizations')
      .select('name, created_at, subscription_plan, subscription_status, trial_ends_at')
      .eq('id', profile.organization_id)
      .single();

    if (!org) {
      return defaultStatus;
    }

    const now = new Date();
    // Default trialEndsAt to 14 days after creation if missing
    const createdDate = org.created_at ? new Date(org.created_at) : now;
    const trialEndsAt = org.trial_ends_at 
      ? new Date(org.trial_ends_at) 
      : new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const isTrial = org.subscription_plan === 'free_trial';
    const remainingTime = trialEndsAt.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
    
    let isExpired = false;
    if (isTrial) {
      isExpired = now > trialEndsAt || org.subscription_status === 'expired';
    } else {
      isExpired = org.subscription_status === 'expired';
    }

    const planNames: Record<string, string> = {
      'free_trial': 'Free Trial',
      'starter': 'Starter Plan ($9/mo)',
      'professional': 'Professional Plan ($19/mo)'
    };

    return {
      isTrial,
      remainingDays,
      isExpired,
      planName: planNames[org.subscription_plan] || org.subscription_plan || 'Free Trial',
      status: org.subscription_status || 'trialing',
      clinicName: org.name || 'VetControl Clinic',
    };
  } catch (error) {
    console.error('Error fetching subscription/trial status, falling back to mock trial status:', error);
    return defaultStatus;
  }
}
