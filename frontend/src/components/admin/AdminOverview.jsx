import { Users, ShieldAlert, CheckCircle, XCircle, BarChart2, Activity, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-2xl font-mono text-xs">
        <p className="text-white mb-2 border-b border-white/10 pb-1 font-bold">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between gap-4 py-0.5" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AdminOverview = ({ stats, logs }) => {
  if (!stats) return null;

  // Process Logs for Activity Chart (Last 7 Days)
  const processActivityData = () => {
    if (!logs || logs.length === 0) return [];

    const days = 7;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const count = logs.filter(log => {
        const logDate = new Date(log.createdAt);
        return logDate.getDate() === d.getDate() && logDate.getMonth() === d.getMonth();
      }).length;

      data.push({ name: dateStr, actions: count });
    }
    return data;
  };

  const activityData = processActivityData();

  // Process Stats for Pie Chart
  const pieData = [
    { name: 'Successful', value: stats.completedScans || 0 },
    { name: 'Failed', value: stats.failedScans || 0 },
  ];
  const COLORS = ['#10b981', '#ef4444'];

  const statItems = [
    { label: 'Total Users', val: stats.totalUsers, icon: Users, color: 'text-indigo-400', border: 'border-l-indigo-500', trend: 'Global Database' },
    { label: 'Active (24h)', val: stats.activeUsers24h || 0, icon: Activity, color: 'text-pink-400', border: 'border-l-pink-500', trend: 'Real-time Pulse' },
    { label: 'Total Scans', val: stats.totalScans, icon: BarChart2, color: 'text-cyan-400', border: 'border-l-cyan-500', trend: 'Infrastructure Load' },
    { label: 'Successful', val: stats.completedScans, icon: CheckCircle, color: 'text-emerald-400', border: 'border-l-emerald-500', trend: 'System Integrity' },
    { label: 'Failed', val: stats.failedScans, icon: XCircle, color: 'text-red-400', border: 'border-l-red-500', trend: 'Critical Exceptions' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card p-6 rounded-2xl border-l-4 ${item.border} group hover:-translate-y-1 transition-all duration-300 shadow-xl overflow-hidden relative`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <item.icon size={64} />
            </div>
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{item.label}</span>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-white font-mono tracking-tighter">{item.val}</p>
                <div className={`p-2 bg-slate-800/80 rounded-xl ${item.color} border border-white/5`}>
                  <item.icon size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <TrendingUp size={10} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{item.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              <Zap className="w-5 h-5 text-cyan-400" />
              Network Throughput
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 border border-white/5 px-4 py-1.5 rounded-full">Temporal Range: 7D</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#475569"
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="actions"
                  name="Operations"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorActions)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              Operational Integrity
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 border border-white/5 px-4 py-1.5 rounded-full">Success vs Failure</span>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none transition-all duration-500" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminOverview;
