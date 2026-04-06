'use client';

import React from 'react';
import RepoCard from './RepoCard';
import { useRepos } from '@/context/RepoContext';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

const Dashboard: React.FC = () => {
  const { repos, deleteRepo } = useRepos();
  
  // Activate the singleton SSE connection for all repos
  useRealTimeUpdates();

  return (
    <div className="max-w-7xl mx-auto py-20 px-6">
      <div className="flex flex-col gap-2 mb-16">
        <h1 className="text-6xl font-black text-white tracking-tighter">
          MONITOR <span className="text-neutral-700">WORKFLOWS</span>
        </h1>
        <p className="text-neutral-500 font-medium text-lg tracking-tight">
          Real-time GitHub Actions status monitoring. Add or remove repositories using the menu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {repos.map((repo) => (
          <RepoCard 
            key={`${repo.owner}-${repo.repo}`} 
            owner={repo.owner} 
            repo={repo.repo} 
            token={repo.token}
            onDelete={deleteRepo}
          />
        ))}

        {repos.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-neutral-900 rounded-3xl">
            <p className="text-neutral-700 font-black text-4xl opacity-20">NO REPOS ADDED</p>
            <p className="text-neutral-500 mt-2 font-bold">Use the floating button to add your first repository.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
