package com.enterprise.downloader.controller;

import com.enterprise.downloader.model.DownloadTask;
import com.enterprise.downloader.model.NewDownloadRequest;
import com.enterprise.downloader.service.DownloadManagerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/downloader")
@CrossOrigin(origins = "*")
public class DownloadController {

    private final DownloadManagerService downloadService;

    public DownloadController(DownloadManagerService downloadService) {
        this.downloadService = downloadService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "service", "Java 21 Multi-Threaded Chunk Downloader",
                "virtualThreads", "Project Loom Enabled",
                "framework", "Spring Boot 3.3.0"
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(downloadService.getTelemetryStats());
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<DownloadTask>> getTasks() {
        return ResponseEntity.ok(downloadService.getAllTasks());
    }

    @PostMapping("/tasks")
    public ResponseEntity<DownloadTask> createDownload(@RequestBody NewDownloadRequest request) {
        return ResponseEntity.ok(downloadService.createNewDownload(request));
    }

    @PostMapping("/tasks/{id}/toggle-pause")
    public ResponseEntity<DownloadTask> togglePause(@PathVariable String id) {
        return ResponseEntity.ok(downloadService.togglePauseResume(id));
    }
}
