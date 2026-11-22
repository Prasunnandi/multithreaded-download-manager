package com.enterprise.downloader.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewDownloadRequest {
    private String url;
    private String customFilename;
    private int threadCount;
}
