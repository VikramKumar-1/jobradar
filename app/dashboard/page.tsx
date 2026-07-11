"use client";
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      
      const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      if (user?.role === 'recruiter') {
        router.push('/dashboard/recruiter');
      } else {
        router.push('/dashboard/candidate');
      }
    };
    checkRole();
  }, [router]);

  return <div style={{ padding: '4rem', color: 'white', textAlign: 'center' }}>Loading Dashboard...</div>;
}
