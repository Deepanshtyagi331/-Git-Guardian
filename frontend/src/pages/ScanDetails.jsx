import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getScan, cancelScan } from '../services/api';
import { ArrowLeft, AlertTriangle, FileText, CheckCircle, Activity, Search, Code, ShieldAlert, XCircle, ChevronRight, Hash, Zap, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ScanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchScan = async () => {
    try {
      const data = await getScan(id);
      setScan(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();

    const interval = setInterval(() => {
      if (scan && scan.status !== 'completed' && scan.status !== 'failed') {
        fetchScan();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, scan?.status]);

  const handleCancel = async () => {
    if (!window.confirm('Confirm protocol termination?')) return;
    try {
      await cancelScan(id);
      fetchScan();
    } catch (error) {
      console.error(error);
      alert('Failed to terminate scan');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full animate-pulse"></div>
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
          <Cpu className="h-16 w-16 text-cyan-400 relative animate-spin-slow" />
        </div>
        <p className="text-cyan-100 font-mono tracking-widest text-sm uppercase">Accessing Database Manifest...</p>
      </div>
    </div>
  );

  if (!scan) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 relative">
      <div className="absolute top-10 left-10">
        <Link to="/" className="text-slate-500 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft size={16} /> Return to Home
        </Link>
      </div>
      <div className="text-center relative z-10 glass-card p-12 rounded-[2.5rem]">
        <ShieldAlert className="h-20 w-20 text-red-500 mx-auto mb-6 opacity-80" />
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Access Denied</h2>
        <p className="text-slate-400 font-medium">Requested protocol manifest could not be retrieved from the central registry.</p>
      </div>
    </div>
  );

  if (scan.status === 'failed') {
    return (
      <div className="min-h-screen bg-slate-950 pt-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-red-500/5 blur-[100px] rounded-full"></div>
        <div className="max-w-2xl mx-auto glass-card border-red-500/20 rounded-[2.5rem] p-12 text-center relative z-10 shadow-2xl shadow-red-900/10">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="h-10 w-10 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">System Critical Failure</h2>
          <p className="text-red-400/80 mb-10 font-mono text-sm leading-relaxed px-6">
            {scan.error || 'The analysis engine encountered an catastrophic exception during repository deconstruction.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-red-900/40"
          >
            <ArrowLeft className="h-5 w-5" />
            Revert to CommandCenter
          </button>
        </div>
      </div>
    );
  }

  const severityStyles = (severity) => {
    switch (severity) {
      case 'critical': return {
        card: 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30 shadow-red-500/5',
        icon: 'text-red-500 bg-red-500/10 border-red-500/20',
        badge: 'text-red-400 border-red-400/20 bg-red-500/10'
      };
      case 'high': return {
        card: 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/30 shadow-orange-500/5',
        icon: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        badge: 'text-orange-400 border-orange-400/20 bg-orange-500/10'
      };
      case 'medium': return {
        card: 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/30 shadow-yellow-500/5',
        icon: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        badge: 'text-yellow-400 border-yellow-400/20 bg-yellow-500/10'
      };
      case 'low': return {
        card: 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/30 shadow-blue-500/5',
        icon: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        badge: 'text-blue-400 border-blue-400/20 bg-blue-500/10'
      };
      default: return {
        card: 'bg-slate-800/20 border-white/5 hover:bg-slate-800/40',
        icon: 'text-slate-400 bg-slate-800 border-white/5',
        badge: 'text-slate-400 border-white/5 bg-slate-800/50'
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-x-hidden pt-10 pb-20">
      {/* Background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-cyan-400 transition-colors group">
              <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Operational Return
            </Link>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl">
                <Code size={32} className="text-cyan-400" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">Protocol Manifesto</h1>
                <p className="text-slate-500 font-medium font-mono text-sm max-w-md truncate" title={scan.repoUrl}>{scan.repoUrl}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {(scan.status === 'scanning' || scan.status === 'queued') && (
              <button
                onClick={handleCancel}
                className="bg-red-500/10 hover:bg-red-500 text-white border border-red-500/20 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center transition-all shadow-xl shadow-red-900/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Terminate Node
              </button>
            )}
            <div className={`px-6 py-3 rounded-2xl text-xs font-bold tracking-widest uppercase border backdrop-blur-md ${scan.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              scan.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                'bg-cyan-500/10 text-cyan-400 border-cyan-400/30 animate-pulse'
              }`}>
              {scan.status}
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <AnimatePresence>
          {scan.status === 'completed' && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
            >
              {[
                { label: 'Critical Threats', val: scan.results?.stats.critical, color: 'text-red-500', glow: 'shadow-red-500/20' },
                { label: 'High Risks', val: scan.results?.stats.high, color: 'text-orange-500', glow: 'shadow-orange-500/20' },
                { label: 'Medium Safety', val: scan.results?.stats.medium, color: 'text-yellow-500', glow: 'shadow-yellow-500/20' },
                { label: 'Low Observations', val: scan.results?.stats.low, color: 'text-blue-500', glow: 'shadow-blue-500/20' },
              ].map((stat, i) => (
                <div key={i} className={`glass-card p-8 rounded-[2rem] text-center group hover:-translate-y-1 transition-all duration-300 ${stat.glow}`}>
                  <div className={`text-5xl font-black mb-3 font-mono tracking-tighter ${stat.color} drop-shadow-sm group-hover:drop-shadow-[0_0_15px_currentColor] transition-all`}>
                    {stat.val}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{stat.label}</div>
                </div>
              ))}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Vulnerability Stream</h2>
            <div className="h-[1px] w-20 bg-gradient-to-r from-cyan-400/50 to-transparent ml-4 opacity-30"></div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 border border-white/5 px-4 py-2 rounded-xl">
            <Hash size={12} className="text-cyan-400" />
            NodeID: {id.slice(-8).toUpperCase()}
          </div>
        </div>

        {/* Vulnerability List */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {scan.results?.issues.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card border-dashed border-emerald-500/20 p-20 rounded-[2.5rem] text-center bg-emerald-500/[0.02]"
              >
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Integrity Optimal</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">No high-risk vulnerabilities detected within the scanned operational parameters.</p>
              </motion.div>
            ) : (
              scan.results?.issues.map((issue, index) => {
                const styles = severityStyles(issue.severity);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-8 rounded-[2rem] border backdrop-blur-xl transition-all duration-500 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden group shadow-lg ${styles.card}`}
                  >
                    <div className={`p-4 rounded-2xl flex-shrink-0 transition-transform duration-500 group-hover:scale-110 border ${styles.icon}`}>
                      <AlertTriangle size={24} />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <h3 className="text-lg font-bold text-white tracking-tight leading-snug max-w-2xl">{issue.message}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles.badge}`}>
                          {issue.severity}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-900 border border-white/5 px-4 py-2 rounded-xl text-xs font-mono text-slate-300">
                          <FileText size={14} className="text-slate-500" />
                          <span className="truncate max-w-xs">{issue.file}</span>
                          {issue.line > 0 && <span className="text-cyan-400 font-bold ml-1">:{issue.line}</span>}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900 border border-white/5 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <Zap size={12} className="text-indigo-400" />
                          Type: {issue.type}
                        </div>
                      </div>
                    </div>

                    <div className="md:border-l md:border-white/5 md:pl-8 flex flex-col justify-center h-full pt-4 md:pt-0">
                      <button className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-2">
                        View Solution <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ScanDetails;
