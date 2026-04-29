import { useState } from 'react';
import { Search, GitBranch, Activity, Plus, Github, Download, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGithubRepos } from '../../services/api';

const DashboardNewScan = ({ onScan, onBulkScan, scanning }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [fetchedRepos, setFetchedRepos] = useState([]);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [repoFilter, setRepoFilter] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recent_scan_targets');
    return saved ? JSON.parse(saved) : [];
  });

  const addToHistory = (username) => {
    const newHistory = [username, ...recentSearches.filter(u => u !== username)].slice(0, 5);
    setRecentSearches(newHistory);
    localStorage.setItem('recent_scan_targets', JSON.stringify(newHistory));
  };

  const handleScan = (e) => {
    e.preventDefault();
    if (!repoUrl || !repoUrl.trim()) return;
    onScan(repoUrl.trim());
    setRepoUrl('');
  };

  const fetchUserRepos = async (targetUser) => {
    const input = typeof targetUser === 'string' ? targetUser : githubUsername;
    let username = input.trim();
    if (!username) return;

    // Sanitize: If user pasted a URL or used slashes like /username/, extract just the username
    const parts = username.split('/').filter(Boolean);
    username = parts[parts.length - 1];

    setFetchingRepos(true);
    setFetchedRepos([]);
    // Clear filter but keep current githubUsername input if we searched for a new target
    if (typeof targetUser === 'string') setGithubUsername(targetUser);
    setRepoFilter('');

    try {
      const data = await getGithubRepos(username);
      setFetchedRepos(Array.isArray(data) ? data : []);
      addToHistory(username);
    } catch (error) {
      console.error('Fetch Protocol Error:', error);
      const message = error.response?.data?.message || error.message || 'Identity unreachable.';
      alert(`GitHub Sync Failed: ${message}`);
    } finally {
      setFetchingRepos(false);
    }
  };

  const filteredRepos = fetchedRepos.filter(repo =>
    repo.name.toLowerCase().includes(repoFilter.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(repoFilter.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2rem] p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Search className="w-40 h-40 text-cyan-400" />
        </div>

        <div className="relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Search & Scan</h2>
            <p className="text-slate-400 font-medium">Connect your GitHub or provide a direct link to initiate analysis.</p>
          </div>

          <div className="flex justify-center p-1.5 glass-panel rounded-2xl mb-10 max-w-sm mx-auto">
            <button
              onClick={() => setShowDirectInput(false)}
              className={`flex-1 py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${!showDirectInput ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              GitHub Cloud
            </button>
            <button
              onClick={() => setShowDirectInput(true)}
              className={`flex-1 py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${showDirectInput ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Direct Link
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!showDirectInput ? (
              <motion.div
                key="cloud"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex gap-4">
                  <div className="relative flex-1 group">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="Enter ANY GitHub username (e.g. facebook, google)"
                      className="w-full bg-slate-800/50 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-cyan-500/50 transition-all font-mono placeholder-slate-600"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchUserRepos()}
                    />
                  </div>
                  <button
                    onClick={() => fetchUserRepos()}
                    disabled={fetchingRepos || !githubUsername.trim()}
                    className="glass-card border-white/10 px-8 py-4 rounded-2xl font-bold text-cyan-400 hover:bg-cyan-500/10 transition-all disabled:opacity-30 flex items-center gap-2 group"
                  >
                    {fetchingRepos ? <Activity className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5 group-hover:translate-y-0.5 transition-transform" />}
                    <span>Fetch Targets</span>
                  </button>
                </div>

                {/* Recent Targets History */}
                {recentSearches.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Recent Targets:</span>
                    {recentSearches.map((target) => (
                      <button
                        key={target}
                        onClick={() => { setGithubUsername(target); fetchUserRepos(target); }}
                        className="px-3 py-1 rounded-full bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 text-xs font-mono transition-colors border border-white/5 hover:border-cyan-500/30"
                      >
                        @{target}
                      </button>
                    ))}
                  </div>
                )}

                {fetchingRepos && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-32 glass-panel rounded-2xl animate-pulse p-5">
                        <div className="h-4 w-1/2 bg-slate-800 rounded-full mb-4"></div>
                        <div className="h-3 w-full bg-slate-800/50 rounded-full mb-2"></div>
                        <div className="h-3 w-3/4 bg-slate-800/50 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                )}

                {fetchedRepos.length > 0 && !fetchingRepos && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-6 border-t border-white/5"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      <div className="relative flex-1 w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                          type="text"
                          placeholder="Filter project results..."
                          className="w-full bg-slate-900/50 border border-white/5 text-sm text-slate-300 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-cyan-500/30 transition-all"
                          value={repoFilter}
                          onChange={(e) => setRepoFilter(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{filteredRepos.length} Repositories</span>
                        {filteredRepos.length > 0 && onBulkScan && (
                          <button
                            onClick={() => onBulkScan(filteredRepos.map(r => r.html_url))}
                            disabled={scanning}
                            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors border border-cyan-400/20 px-3 py-1 rounded-lg bg-cyan-400/5 hover:bg-cyan-400/10"
                          >
                            <Sparkles className="h-3 w-3" />
                            Bulk Scan All
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[440px] overflow-y-auto custom-scrollbar pr-2">
                      {filteredRepos.map(repo => (
                        <button
                          key={repo.id}
                          onClick={() => onScan(repo.html_url)}
                          disabled={scanning}
                          className="flex flex-col p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/[0.03] transition-all group text-left relative overflow-hidden h-full shadow-lg"
                        >
                          <div className="flex items-center justify-between mb-3 w-full">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <GitBranch className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                              <h4 className="text-sm font-bold text-white truncate">{repo.name}</h4>
                            </div>
                            {repo.stargazers_count > 0 && (
                              <span className="text-[10px] font-bold text-slate-500">⭐ {repo.stargazers_count}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-6 font-medium">
                            {repo.description || 'System metadata analysis: Project description not provided by operator.'}
                          </p>
                          <div className="mt-auto flex items-center justify-between">
                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest border border-indigo-400/20 px-2 py-0.5 rounded-lg bg-indigo-500/5">{repo.language || 'Standard'}</span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              Initiate <Sparkles className="h-3 w-3" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {fetchedRepos.length === 0 && !fetchingRepos && !githubUsername && (
                  <div className="py-20 text-center glass-panel rounded-3xl border-dashed border-white/5">
                    <Activity className="h-10 w-10 text-slate-700 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-500 text-sm font-medium italic tracking-wide">Enter a target identity to audit their public repository infrastructure.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.form
                key="direct"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleScan}
                className="space-y-6"
              >
                <div className="relative group">
                  <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="https://github.com/organization/repository"
                    className="w-full bg-slate-800/50 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-5 focus:outline-none focus:border-cyan-500/50 transition-all font-mono placeholder-slate-600"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-orange-400 text-xs">
                  <AlertCircle size={14} />
                  <span>Ensure the repository is public or your access token has appropriate visibility.</span>
                </div>

                <button
                  type="submit"
                  disabled={scanning || !repoUrl.trim()}
                  className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-cyan-900/20 transition-all active:scale-[0.98] disabled:opacity-30"
                >
                  {scanning ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing Cloud Patterns...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Execute Vulnerability Scan</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardNewScan;
