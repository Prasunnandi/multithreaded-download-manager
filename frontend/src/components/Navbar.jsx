import React from 'react';
import { Activity, Cpu, Search, HardDrive, Wifi } from 'lucide-react';

export default function Navbar({ stats }) {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search downloads, target URIs, chunk hashes..."
            className="w-80 bg-slate-800/80 border border-slate-700/60 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-sky-400 bg-sky-950/40 px-3 py-1.5 rounded border border-sky-500/30">
          <Wifi className="w-3.5 h-3.5 text-sky-400" />
          <span>Total Bandwidth: {stats?.totalThroughputMbps || 257.8} MB/s</span>
        </div>
      </div>

      <div className="flex items-center space-x-5">
        <div className="text-right">
          <div className="text-[11px] text-slate-400 font-mono">Virtual Threads Active</div>
          <div className="text-sm font-bold text-sky-400 font-mono">
            {stats?.activeVirtualThreads || 14} Fibers <span className="text-slate-500 font-normal">/ {stats?.totalActiveTasks || 2} Streams</span>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-slate-800"></div>

        <div className="flex items-center space-x-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-xs font-bold text-sky-300">
            DL
          </div>
          <div className="text-left text-xs">
            <div className="font-semibold text-slate-200">System Operator</div>
            <div className="text-[10px] text-slate-400">Concurrency Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
}
