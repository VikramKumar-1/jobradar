import FiltersSidebar from '@/components/FiltersSidebar';
import JobCard from '@/components/JobCard';
import FetchJobsButton from '@/components/FetchJobsButton';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering so we always see fresh jobs after fetching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await the search params in Next.js 15
  const params = await searchParams;

  // Build the Supabase query dynamically based on searchParams
  let query = supabase.from('jobs').select('*').eq('is_active', true).order('posted_at', { ascending: false });

  // 1. Search Query
  if (params.q && typeof params.q === 'string') {
    query = query.or(`title.ilike.%${params.q}%,company.ilike.%${params.q}%,skills_required.cs.{${params.q}}`);
  }

  // 2. Experience Filter
  if (params.experience && typeof params.experience === 'string') {
    const expArray = params.experience.split(',');
    // We map experience to ilike queries on our normalized strings
    const conditions = expArray.map(exp => `experience.ilike.%${exp}%`).join(',');
    if (conditions) query = query.or(conditions);
  }

  // 3. Location Filter
  if (params.location && typeof params.location === 'string') {
    const locArray = params.location.split(',');
    const conditions = locArray.map(loc => `city.ilike.%${loc}%`).join(',');
    if (conditions) query = query.or(conditions);
  }

  // 4. Job Type Filter
  if (params.jobType && typeof params.jobType === 'string') {
    const typeArray = params.jobType.split(',');
    // Handle 'Remote' specifically since it's a boolean in DB
    if (typeArray.includes('Remote')) {
      query = query.eq('is_remote', true);
    }
    // Handle other types
    const otherTypes = typeArray.filter(t => t !== 'Remote');
    if (otherTypes.length > 0) {
      const conditions = otherTypes.map(t => `job_type.ilike.%${t}%`).join(',');
      query = query.or(conditions);
    }
  }

  // 5. Skills Filter (Using array overlap for Postgres)
  if (params.skills && typeof params.skills === 'string') {
    const skillsArray = params.skills.split(',');
    // For arrays, Postgres has 'overlaps' (&&) but Supabase JS uses .ov() or we can use or() with ilike on the text representation
    // A simpler way for string arrays is to check if ANY of the requested skills are in the job's skills_required array.
    // Supabase JS syntax for array contains: .contains('skills_required', ['React'])
    // But since it's an OR (if user clicks React OR Node), we build an OR statement.
    const conditions = skillsArray.map(skill => `skills_required.cs.{${skill}}`).join(',');
    if (conditions) query = query.or(conditions);
  }

  // Finally execute query
  const { data: jobs, error } = await query.limit(50);

  if (error) {
    console.error("Error fetching jobs:", error);
  }

  const jobList = jobs || [];

  return (
    <div className="jobs-page-layout">
      <main className="jobs-container">
        <div className="jobs-header">
          <h2>Find Your Next IT Job</h2>
          <div className="search-bar">
            {/* The search bar should be a client component eventually, for now we keep it static */}
            <input type="text" placeholder="Search by job title, skill, or company..." />
            <button className="btn-search">Search</button>
          </div>
        </div>
        
        <div className="jobs-content">
          <FiltersSidebar />
          
          <div className="jobs-feed">
            <div className="feed-controls">
              <span>Showing <strong>{jobList.length}</strong> jobs matching your criteria</span>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <FetchJobsButton />
                <select className="sort-dropdown">
                  <option>Newest First</option>
                  <option>Salary: High to Low</option>
                </select>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid red', padding: '1rem', borderRadius: '0.5rem', color: 'white', marginBottom: '1rem' }}>
                <strong>Database Error:</strong> {error.message}
                <br/>
                <small>Hint: Check your Vercel Environment Variables. URL or Key might be wrong.</small>
              </div>
            )}

            {jobs && jobs.length > 0 ? (
              <div className="jobs-grid">
                {jobs.map((job: any) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ marginTop: '2rem' }}>
                <h3>No Jobs Found</h3>
                <p>No jobs match your current filters. Try clearing them or fetching new jobs.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
