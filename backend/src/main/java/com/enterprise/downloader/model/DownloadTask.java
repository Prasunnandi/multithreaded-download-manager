package com.enterprise.downloader.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadTask {
    private String id;
    private String filename;
    private String sourceUrl;
    private double sizeMb;
    private int allocatedThreads;
    private double throughputMbps;
    private int latencyMs;
    private double progressPct;
    private String status; // DOWNLOADING, COMPLETED, PAUSED, QUEUED
    private boolean pauseSupported;
    private String sha256;
    private LocalDateTime startedAt;
    private List<DownloadChunk> chunks;
}
