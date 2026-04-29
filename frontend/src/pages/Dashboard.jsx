import { useState, useEffect } from 'react';
import { getScans, createScan } from '../services/api';
import { LayoutDashboard, Terminal, FolderGit2, User, Menu, X, Shield, Activity, Search, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginBg from '../assets/login-bg.png';

// Components
import DashboardOverview from '../components/dashboard/DashboardOverview';
import DashboardScans from '../components/dashboard/DashboardScans';
import DashboardNewScan from '../components/dashboard/DashboardNewScan';
import DashboardProfile from '../components/dashboard/DashboardProfile';
import DashboardAutoScan from '../components/dashboard/DashboardAutoScan';
import DashboardAutoScanHistory from '../components/dashboard/DashboardAutoScanHistory';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchScans();
    const interval = setInterval(() => {
      fetchScans();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchScans = async () => {
    try {
      const data = await getScans();
      setScans(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (repoUrl, skipTabSwitch = false) => {
    setScanning(true);
    try {
      await createScan({ repoUrl });
      if (!skipTabSwitch) {
        setActiveTab('scans');
        fetchScans();
      }
    } catch (error) {
      console.error(error);
      if (!skipTabSwitch) alert('Failed to start scan');
      throw error; // Rethrow for bulk handler
    } finally {
      if (!skipTabSwitch) setScanning(false);
    }
  };

  const handleBulkScan = async (repoUrls) => {
    setScanning(true);
    let successCount = 0;
    
    try {
      for (const url of repoUrls) {
        try {
          await handleScan(url, true);
          successCount++;
          // Small delay to prevent rate limiting/overload
          await new Promise(r => setTimeout(r, 500));
        } catch (err) {
          console.error(`Bulk Scan failed for ${url}:`, err);
        }
      }
      
      alert(`Bulk Scan Protocol initiated for ${successCount}/${repoUrls.length} repositories.`);
      setActiveTab('scans');
      fetchScans();
    } finally {
      setScanning(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard, desc: 'Operational Overview' },
    { id: 'new-scan', label: 'Initiate Scan', icon: Search, desc: 'Vulnerability Analysis' },
    { id: 'auto-scan', label: 'Auto-Protocols', icon: Shield, desc: 'Recurring Analysis' },
    { id: 'auto-history', label: 'Auto-History', icon: History, desc: 'Autonomous Logs' },
    { id: 'scans', label: 'Scan History', icon: FolderGit2, desc: 'Operations Archive' },
    { id: 'profile', label: 'Operator Profile', icon: User, desc: 'Identity & Access' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-2 border-b-2 border-cyan-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="h-8 w-8 text-cyan-400 animate-pulse" />
        </div>
        <p className="mt-8 text-cyan-500/70 font-mono text-xs tracking-[0.2em] uppercase transition-all animate-pulse">Establishing Secure Uplink...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-20 bg-slate-950/80 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 glass-panel border-r border-white/5 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
              <Terminal className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Git Guardian<span className="text-cyan-400">.</span></span>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${activeTab === item.id
                  ? 'bg-white/5 text-white shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
              >
                {activeTab === item.id && (
                  <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_15px_rgba(6,182,212,1)]" />
                )}
                <item.icon className={`h-5 w-5 transition-colors duration-300 ${activeTab === item.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                  <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-400 transition-colors uppercase tracking-widest">{item.desc}</span>
                </div>
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="glass-panel rounded-2xl p-4 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Core Status</span>
                <span className="text-emerald-500 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  Online
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                ></motion.div>
              </div>
              <p className="mt-2 text-[10px] text-slate-500 font-mono">ENCRYPTED // NODE-04</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 md:hidden bg-slate-950/20 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-400" />
            <span className="font-bold text-white tracking-tight text-lg">Git Guardian</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 active:scale-95 transition-transform"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto pb-20 md:pb-0">
            <header className="mb-8 md:mb-12 cursor-default">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-cyan-500 font-mono text-[10px] font-bold uppercase tracking-[0.3em] mb-3"
              >
                <div className="h-px w-8 bg-cyan-500/30"></div>
                System Module 0{navItems.findIndex(i => i.id === activeTab) + 1}
              </motion.div>
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2 md:mb-4">
                {navItems.find(i => i.id === activeTab)?.label}
              </h1>
              <p className="text-slate-400 text-sm md:text-lg max-w-2xl font-medium leading-relaxed">
                {activeTab === 'overview' && 'Real-time security metrics and personal scan telemetry dashboard.'}
                {activeTab === 'new-scan' && 'Initiate comprehensive vulnerability analysis on remote repositories.'}
                {activeTab === 'auto-scan' && 'Define automated scanning protocols for continuous monitoring.'}
                {activeTab === 'auto-history' && 'Audit logs for autonomous security analysis protocols.'}
                {activeTab === 'scans' && 'Encrypted archive of all manual security scan operations.'}
                {activeTab === 'profile' && 'Manage operator identity and secure access tokens.'}
              </p>
            </header>

            <AnimatePresence mode='wait'>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeTab === 'overview' && <DashboardOverview scans={scans} />}
                {activeTab === 'new-scan' && <DashboardNewScan onScan={handleScan} onBulkScan={handleBulkScan} scanning={scanning} />}
                {activeTab === 'auto-scan' && <DashboardAutoScan />}
                {activeTab === 'auto-history' && <DashboardAutoScanHistory scans={scans} />}
                {activeTab === 'scans' && <DashboardScans scans={scans} onRefresh={fetchScans} />}
                {activeTab === 'profile' && <DashboardProfile />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
