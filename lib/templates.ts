export interface Template {
  id: string;
  name: string;
  category: 'landing' | 'dashboard' | 'component' | 'app';
  description: string;
  preview: string; // base64 or URL
  prompt: string; // AI prompt to generate this template
  tags: string[];
  featured?: boolean;
}

export const TEMPLATES: Template[] = [
  // Landing Pages
  {
    id: 'saas-landing',
    name: 'SaaS Landing Page',
    category: 'landing',
    description: 'Modern SaaS landing page with hero, features, pricing, and testimonials',
    preview: '',
    prompt: 'Create a modern SaaS landing page with: 1) Hero section with headline, subheadline, and CTA buttons, 2) Features section with 6 feature cards in a grid, 3) Pricing section with 3 pricing tiers, 4) Testimonials section with customer quotes and avatars, 5) Footer with links and social media. Use modern design with gradients, glassmorphism effects, and smooth animations.',
    tags: ['saas', 'landing', 'modern', 'gradient'],
    featured: true
  },
  {
    id: 'portfolio-landing',
    name: 'Portfolio Landing Page',
    category: 'landing',
    description: 'Personal portfolio website with projects showcase and about section',
    preview: '',
    prompt: 'Create a personal portfolio landing page with: 1) Hero section with name, title, and brief intro, 2) About section with profile image and description, 3) Projects showcase in a grid with project cards showing image, title, description, and tech stack, 4) Skills section with icons and progress bars, 5) Contact section with social links and email. Use dark theme with purple/blue accents.',
    tags: ['portfolio', 'personal', 'showcase'],
    featured: true
  },
  {
    id: 'ecommerce-landing',
    name: 'E-commerce Landing Page',
    category: 'landing',
    description: 'E-commerce product landing page with hero, features, and product showcase',
    preview: '',
    prompt: 'Create an e-commerce product landing page with: 1) Hero section with product image, title, price, and add to cart button, 2) Product features in a grid, 3) Product gallery with multiple images, 4) Customer reviews section, 5) Related products carousel. Use modern e-commerce design patterns.',
    tags: ['ecommerce', 'product', 'shop'],
    featured: false
  },
  {
    id: 'agency-landing',
    name: 'Agency Landing Page',
    category: 'landing',
    description: 'Creative agency website with services, portfolio, and team section',
    preview: '',
    prompt: 'Create a creative agency landing page with: 1) Hero section with animated background and bold typography, 2) Services section with 4 service cards, 3) Portfolio gallery with project thumbnails, 4) Team section with member cards, 5) Contact form. Use creative, bold design with animations.',
    tags: ['agency', 'creative', 'portfolio'],
    featured: false
  },
  
  // Dashboards
  {
    id: 'crm-dashboard',
    name: 'CRM Dashboard',
    category: 'dashboard',
    description: 'Customer relationship management dashboard with stats, charts, and tables',
    preview: '',
    prompt: 'Create a CRM dashboard with: 1) Header with search and user menu, 2) Stats cards showing total customers, revenue, growth, and conversions, 3) Revenue chart with line graph, 4) Recent customers table with name, email, status, and actions, 5) Quick actions sidebar. Use professional dashboard design with data visualization.',
    tags: ['crm', 'dashboard', 'analytics', 'business'],
    featured: true
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    category: 'dashboard',
    description: 'Analytics dashboard with charts, metrics, and data visualization',
    preview: '',
    prompt: 'Create an analytics dashboard with: 1) Top metrics cards (visitors, page views, bounce rate, avg session), 2) Line chart showing traffic over time, 3) Pie chart for traffic sources, 4) Bar chart for top pages, 5) Data table with detailed metrics. Use clean, data-focused design.',
    tags: ['analytics', 'charts', 'data', 'metrics'],
    featured: true
  },
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    category: 'dashboard',
    description: 'Admin panel with user management, settings, and system overview',
    preview: '',
    prompt: 'Create an admin dashboard with: 1) Sidebar navigation with icons, 2) Main content area with overview stats, 3) User management table with search, filter, and actions, 4) System settings panel, 5) Activity log. Use professional admin interface design.',
    tags: ['admin', 'management', 'settings'],
    featured: false
  },
  
  // Components
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'component',
    description: 'Modern contact form with validation and animations',
    preview: '',
    prompt: 'Create a modern contact form component with: 1) Name, email, subject, and message fields, 2) Form validation with error messages, 3) Submit button with loading state, 4) Success/error notifications, 5) Smooth animations. Use modern form design with focus states.',
    tags: ['form', 'contact', 'validation'],
    featured: false
  },
  {
    id: 'pricing-cards',
    name: 'Pricing Cards',
    category: 'component',
    description: 'Pricing section with 3 tiered pricing cards',
    preview: '',
    prompt: 'Create a pricing cards component with: 1) Three pricing tiers (Basic, Pro, Enterprise), 2) Each card showing price, features list, and CTA button, 3) Highlighted "popular" tier, 4) Feature comparison, 5) Hover effects and animations. Use modern pricing design.',
    tags: ['pricing', 'cards', 'comparison'],
    featured: false
  },
  {
    id: 'navigation-bar',
    name: 'Navigation Bar',
    category: 'component',
    description: 'Modern responsive navigation bar with mobile menu',
    preview: '',
    prompt: 'Create a modern navigation bar component with: 1) Logo and menu items, 2) Mobile hamburger menu, 3) Smooth scroll to sections, 4) Active link highlighting, 5) Sticky header on scroll. Use modern nav design with glassmorphism.',
    tags: ['navigation', 'menu', 'responsive'],
    featured: false
  },
  
  // Apps
  {
    id: 'todo-app',
    name: 'Todo App',
    category: 'app',
    description: 'Full-featured todo application with add, edit, delete, and filter',
    preview: '',
    prompt: 'Create a todo application with: 1) Add new todo input, 2) Todo list with checkboxes, 3) Edit and delete buttons, 4) Filter buttons (All, Active, Completed), 5) Clear completed button. Use modern todo app design with smooth animations.',
    tags: ['todo', 'app', 'productivity'],
    featured: true
  },
  {
    id: 'calculator',
    name: 'Calculator',
    category: 'app',
    description: 'Modern calculator with basic operations',
    preview: '',
    prompt: 'Create a calculator application with: 1) Display screen showing current number and operation, 2) Number buttons (0-9), 3) Operation buttons (+, -, *, /), 4) Equals button, 5) Clear button. Use modern calculator design with button animations.',
    tags: ['calculator', 'math', 'utility'],
    featured: false
  },
  {
    id: 'weather-app',
    name: 'Weather App',
    category: 'app',
    description: 'Weather application with current conditions and forecast',
    preview: '',
    prompt: 'Create a weather application with: 1) Current weather display with temperature, condition, and icon, 2) Location search input, 3) 5-day forecast cards, 4) Weather details (humidity, wind speed, etc.), 5) Animated background based on weather. Use modern weather app design.',
    tags: ['weather', 'forecast', 'api'],
    featured: false
  },
  {
    id: 'image-gallery',
    name: 'Image Gallery',
    category: 'app',
    description: 'Image gallery with lightbox and grid layout',
    preview: '',
    prompt: 'Create an image gallery application with: 1) Grid layout of images, 2) Lightbox modal for full-size view, 3) Navigation arrows in lightbox, 4) Image search/filter, 5) Lazy loading. Use modern gallery design with smooth transitions.',
    tags: ['gallery', 'images', 'lightbox'],
    featured: false
  },
  {
    id: 'chat-interface',
    name: 'Chat Interface',
    category: 'app',
    description: 'Modern chat interface with message bubbles and input',
    preview: '',
    prompt: 'Create a chat interface application with: 1) Message list with user/AI message bubbles, 2) Input field with send button, 3) Timestamp for each message, 4) Scroll to bottom on new message, 5) Typing indicator. Use modern chat design similar to messaging apps.',
    tags: ['chat', 'messaging', 'ui'],
    featured: false
  }
];

export const getTemplatesByCategory = (category: string): Template[] => {
  if (category === 'all') return TEMPLATES;
  return TEMPLATES.filter(t => t.category === category);
};

export const getFeaturedTemplates = (): Template[] => {
  return TEMPLATES.filter(t => t.featured);
};

export const searchTemplates = (query: string): Template[] => {
  const lowerQuery = query.toLowerCase();
  return TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getTemplateById = (id: string): Template | undefined => {
  return TEMPLATES.find(t => t.id === id);
};
