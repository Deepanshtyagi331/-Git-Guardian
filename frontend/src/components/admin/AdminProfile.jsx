import { User, Shield, Key, Mail, Fingerprint, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const AdminProfile = () => {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="glass-card rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
        {/* Background Decorative Element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]"></div>

        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 mb-12 pb-12 border-b border-white/5">
          <div className="relative group">
            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl relative rotate-3 group-hover:rotate-0 transition-transform duration-500 border border-white/20">
              <span className="text-5xl font-black text-white drop-shadow-lg">{user?.name?.charAt(0)}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 p-2.5 bg-slate-900 border border-white/10 rounded-2xl shadow-xl">
              <ShieldCheck size={20} className="text-cyan-400" />
            </div>
          </div>

          <div className="text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h2 className="text-4xl font-black text-white tracking-tighter">{user?.name}</h2>
              <span className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-full w-fit mx-auto md:mx-0">Root Access</span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center md:justify-start gap-2">
              <Fingerprint size={14} className="text-indigo-400" />
              Security Grade: A-Level Admin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative z-10">
          <div className="glass-panel p-6 rounded-3xl border-transparent hover:border-white/5 transition-all group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 text-slate-400 group-hover:text-cyan-400 transition-colors">
                <Mail size={18} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Communication node</span>
            </div>
            <p className="text-white font-bold tracking-tight bg-slate-900/50 p-3 rounded-2xl border border-white/5">{user?.email}</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border-transparent hover:border-white/5 transition-all group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 text-slate-400 group-hover:text-indigo-400 transition-colors">
                <Key size={18} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Validation ID</span>
            </div>
            <p className="text-slate-400 font-mono text-xs bg-slate-900/50 p-3 rounded-2xl border border-white/5 truncate">{user?._id}</p>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2rem] border-transparent relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-cyan-400 animate-pulse" size={18} />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Privileges</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'System Surveillance', active: true },
              { label: 'Identity Override', active: true },
              { label: 'Log Sanitization', active: true },
              { label: 'Protocol Synthesis', active: true }
            ].map((priv, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-colors">
                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{priv.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminProfile;
