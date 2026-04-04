import { User, Shield, Key, Mail, Fingerprint, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const DashboardProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <User className="w-56 h-56 text-cyan-400" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-28 h-28 rounded-full bg-slate-900 flex items-center justify-center border-2 border-white/10 shadow-2xl">
                <span className="text-4xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-900 rounded-full"></div>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-1">{user?.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield size={10} />
                    Verified Operator
                  </span>
                </div>
                {user?.isAdmin && (
                  <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Administrator</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="glass-panel p-5 rounded-2xl border-white/5 bg-white/[0.02] flex items-center gap-4">
              <div className="p-3 bg-slate-800 rounded-xl text-slate-400">
                <Mail size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Email Address</p>
                <p className="text-sm font-medium text-slate-200 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-white/5 bg-white/[0.02] flex items-center gap-4">
              <div className="p-3 bg-slate-800 rounded-xl text-slate-400">
                <Fingerprint size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Identity Token</p>
                <p className="text-xs font-mono text-slate-400 truncate tracking-tighter">{user?._id}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 border-white/5 bg-white/[0.01]">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
              <Key size={16} className="text-cyan-400" />
              Manifest Permissions
            </h3>

            <div className="space-y-4">
              {[
                { label: 'Autonomous Repository Analysis', access: 'Authorized' },
                { label: 'Report Generation & Storage', access: 'Authorized' },
                { label: 'Global Security Posture Read', access: 'Authorized' },
              ].map((perm, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="text-xs font-medium text-slate-400">{perm.label}</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">{perm.access}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Calendar size={12} />
              Operator since {new Date(user?.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardProfile;
