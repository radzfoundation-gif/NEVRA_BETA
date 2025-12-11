export interface ComponentNode {
  id: string;
  name: string;
  type: 'component' | 'element' | 'text';
  tagName?: string;
  props?: { [key: string]: any };
  className?: string;
  style?: { [key: string]: string };
  children?: ComponentNode[];
  textContent?: string;
  domPath?: string; // CSS selector path
}

/**
 * Parse JSX/HTML string to extract component tree
 */
export function parseComponents(html: string): ComponentNode[] {
  try {
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    if (!body) return [];

    return Array.from(body.children).map((child, index) => 
      parseElement(child as HTMLElement, `root-${index}`)
    );
  } catch (error) {
    console.error('Error parsing components:', error);
    return [];
  }
}

/**
 * Parse a single DOM element to ComponentNode
 */
function parseElement(element: HTMLElement, id: string, path: string = ''): ComponentNode {
  const tagName = element.tagName.toLowerCase();
  const currentPath = path ? `${path} > ${tagName}` : tagName;
  
  const node: ComponentNode = {
    id,
    name: tagName,
    type: tagName.includes('-') || /^[A-Z]/.test(tagName) ? 'component' : 'element',
    tagName,
    domPath: currentPath,
  };

  // Extract props/attributes
  const props: { [key: string]: any } = {};
  const style: { [key: string]: string } = {};
  
  Array.from(element.attributes).forEach(attr => {
    if (attr.name === 'class' || attr.name === 'className') {
      node.className = attr.value;
    } else if (attr.name === 'style') {
      // Parse inline styles
      attr.value.split(';').forEach(rule => {
        const [key, value] = rule.split(':').map(s => s.trim());
        if (key && value) {
          style[key] = value;
        }
      });
      node.style = style;
    } else {
      props[attr.name] = attr.value;
    }
  });

  if (Object.keys(props).length > 0) {
    node.props = props;
  }

  // Parse children
  const children: ComponentNode[] = [];
  Array.from(element.childNodes).forEach((child, index) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(
        parseElement(
          child as HTMLElement,
          `${id}-${index}`,
          currentPath
        )
      );
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        children.push({
          id: `${id}-text-${index}`,
          name: 'text',
          type: 'text',
          textContent: text,
          domPath: `${currentPath} > text`,
        });
      }
    }
  });

  if (children.length > 0) {
    node.children = children;
  }

  return node;
}

/**
 * Find component by DOM path
 */
export function findComponentByPath(
  components: ComponentNode[],
  domPath: string
): ComponentNode | null {
  for (const component of components) {
    if (component.domPath === domPath) {
      return component;
    }
    if (component.children) {
      const found = findComponentByPath(component.children, domPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get component hierarchy as flat list
 */
export function flattenComponents(components: ComponentNode[]): ComponentNode[] {
  const result: ComponentNode[] = [];
  
  function traverse(node: ComponentNode) {
    result.push(node);
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  components.forEach(traverse);
  return result;
}

/**
 * Extract component props from JSX string (basic regex-based)
 */
export function extractPropsFromJSX(jsx: string, componentName: string): { [key: string]: any } {
  const props: { [key: string]: any } = {};
  
  // Simple regex to find component usage
  const regex = new RegExp(`<${componentName}[^>]*>`, 'g');
  const match = jsx.match(regex);
  
  if (match) {
    const tag = match[0];
    // Extract attributes
    const attrRegex = /(\w+)=["']([^"']+)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(tag)) !== null) {
      props[attrMatch[1]] = attrMatch[2];
    }
  }
  
  return props;
}

/**
 * Update component props in JSX string
 */
export function updatePropsInJSX(
  jsx: string,
  componentName: string,
  newProps: { [key: string]: any }
): string {
  const regex = new RegExp(`(<${componentName}[^>]*>)`, 'g');
  
  return jsx.replace(regex, (match) => {
    // Remove existing props
    let updated = match.replace(/\s+\w+=["'][^"']*["']/g, '');
    
    // Add new props
    const propsString = Object.entries(newProps)
      .map(([key, value]) => ` ${key}="${value}"`)
      .join('');
    
    return updated.replace('>', `${propsString}>`);
  });
}
