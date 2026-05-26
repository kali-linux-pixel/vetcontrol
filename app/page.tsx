import type { Metadata } from 'next';
import LandingClient from './landing-client';

export const metadata: Metadata = {
  title: 'VetControl - Premium Veterinary Practice Management SaaS',
  description: 'Streamline appointments, automate vaccination boosters, track medicine inventory, and organize secure pet medical records in a multi-tenant cloud dashboard designed for modern veterinary clinics.',
  keywords: 'veterinary SaaS, vet practice management software, clinical records database, vaccine reminders, pet registry dashboard',
};

export default function Page() {
  return <LandingClient />;
}
