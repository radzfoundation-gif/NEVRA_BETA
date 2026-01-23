import { ProjectFile } from './fileManager';

export interface Version {
  id: string;
  timestamp: Date;
  files: ProjectFile[];
  message?: string;
}

export class VersionManager {
  private versions: Version[] = [];
  private maxVersions: number = 50;

  /**
   * Save a version snapshot
   */
  saveVersion(files: ProjectFile[], message?: string): string {
    const version: Version = {
      id: `v${Date.now()}`,
      timestamp: new Date(),
      files: files.map(f => ({ ...f })), // Deep copy
      message,
    };

    this.versions.unshift(version); // Add to beginning

    // Limit history
    if (this.versions.length > this.maxVersions) {
      this.versions = this.versions.slice(0, this.maxVersions);
    }

    // Save to localStorage
    this.persist();

    return version.id;
  }

  /**
   * Get a specific version by ID
   */
  getVersion(id: string): Version | undefined {
    return this.versions.find(v => v.id === id);
  }

  /**
   * Get all versions
   */
  getAllVersions(): Version[] {
    return [...this.versions];
  }

  /**
   * Restore files from a version
   */
  restoreVersion(id: string): ProjectFile[] | null {
    const version = this.getVersion(id);
    if (!version) return null;

    return version.files.map(f => ({ ...f })); // Return deep copy
  }

  /**
   * Get diff between two versions
   */
  getDiff(version1Id: string, version2Id: string): {
    added: ProjectFile[];
    removed: ProjectFile[];
    modified: Array<{ file: ProjectFile; oldContent: string; newContent: string }>;
  } {
    const v1 = this.getVersion(version1Id);
    const v2 = this.getVersion(version2Id);

    if (!v1 || !v2) {
      return { added: [], removed: [], modified: [] };
    }

    const v1Files = new Map(v1.files.map(f => [f.path, f]));
    const v2Files = new Map(v2.files.map(f => [f.path, f]));

    const added: ProjectFile[] = [];
    const removed: ProjectFile[] = [];
    const modified: Array<{ file: ProjectFile; oldContent: string; newContent: string }> = [];

    // Find added and modified files
    v2Files.forEach((file2, path) => {
      const file1 = v1Files.get(path);
      if (!file1) {
        added.push(file2);
      } else if (file1.content !== file2.content) {
        modified.push({
          file: file2,
          oldContent: file1.content,
          newContent: file2.content,
        });
      }
    });

    // Find removed files
    v1Files.forEach((file1, path) => {
      if (!v2Files.has(path)) {
        removed.push(file1);
      }
    });

    return { added, removed, modified };
  }

  /**
   * Delete a version
   */
  deleteVersion(id: string): boolean {
    const index = this.versions.findIndex(v => v.id === id);
    if (index === -1) return false;

    this.versions.splice(index, 1);
    this.persist();
    return true;
  }

  /**
   * Clear all versions
   */
  clear(): void {
    this.versions = [];
    this.persist();
  }

  /**
   * Persist to localStorage
   */
  private persist(): void {
    try {
      const data = JSON.stringify(this.versions.map(v => ({
        ...v,
        timestamp: v.timestamp.toISOString(),
      })));
      localStorage.setItem('noir_ai_versions', data);
    } catch (error) {
      console.error('Error persisting versions:', error);
    }
  }

  /**
   * Load from localStorage
   */
  load(): void {
    try {
      const data = localStorage.getItem('noir_ai_versions');
      if (data) {
        const parsed = JSON.parse(data);
        this.versions = parsed.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp),
        }));
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  }
}

// Singleton instance
let versionManagerInstance: VersionManager | null = null;

export function getVersionManager(): VersionManager {
  if (!versionManagerInstance) {
    versionManagerInstance = new VersionManager();
    versionManagerInstance.load();
  }
  return versionManagerInstance;
}
