"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FetchJobsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFetch = async () => {
    setLoading(true);
    try {
      // Trigger the background fetch
      const res = await fetch("/api/cron/fetch-jobs?token=jobradar-secret-123");
      const data = await res.json();
      
      if (data.success) {
        alert(`Successfully fetched ${data.jobsAdded} jobs!`);
        // Refresh the page to show new jobs
        router.refresh();
      } else {
        alert("Error fetching jobs: " + data.error);
      }
    } catch (err) {
      alert("Something went wrong while fetching.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleFetch} 
      disabled={loading}
      className="btn-search" 
      style={{ display: 'inline-block', marginTop: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}
    >
      {loading ? "Fetching Jobs (Please wait...)" : "Fetch API Jobs Now"}
    </button>
  );
}
