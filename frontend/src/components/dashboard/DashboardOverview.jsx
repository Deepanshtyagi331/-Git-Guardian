import { Terminal, Search, Shield, Zap, BarChart2, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

const DashboardOverview = ({ scans }) => {
  const totalScans = scans.length;
  const completedScans = scans.filter(s => s.status === 'completed');
  const criticalVulns = scans.reduce((acc, scan) => acc + (scan.results?.stats?.critical || 0), 0);
  const highVulns = scans.reduce((acc, scan) => acc + (scan.results?.stats?.high || 0), 0);
  const mediumVulns = scans.reduce((acc, scan) => acc + (scan.results?.stats?.medium || 0), 0);
  const lowVulns = scans.reduce((acc, scan) => acc + (scan.results?.stats?.low || 0), 0);

  const vulnData = [
    { name: 'Critical', value: criticalVulns },
    { name: 'High', value: highVulns },
    { name: 'Medium', value: mediumVulns },
    { name: 'Low', value: lowVulns },
  ].filter(d => d.value > 0);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

  const recentScansData = completedScans.slice(0, 5).map(scan => ({
    name: scan.repoUrl.split('/').pop().replace('.git', '') || 'repo',
    Critical: scan.results?.stats?.critical || 0,
    High: scan.results?.stats?.high || 0,
    Medium: scan.results?.stats?.medium || 0,
    Low: scan.results?.stats?.low || 0,
  }));

  const stats = [
    { label: 'Total Scans', value: totalScans, icon: Terminal, color: 'text-cyan-400', border: 'border-cyan-500/20' },
    { label: 'Completed', value: completedScans.length, icon: Shield, color: 'text-emerald-400', border: 'border-emerald-500/20' },
    { label: 'Critical Threats', value: criticalVulns, icon: Zap, color: 'text-red-400', border: 'border-red-500/20' },
    { label: 'High Risks', value: highVulns, icon: Search, color: 'text-orange-400', border: 'border-orange-500/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-card p-6 rounded-2xl border-l-4 ${stat.border.replace('border-', 'border-l-')} group hover:scale-[1.02] transition-transform duration-300`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white font-mono tracking-tighter">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-slate-800/50 ${stat.color} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" />
              Real-time Monitoring
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center">
              <PieChartIcon className="w-6 h-6 mr-3 text-cyan-400" />
              Security Posture
            </h3>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">Distribution</span>
          </div>
          <div className="h-72 w-full">
            {vulnData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={vulnData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {vulnData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-slate-700 rounded-2xl">
                <p className="text-slate-500 font-mono text-sm italic">Scan protocol required for telemetry...</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center">
              <BarChart2 className="w-6 h-6 mr-3 text-indigo-400" />
              Vulnerability Trends
            </h3>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">Recent Metrics</span>
          </div>
          <div className="h-72 w-full">
            {recentScansData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={recentScansData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Legend />
                  <Bar dataKey="Critical" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="High" stackId="a" fill="#f97316" />
                  <Bar dataKey="Medium" stackId="a" fill="#eab308" />
                  <Bar dataKey="Low" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-slate-700 rounded-2xl">
                <p className="text-slate-500 font-mono text-sm italic">Awaiting manual scan execution...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardOverview;
