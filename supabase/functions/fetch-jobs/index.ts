import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ADZUNA_APP_ID = Deno.env.get('ADZUNA_APP_ID') || ''
const ADZUNA_API_KEY = Deno.env.get('ADZUNA_API_KEY') || ''

serve(async (req) => {
  try {
    console.log("Starting job fetch cron...")
    let jobsAdded = 0;
    
    // 1. Fetch from Remotive (Free, No Auth needed)
    const remotiveRes = await fetch("https://remotive.com/api/remote-jobs?category=software-dev&limit=20")
    if (remotiveRes.ok) {
      const data = await remotiveRes.json()
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
        }, { onConflict: 'source,external_id' })
        
        if (!error) jobsAdded++;
      }
    }

    // 2. Fetch from Adzuna (India Jobs)
    if (ADZUNA_APP_ID && ADZUNA_API_KEY) {
      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=20&what=developer`
      const adzunaRes = await fetch(adzunaUrl)
      
      if (adzunaRes.ok) {
        const data = await adzunaRes.json()
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
          }, { onConflict: 'source,external_id' })
          
          if (!error) jobsAdded++;
        }
      }
    }

    // Log the successful fetch
    await supabase.from('fetch_logs').insert({
      source: 'auto_cron',
      status: 'success',
      jobs_added: jobsAdded
    })

    return new Response(JSON.stringify({ success: true, jobsAdded }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (err: any) {
    console.error("Error fetching jobs:", err)
    
    // Log error
    await supabase.from('fetch_logs').insert({
      source: 'auto_cron',
      status: 'error',
      error_msg: err.message
    })

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
