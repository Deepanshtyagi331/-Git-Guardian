import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, ArrowRight } from 'lucide-react';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Email successfully verified.');
        setTimeout(() => {
          navigate('/login', { state: { message: 'Verification complete. You may now log in.' } });
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. Token may be invalid or expired.');
      }
    };
    if (token) {
      verify();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse-slow"></div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 rounded-[3rem] shadow-2xl border-white/5 relative z-10 text-center max-w-md w-full bg-slate-900/60 backdrop-blur-3xl"
      >
        {status === 'verifying' && (
          <div>
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Verifying Identity</h2>
            <p className="text-slate-400 text-sm">Please wait while we confirm your credentials...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <ShieldCheck className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Identity Verified</h2>
            <p className="text-slate-400 text-sm mb-8">{message}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Redirecting to Access Control...</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <Activity className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Verification Failed</h2>
            <p className="text-red-400 text-sm mb-8 font-bold">{message}</p>
            <Link to="/login" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-bold text-sm uppercase tracking-wider">
              Return to Login <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
