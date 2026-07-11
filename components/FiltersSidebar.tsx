"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

export default function FiltersSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [filters, setFilters] = useState({
    experience: searchParams.get('experience')?.split(',') || [],
    jobType: searchParams.get('jobType')?.split(',') || [],
    skills: searchParams.get('skills')?.split(',') || [],
    location: searchParams.get('location')?.split(',') || [],
  });

  // Keep state in sync with URL changes
  useEffect(() => {
    setFilters({
      experience: searchParams.get('experience')?.split(',') || [],
      jobType: searchParams.get('jobType')?.split(',') || [],
      skills: searchParams.get('skills')?.split(',') || [],
      location: searchParams.get('location')?.split(',') || [],
    });
  }, [searchParams]);

  // Handle checkbox toggles
  const handleFilterChange = (category: keyof typeof filters, value: string) => {
    const currentValues = [...filters[category]];
    const index = currentValues.indexOf(value);
    
    if (index === -1) {
      currentValues.push(value);
    } else {
      currentValues.splice(index, 1);
    }

    const newFilters = { ...filters, [category]: currentValues };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const updateURL = useCallback((newFilters: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key].length > 0) {
        params.set(key, newFilters[key].join(','));
      } else {
        params.delete(key);
      }
    });

    // Reset pagination or anything else if needed, but for now just push filters
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  const clearFilters = () => {
    setFilters({ experience: [], jobType: [], skills: [], location: [] });
    router.push('/jobs');
  };

  const isChecked = (category: keyof typeof filters, value: string) => {
    return filters[category].includes(value);
  };

  // High demand hot skills
  const topSkills = ["React", "Next.js", "Node.js", "Python", "TypeScript", "AWS", "Java", "DevOps"];

  return (
    <aside className="filters-sidebar">
      <div className="filters-header">
        <h3>Filters</h3>
        <button className="btn-clear" onClick={clearFilters}>Clear All</button>
      </div>

      <div className="filter-group">
        <h4>Experience Level</h4>
        <label><input type="checkbox" checked={isChecked('experience', '0-1')} onChange={() => handleFilterChange('experience', '0-1')} /> Fresher (0-1 yr)</label>
        <label><input type="checkbox" checked={isChecked('experience', '1-3')} onChange={() => handleFilterChange('experience', '1-3')} /> Junior (1-3 yrs)</label>
        <label><input type="checkbox" checked={isChecked('experience', '3-5')} onChange={() => handleFilterChange('experience', '3-5')} /> Mid-Level (3-5 yrs)</label>
        <label><input type="checkbox" checked={isChecked('experience', '5+')} onChange={() => handleFilterChange('experience', '5+')} /> Senior (5+ yrs)</label>
      </div>

      <div className="filter-group">
        <h4>Job Type</h4>
        <label><input type="checkbox" checked={isChecked('jobType', 'Full Time')} onChange={() => handleFilterChange('jobType', 'Full Time')} /> Full Time</label>
        <label><input type="checkbox" checked={isChecked('jobType', 'Part Time')} onChange={() => handleFilterChange('jobType', 'Part Time')} /> Part Time</label>
        <label><input type="checkbox" checked={isChecked('jobType', 'Contract')} onChange={() => handleFilterChange('jobType', 'Contract')} /> Contract</label>
        <label><input type="checkbox" checked={isChecked('jobType', 'Internship')} onChange={() => handleFilterChange('jobType', 'Internship')} /> Internship</label>
        <label><input type="checkbox" checked={isChecked('jobType', 'Remote')} onChange={() => handleFilterChange('jobType', 'Remote')} /> Remote</label>
      </div>

      <div className="filter-group">
        <h4>Hot & Top Skills 🔥</h4>
        {topSkills.map(skill => (
          <label key={skill}>
            <input 
              type="checkbox" 
              checked={isChecked('skills', skill)} 
              onChange={() => handleFilterChange('skills', skill)} 
            /> {skill}
          </label>
        ))}
      </div>
      
      <div className="filter-group">
        <h4>Top Locations</h4>
        <label><input type="checkbox" checked={isChecked('location', 'Bangalore')} onChange={() => handleFilterChange('location', 'Bangalore')} /> Bangalore</label>
        <label><input type="checkbox" checked={isChecked('location', 'Mumbai')} onChange={() => handleFilterChange('location', 'Mumbai')} /> Mumbai</label>
        <label><input type="checkbox" checked={isChecked('location', 'Hyderabad')} onChange={() => handleFilterChange('location', 'Hyderabad')} /> Hyderabad</label>
        <label><input type="checkbox" checked={isChecked('location', 'Pune')} onChange={() => handleFilterChange('location', 'Pune')} /> Pune</label>
        <label><input type="checkbox" checked={isChecked('location', 'Gurgaon')} onChange={() => handleFilterChange('location', 'Gurgaon')} /> Gurgaon</label>
        <label><input type="checkbox" checked={isChecked('location', 'Noida')} onChange={() => handleFilterChange('location', 'Noida')} /> Noida</label>
      </div>
    </aside>
  );
}
