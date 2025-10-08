"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerOnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireccionar a /shop
    router.push('/shop');
  }, [router]);

  return null;
}