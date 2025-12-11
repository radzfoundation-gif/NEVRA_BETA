/**
 * Style Editor utilities for CSS and Tailwind class manipulation
 */

export interface StyleChange {
  property: string;
  value: string;
  type: 'inline' | 'class' | 'tailwind';
}

/**
 * Parse Tailwind classes into style properties
 */
export function parseTailwindClasses(classes: string): { [key: string]: string } {
  const styles: { [key: string]: string } = {};
  
  // Common Tailwind mappings (simplified)
  const mappings: { [key: string]: { property: string; value: string } } = {
    'p-4': { property: 'padding', value: '1rem' },
    'px-4': { property: 'paddingLeft', value: '1rem' },
    'py-4': { property: 'paddingTop', value: '1rem' },
    'm-4': { property: 'margin', value: '1rem' },
    'mx-4': { property: 'marginLeft', value: '1rem' },
    'my-4': { property: 'marginTop', value: '1rem' },
    'bg-white': { property: 'backgroundColor', value: '#ffffff' },
    'bg-black': { property: 'backgroundColor', value: '#000000' },
    'text-white': { property: 'color', value: '#ffffff' },
    'text-black': { property: 'color', value: '#000000' },
    'rounded': { property: 'borderRadius', value: '0.25rem' },
    'rounded-lg': { property: 'borderRadius', value: '0.5rem' },
    'rounded-xl': { property: 'borderRadius', value: '0.75rem' },
    'shadow': { property: 'boxShadow', value: '0 1px 3px rgba(0,0,0,0.1)' },
    'shadow-lg': { property: 'boxShadow', value: '0 10px 15px rgba(0,0,0,0.1)' },
  };
  
  classes.split(' ').forEach(cls => {
    const mapping = mappings[cls];
    if (mapping) {
      styles[mapping.property] = mapping.value;
    }
  });
  
  return styles;
}

/**
 * Convert style object to Tailwind classes (basic)
 */
export function stylesToTailwind(styles: { [key: string]: string }): string {
  const classes: string[] = [];
  
  // Reverse mapping (simplified)
  Object.entries(styles).forEach(([property, value]) => {
    if (property === 'padding' && value === '1rem') classes.push('p-4');
    if (property === 'margin' && value === '1rem') classes.push('m-4');
    if (property === 'backgroundColor' && value === '#ffffff') classes.push('bg-white');
    if (property === 'color' && value === '#ffffff') classes.push('text-white');
    if (property === 'borderRadius' && value === '0.5rem') classes.push('rounded-lg');
  });
  
  return classes.join(' ');
}

/**
 * Parse inline style string to object
 */
export function parseInlineStyles(styleString: string): { [key: string]: string } {
  const styles: { [key: string]: string } = {};
  
  styleString.split(';').forEach(rule => {
    const [key, value] = rule.split(':').map(s => s.trim());
    if (key && value) {
      // Convert kebab-case to camelCase
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      styles[camelKey] = value;
    }
  });
  
  return styles;
}

/**
 * Convert style object to inline style string
 */
export function stylesToInline(styles: { [key: string]: string }): string {
  return Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebabKey}: ${value}`;
    })
    .join('; ');
}

/**
 * Update className in JSX/HTML string
 */
export function updateClassName(
  html: string,
  selector: string,
  newClasses: string
): string {
  // Simple regex-based replacement (for basic cases)
  const regex = new RegExp(`(class|className)=["']([^"']*)["']`, 'g');
  
  return html.replace(regex, (match, attr, oldClasses) => {
    // This is a simplified version - in production, use proper HTML parser
    return `${attr}="${newClasses}"`;
  });
}

/**
 * Update inline styles in JSX/HTML string
 */
export function updateInlineStyles(
  html: string,
  selector: string,
  newStyles: { [key: string]: string }
): string {
  const styleString = stylesToInline(newStyles);
  const regex = /style=["']([^"']*)["']/g;
  
  return html.replace(regex, (match, oldStyles) => {
    return `style="${styleString}"`;
  });
}

/**
 * Get computed styles from element (for visual editor)
 */
export function getComputedStyles(element: HTMLElement): { [key: string]: string } {
  const computed = window.getComputedStyle(element);
  const styles: { [key: string]: string } = {};
  
  // Common properties to extract
  const properties = [
    'color', 'backgroundColor', 'padding', 'margin', 'borderRadius',
    'fontSize', 'fontWeight', 'width', 'height', 'display', 'flexDirection',
    'justifyContent', 'alignItems', 'gap', 'boxShadow', 'border',
  ];
  
  properties.forEach(prop => {
    const value = computed.getPropertyValue(prop);
    if (value) {
      styles[prop] = value;
    }
  });
  
  return styles;
}

/**
 * Apply style changes to element
 */
export function applyStyleChange(
  element: HTMLElement,
  change: StyleChange
): void {
  if (change.type === 'inline') {
    element.style.setProperty(change.property, change.value);
  } else if (change.type === 'class') {
    // Add/remove CSS class
    if (change.value) {
      element.classList.add(change.value);
    } else {
      element.classList.remove(change.property);
    }
  } else if (change.type === 'tailwind') {
    // Update Tailwind classes
    const currentClasses = element.className.split(' ');
    const updatedClasses = currentClasses.filter(c => !c.startsWith(change.property));
    if (change.value) {
      updatedClasses.push(`${change.property}-${change.value}`);
    }
    element.className = updatedClasses.join(' ');
  }
}
