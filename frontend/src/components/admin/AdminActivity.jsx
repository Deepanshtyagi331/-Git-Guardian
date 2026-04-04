import { Activity, Clock, User, LogIn, FileText, Hash, Globe, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminActivity = ({ logs }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case 'LOGIN': return <LogIn size={14} />;
      case 'REGISTER': return <User size={14} />;
      case 'SCAN_CREATED': return <Activity size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getActionStyles = (action) => {
    switch (action) {
      case 'LOGIN': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'REGISTER': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'SCAN_CREATED': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      default: return 'text-slate-400 bg-slate-800/50 border-white/5';
    }
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="glass-panel rounded-[2.5rem] border-dashed border-white/10 p-20 text-center flex flex-col items-center">
        <div className="p-6 bg-slate-900/50 rounded-full mb-6 border border-white/5">
          <Activity className="h-12 w-12 text-slate-700" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Protocol Archive Empty</h3>
        <p className="text-slate-500 font-medium max-w-sm">No recorded movement protocols detected in the central nervous system.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl"
    >
      <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Clock className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Movement Logs</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time sequential audit of system-wide operations.</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mr-2">Retention</span>
          <span className="text-xs font-bold text-indigo-400 font-mono">100 ENTRIES</span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-white/[0.02]">
            <tr>
              <th className="px-10 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
              <th className="px-10 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Validated Node</th>
              <th className="px-10 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Action Protocol</th>
              <th className="px-10 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Payload Details</th>
              <th className="px-10 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Origin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map((log, index) => (
              <motion.tr
                key={log._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-white/[0.02] transition-colors group"
              >
                <td className="px-10 py-6 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300 font-mono tracking-tighter">
                      {new Date(log.createdAt).toLocaleTimeString(undefined, { hour12: false })}
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold uppercase mt-0.5">
                      {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </td>
                <td className="px-10 py-6 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                      {log.user ? log.user.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {log.user ? log.user.name : 'Unknown Terminal'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6 whitespace-nowrap">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border w-fit ${getActionStyles(log.action)}`}>
                    {getActionIcon(log.action)}
                    {log.action}
                  </span>
                </td>
                <td className="px-10 py-6 text-xs text-slate-400 font-mono truncate max-w-[200px] hover:max-w-none transition-all duration-300">
                  {log.details || '-'}
                </td>
                <td className="px-10 py-6 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                    <Globe size={12} className="text-slate-600" />
                    {log.ipAddress || '::1'}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default AdminActivity;
