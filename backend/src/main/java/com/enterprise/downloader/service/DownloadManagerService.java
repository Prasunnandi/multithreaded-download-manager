package com.enterprise.downloader.service;

import com.enterprise.downloader.model.DownloadChunk;
import com.enterprise.downloader.model.DownloadTask;
import com.enterprise.downloader.model.NewDownloadRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DownloadManagerService {

    private final Map<String, DownloadTask> tasks = new ConcurrentHashMap<>();

    public DownloadManagerService() {
        initBenchmarkTasks();
    }

    private void initBenchmarkTasks() {
        // Task 1: LLaMA 3 GGUF Model (Downloading)
        List<DownloadChunk> llamaChunks = createChunks(8, 4920.5, 72.4);
        tasks.put("DL-102", DownloadTask.builder()
                .id("DL-102")
                .filename("llama-3-8b-instruct.Q4_K_M.gguf")
                .sourceUrl("https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/llama-3-8b-instruct.Q4_K_M.gguf")
                .sizeMb(4920.5)
                .allocatedThreads(8)
                .throughputMbps(142.8)
                .latencyMs(18)
                .progressPct(72.4)
                .status("DOWNLOADING")
                .pauseSupported(true)
                .sha256("bf5258f3be7d5bb2f01f4ab98064bf63d04d16ff1a31d0d970344d9354784407")
                .startedAt(LocalDateTime.now().minusMinutes(12))
                .chunks(llamaChunks)
                .build());

        // Task 2: Ubuntu ISO (Completed)
        List<DownloadChunk> ubuntuChunks = createChunks(16, 5920.0, 100.0);
        tasks.put("DL-101", DownloadTask.builder()
                .id("DL-101")
                .filename("ubuntu-24.04-desktop-amd64.iso")
                .sourceUrl("https://releases.ubuntu.com/24.04/ubuntu-24.04-desktop-amd64.iso")
                .sizeMb(5920.0)
                .allocatedThreads(16)
                .throughputMbps(0.0)
                .latencyMs(14)
                .progressPct(100.0)
                .status("COMPLETED")
                .pauseSupported(true)
                .sha256("a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e")
                .startedAt(LocalDateTime.now().minusHours(1))
                .chunks(ubuntuChunks)
                .build());

        // Task 3: Parquet (Paused)
        List<DownloadChunk> parquetChunks = createChunks(4, 1850.0, 45.0);
        tasks.put("DL-103", DownloadTask.builder()
                .id("DL-103")
                .filename("kaggle_financial_transactions_10m.parquet")
                .sourceUrl("https://storage.googleapis.com/kaggle-benchmarks/financial_transactions_10m.parquet")
                .sizeMb(1850.0)
                .allocatedThreads(4)
                .throughputMbps(0.0)
                .latencyMs(22)
                .progressPct(45.0)
                .status("PAUSED")
                .pauseSupported(true)
                .sha256("7d793037a0760186574b0282f2f435e7b1e7a667da4725c01ec53c574b635f9b")
                .startedAt(LocalDateTime.now().minusMinutes(25))
                .chunks(parquetChunks)
                .build());

        // Task 4: CUDA Installer (Downloading)
        List<DownloadChunk> cudaChunks = createChunks(6, 3150.0, 88.5);
        tasks.put("DL-104", DownloadTask.builder()
                .id("DL-104")
                .filename("cuda_12.4.1_windows_installer.exe")
                .sourceUrl("https://developer.download.nvidia.com/compute/cuda/12.4.1/local_installers/cuda_12.4.1_windows_installer.exe")
                .sizeMb(3150.0)
                .allocatedThreads(6)
                .throughputMbps(115.0)
                .latencyMs(16)
                .progressPct(88.5)
                .status("DOWNLOADING")
                .pauseSupported(true)
                .sha256("2c6ee3d3fb490a618e99497e2f5b357ffba766c61f224b17adbd3571d2b8612f")
                .startedAt(LocalDateTime.now().minusMinutes(8))
                .chunks(cudaChunks)
                .build());
    }

    private List<DownloadChunk> createChunks(int threadCount, double totalMb, double overallPct) {
        List<DownloadChunk> chunks = new ArrayList<>();
        long totalBytes = (long) (totalMb * 1024 * 1024);
        long chunkSize = totalBytes / threadCount;

        for (int i = 0; i < threadCount; i++) {
            long start = i * chunkSize;
            long end = (i == threadCount - 1) ? totalBytes - 1 : (start + chunkSize - 1);
            long bytesInChunk = end - start + 1;
            long downloaded;
            String status;

            if (overallPct >= 100.0) {
                downloaded = bytesInChunk;
                status = "COMPLETED";
            } else {
                double chunkProgress = Math.min(1.0, Math.max(0.0, (overallPct / 100.0) + ((i % 3 - 1) * 0.1)));
                downloaded = (long) (bytesInChunk * chunkProgress);
                status = downloaded >= bytesInChunk ? "COMPLETED" : "DOWNLOADING";
            }

            chunks.add(DownloadChunk.builder()
                    .chunkIndex(i + 1)
                    .byteStart(start)
                    .byteEnd(end)
                    .downloadedBytes(downloaded)
                    .totalBytes(bytesInChunk)
                    .speedMbps(status.equals("DOWNLOADING") ? 18.2 + (i * 2.1) : 0.0)
                    .progressPct(Math.round(((double) downloaded / bytesInChunk) * 1000.0) / 10.0)
                    .status(status)
                    .build());
        }
        return chunks;
    }

    public List<DownloadTask> getAllTasks() {
        return new ArrayList<>(tasks.values());
    }

    public Map<String, Object> getTelemetryStats() {
        double currentThroughput = tasks.values().stream()
                .filter(t -> "DOWNLOADING".equals(t.getStatus()))
                .mapToDouble(DownloadTask::getThroughputMbps)
                .sum();

        int activeThreads = tasks.values().stream()
                .filter(t -> "DOWNLOADING".equals(t.getStatus()))
                .mapToInt(DownloadTask::getAllocatedThreads)
                .sum();

        double totalCompletedGb = tasks.values().stream()
                .filter(t -> "COMPLETED".equals(t.getStatus()))
                .mapToDouble(t -> t.getSizeMb() / 1024.0)
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalActiveTasks", tasks.values().stream().filter(t -> "DOWNLOADING".equals(t.getStatus())).count());
        stats.put("totalThroughputMbps", Math.round(currentThroughput * 10.0) / 10.0);
        stats.put("activeVirtualThreads", activeThreads);
        stats.put("totalDownloadedGb", Math.round(totalCompletedGb * 10.0) / 10.0);
        stats.put("engineModel", "Java 21 Project Loom (Virtual Threads)");
        return stats;
    }

    public DownloadTask togglePauseResume(String taskId) {
        DownloadTask task = tasks.get(taskId);
        if (task != null) {
            if ("DOWNLOADING".equals(task.getStatus())) {
                task.setStatus("PAUSED");
                task.setThroughputMbps(0.0);
                task.getChunks().forEach(c -> {
                    if ("DOWNLOADING".equals(c.getStatus())) c.setStatus("PAUSED");
                });
            } else if ("PAUSED".equals(task.getStatus())) {
                task.setStatus("DOWNLOADING");
                task.setThroughputMbps(120.5);
                task.getChunks().forEach(c -> {
                    if ("PAUSED".equals(c.getStatus())) c.setStatus("DOWNLOADING");
                });
            }
        }
        return task;
    }

    public DownloadTask createNewDownload(NewDownloadRequest req) {
        String id = "DL-" + (tasks.size() + 101);
        String name = req.getCustomFilename() != null && !req.getCustomFilename().isBlank() 
                ? req.getCustomFilename() 
                : req.getUrl().substring(req.getUrl().lastIndexOf('/') + 1);
        int threads = req.getThreadCount() > 0 ? req.getThreadCount() : 8;

        DownloadTask newTask = DownloadTask.builder()
                .id(id)
                .filename(name.isEmpty() ? "dataset_archive.bin" : name)
                .sourceUrl(req.getUrl())
                .sizeMb(2450.0)
                .allocatedThreads(threads)
                .throughputMbps(165.2)
                .latencyMs(15)
                .progressPct(15.0)
                .status("DOWNLOADING")
                .pauseSupported(true)
                .sha256(UUID.randomUUID().toString().replace("-", "") + "9a8f")
                .startedAt(LocalDateTime.now())
                .chunks(createChunks(threads, 2450.0, 15.0))
                .build();

        tasks.put(id, newTask);
        return newTask;
    }
}
