import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Shield, Mail, Lock, Activity, User, ArrowRight, Sparkles, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Identity establishment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center relative z-10 mb-10 w-full"
      >
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500/40 blur-2xl rounded-2xl scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="p-5 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl relative">
              <UserPlus className="h-12 w-12 text-indigo-400" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter mb-3 uppercase">
          Git Guardian Join
        </h2>
        <p className="text-slate-400 font-bold tracking-[0.3em] text-[10px] uppercase">
          Initialize Operator Identity
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-10 rounded-[3rem] shadow-2xl border-white/5 relative overflow-hidden backdrop-blur-3xl bg-slate-900/60">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3"
                >
                  <Activity size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-indigo-400 transition-colors">Full Identity</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-white/5 rounded-2xl bg-slate-950/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 text-sm font-medium"
                    placeholder="Operator Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-cyan-400 transition-colors">Digital Node</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-white/5 rounded-2xl bg-slate-950/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 text-sm font-medium"
                    placeholder="operator@guardian.core"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-purple-400 transition-colors">Access Logic</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-white/5 rounded-2xl bg-slate-950/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 text-sm font-medium"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-6 rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 focus:outline-none shadow-xl hover:shadow-indigo-500/20 transition-all duration-500 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-3 relative z-10 font-black text-sm uppercase tracking-widest">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Encrypting...
                    </>
                  ) : (
                    <>
                      <Fingerprint size={18} />
                      Establish Identity
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>

          <div className="mt-10">
            <div className="relative flex items-center gap-4 mb-8">
              <div className="h-px bg-white/5 flex-grow"></div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Established Protocol</span>
              <div className="h-px bg-white/5 flex-grow"></div>
            </div>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-2 group">
                <span className="text-sm font-bold text-slate-500">Already Registered?</span>
                <span className="text-sm font-black text-indigo-400 group-hover:text-indigo-300 transition-colors border-b border-indigo-400/30">Access Control Center</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
