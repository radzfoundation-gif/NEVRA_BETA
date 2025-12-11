export interface Component {
  id: string;
  name: string;
  description: string;
  category: 'button' | 'form' | 'card' | 'navigation' | 'layout' | 'modal' | 'other';
  code: string;
  preview?: string; // base64 image or URL
  tags: string[];
  authorId?: string;
  authorName?: string;
  usageCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ComponentLibrary {
  private components: Map<string, Component> = new Map();

  /**
   * Save component to library
   */
  saveComponent(component: Omit<Component, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Component {
    const id = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newComponent: Component = {
      ...component,
      id,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.components.set(id, newComponent);
    return newComponent;
  }

  /**
   * Get component by ID
   */
  getComponent(id: string): Component | undefined {
    return this.components.get(id);
  }

  /**
   * Get all components
   */
  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /**
   * Search components by query
   */
  searchComponents(query: string): Component[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.components.values()).filter(comp =>
      comp.name.toLowerCase().includes(lowerQuery) ||
      comp.description.toLowerCase().includes(lowerQuery) ||
      comp.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get components by category
   */
  getByCategory(category: Component['category']): Component[] {
    return Array.from(this.components.values()).filter(comp => comp.category === category);
  }

  /**
   * Get popular components (by usage count)
   */
  getPopular(limit: number = 10): Component[] {
    return Array.from(this.components.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Increment usage count
   */
  incrementUsage(id: string): void {
    const component = this.components.get(id);
    if (component) {
      component.usageCount++;
      component.updatedAt = new Date();
    }
  }

  /**
   * Delete component
   */
  deleteComponent(id: string): boolean {
    return this.components.delete(id);
  }

  /**
   * Update component
   */
  updateComponent(id: string, updates: Partial<Omit<Component, 'id' | 'createdAt'>>): Component | null {
    const component = this.components.get(id);
    if (!component) return null;

    const updated: Component = {
      ...component,
      ...updates,
      updatedAt: new Date(),
    };

    this.components.set(id, updated);
    return updated;
  }

  /**
   * Get components by tags
   */
  getByTags(tags: string[]): Component[] {
    return Array.from(this.components.values()).filter(comp =>
      tags.some(tag => comp.tags.includes(tag))
    );
  }

  /**
   * Get featured components (public and popular)
   */
  getFeatured(limit: number = 6): Component[] {
    return Array.from(this.components.values())
      .filter(comp => comp.isPublic)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Load components from storage
   */
  load(): void {
    try {
      const stored = localStorage.getItem('nevra_component_library');
      if (stored) {
        const components: Component[] = JSON.parse(stored);
        components.forEach(comp => {
          this.components.set(comp.id, {
            ...comp,
            createdAt: new Date(comp.createdAt),
            updatedAt: new Date(comp.updatedAt),
          });
        });
      }
    } catch (error) {
      console.error('Error loading component library:', error);
    }
  }

  /**
   * Save components to storage
   */
  save(): void {
    try {
      const components = Array.from(this.components.values());
      localStorage.setItem('nevra_component_library', JSON.stringify(components));
    } catch (error) {
      console.error('Error saving component library:', error);
    }
  }
}

// Singleton instance
let componentLibraryInstance: ComponentLibrary | null = null;

export function getComponentLibrary(): ComponentLibrary {
  if (!componentLibraryInstance) {
    componentLibraryInstance = new ComponentLibrary();
    // Load from localStorage or Supabase
    componentLibraryInstance.load();
  }
  return componentLibraryInstance;
}
