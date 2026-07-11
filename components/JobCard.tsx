type Job = {
  id: string;
  title: string;
  company: string;
  city: string;
  experience: string;
  salary_min: number | null;
  salary_max: number | null;
  skills_required: string[];
  is_remote: boolean;
  apply_url: string;
  source: string;
  posted_at: string;
}

export default function JobCard({ job }: { job: Job }) {
  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Not Disclosed';
    if (min && !max) return `₹${(min/100000).toFixed(1)}L+`;
    if (!min && max) return `Up to ₹${(max/100000).toFixed(1)}L`;
    return `₹${(min!/100000).toFixed(1)}L - ₹${(max!/100000).toFixed(1)}L`;
  };

  const daysAgo = Math.floor((new Date().getTime() - new Date(job.posted_at).getTime()) / (1000 * 3600 * 24));

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div>
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
        </div>
        {job.is_remote && <span className="tag tag-remote">Remote</span>}
      </div>
      
      <div className="job-details">
        <span className="detail-item">
          <i>📍</i> {job.city || 'India'}
        </span>
        <span className="detail-item">
          <i>💼</i> {job.experience || 'Experience Not Specified'}
        </span>
        <span className="detail-item">
          <i>💰</i> {formatSalary(job.salary_min, job.salary_max)}
        </span>
      </div>

      <div className="job-skills">
        {job.skills_required?.slice(0, 4).map(skill => (
          <span key={skill} className="skill-tag">{skill}</span>
        ))}
        {job.skills_required?.length > 4 && (
          <span className="skill-tag more">+{job.skills_required.length - 4}</span>
        )}
      </div>

      <div className="job-card-footer">
        <span className="posted-time">{daysAgo === 0 ? 'Posted Today' : `${daysAgo} days ago`} via {job.source}</span>
        <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="btn-apply">
          Apply Now
        </a>
      </div>
    </div>
  );
}
