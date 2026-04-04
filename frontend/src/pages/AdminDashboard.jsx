import { useState, useEffect } from 'react';
import { getAllUsers, getSystemStats, getActivityLogs } from '../services/api';
import { Shield, LayoutDashboard, Users, Activity, User, Menu, X, ChevronRight, Hash, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminActivity from '../components/admin/AdminActivity';
import AdminProfile from '../components/admin/AdminProfile';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersData, statsData, logsData] = await Promise.all([
        getAllUsers(),
        getSystemStats(),
        getActivityLogs()
      ]);
      setUsers(usersData);
      setStats(statsData);
      setLogs(logsData);
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard, desc: 'Global Metrics' },
    { id: 'users', label: 'User Identities', icon: Users, desc: 'Access Control' },
    { id: 'activity', label: 'Movement Logs', icon: Activity, desc: 'System Audit' },
    { id: 'profile', label: 'Admin Profile', icon: User, desc: 'Root Settings' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
        <Shield className="h-16 w-16 text-cyan-400 relative animate-bounce" />
      </div>
      <p className="text-cyan-100 font-mono tracking-widest text-xs uppercase mt-8 animate-pulse">Initializing Git Guardian...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 glass-panel border-r border-white/5 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-white/5">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-lg scale-110 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Shield className="h-9 w-9 text-cyan-400 relative" />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tighter block uppercase">Git Guardian</span>
                <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Admin Terminal</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${activeTab === item.id
                  ? 'bg-white/[0.03] text-white shadow-xl shadow-black/50 border border-white/10'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                <div className={`p-2 rounded-xl transition-colors duration-300 mr-4 ${activeTab === item.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/50 group-hover:bg-slate-800'}`}>
                  <item.icon size={18} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block">{item.label}</span>
                  <span className="text-[10px] opacity-60 font-medium">{item.desc}</span>
                </div>
                {activeTab === item.id && (
                  <motion.div
                    layoutId="active-nav-glow"
                    className="absolute right-4 w-1 h-4 bg-cyan-500 rounded-full shadow-[0_0_15px_#06b6d4]"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="p-6">
            <div className="glass-card p-4 rounded-2xl border-white/5 bg-slate-900/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">System Health</span>
                <Zap size={10} className="text-cyan-400 animate-pulse" />
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '94%' }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                />
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-tighter flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div> Online
                </span>
                <span className="text-[10px] font-mono text-slate-500 tracking-tighter">94%</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-6 glass-panel border-b border-white/5">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-400" />
            <span className="font-black text-white tracking-widest uppercase text-sm">Git Guardian</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-slate-800 rounded-xl text-slate-300">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">
                  {navItems.find(i => i.id === activeTab)?.label}
                </h1>
                <p className="text-slate-500 font-medium max-w-xl mt-2 leading-relaxed">
                  {activeTab === 'overview' && 'Aggregate system-wide metrics and real-time performance clusters.'}
                  {activeTab === 'users' && 'Authorize and audit user protocol access and identity validation.'}
                  {activeTab === 'activity' && 'Sequential movement logs of all validated operations within the Guardian.'}
                  {activeTab === 'profile' && 'Administrator core credentials and security parameter settings.'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 border border-white/5 px-4 py-2 rounded-xl">
                <Hash size={12} className="text-cyan-400" />
                Git Guardian v4.0.2
              </div>
            </header>

            <AnimatePresence mode='wait'>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeTab === 'overview' && <AdminOverview stats={stats} logs={logs} />}
                {activeTab === 'users' && <AdminUsers users={users} />}
                {activeTab === 'activity' && <AdminActivity logs={logs} />}
                {activeTab === 'profile' && <AdminProfile />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
