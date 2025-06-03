import * as fs from "fs";
import * as path from "path";
import type { Config } from "../config.js";
import { sanitizeFilename } from "../config.js";
import { 
  _spawnPromise, 
  validateUrl, 
  getFormattedTimestamp, 
  isYouTubeUrl
} from "./utils.js";

export async function downloadVideo(
  url: string,
  config: Config,
  resolution: "480p" | "720p" | "1080p" | "best" = "720p"
): Promise<string> {
  try {
    validateUrl(url);
    
    // Ensure downloads directory exists
    if (!fs.existsSync(config.file.downloadsDir)) {
      fs.mkdirSync(config.file.downloadsDir, { recursive: true });
    }
    
    const timestamp = getFormattedTimestamp();
    const outputTemplate = path.join(config.file.downloadsDir, `video_${timestamp}.%(ext)s`);
    
    // Simple format selection that actually works
    const formatMap = {
      "480p": "worst[height>=360]/best[height<=480]/worst",
      "720p": "best[height<=720]/best", 
      "1080p": "best[height<=1080]/best",
      "best": "best"
    };
    
    console.log(`Downloading ${url} to ${outputTemplate}`);
    
    const output = await _spawnPromise("yt-dlp", [
      "--verbose",
      "-f", formatMap[resolution],
      "-o", outputTemplate,
      "--no-mtime",
      url
    ]);
    
    console.log(`yt-dlp output: ${output}`);
    
    // Find the downloaded file
    const files = fs.readdirSync(config.file.downloadsDir);
    const downloadedFile = files.find(f => f.includes(`video_${timestamp}`));
    
    if (!downloadedFile) {
      // Try to find any new video file
      const videoFiles = files.filter(f => f.match(/\.(mp4|webm|mkv|avi)$/i));
      if (videoFiles.length === 0) {
        throw new Error(`No video file found after download. Files in directory: ${files.join(', ')}`);
      }
      const latestFile = videoFiles[videoFiles.length - 1];
      return `Video downloaded as "${latestFile}" to ${config.file.downloadsDir}`;
    }
    
    const filePath = path.join(config.file.downloadsDir, downloadedFile);
    const stats = fs.statSync(filePath);
    
    return `Video successfully downloaded as "${downloadedFile}" (${Math.round(stats.size / 1024 / 1024)}MB) to ${config.file.downloadsDir}`;
    
  } catch (error) {
    console.error(`Download failed: ${error}`);
    throw new Error(`Video download failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
