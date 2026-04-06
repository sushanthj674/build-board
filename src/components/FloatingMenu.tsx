"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, RefreshCw, Plus, Key, Search, History, Settings, Trash2 } from "lucide-react";
import { useRepos } from "@/context/RepoContext";
import { PREDEFINED_REPOS, PREDEFINED_OWNERS } from "@/lib/constants";
import { searchUserRepos } from "@/lib/github";
import { toast } from "sonner";

const RECENT_OWNERS_KEY = "recent_owners";
const RECENT_REPOS_KEY = "recent_repos";

const FloatingMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingTokens, setIsManagingTokens] = useState(false);
  const [ownerInput, setOwnerInput] = useState("");
  const [repoInput, setRepoInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [tokenLabel, setTokenLabel] = useState("");
  const [focusedField, setFocusedField] = useState<"owner" | "repo" | "token" | null>(
    null,
  );

  const [recentOwners, setRecentOwners] = useState<string[]>([]);
  const [recentRepos, setRecentRepos] = useState<string[]>([]);
  const [repoSuggestions, setRepoSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { addRepo, savedTokens, addSavedToken, deleteSavedToken } = useRepos();
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Fetch repo suggestions when owner changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (ownerInput.length > 2) {
        setIsSearching(true);
        const repos = await searchUserRepos(ownerInput, tokenInput);
        setRepoSuggestions(repos);
        setIsSearching(false);
      } else {
        setRepoSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timer);
  }, [ownerInput, tokenInput]);

  // Load recent searches from localStorage
  useEffect(() => {
    const savedOwners = localStorage.getItem(RECENT_OWNERS_KEY);
    const savedRepos = localStorage.getItem(RECENT_REPOS_KEY);
    if (savedOwners) setRecentOwners(JSON.parse(savedOwners));
    if (savedRepos) setRecentRepos(JSON.parse(savedRepos));
  }, []);

  // Update recent lists
  const updateRecent = (newOwner: string, newRepo: string) => {
    const updatedOwners = [
      newOwner,
      ...recentOwners.filter((o) => o !== newOwner),
    ].slice(0, 10);
    const updatedRepos = [
      newRepo,
      ...recentRepos.filter((r) => r !== newRepo),
    ].slice(0, 10);

    setRecentOwners(updatedOwners);
    setRecentRepos(updatedRepos);

    localStorage.setItem(RECENT_OWNERS_KEY, JSON.stringify(updatedOwners));
    localStorage.setItem(RECENT_REPOS_KEY, JSON.stringify(updatedRepos));
  };

  // Combine predefined with recent for suggestions
  const allOwners = Array.from(
    new Set([...recentOwners, ...PREDEFINED_OWNERS]),
  );
  const allRepos = Array.from(
    new Set([...recentRepos, ...PREDEFINED_REPOS.map((r) => r.split("/")[1])]),
  );

  const ownerSuggestions = allOwners
    .filter(
      (owner) =>
        owner.toLowerCase().includes(ownerInput.toLowerCase()) &&
        owner.toLowerCase() !== ownerInput.toLowerCase(),
    )
    .slice(0, 5);

  const repoSuggestions = allRepos
    .filter(
      (repo) =>
        repo.toLowerCase().includes(repoInput.toLowerCase()) &&
        repo.toLowerCase() !== repoInput.toLowerCase(),
    )
    .slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node)
      ) {
        setFocusedField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const owner = ownerInput.trim();
    const repo = repoInput.trim();

    if (owner && repo) {
      addRepo(owner, repo, tokenInput.trim() || undefined);
      updateRecent(owner, repo);
      setOwnerInput("");
      setRepoInput("");
      setTokenInput("");
      setIsAdding(false);
      setIsOpen(false);
    } else {
      toast.error("Please provide both Owner and Repository Name");
    }
  };

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenLabel && tokenInput) {
      addSavedToken(tokenLabel, tokenInput);
      setTokenLabel("");
      setTokenInput("");
    } else {
      toast.error("Please provide both Label and Token");
    }
  };

  const menuItems = [
    {
      icon: <Plus size={20} />,
      label: "Add Repo",
      onClick: () => {
        setIsAdding(true);
        setIsOpen(false);
        setIsManagingTokens(false);
      },
    },
    {
      icon: <Settings size={20} />,
      label: "Tokens",
      onClick: () => {
        setIsManagingTokens(true);
        setIsOpen(false);
        setIsAdding(false);
      },
    },
    {
      icon: <RefreshCw size={20} />,
      label: "Refresh",
      onClick: () => {
        toast.info("Refreshing dashboard...");
        window.location.reload();
      },
    },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isManagingTokens && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-80 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-black text-sm tracking-widest uppercase">
                Manage Tokens
              </h4>
              <button
                onClick={() => setIsManagingTokens(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveToken} className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Token Label (e.g. Work)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
                value={tokenLabel}
                onChange={(e) => setTokenLabel(e.target.value)}
              />
              <input
                type="password"
                placeholder="GitHub Token"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
              <button
                type="submit"
                className="w-full py-3 bg-white text-black rounded-xl text-xs font-black hover:bg-neutral-200 transition-colors tracking-widest uppercase"
              >
                SAVE TOKEN
              </button>
            </form>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {savedTokens.length === 0 ? (
                <p className="text-xs text-neutral-600 text-center py-4 italic">No saved tokens.</p>
              ) : (
                savedTokens.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800/50">
                    <span className="text-xs font-bold text-neutral-300">{t.label}</span>
                    <button 
                      onClick={() => deleteSavedToken(t.id)}
                      className="text-neutral-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-80 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-black text-sm tracking-widest uppercase">
                Add Repository
              </h4>
              <button
                onClick={() => setIsAdding(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div className="relative" ref={suggestionRef}>
                <div className="space-y-3">
                  {/* Owner Field */}
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                      size={14}
                    />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Owner / Org"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
                      value={ownerInput}
                      onFocus={() => setFocusedField("owner")}
                      onChange={(e) => setOwnerInput(e.target.value)}
                    />
                    <AnimatePresence>
                      {focusedField === "owner" &&
                        ownerSuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute bottom-full left-0 w-full mb-2 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl z-50"
                          >
                            {ownerSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                className="w-full text-left px-4 py-3 text-xs font-bold text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors border-b border-neutral-800/50 last:border-0 flex items-center justify-between"
                                onClick={() => {
                                  setOwnerInput(suggestion);
                                  setFocusedField(null);
                                }}
                              >
                                <span>{suggestion}</span>
                                {recentOwners.includes(suggestion) && (
                                  <History
                                    size={10}
                                    className="text-neutral-600"
                                  />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>

                  {/* Repo Field */}
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700 text-[10px] font-black uppercase">
                      Repo
                    </div>
                    <input
                      type="text"
                      placeholder="Repository Name"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
                      value={repoInput}
                      onFocus={() => setFocusedField("repo")}
                      onChange={(e) => setRepoInput(e.target.value)}
                    />
                    <AnimatePresence>
                      {focusedField === "repo" && (repoSuggestions.length > 0 || isSearching) && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute bottom-full left-0 w-full mb-2 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-60 overflow-y-auto"
                        >
                          {isSearching ? (
                            <div className="p-4 text-center">
                              <RefreshCw size={14} className="animate-spin text-neutral-500 mx-auto" />
                            </div>
                          ) : (
                            repoSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                className="w-full text-left px-4 py-3 text-xs font-bold text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors border-b border-neutral-800/50 last:border-0"
                                onClick={() => {
                                  setRepoInput(suggestion);
                                  setFocusedField(null);
                                }}
                              >
                                {suggestion}
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Key
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={14}
                />
                <input
                  type="password"
                  placeholder="Auth Token (Optional)"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onFocus={() => setFocusedField("token")}
                />
                
                <AnimatePresence>
                  {focusedField === "token" && savedTokens.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full left-0 w-full mb-2 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl z-50"
                    >
                      {savedTokens.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className="w-full text-left px-4 py-3 text-xs font-bold text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors border-b border-neutral-800/50 last:border-0"
                          onClick={() => {
                            setTokenInput(t.token);
                            setFocusedField(null);
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-[10px] text-neutral-500 font-medium px-1 leading-relaxed">
                Tokens are required for private repositories and stored only in
                your local browser.
              </p>

              <button
                type="submit"
                className="w-full py-3 bg-white text-black rounded-xl text-xs font-black hover:bg-neutral-200 transition-colors tracking-widest uppercase"
              >
                ADD
              </button>
            </form>
          </motion.div>
        )}

        {isOpen && !isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 flex flex-col gap-3"
          >
            {menuItems.map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={item.onClick}
                className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 text-neutral-300 px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors shadow-xl"
              >
                {item.icon}
                <span className="text-sm font-bold">{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsAdding(false);
        }}
        className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]"
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </motion.button>
    </div>
  );
};

export default FloatingMenu;
