"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CandidateDashboard() {
  const [user, setUser] = useState<any>(null);
  const [skills, setSkills] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
         router.push('/auth');
         return;
      }
      
      const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUser(userData);
      if (userData?.skills) setSkills(userData.skills.join(', '));

      const { data: apps } = await supabase.from('applications').select('*, jobs(*)').eq('candidate_id', session.user.id);
      if (apps) setApplications(apps);
    };
    fetchUser();
  }, [router]);

  const updateProfile = async (e: any) => {
    e.preventDefault();
    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== '');
    await supabase.from('users').update({ skills: skillsArray }).eq('id', user.id);
    alert('Profile updated! AI will now start matching you.');
  };

  if (!user) return <div style={{ padding: '2rem', color: 'white' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Candidate Dashboard</h1>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/auth'); }} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign Out</button>
      </div>
      
      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem' }}>
        <h3>Your Profile</h3>
        <p style={{ color: 'var(--text-muted)' }}>Enter your skills. Our AI engine will automatically apply to new jobs that match your skillset.</p>
        <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <label>Skills (comma separated):</label>
          <input 
            type="text" 
            value={skills} 
            onChange={e => setSkills(e.target.value)} 
            placeholder="React, Node.js, Python, AWS"
            style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
          <button type="submit" className="btn-apply" style={{ alignSelf: 'flex-start' }}>Save Profile</button>
        </form>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem' }}>
        <h3>Your Auto-Applications</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Jobs the AI applied to for you.</p>
        
        {applications.length === 0 ? <p>No applications yet. Add some skills and wait for recruiters to post jobs!</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem 0' }}>Job Title</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Match Score</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0', color: 'var(--accent-hover)' }}>{app.jobs.title}</td>
                    <td>{app.jobs.company}</td>
                    <td><span className="tag-remote" style={{ background: app.status === 'applied' ? 'rgba(99,102,241,0.1)' : 'rgba(34,197,94,0.1)', color: app.status === 'applied' ? '#818cf8' : '#4ade80' }}>{app.status}</span></td>
                    <td>{app.match_score ? `${(app.match_score * 100).toFixed(0)}%` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
