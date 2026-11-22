package com.enterprise.downloader.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadChunk {
    private int chunkIndex;
    private long byteStart;
    private long byteEnd;
    private long downloadedBytes;
    private long totalBytes;
    private double speedMbps;
    private double progressPct;
    private String status; // DOWNLOADING, COMPLETED, PAUSED, QUEUED
}
