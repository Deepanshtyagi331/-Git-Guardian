import { useState } from 'react';
import { User, Shield, Key, Mail, Fingerprint, Calendar, Smartphone, QrCode, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { setupMfa, enableMfa, disableMfa } from '../../services/api';

const DashboardProfile = () => {
  const { user, updateUser } = useAuth();
  
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetupMfa = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await setupMfa();
      setMfaSetup(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMfa = async () => {
    setLoading(true);
    setError('');
    try {
      await enableMfa(mfaCode);
      updateUser({ mfaEnabled: true });
      setMfaSetup(null);
      setMfaCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid MFA code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    setLoading(true);
    setError('');
    try {
      await disableMfa(mfaCode);
      updateUser({ mfaEnabled: false });
      setMfaCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid MFA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
                <span className="text-4xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent uppercase">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-900 rounded-full"></div>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-1">{user?.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield size={10} />
                    Verified Operator
                  </span>
                </div>
                {user?.mfaEnabled && (
                  <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Smartphone size={10} />
                      MFA Active
                    </span>
                  </div>
                )}
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
              Operator since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Unknown'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* MFA Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-3">
              <Smartphone className="text-purple-400" size={24} />
              Multi-Factor Authentication
            </h3>
            <p className="text-slate-400 text-xs mt-2 font-medium tracking-wide">Add an additional layer of security to your Guardian operator profile.</p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border ${user?.mfaEnabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}>
            {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 mb-6"
            >
              <Activity size={16} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!user?.mfaEnabled && !mfaSetup && (
          <div className="text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-sm text-slate-300">Protect your account using a Time-based One-Time Password (TOTP) application like Google Authenticator or Authy.</p>
            <button
              onClick={handleSetupMfa}
              disabled={loading}
              className="flex-shrink-0 px-6 py-3 rounded-xl bg-purple-500/20 text-purple-400 font-bold text-xs uppercase tracking-widest hover:bg-purple-500/30 transition-colors border border-purple-500/30"
            >
              {loading ? 'Processing...' : 'Configure MFA'}
            </button>
          </div>
        )}

        {mfaSetup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-8 items-center bg-slate-900/50 p-6 rounded-2xl border border-white/5">
              <div className="bg-white p-2 rounded-xl">
                <img src={mfaSetup.qrCode} alt="MFA QR Code" className="w-32 h-32" />
              </div>
              <div className="flex-1 space-y-4">
                <h4 className="text-sm font-bold text-white">1. Scan the QR Code</h4>
                <p className="text-xs text-slate-400">Open your authenticator app and scan this QR code, or manually enter the secret key below:</p>
                <div className="bg-slate-950 p-3 rounded-lg border border-white/5 text-center">
                  <code className="text-cyan-400 font-mono text-sm tracking-widest">{mfaSetup.secret}</code>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">2. Verify Token</h4>
              <p className="text-xs text-slate-400">Enter the 6-digit code generated by your app to verify setup.</p>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="123456"
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  maxLength={6}
                />
                <button
                  onClick={handleEnableMfa}
                  disabled={loading || mfaCode.length !== 6}
                  className="px-8 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-widest hover:bg-emerald-500/30 transition-colors border border-emerald-500/30 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Enable'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {user?.mfaEnabled && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">To disable MFA, you must provide a valid code from your authenticator app.</p>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="123456"
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                maxLength={6}
              />
              <button
                onClick={handleDisableMfa}
                disabled={loading || mfaCode.length !== 6}
                className="px-8 py-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-500/30 transition-colors border border-red-500/30 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Disable MFA'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardProfile;
