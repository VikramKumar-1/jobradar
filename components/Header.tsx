import Link from 'next/link';

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <span className="logo-icon">Radar</span>
          <span className="logo-text">JobRadar <span className="highlight">India</span></span>
        </Link>
        
        <nav className="main-nav">
          <Link href="/jobs" className="nav-link">Find Jobs</Link>
          <Link href="/companies" className="nav-link">Companies</Link>
          <div className="nav-divider"></div>
          <Link href="/auth" className="btn-login" style={{ textDecoration: 'none' }}>
            Sign In / Post Job
          </Link>
        </nav>
      </div>
    </header>
  );
}
