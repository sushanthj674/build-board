'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

import { createWebhook } from '@/lib/github';

export interface RepoConfig {
  owner: string;
  repo: string;
  token?: string;
}

export interface AuthToken {
  id: string;
  label: string;
  token: string;
}

interface RepoContextType {
  repos: RepoConfig[];
  savedTokens: AuthToken[];
  addRepo: (owner: string, repo: string, token?: string) => Promise<void>;
  deleteRepo: (owner: string, repo: string) => void;
  addSavedToken: (label: string, token: string) => void;
  deleteSavedToken: (id: string) => void;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

const STORAGE_KEY = 'dashboard_repos_v3';
const TOKENS_STORAGE_KEY = 'dashboard_tokens_v1';

export const RepoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [repos, setRepos] = useState<RepoConfig[]>([]);
  const [savedTokens, setSavedTokens] = useState<AuthToken[]>([]);

  useEffect(() => {
    // Load repos
    const savedRepos = localStorage.getItem(STORAGE_KEY);
    if (savedRepos) {
      setRepos(JSON.parse(savedRepos));
    } else {
      setRepos([]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }

    // Load tokens
    const savedTokensList = localStorage.getItem(TOKENS_STORAGE_KEY);
    if (savedTokensList) {
      setSavedTokens(JSON.parse(savedTokensList));
    }
  }, []);

  const addSavedToken = (label: string, token: string) => {
    const newToken: AuthToken = {
      id: crypto.randomUUID(),
      label,
      token,
    };
    const newTokens = [...savedTokens, newToken];
    setSavedTokens(newTokens);
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(newTokens));
    toast.success(`Token "${label}" saved.`);
  };

  const deleteSavedToken = (id: string) => {
    const newTokens = savedTokens.filter(t => t.id !== id);
    setSavedTokens(newTokens);
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(newTokens));
    toast.info('Token deleted.');
  };

  const addRepo = async (owner: string, repo: string, token?: string) => {
    if (repos.some(r => r.owner === owner && r.repo === repo)) {
      toast.error('This repository is already being monitored.');
      return;
    }

    // Try to create the webhook automatically if a token is provided
    if (token) {
      const success = await createWebhook(owner, repo, token);
      if (!success) {
        toast.info(`Could not create webhook automatically, using slow-polling fallback.`);
      }
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
    <RepoContext.Provider value={{ repos, savedTokens, addRepo, deleteRepo, addSavedToken, deleteSavedToken }}>
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
