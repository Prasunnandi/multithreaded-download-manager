import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Cpu, 
  Search, 
  CheckCircle, 
  Activity, 
  ShieldCheck, 
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { fetchTasks } from '../services/api';

export default function ChunkInspectorView() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('DL-102');

  useEffect(() => {
    fetchTasks().then(data => {
      setTasks(data);
      if (data.length > 0 && !data.find(t => t.id === selectedTaskId)) {
        setSelectedTaskId(data[0].id);
      }
    });
  }, []);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            HTTP Byte-Range Chunk Inspector & Memory Slices
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inspection of active Virtual Threads, byte boundaries, and deterministic SHA-256 buffer assembly.
          </p>
        </div>

        {/* Task Selector Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          {tasks.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTaskId(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                selectedTaskId === t.id 
                  ? 'bg-sky-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.id} ({t.status})
            </button>
          ))}
        </div>
      </div>

      {selectedTask && (
        <>
          {/* Task Info Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                  {selectedTask.filename}
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap gap-3">
                  <span>Size: {selectedTask.sizeMb} MB</span>
                  <span>•</span>
                  <span>Threads: {selectedTask.allocatedThreads} Virtual Fibers</span>
                  <span>•</span>
                  <span>Status: <strong className="text-sky-400">{selectedTask.status}</strong></span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-mono">Target Checksum</div>
                <div className="font-mono text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {selectedTask.sha256}
                </div>
              </div>
            </div>
          </div>

          {/* Chunks Grid / Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase font-mono">
                Concurrent Byte Range Slices ({selectedTask.chunks?.length || selectedTask.allocatedThreads} Segments)
              </span>
              <span className="text-[11px] font-mono text-sky-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" /> Java 21 Loom Virtual Carrier Threads
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Chunk Index</th>
                    <th className="py-3 px-4">HTTP Range Header</th>
                    <th className="py-3 px-4">Bytes Ingested</th>
                    <th className="py-3 px-4">Fiber Speed</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Fiber Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedTask.chunks && selectedTask.chunks.length > 0 ? (
                    selectedTask.chunks.map((c) => {
                      const isComplete = c.status === 'COMPLETED';

                      return (
                        <tr key={c.chunkIndex} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-bold text-white">
                            Chunk #{c.chunkIndex}
                          </td>

                          <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                            Range: bytes={c.byteStart.toLocaleString()}-{c.byteEnd.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-slate-300">
                            {(c.downloadedBytes / (1024 * 1024)).toFixed(1)} / {(c.totalBytes / (1024 * 1024)).toFixed(1)} MB
                          </td>

                          <td className="py-3.5 px-4 text-sky-400 font-bold">
                            {c.speedMbps > 0 ? `${c.speedMbps.toFixed(1)} MB/s` : '0.0 MB/s'}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-sky-500'}`}
                                  style={{ width: `${c.progressPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-300">{c.progressPct.toFixed(0)}%</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isComplete 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 font-sans">
                        Task completed or awaiting slice initialization.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
