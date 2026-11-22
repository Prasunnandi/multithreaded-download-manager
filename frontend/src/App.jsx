import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DownloadsDashboard from './pages/DownloadsDashboard';
import ChunkInspectorView from './pages/ChunkInspectorView';
import { fetchStats } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('downloads');
  const [stats, setStats] = useState({
    totalActiveTasks: 2,
    totalThroughputMbps: 257.8,
    activeVirtualThreads: 14,
    totalDownloadedGb: 5.9,
    engineModel: "Java 21 Project Loom (Virtual Threads)"
  });

  const refreshStats = () => {
    fetchStats().then(data => {
      if (data) setStats(data);
    });
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar stats={stats} />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'downloads' && (
            <DownloadsDashboard onTaskUpdate={refreshStats} />
          )}
          {activeTab === 'chunks' && (
            <ChunkInspectorView />
          )}
        </main>
      </div>
    </div>
  );
}
