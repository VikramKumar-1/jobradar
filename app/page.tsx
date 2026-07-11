export default function Home() {
  return (
    <main className="main-content">
      <header className="hero">
        <h1>JobRadar India</h1>
        <p>Live IT Job Aggregator & Auto-Apply System</p>
        <div className="badges">
          <span className="badge active">Phase 1: Job Fetching API (Active)</span>
          <span className="badge upcoming">Phase 2: Recruiter Dashboard & Auto-Apply (Upcoming)</span>
        </div>
      </header>

      <section className="jobs-feed">
        <div className="empty-state">
          <h3>Welcome to JobRadar</h3>
          <p>Click "Find Jobs" to see the latest IT opportunities in India.</p>
        </div>
      </section>
    </main>
  );
}
