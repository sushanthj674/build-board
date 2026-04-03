'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export interface RepoConfig {
  owner: string;
  repo: string;
  token?: string;
}

interface RepoContextType {
  repos: RepoConfig[];
  addRepo: (owner: string, repo: string, token?: string) => void;
  deleteRepo: (owner: string, repo: string) => void;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

const STORAGE_KEY = 'dashboard_repos_v2';

export const RepoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [repos, setRepos] = useState<RepoConfig[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setRepos(JSON.parse(saved));
    } else {
      const initial = [
        { 
          owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || 'sushanthj674', 
          repo: process.env.NEXT_PUBLIC_GITHUB_REPO || 'todo-wrk-flw' 
        }
      ];
      setRepos(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }, []);

  const addRepo = (owner: string, repo: string, token?: string) => {
    if (repos.some(r => r.owner === owner && r.repo === repo)) {
      toast.error('This repository is already being monitored.');
      return;
    }
    const newRepos = [...repos, { owner, repo, token }];
    setRepos(newRepos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRepos));
    toast.success(`Monitoring ${owner}/${repo}`);
  };

  const deleteRepo = (owner: string, repo: string) => {
    const newRepos = repos.filter(r => !(r.owner === owner && r.repo === repo));
    setRepos(newRepos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRepos));
    toast.info(`Stopped monitoring ${owner}/${repo}`);
  };

  return (
    <RepoContext.Provider value={{ repos, addRepo, deleteRepo }}>
      {children}
    </RepoContext.Provider>
  );
};

export const useRepos = () => {
  const context = useContext(RepoContext);
  if (context === undefined) {
    throw new Error('useRepos must be used within a RepoProvider');
  }
  return context;
};
