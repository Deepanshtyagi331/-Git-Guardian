import { GitBranch, Activity, CheckCircle, AlertTriangle, Clock, History, ShieldAlert, ChevronRight, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DashboardAutoScanHistory = ({ scans }) => {
  const autoScans = scans.filter(scan => scan.scanType === 'automated');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={18} className="text-emerald-400" />;
      case 'failed': return <AlertTriangle size={18} className="text-red-400" />;
      case 'scanning': return <Activity size={18} className="text-cyan-400 animate-pulse" />;
      default: return <Clock size={18} className="text-slate-500" />;
    }
  };

  if (autoScans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 glass-panel rounded-[2rem] border-dashed border-white/10 mt-10">
        <div className="p-6 bg-slate-900/50 rounded-full mb-6 border border-white/5">
          <History className="h-12 w-12 text-slate-700" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Passive Observation Mode</h3>
        <p className="text-slate-500 font-medium text-sm max-w-sm text-center leading-relaxed">
          The autonomous security engine hasn't executed any scheduled protocols yet.
          Enable <span className="text-cyan-400">Auto-Protocols</span> to start monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center glass-card p-8 rounded-[2rem] gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <ShieldAlert className="h-8 w-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Autonomous Manifest</h3>
            <p className="text-slate-500 font-medium">Historical archive of system-initiated analysis.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 px-6 py-3 rounded-2xl border border-white/5">
          <span className="text-2xl font-bold text-cyan-400 font-mono tracking-tighter">{autoScans.length}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Events Logged</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {autoScans.map((scan, index) => (
          <motion.div
            key={scan._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card rounded-3xl overflow-hidden group flex flex-col hover:border-cyan-500/30 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/10"
          >
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-3 bg-slate-800/80 rounded-2xl group-hover:scale-110 transition-transform duration-500 border border-white/5">
                    <GitBranch className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-white truncate max-w-[150px]" title={scan.repoUrl}>
                      {scan.repoUrl.split('/').pop().replace('.git', '') || 'repository'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Hash size={10} className="text-slate-500" />
                      <span className="text-[10px] font-mono text-slate-500 tracking-tighter">
                        {scan._id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`p-2 rounded-xl border ${scan.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  {getStatusIcon(scan.status)}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>Logged At</span>
                  <span className="text-slate-300">{new Date(scan.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>System Label</span>
                  <span className="px-2 py-0.5 rounded-lg border border-cyan-400/20 text-cyan-400 bg-cyan-400/5">Automated Scan</span>
                </div>
              </div>

              {scan.status === 'completed' && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Critical</p>
                    <p className="text-xl font-bold text-white font-mono">{scan.results?.stats.critical || 0}</p>
                  </div>
                  <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-1">Warnings</p>
                    <p className="text-xl font-bold text-white font-mono">{(scan.results?.stats.high || 0) + (scan.results?.stats.medium || 0)}</p>
                  </div>
                </div>
              )}

              <div className="mt-auto">
                <Link
                  to={`/scans/${scan._id}`}
                  className="w-full group/btn flex items-center justify-center gap-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white py-4 rounded-2xl transition-all duration-300 font-bold text-xs uppercase tracking-widest border border-white/5"
                >
                  Examine Log
                  <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DashboardAutoScanHistory;
