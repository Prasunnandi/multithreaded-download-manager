// Multi-Threaded Download Manager API Service

const API_BASE = 'http://localhost:8087';

export const fallbackTasks = [
  {
    id: "DL-102",
    filename: "llama-3-8b-instruct.Q4_K_M.gguf",
    sourceUrl: "https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/llama-3-8b-instruct.Q4_K_M.gguf",
    sizeMb: 4920.5,
    allocatedThreads: 8,
    throughputMbps: 142.8,
    latencyMs: 18,
    progressPct: 72.4,
    status: "DOWNLOADING",
    pauseSupported: true,
    sha256: "bf5258f3be7d5bb2f01f4ab98064bf63d04d16ff1a31d0d970344d9354784407",
    chunks: [
      { chunkIndex: 1, byteStart: 0, byteEnd: 644933632, downloadedBytes: 644933632, totalBytes: 644933632, speedMbps: 0.0, progressPct: 100.0, status: "COMPLETED" },
      { chunkIndex: 2, byteStart: 644933633, byteEnd: 1289867264, downloadedBytes: 644933632, totalBytes: 644933632, speedMbps: 0.0, progressPct: 100.0, status: "COMPLETED" },
      { chunkIndex: 3, byteStart: 1289867265, byteEnd: 1934800896, downloadedBytes: 580430268, totalBytes: 644933632, speedMbps: 24.5, progressPct: 90.0, status: "DOWNLOADING" },
      { chunkIndex: 4, byteStart: 1934800897, byteEnd: 2579734528, downloadedBytes: 515946905, totalBytes: 644933632, speedMbps: 22.1, progressPct: 80.0, status: "DOWNLOADING" },
      { chunkIndex: 5, byteStart: 2579734529, byteEnd: 3224668160, downloadedBytes: 451453542, totalBytes: 644933632, speedMbps: 21.0, progressPct: 70.0, status: "DOWNLOADING" },
      { chunkIndex: 6, byteStart: 3224668161, byteEnd: 3869601792, downloadedBytes: 386960179, totalBytes: 644933632, speedMbps: 19.8, progressPct: 60.0, status: "DOWNLOADING" },
      { chunkIndex: 7, byteStart: 3869601793, byteEnd: 4514535424, downloadedBytes: 322466816, totalBytes: 644933632, speedMbps: 18.2, progressPct: 50.0, status: "DOWNLOADING" },
      { chunkIndex: 8, byteStart: 4514535425, byteEnd: 5159469056, downloadedBytes: 257973452, totalBytes: 644933632, speedMbps: 17.5, progressPct: 40.0, status: "DOWNLOADING" }
    ]
  },
  {
    id: "DL-101",
    filename: "ubuntu-24.04-desktop-amd64.iso",
    sourceUrl: "https://releases.ubuntu.com/24.04/ubuntu-24.04-desktop-amd64.iso",
    sizeMb: 5920.0,
    allocatedThreads: 16,
    throughputMbps: 0.0,
    latencyMs: 14,
    progressPct: 100.0,
    status: "COMPLETED",
    pauseSupported: true,
    sha256: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    chunks: []
  },
  {
    id: "DL-103",
    filename: "kaggle_financial_transactions_10m.parquet",
    sourceUrl: "https://storage.googleapis.com/kaggle-benchmarks/financial_transactions_10m.parquet",
    sizeMb: 1850.0,
    allocatedThreads: 4,
    throughputMbps: 0.0,
    latencyMs: 22,
    progressPct: 45.0,
    status: "PAUSED",
    pauseSupported: true,
    sha256: "7d793037a0760186574b0282f2f435e7b1e7a667da4725c01ec53c574b635f9b",
    chunks: []
  },
  {
    id: "DL-104",
    filename: "cuda_12.4.1_windows_installer.exe",
    sourceUrl: "https://developer.download.nvidia.com/compute/cuda/12.4.1/local_installers/cuda_12.4.1_windows_installer.exe",
    sizeMb: 3150.0,
    allocatedThreads: 6,
    throughputMbps: 115.0,
    latencyMs: 16,
    progressPct: 88.5,
    status: "DOWNLOADING",
    pauseSupported: true,
    sha256: "2c6ee3d3fb490a618e99497e2f5b357ffba766c61f224b17adbd3571d2b8612f",
    chunks: []
  }
];

export async function fetchTasks() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/downloader/tasks`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    return fallbackTasks;
  }
}

export async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/downloader/stats`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    return {
      totalActiveTasks: 2,
      totalThroughputMbps: 257.8,
      activeVirtualThreads: 14,
      totalDownloadedGb: 5.9,
      engineModel: "Java 21 Project Loom (Virtual Threads)"
    };
  }
}

export async function toggleTaskPause(id) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/downloader/tasks/${id}/toggle-pause`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Toggle error');
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function createDownload(downloadData) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/downloader/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(downloadData)
    });
    if (!res.ok) throw new Error('Create error');
    return await res.json();
  } catch (e) {
    return {
      id: `DL-${Math.floor(200 + Math.random() * 800)}`,
      filename: downloadData.customFilename || 'downloaded_asset.bin',
      sourceUrl: downloadData.url,
      sizeMb: 1200.0,
      allocatedThreads: downloadData.threadCount || 8,
      throughputMbps: 95.0,
      latencyMs: 16,
      progressPct: 5.0,
      status: "DOWNLOADING",
      pauseSupported: true,
      sha256: "7d793037a0760186574b0282f2f435e7b1e7a667da4725c01ec53c574b635f9b",
      chunks: []
    };
  }
}
