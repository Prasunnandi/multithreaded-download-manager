<div align="center">

# Multi-Threaded Chunk Downloader — Java 21 Virtual Threads & Loom

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Java 21](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Project Loom](https://img.shields.io/badge/Concurrency-Virtual_Threads-0284c7)](https://openjdk.org/projects/loom/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.0-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com)

**High-performance concurrent chunk downloader built on Java 21 Project Loom virtual threads, HTTP byte-range slicing, pause/resume state management, and deterministic SHA-256 buffer stitching.**

[Architecture](#system-architecture) • [Live Dashboard](#live-dashboard-preview) • [Benchmark Data](#benchmark-dataset) • [API Reference](#rest-api-documentation) • [Quickstart](#quickstart-guide)

</div>

---

## Live Dashboard Preview

<div align="center">
  <img src="docs/screenshots/dashboard.png" alt="Multi-Threaded Download Manager Dashboard" width="100%" />
</div>

---

## Core Capabilities

- **Java 21 Virtual Threads (Project Loom):** Massively concurrent lightweight user-mode fibers (`Executors.newVirtualThreadPerTaskExecutor()`) eliminating thread pooling bottlenecks during high-latency network I/O.
- **HTTP Range Slicing:** Dynamic byte-range chunk calculation (`Range: bytes=start-end`) fetching non-overlapping partitions in parallel across multiple sockets.
- **Resilient Pause & Resume:** State-preserving byte-level checkpointing allowing seamless resumption without re-downloading previously completed chunk segments.
- **Zero-Copy Direct ByteBuffer Assembly:** Sequential file stitching with deterministic byte offset ordering and real-time streaming SHA-256 integrity validation.
- **Dynamic Bandwidth Regulation:** Thread worker pool allocation (4 to 32 fibers per task) adapting to connection latency and server rate limits.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend Interface (React + Vite)"]
        Dashboard["Telemetry Dashboard & Speed Gauges"]
        Inspector["Byte-Range Chunk Inspector"]
    end

    subgraph Core ["Java 21 Download Engine"]
        TaskCoordinator["Download Task Coordinator"]
        RangeCalculator["HTTP Range Boundary Slicer"]
        VirtualThreadPool["Project Loom Virtual Threads Pool"]
    end

    subgraph Network ["Remote Target Servers"]
        HttpServer["HTTP 1.1 / HTTP 2 CDN Endpoints"]
    end

    subgraph Assembly ["Assembly & Storage"]
        ChunkStitcher["Zero-Copy ByteBuffer Stitcher"]
        Sha256Validator["Cryptographic Checksum Validator"]
        DiskFile[("Persistent Local Disk Storage")]
    end

    Dashboard --> TaskCoordinator
    TaskCoordinator --> RangeCalculator
    RangeCalculator --> VirtualThreadPool
    VirtualThreadPool -->|Range: bytes=X-Y| HttpServer
    HttpServer -->|Byte Streams| VirtualThreadPool
    VirtualThreadPool --> ChunkStitcher
    ChunkStitcher --> Sha256Validator
    Sha256Validator --> DiskFile
    ChunkStitcher -->|Telemetry Events| Dashboard
```

---

## Benchmark Dataset

Standard enterprise network transfer benchmarks in [`data/kaggle_multithreaded_downloads_benchmark.csv`](data/kaggle_multithreaded_downloads_benchmark.csv):

| Task ID | Filename | Size | Threads | Speed | Status | Checksum Verified |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DL-101` | ubuntu-24.04-desktop-amd64.iso | 5,920 MB | 16 | 184.5 MB/s | `COMPLETED` | Verified |
| `DL-102` | llama-3-8b-instruct.Q4_K_M.gguf | 4,920 MB | 8 | 142.8 MB/s | `DOWNLOADING` | Streaming |
| `DL-103` | kaggle_financial_transactions_10m.parquet | 1,850 MB | 4 | 0.0 MB/s | `PAUSED` | Checkpointed |
| `DL-104` | cuda_12.4.1_windows_installer.exe | 3,150 MB | 6 | 115.0 MB/s | `DOWNLOADING` | Streaming |

---

## REST API Documentation

### 1. Initiate Parallel Download Stream
```http
POST /api/v1/downloader/tasks
Content-Type: application/json

{
  "url": "https://storage.googleapis.com/ai-weights/qwen-2.5-7b-instruct.bin",
  "customFilename": "qwen-2.5-7b-instruct.bin",
  "threadCount": 12
}
```

### 2. Pause / Resume Download
```http
POST /api/v1/downloader/tasks/:id/toggle-pause
```

### 3. Retrieve Telemetry & Chunks
```http
GET /api/v1/downloader/tasks
```

---

## Quickstart Guide

### Prerequisites
- Java 21 JDK (with Preview or LTS flags)
- Maven 3.9+
- Node.js 18+ or Docker & Docker Compose

### Running Locally

```bash
# Clone repository
git clone https://github.com/Prasunnandi/multithreaded-download-manager.git
cd multithreaded-download-manager

# Start Java 21 Backend
cd backend
mvn spring-boot:run &

# Start React Frontend
cd ../frontend
npm install
npm run dev
```

### Running with Docker Compose

```bash
docker-compose up --build
```
Navigate to `http://localhost:3000` to access the multi-threaded download dashboard.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
