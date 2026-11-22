import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Layers, 
  Cpu, 
  Wifi, 
  Plus, 
  HardDrive,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { fetchTasks, toggleTaskPause, createDownload } from '../services/api';

export default function DownloadsDashboard({ onTaskUpdate }) {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState('https://storage.googleapis.com/ai-weights/qwen-2.5-7b-instruct.bin');
  const [customFilename, setCustomFilename] = useState('qwen-2.5-7b-instruct.bin');
  const [threadCount, setThreadCount] = useState(12);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    const data = await fetchTasks();
    setTasks(data);
  };

  const handleToggle = async (taskId) => {
    await toggleTaskPause(taskId);
    await loadTasks();
    if (onTaskUpdate) onTaskUpdate();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createDownload({ url, customFilename, threadCount: parseInt(threadCount) });
      setIsModalOpen(false);
      await loadTasks();
      if (onTaskUpdate) onTaskUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalSpeed = tasks
    .filter(t => t.status === 'DOWNLOADING')
    .reduce((sum, t) => sum + t.throughputMbps, 0);

  const activeThreads = tasks
    .filter(t => t.status === 'DOWNLOADING')
    .reduce((sum, t) => sum + t.allocatedThreads, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Aggregated Throughput</span>
            <span className="p-2 bg-sky-500/10 text-sky-400 rounded-lg"><Wifi className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {totalSpeed.toFixed(1)} <span className="text-sm font-normal text-slate-400">MB/s</span>
          </div>
          <div className="text-[11px] text-sky-400 mt-1 flex items-center gap-1">
            <span>● Dynamic Sockets Active</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Virtual Threads (Loom)</span>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Cpu className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {activeThreads} <span className="text-sm font-normal text-slate-400">Fibers</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Lightweight JVM Concurrency</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Downloaded</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><HardDrive className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            18.2 <span className="text-sm font-normal text-slate-400">GB</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Zero-Copy Direct ByteBuffer</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Checksum Verification</span>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><ShieldCheck className="w-4 h-4" /></span>
          </div>
          <div className="text-xl font-bold text-white mt-2 font-mono">SHA-256 Stream</div>
          <div className="text-[11px] text-purple-400 mt-1">Deterministic Chunk Stitching</div>
        </div>
      </div>

      {/* Main Downloads Stream Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-sky-400" />
              Concurrent Download Tasks & Chunk Multiplexing
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Files are split into HTTP byte-range slices and fetched simultaneously across Java 21 Virtual Threads.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadTasks}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              title="Refresh Tasks"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Download Stream
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-800/70">
          {tasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isPaused = task.status === 'PAUSED';
            const isDownloading = task.status === 'DOWNLOADING';

            return (
              <div key={task.id} className="p-5 hover:bg-slate-800/30 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white text-sm">{task.filename}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {task.id}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                        isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        isPaused ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                      <span className="truncate max-w-md">{task.sourceUrl}</span>
                      <span>•</span>
                      <span>{task.sizeMb} MB</span>
                      <span>•</span>
                      <span>{task.allocatedThreads} Virtual Threads</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {isDownloading && (
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-mono">Transfer Speed</div>
                        <div className="text-sm font-bold text-sky-400 font-mono">
                          {task.throughputMbps} MB/s
                        </div>
                      </div>
                    )}

                    {!isCompleted && (
                      <button
                        onClick={() => handleToggle(task.id)}
                        className={`p-2 rounded-lg border text-xs transition flex items-center gap-1.5 ${
                          isDownloading 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' 
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
                        }`}
                      >
                        {isDownloading ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isDownloading ? 'Pause' : 'Resume'}</span>
                      </button>
                    )}

                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <CheckCircle className="w-4 h-4" /> Verified Stitched
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Slices */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Progress: {task.progressPct.toFixed(1)}%</span>
                    <span>SHA-256: {task.sha256.slice(0, 16)}...</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${task.progressPct}%` }}
                    />
                  </div>

                  {/* Multi-chunk mini visualization if available */}
                  {task.chunks && task.chunks.length > 0 && (
                    <div className="pt-1 flex items-center gap-1 overflow-x-auto">
                      {task.chunks.map((c) => (
                        <div 
                          key={c.chunkIndex} 
                          title={`Chunk #${c.chunkIndex}: ${c.progressPct}% (${c.status})`}
                          className={`h-1.5 flex-1 rounded-sm ${
                            c.status === 'COMPLETED' ? 'bg-emerald-500/80' :
                            c.status === 'DOWNLOADING' ? 'bg-sky-400 animate-pulse' :
                            'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Download Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Multi-Threaded Download</h3>
                  <p className="text-xs text-slate-400">HTTP Byte-Range Slicing & Loom Fibers</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Source URL (HTTP Range Capable)</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Filename</label>
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Concurrent Virtual Threads (Fibers)</label>
                <select
                  value={threadCount}
                  onChange={(e) => setThreadCount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="4">4 Threads (Standard Bandwidth)</option>
                  <option value="8">8 Threads (High Performance)</option>
                  <option value="12">12 Threads (Gigabit Fiber)</option>
                  <option value="16">16 Threads (Multi-Gigabit Aggregation)</option>
                  <option value="32">32 Threads (Extreme Parallelism)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Java 21 Virtual Threads Runtime:</p>
                <p className="text-[11px]">
                  Fibers are scheduled cooperatively on carrier threads. Non-blocking network I/O achieves max saturation without thread exhaustion.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  {loading ? 'Initializing Range Slices...' : 'Spawn Download Stream'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
