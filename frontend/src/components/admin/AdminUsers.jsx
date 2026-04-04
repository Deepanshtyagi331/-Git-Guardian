import { Users, Lock, Unlock, Activity, Hash, Mail, Shield, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminUsers = ({ users }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl"
    >
      <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <Users className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Identity Registry</h3>
            <p className="text-xs text-slate-500 font-medium">Global database of validated system operators.</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
          <span className="text-xs font-bold text-cyan-400 font-mono">{users.length}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-2">Total Logs</span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-white/[0.02]">
            <tr>
              <th className="px-10 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Validated Operator</th>
              <th className="px-10 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Contact Node</th>
              <th className="px-10 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Privilege Level</th>
              <th className="px-10 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Load Metrics</th>
              <th className="px-10 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Inception</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user, index) => (
              <motion.tr
                key={user._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-white/[0.02] transition-colors group"
              >
                <td className="px-10 py-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform duration-500">
                        {user.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                    </div>
                    <div className="ml-5">
                      <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{user.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Hash size={10} className="text-slate-600" />
                        <span className="text-[10px] text-slate-600 font-mono tracking-tighter uppercase">{user._id.substring(user._id.length - 8)}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-slate-300 font-medium text-xs">
                    <Mail size={12} className="text-slate-500" />
                    {user.email}
                  </div>
                </td>
                <td className="px-10 py-6 whitespace-nowrap">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 w-fit border ${user.isAdmin
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'bg-slate-800/50 text-slate-400 border-white/5'
                    }`}>
                    {user.isAdmin ? <Shield size={10} /> : <Unlock size={10} />}
                    {user.isAdmin ? 'Administrator' : 'Operator'}
                  </span>
                </td>
                <td className="px-10 py-6 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg border border-white/5">
                      <Activity size={12} className="text-cyan-400" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white font-mono">{user.scanCount || 0}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter ml-1.5">Ops</span>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-tighter">
                    <Calendar size={12} />
                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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

export default AdminUsers;
