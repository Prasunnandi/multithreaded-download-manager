import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * State Machine Enums for Download Transfer Lifecycle
 */
export const DOWNLOAD_STATUS = {
  IDLE: 'IDLE',
  PLANNING: 'PLANNING',
  DOWNLOADING: 'DOWNLOADING',
  PAUSED: 'PAUSED',
  VERIFYING: 'VERIFYING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  ABORTED: 'ABORTED'
};

export const CHUNK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

/**
 * Persistent Chunk State Machine & Transfer Store
 * Persists granular byte-range offsets, per-chunk completion flags, and SHA-256 hashes
 * enabling zero-loss pause, resume, and crash recovery.
 */
export class DownloadStateStore {
  /**
   * @param {Object} [options]
   * @param {string} [options.stateDir] - Directory where .state.json metadata files are stored
   * @param {boolean} [options.autoPersist=true]
   */
  constructor(options = {}) {
    this.stateDir = options.stateDir || path.resolve(process.cwd(), '.download_states');
    this.autoPersist = options.autoPersist ?? true;
    this.state = null;

    if (this.autoPersist && !fs.existsSync(this.stateDir)) {
      try {
        fs.mkdirSync(this.stateDir, { recursive: true });
      } catch (_) {
        // ignore if exists
      }
    }
  }

  /**
   * Initialize a new state machine for a multi-threaded file download
   * @param {Object} params
   * @param {string} params.url
   * @param {string} params.destinationPath
   * @param {number} params.totalBytes
   * @param {Array<Object>} params.plannedChunks - Planned byte intervals from ChunkDownloader
   * @param {string} [params.expectedSha256]
   * @returns {Object} Initialized state machine data
   */
  initDownload(params) {
    const {
      url,
      destinationPath,
      totalBytes,
      plannedChunks = [],
      expectedSha256 = null,
      concurrency = plannedChunks.length || 8
    } = params;

    if (!url || !destinationPath || totalBytes <= 0) {
      throw new Error('Invalid download parameters: url, destinationPath, and totalBytes > 0 required.');
    }

    const downloadId = crypto.randomUUID();
    const now = Date.now();

    const chunks = plannedChunks.map((pc, idx) => ({
      chunkIndex: pc.chunkIndex !== undefined ? pc.chunkIndex : idx,
      startByte: pc.startByte ?? pc.start,
      endByte: pc.endByte ?? pc.end,
      totalBytes: (pc.endByte ?? pc.end) - (pc.startByte ?? pc.start) + 1,
      downloadedBytes: 0,
      status: CHUNK_STATUS.PENDING,
      sha256: null,
      attempts: 0,
      lastError: null
    }));

    this.state = {
      downloadId,
      url,
      destinationPath,
      totalBytes,
      downloadedBytes: 0,
      expectedSha256,
      concurrency,
      status: DOWNLOAD_STATUS.PLANNING,
      createdAt: now,
      lastUpdatedAt: now,
      startedAt: null,
      completedAt: null,
      chunks
    };

    if (this.autoPersist) {
      this.persist();
    }

    return this.getState();
  }

  /**
   * Update chunk progress and recalculate aggregate speed/percentages
   */
  updateChunkProgress(chunkIndex, bytesDownloadedDelta, isComplete = false, chunkSha256 = null) {
    if (!this.state) throw new Error('No download state initialized');

    const chunk = this.state.chunks.find((c) => c.chunkIndex === chunkIndex);
    if (!chunk) throw new Error(`Chunk ${chunkIndex} not found in state.`);

    chunk.downloadedBytes = Math.min(chunk.totalBytes, chunk.downloadedBytes + bytesDownloadedDelta);
    chunk.status = isComplete ? CHUNK_STATUS.COMPLETED : CHUNK_STATUS.IN_PROGRESS;
    if (chunkSha256) chunk.sha256 = chunkSha256;

    // Recalculate global progress
    this.state.downloadedBytes = this.state.chunks.reduce((sum, c) => sum + c.downloadedBytes, 0);
    this.state.lastUpdatedAt = Date.now();

    if (this.state.status === DOWNLOAD_STATUS.PLANNING) {
      this.state.status = DOWNLOAD_STATUS.DOWNLOADING;
      this.state.startedAt = this.state.startedAt || Date.now();
    }

    const allComplete = this.state.chunks.every((c) => c.status === CHUNK_STATUS.COMPLETED);
    if (allComplete) {
      this.state.status = DOWNLOAD_STATUS.COMPLETED;
      this.state.completedAt = Date.now();
    }

    if (this.autoPersist) {
      this.persist();
    }

    return this.getState();
  }

  /**
   * Transition state to PAUSED
   */
  pause() {
    if (!this.state) throw new Error('No download state initialized');
    if (this.state.status === DOWNLOAD_STATUS.COMPLETED) {
      return this.getState();
    }

    this.state.status = DOWNLOAD_STATUS.PAUSED;
    this.state.chunks.forEach((c) => {
      if (c.status === CHUNK_STATUS.IN_PROGRESS) {
        c.status = CHUNK_STATUS.PAUSED;
      }
    });
    this.state.lastUpdatedAt = Date.now();

    if (this.autoPersist) {
      this.persist();
    }

    return this.getState();
  }

  /**
   * Transition state from PAUSED to DOWNLOADING, returning resume specifications
   * for incomplete chunks
   */
  resume() {
    if (!this.state) throw new Error('No download state initialized');
    if (this.state.status === DOWNLOAD_STATUS.COMPLETED) {
      return { state: this.getState(), resumePlan: [] };
    }

    this.state.status = DOWNLOAD_STATUS.DOWNLOADING;
    this.state.lastUpdatedAt = Date.now();

    const resumePlan = [];

    this.state.chunks.forEach((c) => {
      if (c.status !== CHUNK_STATUS.COMPLETED) {
        // Compute resume byte boundary
        const currentResumeByte = c.startByte + c.downloadedBytes;
        c.status = CHUNK_STATUS.IN_PROGRESS;
        resumePlan.push({
          chunkIndex: c.chunkIndex,
          resumeStartByte: currentResumeByte,
          endByte: c.endByte,
          remainingBytes: c.endByte - currentResumeByte + 1,
          rangeHeader: `bytes=${currentResumeByte}-${c.endByte}`
        });
      }
    });

    if (this.autoPersist) {
      this.persist();
    }

    return {
      state: this.getState(),
      resumePlan
    };
  }

  /**
   * Persist current state to disk atomically using temporary file rename
   */
  persist(filePath = null) {
    if (!this.state) return;
    const targetPath = filePath || this.getStateFilePath(this.state.downloadId);
    const tempPath = `${targetPath}.tmp.${Date.now()}`;

    try {
      const serialized = JSON.stringify(this.state, null, 2);
      fs.writeFileSync(tempPath, serialized, 'utf8');
      fs.renameSync(tempPath, targetPath);
    } catch (e) {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch (_) {}
      throw e;
    }
  }

  /**
   * Load existing state from disk
   */
  loadState(filePathOrId) {
    let targetPath = filePathOrId;
    if (!fs.existsSync(targetPath)) {
      targetPath = this.getStateFilePath(filePathOrId);
    }

    if (!fs.existsSync(targetPath)) {
      throw new Error(`State file not found at: ${targetPath}`);
    }

    const raw = fs.readFileSync(targetPath, 'utf8');
    this.state = JSON.parse(raw);
    return this.getState();
  }

  /**
   * Resolve default state file path on disk
   */
  getStateFilePath(downloadId) {
    return path.join(this.stateDir, `${downloadId}.state.json`);
  }

  /**
   * Get active state snapshot with computed progress metrics
   */
  getState() {
    if (!this.state) return null;
    const progressPct =
      this.state.totalBytes > 0
        ? Number(((this.state.downloadedBytes / this.state.totalBytes) * 100).toFixed(1))
        : 0;

    const completedChunks = this.state.chunks.filter((c) => c.status === CHUNK_STATUS.COMPLETED).length;

    return {
      ...this.state,
      progressPct,
      completedChunks,
      totalChunks: this.state.chunks.length,
      isFinished: this.state.status === DOWNLOAD_STATUS.COMPLETED
    };
  }
}

// Dual ESM & CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DOWNLOAD_STATUS,
    CHUNK_STATUS,
    DownloadStateStore
  };
}

export default DownloadStateStore;
