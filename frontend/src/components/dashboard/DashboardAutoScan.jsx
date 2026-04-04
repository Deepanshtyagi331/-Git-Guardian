import { Github, Clock, Save, CheckCircle2, Shield, Info, Zap, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { updateProfile } from '../../services/api';

const DashboardAutoScan = () => {
  const { user, updateUser } = useAuth();
  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || '');
  const [autoScanEnabled, setAutoScanEnabled] = useState(user?.autoScanEnabled || false);
  const [autoScanInterval, setAutoScanInterval] = useState(user?.autoScanInterval || 7);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const data = await updateProfile({
        githubUsername,
        autoScanEnabled,
        autoScanInterval: parseInt(autoScanInterval)
      });
      updateUser(data);
      setMessage({ type: 'success', text: 'Protocol parameters synchronized successfully.' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Protocol synchronization failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Zap className="w-48 h-48 text-cyan-400" />
        </div>

        <div className="relative z-10">
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Auto-Analysis</h2>
                <p className="text-slate-500 font-medium">Configure recurring autonomous scan protocols.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">GitHub Association</label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="Enter operator GitHub ID"
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-cyan-500/30 transition-all font-mono placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-6 border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl transition-colors ${autoScanEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Activity size={20} className={autoScanEnabled ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Execution Toggle</h4>
                      <p className="text-xs text-slate-500 font-medium">Enable autonomous recurring scans</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                    className={`w-14 h-8 rounded-full relative transition-all duration-300 ${autoScanEnabled ? 'bg-cyan-600 shadow-lg shadow-cyan-600/30' : 'bg-slate-800'}`}
                  >
                    <motion.div
                      animate={{ x: autoScanEnabled ? 28 : 4 }}
                      className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {autoScanEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-8 mt-6 border-t border-white/5">
                        <div className="flex justify-between items-center mb-6">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} />
                            Protocol Frequency
                          </label>
                          <span className="text-sm font-bold text-cyan-400 font-mono bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">Every {autoScanInterval} Days</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={autoScanInterval}
                          onChange={(e) => setAutoScanInterval(e.target.value)}
                          className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500 transition-all"
                        />
                        <div className="flex justify-between text-[10px] text-slate-600 font-bold mt-4 font-mono">
                          <span>01D</span>
                          <span>15D</span>
                          <span>30D</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex gap-4">
              <Info size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                The autonomous engine clones and audits your most active public repositories at the defined interval.
                Reports are generated automatically and stored in the <span className="text-cyan-400">Auto-History</span> manifest.
              </p>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                >
                  <CheckCircle2 size={16} />
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-white text-slate-950 font-bold py-5 rounded-2xl transition-all hover:bg-cyan-50 active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {loading ? (
                <div className="h-5 w-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>Synchronize Manifest</span>
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardAutoScan;
