'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Clock, CheckCircle2, XCircle, PlayCircle, Trash2, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus';
import { WorkflowRun } from '@/lib/github';
import { toast } from 'sonner';

interface RepoCardProps {
  owner: string;
  repo: string;
  token?: string;
  onDelete: (owner: string, repo: string) => void;
}

const RepoCard: React.FC<RepoCardProps> = ({ owner, repo, token, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(2000); // Default to 2 seconds
  const { repoStatus, isLoading, isError } = useWorkflowStatus(owner, repo, 5, token, refreshInterval);
  const [hasNotifiedError, setHasNotifiedError] = useState(false);

  useEffect(() => {
    if (isError) {
      // Slow down polling to 30 seconds if we hit an error (likely rate limit)
      setRefreshInterval(30000);
      
      if (!hasNotifiedError) {
        const message = isError.message || `Failed to fetch ${owner}/${repo}.`;
        toast.error(message, { id: `${owner}-${repo}-error` });
        setHasNotifiedError(true);
      }
    } else {
      // Restore polling if success
      setRefreshInterval(2000);
      setHasNotifiedError(false);
    }
  }, [isError, owner, repo, hasNotifiedError]);

  if (isLoading && !repoStatus) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col gap-4 animate-pulse min-h-[250px]">
        <div className="h-6 w-1/2 bg-neutral-800 rounded"></div>
        <div className="h-4 w-3/4 bg-neutral-800 rounded"></div>
      </div>
    );
  }

  const lastRun = repoStatus?.workflowRuns?.[0];
  const isInProgress = lastRun?.status === 'in_progress' || lastRun?.status === 'queued';

  const getStatusColor = (run?: WorkflowRun) => {
    if (!run) return 'bg-neutral-500 shadow-[0_0_20px_rgba(115,115,115,0.3)]';
    if (run.status === 'in_progress' || run.status === 'queued') {
      return 'bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]'; 
    }
    if (run.conclusion === 'success') {
      return 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]';
    }
    if (run.conclusion === 'failure') {
      return 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]';
    }
    return 'bg-neutral-500 shadow-[0_0_20px_rgba(115,115,115,0.3)]';
  };

  const getStatusIcon = (run?: WorkflowRun) => {
    if (!run) return <Clock className="w-5 h-5 text-neutral-500" />;
    if (run.status === 'in_progress' || run.status === 'queued') {
      return <PlayCircle className="w-5 h-5 animate-spin text-yellow-500" />;
    }
    if (run.conclusion === 'success') {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (run.conclusion === 'failure') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <Clock className="w-5 h-5 text-neutral-500" />;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-6 transition-all hover:border-neutral-700 h-fit ${isError ? 'border-red-900/50 bg-red-900/5' : ''}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-white tracking-tight leading-tight">{repo}</h3>
            {token && <Lock size={12} className="text-neutral-500" />}
          </div>
          <p className="text-xs text-neutral-500 font-medium">{owner}</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => onDelete(owner, repo)}
              className="p-2 bg-neutral-800/50 rounded-full text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={16} />
            </button>
        </div>
      </div>

      <div className="space-y-4">
        {isError ? (
          <div className="space-y-2">
            <p className="text-red-500/70 text-xs font-bold uppercase tracking-tighter">API Error</p>
            <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">{isError.message}</p>
          </div>
        ) : !lastRun ? (
          <p className="text-neutral-500 text-sm">No workflow runs found.</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(lastRun)} ${isInProgress ? 'animate-pulse scale-110' : ''}`}></div>
              <span className="text-base font-bold text-neutral-200 capitalize">
                {lastRun.status === 'completed' ? lastRun.conclusion : lastRun.status?.replace('_', ' ')}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Latest Workflow</p>
              <p className="text-sm text-neutral-300 font-medium truncate">{lastRun.name}</p>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && repoStatus?.workflowRuns && !isError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-6 pt-6 border-t border-neutral-800/50 space-y-4"
          >
            <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Recent Runs</p>
            {repoStatus.workflowRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 overflow-hidden">
                  {getStatusIcon(run)}
                  <div className="truncate">
                    <p className="text-xs text-neutral-300 font-bold truncate">{run.name}</p>
                    <p className="text-[10px] text-neutral-600 font-medium">{new Date(run.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <a href={run.html_url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <ExternalLink size={14} className="text-neutral-500 hover:text-white" />
                </a>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!isError && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-6 py-2 flex items-center justify-center gap-2 text-[10px] font-black text-neutral-500 hover:text-white border-t border-neutral-800/50 pt-4"
        >
          {isExpanded ? (
            <>COLLAPSE <ChevronUp size={12} /></>
          ) : (
            <>EXPAND WORKFLOWS <ChevronDown size={12} /></>
          )}
        </button>
      )}
    </motion.div>
  );
};

export default RepoCard;
