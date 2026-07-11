import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with Service Role Key for admin bypass (if available)
// Or use regular Anon key if RLS policies allow inserts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '';
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY || '';

// Secret token to secure the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || 'jobradar-secret-123';

export async function GET(request: Request) {
  // Simple security check (pass ?token=jobradar-secret-123 in URL)
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (token !== CRON_SECRET && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log("Starting job fetch cron...");
    let jobsAdded = 0;
    
    // 1. Fetch from Remotive (Free, No Auth needed)
    const remotiveRes = await fetch("https://remotive.com/api/remote-jobs?category=software-dev&limit=20");
    if (remotiveRes.ok) {
      const data = await remotiveRes.json();
      for (const job of data.jobs) {
        // Upsert to database
        const { error } = await supabase.from('jobs').upsert({
          external_id: job.id.toString(),
          source: 'remotive',
          title: job.title,
          company: job.company_name,
          city: job.candidate_required_location,
          is_remote: true,
          job_type: job.job_type,
          skills_required: job.tags,
          apply_url: job.url,
          description: job.description.substring(0, 500) // Truncate for storage
        }, { onConflict: 'source,external_id' });
        
        if (!error) jobsAdded++;
      }
    }

    // 2. Fetch from Adzuna (India Jobs)
    if (ADZUNA_APP_ID && ADZUNA_API_KEY) {
      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=20&what=developer`;
      const adzunaRes = await fetch(adzunaUrl);
      
      if (adzunaRes.ok) {
        const data = await adzunaRes.json();
        for (const job of data.results) {
          const { error } = await supabase.from('jobs').upsert({
            external_id: job.id.toString(),
            source: 'adzuna',
            title: job.title,
            company: job.company.display_name,
            city: job.location.display_name,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            apply_url: job.redirect_url,
            description: job.description.substring(0, 500)
          }, { onConflict: 'source,external_id' });
          
          if (!error) jobsAdded++;
        }
      }
    }

    // 3. Fetch Premium Jobs from Top Tech ATS (e.g. Canonical/Ubuntu - Greenhouse API)
    // This is 100% free and cannot be blocked because it's a public ATS feed!
    try {
      const atsRes = await fetch("https://boards-api.greenhouse.io/v1/boards/canonical/jobs");
      if (atsRes.ok) {
        const data = await atsRes.json();
        
        // We only take jobs that match 'India' or 'Remote'
        const relevantJobs = data.jobs.filter((j: any) => 
          j.location.name.toLowerCase().includes('india') || 
          j.location.name.toLowerCase().includes('remote') ||
          j.location.name.toLowerCase().includes('bengaluru')
        ).slice(0, 15); // limit to 15 to avoid massive DB writes in one go

        for (const job of relevantJobs) {
          // Normalize Location for perfect filters
          let normalizedCity = job.location.name;
          if (normalizedCity.toLowerCase().includes('bengaluru')) normalizedCity = 'Bangalore';
          
          // Normalize Experience (Dummy logic without AI)
          let normalizedExp = 'Mid-Level (3-5 yrs)'; // Default fallback
          if (job.title.toLowerCase().includes('senior')) normalizedExp = 'Senior (5+ yrs)';
          if (job.title.toLowerCase().includes('junior') || job.title.toLowerCase().includes('graduate')) normalizedExp = 'Junior (1-3 yrs)';
          if (job.title.toLowerCase().includes('intern')) normalizedExp = 'Fresher (0-1 yr)';

          // Normalize Job Type
          let normalizedType = 'Full Time';
          if (job.title.toLowerCase().includes('intern')) normalizedType = 'Internship';
          if (job.title.toLowerCase().includes('contract')) normalizedType = 'Contract';

          const { error } = await supabase.from('jobs').upsert({
            external_id: job.id.toString(),
            source: 'greenhouse',
            title: job.title,
            company: 'Canonical',
            city: normalizedCity,
            is_remote: normalizedCity.toLowerCase().includes('remote'),
            job_type: normalizedType,
            experience: normalizedExp,
            apply_url: job.absolute_url,
          }, { onConflict: 'source,external_id' });
          
          if (!error) jobsAdded++;
        }
      }
    } catch (e) {
      console.error("ATS fetch error:", e);
    }

    // Log the successful fetch
    await supabase.from('fetch_logs').insert({
      source: 'auto_cron',
      status: 'success',
      jobs_added: jobsAdded
    });

    return NextResponse.json({ success: true, jobsAdded });

  } catch (err: any) {
    console.error("Error fetching jobs:", err);
    
    // Log error
    await supabase.from('fetch_logs').insert({
      source: 'auto_cron',
      status: 'error',
      error_msg: err.message
    });

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
