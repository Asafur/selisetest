import { BlockType, VibeBlock } from '../types';

type BlockDefinition = {
  type: BlockType;
  label: string;
  category: 'Structure' | 'Content' | 'Media' | 'Marketing' | 'Business';
  description: string;
  defaultBlock: Omit<VibeBlock, 'id'>;
};

export const blockDefinitions: BlockDefinition[] = [
  {
    type: 'navbar',
    label: 'Navbar',
    category: 'Structure',
    description: 'Site name, logo, links, and primary action.',
    defaultBlock: {
      type: 'navbar',
      props: {
        siteName: 'YourBrand',
        logoUrl: '',
        buttonText: 'Get started',
        buttonUrl: '#contact',
        links: [
          { label: 'Home', url: '#home' },
          { label: 'Services', url: '#services' },
          { label: 'Pricing', url: '#pricing' },
          { label: 'FAQ', url: '#faq' },
          { label: 'Contact', url: '#contact' },
        ],
      },
      style: { backgroundColor: '#ffffff', textColor: '#111827', buttonColor: '#26b7ae' },
    },
  },
  {
    type: 'hero',
    label: 'Hero Section',
    category: 'Marketing',
    description: 'Opening section with headline, subtitle, and CTA.',
    defaultBlock: {
      type: 'hero',
      props: {
        title: 'Build a clean website for your business in minutes',
        subtitle: 'Create a professional online presence with simple sections, clear messaging, and everything your visitors need to trust you.',
        buttonText: 'Get started',
        buttonUrl: '#contact',
        backgroundImageUrl: '',
      },
      style: {
        backgroundColor: '#f4f7fb',
        cardBackgroundColor: '#101827',
        textColor: '#ffffff',
        buttonColor: '#26b7ae',
        alignment: 'left',
        paddingTop: 44,
        paddingBottom: 18,
      },
    },
  },
  {
    type: 'text',
    label: 'Text Block',
    category: 'Content',
    description: 'Heading and paragraph content.',
    defaultBlock: {
      type: 'text',
      props: {
        heading: 'A clearer way to tell your story',
        body: 'Use focused copy blocks for introductions, summaries, and supporting detail.',
      },
      style: { backgroundColor: '#ffffff', textColor: '#111827', alignment: 'left' },
    },
  },
  {
    type: 'stats',
    label: 'Stat card',
    category: 'Content',
    description: 'Number highlights for trust, proof, or performance.',
    defaultBlock: {
      type: 'stats',
      props: {
        title: 'Trusted by growing brands',
        items: [
          { value: '50+', label: 'Projects completed' },
          { value: '24/7', label: 'Online presence' },
          { value: '3x', label: 'Client satisfaction' },
          { value: '100%', label: 'Responsive experience' },
        ],
      },
      style: { backgroundColor: '#ffffff', textColor: '#111827', alignment: 'center' },
    },
  },
  {
    type: 'featureList',
    label: 'Feature list',
    category: 'Content',
    description: 'Stacked feature rows with concise supporting copy.',
    defaultBlock: {
      type: 'featureList',
      props: {
        title: 'Why it works',
        items: [
          { title: 'Clear structure', description: 'Sections are easy to scan and update.' },
          { title: 'Fast publishing', description: 'Draft changes stay separate until publish.' },
          { title: 'SELISE-backed data', description: 'Content persists through platform APIs.' },
        ],
      },
      style: { backgroundColor: '#f8fafc', textColor: '#111827' },
    },
  },
  {
    type: 'image',
    label: 'Image Block',
    category: 'Media',
    description: 'Single image with alt text and caption.',
    defaultBlock: {
      type: 'image',
      props: { imageUrl: '', altText: 'Website image', caption: 'Image caption' },
      style: { backgroundColor: '#ffffff', alignment: 'center' },
    },
  },
  {
    type: 'gallery',
    label: 'Image Gallery',
    category: 'Media',
    description: 'Grid of SELISE Media images.',
    defaultBlock: {
      type: 'gallery',
      props: {
        title: 'Project gallery',
        images: [
          { url: '', caption: 'Business homepage' },
          { url: '', caption: 'Product landing page' },
          { url: '', caption: 'Portfolio website' },
          { url: '', caption: 'Service page' },
          { url: '', caption: 'Event page' },
          { url: '', caption: 'Online store concept' },
        ],
      },
      style: { backgroundColor: '#f4f7fb', textColor: '#111827' },
    },
  },
  {
    type: 'carousel',
    label: 'Carousel',
    category: 'Media',
    description: 'Slide-based showcase for featured content or campaigns.',
    defaultBlock: {
      type: 'carousel',
      props: {
        title: 'Project gallery',
        slides: [
          { title: 'Business homepage', imageUrl: '', caption: 'A clean first impression' },
          { title: 'Product landing page', imageUrl: '', caption: 'Focused conversion section' },
          { title: 'Portfolio website', imageUrl: '', caption: 'Visual storytelling layout' },
        ],
      },
      style: { backgroundColor: '#f4f7fb', textColor: '#111827' },
    },
  },
  {
    type: 'cta',
    label: 'CTA Section',
    category: 'Marketing',
    description: 'Conversion block with button.',
    defaultBlock: {
      type: 'cta',
      props: {
        heading: 'Need a site that feels sharper and sells better?',
        description: 'Let’s build a website that matches the quality of the business behind it.',
        buttonText: 'Talk to us',
        buttonUrl: '#contact',
      },
      style: {
        backgroundColor: '#f4f7fb',
        cardBackgroundColor: '#101827',
        textColor: '#ffffff',
        buttonColor: '#5967f2',
        alignment: 'center',
      },
    },
  },
  {
    type: 'contact',
    label: 'Contact Form',
    category: 'Business',
    description: 'Visitor form saved through SELISE Data Gateway.',
    defaultBlock: {
      type: 'contact',
      props: {
        title: 'Contact us',
        submitText: 'Send message',
        successMessage: 'Thanks. Your message has been received.',
        fields: ['name', 'email', 'phone', 'message'],
      },
      style: { backgroundColor: '#ffffff' },
    },
  },
  {
    type: 'faq',
    label: 'FAQ',
    category: 'Content',
    description: 'Question and answer list.',
    defaultBlock: {
      type: 'faq',
      props: {
        title: 'Frequently asked questions',
        items: [
          { question: 'How quickly can I launch?', answer: 'Start with a complete section layout and publish after the content is ready.' },
          { question: 'Can I update sections later?', answer: 'Yes. Draft changes stay private until you publish them.' },
          { question: 'Can I use my own media?', answer: 'Yes. Images should be uploaded through SELISE Media once the service is configured.' },
        ],
      },
      style: { backgroundColor: '#f4f7fb', textColor: '#111827' },
    },
  },
  {
    type: 'accordion',
    label: 'Accordion',
    category: 'Content',
    description: 'Collapsible information groups for dense content.',
    defaultBlock: {
      type: 'accordion',
      props: {
        title: 'Helpful details',
        items: [
          { title: 'What is included?', content: 'Editable sections, media, pages, and publishing.' },
          { title: 'Can content change later?', content: 'Yes. Drafts can be edited before publishing.' },
        ],
      },
      style: { backgroundColor: '#ffffff', textColor: '#111827' },
    },
  },
  {
    type: 'tabs',
    label: 'Tabs',
    category: 'Content',
    description: 'Tabbed content for organizing grouped information.',
    defaultBlock: {
      type: 'tabs',
      props: {
        title: 'Explore the offer',
        tabs: [
          { label: 'Strategy', heading: 'Clear positioning', body: 'Shape the message before the layout.' },
          { label: 'Design', heading: 'Polished pages', body: 'Use visual sections that stay consistent.' },
          { label: 'Publish', heading: 'Live when ready', body: 'Push only approved content public.' },
        ],
      },
      style: { backgroundColor: '#ffffff', textColor: '#111827' },
    },
  },
  {
    type: 'timeline',
    label: 'Timeline',
    category: 'Content',
    description: 'A chronological timeline for milestones, process, or history.',
    defaultBlock: {
      type: 'timeline',
      props: {
        title: 'How it works',
        items: [
          { date: 'Step 1', title: 'Plan', description: 'Choose structure and key content.' },
          { date: 'Step 2', title: 'Build', description: 'Drag sections into the page.' },
          { date: 'Step 3', title: 'Publish', description: 'Release the polished public version.' },
        ],
      },
      style: { backgroundColor: '#f8fafc', textColor: '#111827' },
    },
  },
  {
    type: 'features',
    label: 'Feature Cards',
    category: 'Marketing',
    description: 'Three-column feature section.',
    defaultBlock: {
      type: 'features',
      props: {
        title: 'What we do',
        cards: [
          { title: 'Website Design', description: 'Clean, responsive websites for businesses, portfolios, and personal brands.' },
          { title: 'Landing Pages', description: 'High-converting pages for products, offers, events, and campaigns.' },
          { title: 'Branding Support', description: 'Simple visual direction, copy structure, and layout guidance for your site.' },
        ],
      },
      style: { backgroundColor: '#ffffff', textColor: '#111827' },
    },
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    category: 'Marketing',
    description: 'Customer quote cards.',
    defaultBlock: {
      type: 'testimonials',
      props: {
        title: 'What people say',
        items: [
          {
            name: 'A satisfied customer',
            role: 'Founder',
            quote: 'The page was easy to update and publish.',
            imageUrl: '',
          },
        ],
      },
      style: { backgroundColor: '#f8fafc' },
    },
  },
  {
    type: 'footer',
    label: 'Footer',
    category: 'Structure',
    description: 'Footer navigation and copyright.',
    defaultBlock: {
      type: 'footer',
      props: {
        siteName: 'YourBrand',
        text: 'A simple growth partner for brands that need sharper positioning and a clean online presence.',
        links: [
          { label: 'About', url: '#about' },
          { label: 'Services', url: '#services' },
          { label: 'Work', url: '#work' },
          { label: 'Contact', url: '#contact' },
        ],
      },
      style: { backgroundColor: '#0f172a', textColor: '#ffffff' },
    },
  },
  {
    type: 'pricing',
    label: 'Pricing',
    category: 'Business',
    description: 'Plan cards with features.',
    defaultBlock: {
      type: 'pricing',
      props: {
        title: 'Simple pricing for every stage',
        plans: [
          { name: 'Starter', price: '$29/mo', features: ['Single landing page', 'Basic media library', 'Manual publishing'] },
          { name: 'Growth', price: '$79/mo', features: ['Multi-page site', 'Advanced sections', 'Publishing workflow'] },
          { name: 'Scale', price: '$149/mo', features: ['Unlimited projects', 'Dedicated success manager', 'Custom reporting'] },
        ],
      },
      style: { backgroundColor: '#ffffff' },
    },
  },
  {
    type: 'team',
    label: 'Team',
    category: 'Business',
    description: 'People section with roles and bios.',
    defaultBlock: {
      type: 'team',
      props: {
        title: 'Meet the team',
        members: [
          { name: 'Team Member', role: 'Lead', bio: 'Short professional bio.', imageUrl: '' },
        ],
      },
      style: { backgroundColor: '#f8fafc' },
    },
  },
  {
    type: 'location',
    label: 'Map/Location',
    category: 'Business',
    description: 'Address and business hours.',
    defaultBlock: {
      type: 'location',
      props: {
        title: 'Visit us',
        address: '123 Business Road',
        phone: '+1 000 000 0000',
        email: 'hello@example.com',
        hours: 'Mon-Fri, 9:00-17:00',
      },
      style: { backgroundColor: '#ffffff' },
    },
  },
  {
    type: 'video',
    label: 'Video',
    category: 'Media',
    description: 'Embedded video section.',
    defaultBlock: {
      type: 'video',
      props: {
        title: 'Watch the overview',
        videoUrl: '',
        caption: 'Add a safe video embed URL.',
      },
      style: { backgroundColor: '#111827', textColor: '#ffffff' },
    },
  },
];

export const blockDefinitionMap = new Map(blockDefinitions.map((definition) => [definition.type, definition]));

export const createBlock = (type: BlockType): VibeBlock => {
  const definition = blockDefinitionMap.get(type);
  if (!definition) {
    throw new Error(`Unknown block type: ${type}`);
  }

  return {
    id: `block_${type}_${crypto.randomUUID()}`,
    ...structuredClone(definition.defaultBlock),
  };
};
