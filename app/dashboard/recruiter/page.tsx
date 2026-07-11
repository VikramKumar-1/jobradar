"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RecruiterDashboard() {
  const [user, setUser] = useState<any>(null);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const router = useRouter();
  
  // Job Form State
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth');
      
      const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUser(userData);
      
      fetchJobs(session.user.id);
    };
    fetchUser();
  }, [router]);

  const fetchJobs = async (userId: string) => {
    // Fetch recruiter's jobs along with applicants
    const { data } = await supabase.from('jobs')
      .select('*, applications(*, users(*))')
      .eq('recruiter_id', userId)
      .order('posted_at', { ascending: false });
    if (data) setMyJobs(data);
  };

  const postJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== '');
    
    // 1. Post the job
    const { data: newJob, error } = await supabase.from('jobs').insert({
      recruiter_id: user.id,
      title,
      company,
      source: 'recruiter_post',
      skills_required: skillsArray,
      is_active: true
    }).select().single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // 2. SIMULATED AI AUTO-APPLY ENGINE
    // We fetch all candidates and auto-apply the ones who match the required skills
    const { data: candidates } = await supabase.from('users').select('*').eq('role', 'candidate');
    
    if (candidates) {
      const applicationsToInsert = [];
      for (const candidate of candidates) {
        if (!candidate.skills || candidate.skills.length === 0) continue;
        
        // Dummy Matcher: Check overlap between required skills and candidate skills
        const candidateSkillsLower = candidate.skills.map((s: string) => s.toLowerCase());
        const matchCount = skillsArray.filter(reqSkill => candidateSkillsLower.includes(reqSkill.toLowerCase())).length;
        
        // Calculate match score (0 to 1)
        const matchScore = skillsArray.length > 0 ? matchCount / skillsArray.length : 0;
        
        // If they match > 0%, apply them
        if (matchScore > 0) {
          applicationsToInsert.push({
            job_id: newJob.id,
            candidate_id: candidate.id,
            is_auto_applied: true,
            match_score: matchScore,
            status: 'applied'
          });
        }
      }
      
      if (applicationsToInsert.length > 0) {
        await supabase.from('applications').insert(applicationsToInsert);
      }
    }

    alert('Job posted! AI Auto-Apply engine has matched candidates automatically.');
    setTitle(''); setCompany(''); setSkills('');
    fetchJobs(user.id);
    setLoading(false);
  };

  if (!user) return <div style={{ padding: '2rem', color: 'white' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Recruiter Dashboard</h1>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/auth'); }} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign Out</button>
      </div>
      
      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem' }}>
        <h3>Post a New Job (AI Auto-Apply Enabled)</h3>
        <p style={{ color: 'var(--text-muted)' }}>When you post a job, our system will automatically match and apply the best candidates for you.</p>
        <form onSubmit={postJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Job Title (e.g. Senior React Developer)" required style={inputStyle}/>
          <input type="text" value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company Name" required style={inputStyle}/>
          <input type="text" value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Required Skills (e.g. React, TypeScript, Node.js)" required style={inputStyle}/>
          <button type="submit" className="btn-apply" disabled={loading} style={{ alignSelf: 'flex-start', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Posting & Matching...' : 'Post Job'}
          </button>
        </form>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem' }}>
        <h3>Your Posted Jobs & Applicants</h3>
        {myJobs.length === 0 ? <p>No jobs posted yet.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
            {myJobs.map(job => (
              <div key={job.id} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                <h4 style={{ color: 'var(--accent-hover)', fontSize: '1.25rem' }}>{job.title}</h4>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{job.company}</p>
                
                <h5>Auto-Matched Applicants ({job.applications?.length || 0})</h5>
                {job.applications?.length > 0 ? (
                  <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '0.5rem 0' }}>Candidate Email</th>
                          <th>Match Score</th>
                          <th>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {job.applications.sort((a:any, b:any) => b.match_score - a.match_score).map((app: any) => (
                          <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.75rem 0' }}>{app.users?.email}</td>
                            <td><span style={{ color: app.match_score > 0.5 ? '#4ade80' : 'orange' }}>{(app.match_score * 100).toFixed(0)}%</span></td>
                            <td>{app.is_auto_applied ? '🤖 AI Auto-Apply' : '👤 Manual'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Waiting for AI to find candidates...</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = { padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
