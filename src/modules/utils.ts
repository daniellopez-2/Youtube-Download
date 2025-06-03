import * as fs from 'fs';
import { spawn } from 'child_process';
import { randomBytes } from 'crypto';

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be');
  } catch {
    return false;
  }
}

export async function safeCleanup(directory: string): Promise<void> {
  try {
    await fs.promises.rm(directory, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error cleaning up directory ${directory}:`, error);
  }
}

export function _spawnPromise(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(output);
    });

    process.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error(output);
    });

    process.on('close', (code) => {
      const fullOutput = stdout + stderr;
      console.log(`Process exited with code: ${code}`);
      
      if (code === 0) {
        resolve(fullOutput);
      } else {
        reject(new Error(`Command failed with exit code ${code}:\n${fullOutput}`));
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Failed to start process: ${error.message}`));
    });
  });
}

export function getFormattedTimestamp(): string {
  return new Date().toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('.')[0];
}

export function generateRandomFilename(extension: string = 'mp4'): string {
  const timestamp = getFormattedTimestamp();
  const randomId = randomBytes(4).toString('hex');
  return `${timestamp}_${randomId}.${extension}`;
}

export function cleanSubtitleToTranscript(srtContent: string): string {
  return srtContent
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/^\d+$/.test(trimmed)) return false;
      if (/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}$/.test(trimmed)) return false;
      return true;
    })
    .map(line => line.replace(/<[^>]*>/g, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
