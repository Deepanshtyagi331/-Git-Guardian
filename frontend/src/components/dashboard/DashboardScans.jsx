import { GitBranch, Activity, CheckCircle, AlertTriangle, Clock, XCircle, ChevronRight, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cancelScan } from '../../services/api';

const DashboardScans = ({ scans, onRefresh }) => {
  const manualScans = scans.filter(scan => !scan.scanType || scan.scanType === 'manual');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={18} className="text-emerald-400" />;
      case 'failed': return <AlertTriangle size={18} className="text-red-400" />;
      case 'scanning': return <Activity size={18} className="text-cyan-400 animate-pulse" />;
      default: return <Clock size={18} className="text-slate-500" />;
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Confirm protocol termination?')) return;
    try {
      await cancelScan(id);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      alert('Protocol termination failed.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {manualScans.map((scan, index) => (
        <motion.div
          key={scan._id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="glass-card rounded-3xl overflow-hidden group flex flex-col hover:border-cyan-500/30 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/10"
        >
          <div className="p-8 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800/80 rounded-2xl group-hover:scale-110 transition-transform duration-500 border border-white/5">
                  <GitBranch className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-white truncate max-w-[150px]" title={scan.repoUrl}>
                    {scan.repoUrl.split('/').pop().replace('.git', '') || 'repository'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Hash size={10} className="text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter truncate max-w-[120px]">
                      {scan._id.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`p-2 rounded-xl border ${scan.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : scan.status === 'failed' ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]'}`}>
                {getStatusIcon(scan.status)}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Timestamp</span>
                <span className="text-slate-300">{new Date(scan.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Status</span>
                <span className={`px-2 py-0.5 rounded-lg border ${scan.status === 'completed' ? 'text-emerald-400 border-emerald-400/20' : scan.status === 'failed' ? 'text-red-400 border-red-400/20' : 'text-cyan-400 border-cyan-400/20'}`}>
                  {scan.status}
                </span>
              </div>
            </div>

            {scan.status === 'completed' && (
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl group/vuln hover:bg-red-500/10 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Critical</p>
                  <p className="text-xl font-bold text-white font-mono">{scan.results?.stats.critical || 0}</p>
                </div>
                <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-2xl hover:bg-orange-500/10 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-1">High Risk</p>
                  <p className="text-xl font-bold text-white font-mono">{scan.results?.stats.high || 0}</p>
                </div>
              </div>
            )}

            <div className="mt-auto">
              {(scan.status === 'scanning' || scan.status === 'queued') ? (
                <button
                  onClick={() => handleCancel(scan._id)}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 py-4 rounded-2xl hover:bg-red-500 text-white transition-all duration-300 font-bold text-xs uppercase tracking-widest border border-red-500/20"
                >
                  <XCircle size={16} />
                  Terminate Node
                </button>
              ) : (
                <Link
                  to={`/scans/${scan._id}`}
                  className="w-full group/btn flex items-center justify-center gap-2 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white py-4 rounded-2xl transition-all duration-300 font-bold text-xs uppercase tracking-widest border border-white/5"
                >
                  Inspect Manifest
                  <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardScans;
