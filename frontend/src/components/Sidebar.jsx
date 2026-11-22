import React from 'react';
import { 
  Download, 
  Layers, 
  Activity, 
  Cpu, 
  Play, 
  Pause, 
  ShieldCheck,
  HardDrive
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'downloads', label: 'Download Streams', icon: Download, badge: '2 Active' },
    { id: 'chunks', label: 'Chunk Byte Inspector', icon: Layers, badge: 'Loom' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand */}
        <div className="h-16 px-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold shadow-inner">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
              ChunkDownloader
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Java 21
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Virtual Threads & Loom</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 px-3 py-2 uppercase tracking-wider">
            Engine Core
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    isActive ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Loom Status Box */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 m-3 rounded-xl border">
        <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span>Project Loom Virtual Threads</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Lightweight fibers handling non-blocking HTTP Range chunk multiplexing & stream stitching.
        </p>
        <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>Stitch Verification</span>
          <span className="text-emerald-400 font-bold">SHA-256</span>
        </div>
      </div>
    </aside>
  );
}
