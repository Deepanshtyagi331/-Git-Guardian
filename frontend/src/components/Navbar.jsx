import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User, Shield, Zap, Power } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthPage) return null;

  return (
    <nav className="glass-panel border-white/5 border-b sticky top-0 z-[100] h-20 flex items-center shadow-xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-2.5 bg-slate-900 border border-white/10 rounded-xl group-hover:border-cyan-500/30 transition-colors">
                  <ShieldCheck className="h-7 w-7 text-cyan-400" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Zap className="h-3 w-3 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col h-[32px] justify-center">
                <span className="text-xl font-black text-white tracking-tighter uppercase leading-tight">Git Guardian</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Security Sentinel</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-8">
                {user.isAdmin && (
                  <Link to="/admin" className="relative group overflow-hidden">
                    <div className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors py-2">
                      <Shield className="h-4 w-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Root Console</span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </Link>
                )}

                <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                  <Link to="/profile" className="flex items-center gap-3 group">
                    <div className="relative">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
                        {user.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
                    </div>
                    <div className="hidden sm:flex flex-col">
                      <span className="text-xs font-black text-white leading-none">{user.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter leading-none mt-1">Operator: Validated</span>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition-all duration-300 ml-2 group"
                    title="Terminate Session"
                  >
                    <Power className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors px-4 py-2">Login</Link>
                <Link
                  to="/register"
                  className="bg-white/5 hover:bg-white text-white hover:text-slate-950 px-6 py-2.5 rounded-xl border border-white/10 hover:border-white transition-all duration-500 text-xs font-black uppercase tracking-widest shadow-xl"
                >
                  Get Access
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
