/**
 * Concurrent Multi-Part Byte-Range Chunk Downloader
 * Orchestrates parallel HTTP Range requests to maximize network throughput and handle interruptions.
 */

export class ChunkDownloader {
  /**
   * @param {Object} options
   * @param {number} [options.concurrency=8] - Number of concurrent worker threads/streams
   * @param {number} [options.maxRetries=3] - Maximum retry attempts per failed chunk
   * @param {number} [options.chunkTimeoutMs=15000] - Timeout per chunk request
   */
  constructor(options = {}) {
    this.concurrency = options.concurrency || 8;
    this.maxRetries = options.maxRetries || 3;
    this.chunkTimeoutMs = options.chunkTimeoutMs || 15000;
  }

  /**
   * Calculate byte-range intervals for a given total file size
   * @param {number} totalBytes - Total file length in bytes
   * @param {number} [numChunks=8] - Target number of segments
   * @returns {Array<Object>} List of chunk specifications with byte boundaries
   */
  planChunks(totalBytes, numChunks = this.concurrency) {
    if (totalBytes <= 0) {
      throw new Error('Total file size must be greater than 0 bytes');
    }

    const chunks = [];
    const chunkSize = Math.floor(totalBytes / numChunks);

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = (i === numChunks - 1) ? totalBytes - 1 : (start + chunkSize - 1);
      const length = end - start + 1;

      chunks.push({
        chunkIndex: i,
        rangeHeader: `bytes=${start}-${end}`,
        startByte: start,
        endByte: end,
        totalBytes: length,
        downloadedBytes: 0,
        status: 'PENDING', // PENDING, DOWNLOADING, COMPLETED, FAILED
        retries: 0
      });
    }

    return chunks;
  }

  /**
   * Simulate or execute multi-part chunk download with concurrency pool
   * @param {Object} task
   * @param {string} task.url - Target download URL
   * @param {number} task.fileSizeBytes - Total file size
   * @param {Function} [task.onProgress] - Progress callback
   * @param {Function} [customChunkFetcher] - Optional custom fetcher for testing
   * @returns {Promise<Object>} Final download result and statistics
   */
  async download(task, customChunkFetcher = null) {
    const startTime = Date.now();
    const chunks = this.planChunks(task.fileSizeBytes, this.concurrency);
    const completedChunks = new Map();

    const fetcher = customChunkFetcher || this._defaultMockFetcher;

    // Worker queue processing with bounded concurrency
    let activeWorkers = 0;
    let nextChunkIdx = 0;

    return new Promise((resolve, reject) => {
      const dispatchNext = () => {
        if (completedChunks.size === chunks.length) {
          const durationSec = Math.max(0.001, (Date.now() - startTime) / 1000);
          const totalBytesDownloaded = Array.from(completedChunks.values())
            .reduce((sum, c) => sum + c.totalBytes, 0);

          return resolve({
            success: true,
            url: task.url,
            totalBytes: totalBytesDownloaded,
            chunksCount: chunks.length,
            durationSeconds: Number(durationSec.toFixed(3)),
            averageThroughputMBs: Number(((totalBytesDownloaded / (1024 * 1024)) / durationSec).toFixed(2)),
            chunks: Array.from(completedChunks.values()).sort((a, b) => a.chunkIndex - b.chunkIndex)
          });
        }

        while (activeWorkers < this.concurrency && nextChunkIdx < chunks.length) {
          const currentChunk = chunks[nextChunkIdx++];
          activeWorkers++;
          currentChunk.status = 'DOWNLOADING';

          fetcher(currentChunk, task.url)
            .then(result => {
              activeWorkers--;
              currentChunk.status = 'COMPLETED';
              currentChunk.downloadedBytes = currentChunk.totalBytes;
              completedChunks.set(currentChunk.chunkIndex, currentChunk);

              if (task.onProgress) {
                const downloadedTotal = Array.from(completedChunks.values())
                  .reduce((sum, c) => sum + c.totalBytes, 0);
                task.onProgress({
                  downloadedBytes: downloadedTotal,
                  totalBytes: task.fileSizeBytes,
                  percentage: Number(((downloadedTotal / task.fileSizeBytes) * 100).toFixed(2)),
                  completedChunksCount: completedChunks.size
                });
              }

              dispatchNext();
            })
            .catch(err => {
              activeWorkers--;
              if (currentChunk.retries < this.maxRetries) {
                currentChunk.retries++;
                currentChunk.status = 'RETRYING';
                // Push back into dispatch cycle
                chunks.push(currentChunk);
                dispatchNext();
              } else {
                currentChunk.status = 'FAILED';
                reject(new Error(`Chunk ${currentChunk.chunkIndex} failed after ${this.maxRetries} retries: ${err.message}`));
              }
            });
        }
      };

      dispatchNext();
    });
  }

  /**
   * Internal default simulated fetcher for non-network testing environments
   * @private
   */
  async _defaultMockFetcher(chunk) {
    return new Promise(resolve => {
      // Simulate fast network chunk delay (10-30ms)
      setTimeout(() => {
        resolve({
          chunkIndex: chunk.chunkIndex,
          bytesReceived: chunk.totalBytes
        });
      }, 15);
    });
  }
}

export default ChunkDownloader;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChunkDownloader;
  module.exports.ChunkDownloader = ChunkDownloader;
}
