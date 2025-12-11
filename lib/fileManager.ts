export interface ProjectFile {
  path: string;
  content: string;
  type: 'component' | 'page' | 'style' | 'config' | 'other';
}

export interface ProjectStructure {
  files: ProjectFile[];
  entry: string;
  framework?: 'react' | 'next' | 'vue' | 'svelte' | 'html';
}

export class FileManager {
  private files: Map<string, ProjectFile> = new Map();
  private entry: string = '';

  /**
   * Add or update a file in the project
   */
  addFile(path: string, content: string, type: ProjectFile['type'] = 'other'): void {
    const normalizedPath = this.normalizePath(path);
    this.files.set(normalizedPath, {
      path: normalizedPath,
      content,
      type,
    });
  }

  /**
   * Get a file by path
   */
  getFile(path: string): ProjectFile | undefined {
    const normalizedPath = this.normalizePath(path);
    return this.files.get(normalizedPath);
  }

  /**
   * Delete a file from the project
   */
  deleteFile(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.files.delete(normalizedPath);
  }

  /**
   * Get all files in the project
   */
  getAllFiles(): ProjectFile[] {
    return Array.from(this.files.values());
  }

  /**
   * Get files by type
   */
  getFilesByType(type: ProjectFile['type']): ProjectFile[] {
    return Array.from(this.files.values()).filter(file => file.type === type);
  }

  /**
   * Check if a file exists
   */
  hasFile(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.files.has(normalizedPath);
  }

  /**
   * Get the entry file path
   */
  getEntry(): string {
    return this.entry;
  }

  /**
   * Set the entry file path
   */
  setEntry(path: string): void {
    const normalizedPath = this.normalizePath(path);
    if (this.files.has(normalizedPath)) {
      this.entry = normalizedPath;
    }
  }

  /**
   * Export project as structured object
   */
  exportAsProject(): ProjectStructure {
    return {
      files: this.getAllFiles(),
      entry: this.entry,
      framework: this.detectFramework(),
    };
  }

  /**
   * Import project from structured object
   */
  importProject(project: ProjectStructure): void {
    this.files.clear();
    project.files.forEach(file => {
      this.addFile(file.path, file.content, file.type);
    });
    if (project.entry) {
      this.setEntry(project.entry);
    }
  }

  /**
   * Clear all files
   */
  clear(): void {
    this.files.clear();
    this.entry = '';
  }

  /**
   * Get project structure as tree
   */
  getFileTree(): { [key: string]: any } {
    const tree: { [key: string]: any } = {};
    
    this.getAllFiles().forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          // Last part is the file
          current[part] = {
            type: 'file',
            path: file.path,
            fileType: file.type,
          };
        } else {
          // Directory
          if (!current[part]) {
            current[part] = { type: 'directory', children: {} };
          }
          current = current[part].children;
        }
      }
    });
    
    return tree;
  }

  /**
   * Normalize file path
   */
  private normalizePath(path: string): string {
    // Remove leading/trailing slashes and normalize separators
    return path
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '')
      .replace(/\/+/g, '/');
  }

  /**
   * Detect framework from files
   */
  private detectFramework(): ProjectStructure['framework'] {
    const files = this.getAllFiles();
    
    // Check for Next.js
    if (files.some(f => f.path.includes('next.config') || f.path.includes('pages/') || f.path.includes('app/'))) {
      return 'next';
    }
    
    // Check for Vue
    if (files.some(f => f.path.endsWith('.vue') || f.path.includes('vue.config'))) {
      return 'vue';
    }
    
    // Check for Svelte
    if (files.some(f => f.path.endsWith('.svelte'))) {
      return 'svelte';
    }
    
    // Check for React
    if (files.some(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'))) {
      return 'react';
    }
    
    // Default to HTML
    return 'html';
  }

  /**
   * Get file extension
   */
  getFileExtension(path: string): string {
    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Infer file type from path
   */
  inferFileType(path: string): ProjectFile['type'] {
    const ext = this.getFileExtension(path).toLowerCase();
    const lowerPath = path.toLowerCase();

    if (lowerPath.includes('component') || lowerPath.includes('components/')) {
      return 'component';
    }

    if (ext === 'tsx' || ext === 'jsx' || ext === 'vue' || ext === 'svelte') {
      if (lowerPath.includes('page') || lowerPath.includes('pages/') || lowerPath.includes('app/')) {
        return 'page';
      }
      return 'component';
    }

    if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less' || ext === 'styl') {
      return 'style';
    }

    if (ext === 'json' || ext === 'yaml' || ext === 'yml' || lowerPath.includes('config')) {
      return 'config';
    }

    return 'other';
  }
}
