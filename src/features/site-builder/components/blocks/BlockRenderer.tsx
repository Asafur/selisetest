import { FormEvent, memo, useEffect, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Code2,
  Columns3,
  Mail,
  MapPin,
  Newspaper,
  Play,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Textarea } from '@/components/ui-kit/textarea';
import { createContactSubmission } from '../../services/site-builder.service';
import { VibeBlock } from '../../types';

type RendererMode = 'editor' | 'preview' | 'live';

type BlockRendererProps = {
  block: VibeBlock;
  mode?: RendererMode;
  siteId?: string;
  pageId?: string;
  selected?: boolean;
  onSelect?: (blockId: string) => void;
  onInlineChange?: (blockId: string, path: Array<string | number>, value: string) => void;
};

const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const asNumber = (value: unknown, fallback = 0) => (typeof value === 'number' ? value : fallback);
const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const EditableText = ({
  block,
  mode,
  path,
  value,
  fallback = '',
  onInlineChange,
  as = 'span',
  className = '',
  multiline = false,
}: {
  block: VibeBlock;
  mode?: RendererMode;
  path: Array<string | number>;
  value: unknown;
  fallback?: string;
  onInlineChange?: BlockRendererProps['onInlineChange'];
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'figcaption';
  className?: string;
  multiline?: boolean;
}) => {
  const Tag = as;
  const textValue = asString(value, fallback);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(textValue);

  useEffect(() => {
    setDraft(textValue);
  }, [textValue]);

  const commit = () => {
    setEditing(false);
    if (draft !== textValue) onInlineChange?.(block.id, path, draft);
  };

  if (mode !== 'editor' || !onInlineChange) {
    return <Tag className={className}>{textValue}</Tag>;
  }

  return (
    <Tag
      className={`${className} vibe-inline-editable ${editing ? 'is-editing' : ''}`}
      contentEditable={editing}
      suppressContentEditableWarning
      title="Double-click to edit"
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setEditing(true);
      }}
      onClick={(event) => {
        if (editing) event.stopPropagation();
      }}
      onInput={(event) => setDraft(event.currentTarget.textContent || '')}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setDraft(textValue);
          setEditing(false);
          event.currentTarget.blur();
          return;
        }
        if (event.key === 'Enter' && !multiline && !event.shiftKey) {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }
      }}
    >
      {draft || fallback}
    </Tag>
  );
};

const EditableMedia = ({
  block,
  mode,
  path,
  value,
  label,
  className,
  onInlineChange,
}: {
  block: VibeBlock;
  mode?: RendererMode;
  path: Array<string | number>;
  value: unknown;
  label: string;
  className?: string;
  onInlineChange?: BlockRendererProps['onInlineChange'];
}) => {
  const currentUrl = asString(value);
  const onDoubleClick = (event: React.MouseEvent) => {
    if (mode !== 'editor' || !onInlineChange) return;
    event.preventDefault();
    event.stopPropagation();
    const nextUrl = window.prompt('Paste SELISE Media URL or asset URL for this image:', currentUrl);
    if (nextUrl !== null && nextUrl !== currentUrl) onInlineChange(block.id, path, nextUrl);
  };

  if (currentUrl) {
    return (
      <img
        src={currentUrl}
        alt=""
        className={`vibe-inline-media ${className || ''}`}
        onDoubleClick={onDoubleClick}
        title={mode === 'editor' ? 'Double-click to change media URL' : undefined}
      />
    );
  }

  return (
    <div
      className="vibe-inline-media"
      onDoubleClick={onDoubleClick}
      title={mode === 'editor' ? 'Double-click to set media URL' : undefined}
    >
      <PlaceholderImage label={label} />
    </div>
  );
};

const sectionStyle = (block: VibeBlock) => ({
  backgroundColor: asString(block.style?.backgroundColor, '#ffffff'),
  color: asString(block.style?.textColor, '#111827'),
  textAlign: asString(block.style?.alignment, 'left') as any,
  paddingTop: asNumber(block.style?.paddingTop, 56),
  paddingBottom: asNumber(block.style?.paddingBottom, 56),
});

const PlaceholderImage = ({ label = 'Select media' }: { label?: string }) => (
  <div className="relative flex aspect-video w-full overflow-hidden rounded-lg border bg-[#e8eef4] text-sm font-medium text-slate-500">
    <div className="absolute left-5 top-5 h-12 w-28 rounded-md bg-white/70" />
    <div className="absolute bottom-5 left-5 h-8 w-40 rounded-md bg-white/60" />
    <div className="absolute right-5 top-5 h-24 w-28 rounded-md bg-[#c9d6e4]" />
    <div className="absolute bottom-5 right-5 h-14 w-36 rounded-md bg-[#d8e1eb]" />
    <div className="relative z-10 grid h-full w-full place-items-center bg-white/10 px-4 text-center">
      {label}
    </div>
  </div>
);

const ActionLink = ({
  href,
  children,
  color = '#26b7ae',
}: {
  href: string;
  children: React.ReactNode;
  color?: string;
}) => (
  <a
    href={href}
    className="inline-flex min-h-10 items-center justify-center rounded-md px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
    style={{ backgroundColor: color }}
  >
    {children}
  </a>
);

const BlockShell = ({
  block,
  mode,
  selected,
  onSelect,
  children,
}: BlockRendererProps & { children: React.ReactNode }) => (
  <section
    className={`relative ${mode === 'editor' ? 'cursor-pointer' : ''} ${
      selected ? 'ring-2 ring-primary ring-offset-2' : ''
    }`}
    style={sectionStyle(block)}
    onClick={(event) => {
      if (mode !== 'editor') return;
      event.stopPropagation();
      onSelect?.(block.id);
    }}
  >
    {children}
  </section>
);

const NavbarBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const links = asArray<{ label?: string; url?: string }>(block.props.links);
  const buttonColor = asString(block.style?.buttonColor, '#26b7ae');
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {asString(block.props.logoUrl) ? (
            <img src={asString(block.props.logoUrl)} alt="" className="size-9 rounded-md object-cover" />
          ) : null}
          <EditableText block={block} mode={mode} path={['props', 'siteName']} value={block.props.siteName} fallback="Website" onInlineChange={onInlineChange} className="text-base font-semibold" />
        </div>
        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          {links.map((link, index) => (
            <a key={`${link.label}-${index}`} href={asString(link.url, '#')} className="hover:text-primary">
              <EditableText block={block} mode={mode} path={['props', 'links', index, 'label']} value={link.label} fallback="Link" onInlineChange={onInlineChange} />
            </a>
          ))}
        </nav>
        <ActionLink href={asString(block.props.buttonUrl, '#')} color={buttonColor}>
          <EditableText block={block} mode={mode} path={['props', 'buttonText']} value={block.props.buttonText} fallback="Contact" onInlineChange={onInlineChange} />
        </ActionLink>
      </div>
    </BlockShell>
  );
};

const HeroBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const backgroundImageUrl = asString(block.props.backgroundImageUrl);
  const cardBackgroundColor = asString(block.style?.cardBackgroundColor, '');
  const buttonColor = asString(block.style?.buttonColor, '#26b7ae');
  const alignCenter = asString(block.style?.alignment) === 'center';

  if (!backgroundImageUrl) {
    return (
      <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
        <div className="mx-auto max-w-6xl px-6">
          <div
            className={`rounded-2xl px-8 py-12 md:px-16 md:py-14 ${alignCenter ? 'text-center' : ''}`}
            style={{ backgroundColor: cardBackgroundColor || 'transparent' }}
          >
            <div className={alignCenter ? 'mx-auto max-w-3xl' : 'max-w-4xl'}>
              <h1 className="text-4xl font-semibold leading-tight text-current md:text-5xl">
                <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} fallback="Hero title" onInlineChange={onInlineChange} as="span" />
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 opacity-85 md:text-lg">
                <EditableText block={block} mode={mode} path={['props', 'subtitle']} value={block.props.subtitle} onInlineChange={onInlineChange} multiline />
              </p>
              <div className="mt-7">
                <ActionLink href={asString(block.props.buttonUrl, '#')} color={buttonColor}>
                  <EditableText block={block} mode={mode} path={['props', 'buttonText']} value={block.props.buttonText} fallback="Learn more" onInlineChange={onInlineChange} />
                </ActionLink>
              </div>
            </div>
          </div>
        </div>
      </BlockShell>
    );
  }

  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div
        className="mx-auto grid max-w-6xl items-center gap-8 px-6 md:grid-cols-[1.1fr_0.9fr]"
        style={{ minHeight: 360 }}
      >
        <div className={asString(block.style?.alignment) === 'center' ? 'mx-auto max-w-3xl text-center' : ''}>
          <h1 className="text-4xl font-semibold leading-tight text-current md:text-6xl">
            <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} fallback="Hero title" onInlineChange={onInlineChange} />
          </h1>
          <p className="mt-5 text-lg leading-8 opacity-80">
            <EditableText block={block} mode={mode} path={['props', 'subtitle']} value={block.props.subtitle} onInlineChange={onInlineChange} multiline />
          </p>
          <div className="mt-7">
            <ActionLink href={asString(block.props.buttonUrl, '#')} color={buttonColor}>
              <EditableText block={block} mode={mode} path={['props', 'buttonText']} value={block.props.buttonText} fallback="Learn more" onInlineChange={onInlineChange} />
            </ActionLink>
          </div>
        </div>
        {backgroundImageUrl ? (
          <EditableMedia
            block={block}
            mode={mode}
            path={['props', 'backgroundImageUrl']}
            value={block.props.backgroundImageUrl}
            label="Hero media"
            className="min-h-72 w-full rounded-lg object-cover shadow-lg"
            onInlineChange={onInlineChange}
          />
        ) : (
          <div className="hidden md:block">
            <EditableMedia block={block} mode={mode} path={['props', 'backgroundImageUrl']} value={block.props.backgroundImageUrl} label="Hero media" onInlineChange={onInlineChange} />
          </div>
        )}
      </div>
    </BlockShell>
  );
};

const TextBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => (
  <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
    <div className="mx-auto max-w-4xl px-6">
      <h2 className="text-3xl font-semibold leading-tight">
        <EditableText block={block} mode={mode} path={['props', 'heading']} value={block.props.heading} onInlineChange={onInlineChange} />
      </h2>
      <p className="mt-4 text-base leading-7 opacity-80">
        <EditableText block={block} mode={mode} path={['props', 'body']} value={block.props.body} onInlineChange={onInlineChange} multiline />
      </p>
    </div>
  </BlockShell>
);

const StatsBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const items = asArray<{ value?: string; label?: string }>(block.props.items);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border bg-white p-5 text-center shadow-sm">
              <EditableText block={block} mode={mode} path={['props', 'items', index, 'value']} value={item.value} onInlineChange={onInlineChange} className="text-3xl font-semibold text-slate-950" as="div" />
              <EditableText block={block} mode={mode} path={['props', 'items', index, 'label']} value={item.label} onInlineChange={onInlineChange} className="mt-2 text-sm text-slate-500" as="div" />
            </div>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const FeatureListBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const items = asArray<{ title?: string; description?: string }>(block.props.items);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 grid gap-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-4 rounded-lg border bg-white p-5 shadow-sm">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </div>
              <div>
                <EditableText block={block} mode={mode} path={['props', 'items', index, 'title']} value={item.title} onInlineChange={onInlineChange} className="font-semibold text-slate-950" as="h3" />
                <EditableText block={block} mode={mode} path={['props', 'items', index, 'description']} value={item.description} onInlineChange={onInlineChange} className="mt-1 text-sm leading-6 text-slate-600" as="p" multiline />
              </div>
            </div>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const ImageBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => (
  <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
    <div className="mx-auto max-w-5xl px-6">
      <EditableMedia block={block} mode={mode} path={['props', 'imageUrl']} value={block.props.imageUrl} label="Select media" className="max-h-[560px] w-full rounded-lg object-cover shadow" onInlineChange={onInlineChange} />
      {asString(block.props.caption) && (
        <EditableText block={block} mode={mode} path={['props', 'caption']} value={block.props.caption} onInlineChange={onInlineChange} className="mt-3 text-center text-sm opacity-70" as="p" />
      )}
    </div>
  </BlockShell>
);

const GalleryBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const images = asArray<{ url?: string; caption?: string }>(block.props.images);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} fallback="Gallery" onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {images.map((image, index) => (
            <figure key={index} className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <EditableMedia block={block} mode={mode} path={['props', 'images', index, 'url']} value={image.url} label={image.caption || 'Gallery image'} className="aspect-[16/9] w-full object-cover" onInlineChange={onInlineChange} />
              {image.caption && (
                <EditableText block={block} mode={mode} path={['props', 'images', index, 'caption']} value={image.caption} onInlineChange={onInlineChange} className="px-4 py-3 text-sm text-slate-600" as="figcaption" />
              )}
            </figure>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const CarouselBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const slides = asArray<{ title?: string; imageUrl?: string; caption?: string }>(block.props.slides);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} fallback="Carousel" onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {slides.map((slide, index) => (
            <figure key={index} className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <EditableMedia block={block} mode={mode} path={['props', 'slides', index, 'imageUrl']} value={slide.imageUrl} label={slide.title || 'Slide image'} className="aspect-[16/9] w-full object-cover" onInlineChange={onInlineChange} />
              <figcaption className="p-4">
                <EditableText block={block} mode={mode} path={['props', 'slides', index, 'title']} value={slide.title} onInlineChange={onInlineChange} className="font-semibold text-slate-950" as="div" />
                <EditableText block={block} mode={mode} path={['props', 'slides', index, 'caption']} value={slide.caption} onInlineChange={onInlineChange} className="mt-1 text-sm text-slate-500" as="p" />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const CtaBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => (
  <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
    <div className="mx-auto max-w-6xl px-6">
      <div
        className="rounded-2xl px-8 py-10 text-center md:px-14"
        style={{ backgroundColor: asString(block.style?.cardBackgroundColor, 'transparent') }}
      >
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'heading']} value={block.props.heading} onInlineChange={onInlineChange} />
        </h2>
        <EditableText block={block} mode={mode} path={['props', 'description']} value={block.props.description} onInlineChange={onInlineChange} className="mx-auto mt-4 max-w-2xl text-base leading-7 opacity-85" as="p" multiline />
        <div className="mt-7">
          <ActionLink href={asString(block.props.buttonUrl, '#')} color={asString(block.style?.buttonColor, '#5967f2')}>
            <EditableText block={block} mode={mode} path={['props', 'buttonText']} value={block.props.buttonText} fallback="Continue" onInlineChange={onInlineChange} />
          </ActionLink>
        </div>
      </div>
    </div>
  </BlockShell>
);

const ContactBlock = ({ block, mode, selected, onSelect, siteId, pageId }: BlockRendererProps) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode !== 'live' || !siteId || !pageId) return;
    const data = new FormData(event.currentTarget);
    setStatus('sending');
    setError('');
    try {
      await createContactSubmission({
        siteId,
        pageId,
        blockId: block.id,
        name: String(data.get('name') || ''),
        email: String(data.get('email') || ''),
        phone: String(data.get('phone') || ''),
        message: String(data.get('message') || ''),
      });
      event.currentTarget.reset();
      setStatus('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
      setStatus('error');
    }
  };

  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto grid max-w-5xl gap-8 px-6 md:grid-cols-[0.8fr_1fr]">
        <div>
          <Mail className="mb-4 size-8 text-primary" />
          <h2 className="text-3xl font-semibold">{asString(block.props.title, 'Contact us')}</h2>
          <p className="mt-4 text-sm leading-6 opacity-75">
            Messages are persisted through the SELISE ContactSubmission schema when configured.
          </p>
        </div>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Input name="name" placeholder="Name" required disabled={mode !== 'live'} />
          <Input name="email" placeholder="Email" type="email" required disabled={mode !== 'live'} />
          <Input name="phone" placeholder="Phone" disabled={mode !== 'live'} />
          <Textarea name="message" placeholder="Message" required height="120px" disabled={mode !== 'live'} />
          <Button type="submit" disabled={mode !== 'live' || status === 'sending'} loading={status === 'sending'}>
            {asString(block.props.submitText, 'Send message')}
          </Button>
          {status === 'sent' && (
            <p className="text-sm text-emerald-600">{asString(block.props.successMessage, 'Message sent.')}</p>
          )}
          {status === 'error' && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </div>
    </BlockShell>
  );
};

const FaqBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const items = asArray<{ question?: string; answer?: string }>(block.props.items);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 divide-y rounded-lg border bg-white">
          {items.map((item, index) => (
            <div key={index} className="p-5">
              <EditableText block={block} mode={mode} path={['props', 'items', index, 'question']} value={item.question} onInlineChange={onInlineChange} className="font-semibold" as="h3" />
              <EditableText block={block} mode={mode} path={['props', 'items', index, 'answer']} value={item.answer} onInlineChange={onInlineChange} className="mt-2 text-sm leading-6 text-slate-600" as="p" multiline />
            </div>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const AccordionBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const items = asArray<{ title?: string; content?: string }>(block.props.items);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 divide-y rounded-lg border bg-white shadow-sm">
          {items.map((item, index) => (
            <div key={index} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <EditableText block={block} mode={mode} path={['props', 'items', index, 'title']} value={item.title} onInlineChange={onInlineChange} className="font-semibold text-slate-950" as="h3" />
                <ChevronDown className="size-4 text-slate-500" />
              </div>
              <EditableText block={block} mode={mode} path={['props', 'items', index, 'content']} value={item.content} onInlineChange={onInlineChange} className="mt-2 text-sm leading-6 text-slate-600" as="p" multiline />
            </div>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const TabsBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const tabs = asArray<{ label?: string; heading?: string; body?: string }>(block.props.tabs);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab, index) => (
              <div
                key={index}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  index === 0 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <EditableText block={block} mode={mode} path={['props', 'tabs', index, 'label']} value={tab.label} onInlineChange={onInlineChange} />
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-slate-50 p-5">
            <Columns3 className="mb-3 size-5 text-primary" />
            <EditableText block={block} mode={mode} path={['props', 'tabs', 0, 'heading']} value={tabs[0]?.heading} onInlineChange={onInlineChange} className="text-xl font-semibold text-slate-950" as="h3" />
            <EditableText block={block} mode={mode} path={['props', 'tabs', 0, 'body']} value={tabs[0]?.body} onInlineChange={onInlineChange} className="mt-2 text-sm leading-6 text-slate-600" as="p" multiline />
          </div>
        </div>
      </div>
    </BlockShell>
  );
};

const TimelineBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const items = asArray<{ date?: string; title?: string; description?: string }>(block.props.items);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 grid gap-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-4 rounded-lg border bg-white p-5 shadow-sm">
              <CalendarDays className="mt-1 size-5 shrink-0 text-primary" />
              <div>
                <EditableText block={block} mode={mode} path={['props', 'items', index, 'date']} value={item.date} onInlineChange={onInlineChange} className="text-xs font-semibold uppercase text-slate-500" as="div" />
                <EditableText block={block} mode={mode} path={['props', 'items', index, 'title']} value={item.title} onInlineChange={onInlineChange} className="mt-1 font-semibold text-slate-950" as="h3" />
                <EditableText block={block} mode={mode} path={['props', 'items', index, 'description']} value={item.description} onInlineChange={onInlineChange} className="mt-1 text-sm leading-6 text-slate-600" as="p" multiline />
              </div>
            </div>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const TableBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const headers = asArray<string>(block.props.headers);
  const rows = asArray<string[]>(block.props.rows);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="border-b px-4 py-3 font-semibold text-slate-950">
                    <EditableText block={block} mode={mode} path={['props', 'headers', index]} value={header} onInlineChange={onInlineChange} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border-b px-4 py-3 text-slate-600">
                      <EditableText block={block} mode={mode} path={['props', 'rows', rowIndex, cellIndex]} value={cell} onInlineChange={onInlineChange} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BlockShell>
  );
};

const CodeEmbedBlock = ({ block, mode, selected, onSelect }: BlockRendererProps) => (
  <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
    <div className="mx-auto max-w-5xl px-6">
      <div className="mb-4 flex items-center gap-3">
        <Code2 className="size-5 text-primary" />
        <h2 className="text-3xl font-semibold">{asString(block.props.title)}</h2>
      </div>
      <pre className="overflow-auto rounded-lg border border-white/10 bg-black/30 p-5 text-sm leading-6">
        <code>{asString(block.props.code)}</code>
      </pre>
    </div>
  </BlockShell>
);

const BlogArticleBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => (
  <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
    <div className="mx-auto max-w-3xl px-6">
      <article className="rounded-lg border bg-white p-6 shadow-sm">
        <Newspaper className="mb-4 size-6 text-primary" />
        <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} className="text-3xl font-semibold text-slate-950" as="h2" />
        <EditableText block={block} mode={mode} path={['props', 'excerpt']} value={block.props.excerpt} onInlineChange={onInlineChange} className="mt-4 text-base leading-7 text-slate-600" as="p" multiline />
        <Button className="mt-6" variant="outline" asChild>
          <a href={asString(block.props.buttonUrl, '#')}>
            <EditableText block={block} mode={mode} path={['props', 'buttonText']} value={block.props.buttonText} fallback="Read more" onInlineChange={onInlineChange} />
          </a>
        </Button>
      </article>
    </div>
  </BlockShell>
);

const FeaturesBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const cards = asArray<{ title?: string; description?: string }>(block.props.cards);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => (
            <div key={index} className="rounded-lg border bg-white p-5 shadow-sm">
              <EditableText block={block} mode={mode} path={['props', 'cards', index, 'title']} value={card.title} onInlineChange={onInlineChange} className="font-semibold text-slate-950" as="h3" />
              <EditableText block={block} mode={mode} path={['props', 'cards', index, 'description']} value={card.description} onInlineChange={onInlineChange} className="mt-2 text-sm leading-6 text-slate-600" as="p" multiline />
            </div>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const TestimonialsBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const items = asArray<{ name?: string; role?: string; quote?: string; imageUrl?: string }>(block.props.items);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <figure key={index} className="rounded-lg border bg-white p-5 shadow-sm">
              <Quote className="mb-4 size-6 text-primary" />
              <EditableText block={block} mode={mode} path={['props', 'items', index, 'quote']} value={item.quote} onInlineChange={onInlineChange} className="text-base leading-7 text-slate-700" as="blockquote" multiline />
              <figcaption className="mt-4 flex items-center gap-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <div className="size-10 rounded-full bg-slate-200" />
                )}
                <div>
                  <EditableText block={block} mode={mode} path={['props', 'items', index, 'name']} value={item.name} onInlineChange={onInlineChange} className="font-semibold text-slate-950" as="div" />
                  <EditableText block={block} mode={mode} path={['props', 'items', index, 'role']} value={item.role} onInlineChange={onInlineChange} className="text-sm text-slate-500" as="div" />
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const PricingBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const plans = asArray<{ name?: string; price?: string; features?: string[] }>(block.props.plans);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {plans.map((plan, index) => (
            <div key={index} className="rounded-lg border bg-white p-6 shadow-sm">
              <EditableText block={block} mode={mode} path={['props', 'plans', index, 'name']} value={plan.name} onInlineChange={onInlineChange} className="text-xl font-semibold text-slate-950" as="h3" />
              <EditableText block={block} mode={mode} path={['props', 'plans', index, 'price']} value={plan.price} onInlineChange={onInlineChange} className="mt-4 text-4xl font-semibold text-slate-950" as="div" />
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                {asArray<string>(plan.features).map((feature, featureIndex) => (
                  <li key={featureIndex}>
                    <EditableText block={block} mode={mode} path={['props', 'plans', index, 'features', featureIndex]} value={feature} onInlineChange={onInlineChange} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const TeamBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const members = asArray<{ name?: string; role?: string; bio?: string; imageUrl?: string }>(block.props.members);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {members.map((member, index) => (
            <div key={index} className="rounded-lg border bg-white p-5 shadow-sm">
              <EditableMedia block={block} mode={mode} path={['props', 'members', index, 'imageUrl']} value={member.imageUrl} label="Team image" className="aspect-square w-full rounded-lg object-cover" onInlineChange={onInlineChange} />
              <EditableText block={block} mode={mode} path={['props', 'members', index, 'name']} value={member.name} onInlineChange={onInlineChange} className="mt-4 font-semibold text-slate-950" as="h3" />
              <EditableText block={block} mode={mode} path={['props', 'members', index, 'role']} value={member.role} onInlineChange={onInlineChange} className="text-sm text-primary" as="p" />
              <EditableText block={block} mode={mode} path={['props', 'members', index, 'bio']} value={member.bio} onInlineChange={onInlineChange} className="mt-2 text-sm leading-6 text-slate-600" as="p" multiline />
            </div>
          ))}
        </div>
      </div>
    </BlockShell>
  );
};

const LocationBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => (
  <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
    <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-[1fr_1fr]">
      <div>
        <MapPin className="mb-4 size-8 text-primary" />
        <h2 className="text-3xl font-semibold">
          <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
        </h2>
        <div className="mt-5 space-y-2 text-sm leading-6 opacity-80">
          <EditableText block={block} mode={mode} path={['props', 'address']} value={block.props.address} onInlineChange={onInlineChange} as="p" />
          <EditableText block={block} mode={mode} path={['props', 'phone']} value={block.props.phone} onInlineChange={onInlineChange} as="p" />
          <EditableText block={block} mode={mode} path={['props', 'email']} value={block.props.email} onInlineChange={onInlineChange} as="p" />
          <EditableText block={block} mode={mode} path={['props', 'hours']} value={block.props.hours} onInlineChange={onInlineChange} as="p" />
        </div>
      </div>
      <div className="grid min-h-64 place-items-center rounded-lg border bg-slate-100 text-sm text-slate-500">
        Map embed area
      </div>
    </div>
  </BlockShell>
);

const VideoBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => (
  <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
    <div className="mx-auto max-w-5xl px-6">
      <h2 className="text-3xl font-semibold">
        <EditableText block={block} mode={mode} path={['props', 'title']} value={block.props.title} onInlineChange={onInlineChange} />
      </h2>
      <div className="mt-6 grid aspect-video place-items-center rounded-lg bg-black/30">
        {asString(block.props.videoUrl) ? (
          <iframe
            src={asString(block.props.videoUrl)}
            title={asString(block.props.title)}
            className="h-full w-full rounded-lg"
            allowFullScreen
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-white/15">
            <Play className="size-7" />
          </div>
        )}
      </div>
      <EditableText block={block} mode={mode} path={['props', 'caption']} value={block.props.caption} onInlineChange={onInlineChange} className="mt-3 text-sm opacity-70" as="p" />
    </div>
  </BlockShell>
);

const FooterBlock = ({ block, mode, selected, onSelect, onInlineChange }: BlockRendererProps) => {
  const links = asArray<{ label?: string; url?: string }>(block.props.links);
  return (
    <BlockShell block={block} mode={mode} selected={selected} onSelect={onSelect}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <EditableText block={block} mode={mode} path={['props', 'siteName']} value={block.props.siteName} onInlineChange={onInlineChange} className="font-semibold" as="div" />
          <EditableText block={block} mode={mode} path={['props', 'text']} value={block.props.text} onInlineChange={onInlineChange} className="mt-1 text-sm opacity-70" as="p" />
        </div>
        <nav className="flex gap-4 text-sm">
          {links.map((link, index) => (
            <a key={`${link.label}-${index}`} href={asString(link.url, '#')} className="opacity-80 hover:opacity-100">
              <EditableText block={block} mode={mode} path={['props', 'links', index, 'label']} value={link.label} fallback="Link" onInlineChange={onInlineChange} />
            </a>
          ))}
        </nav>
      </div>
    </BlockShell>
  );
};

export const BlockRenderer = memo((props: BlockRendererProps) => {
  switch (props.block.type) {
    case 'navbar':
      return <NavbarBlock {...props} />;
    case 'hero':
      return <HeroBlock {...props} />;
    case 'text':
      return <TextBlock {...props} />;
    case 'stats':
      return <StatsBlock {...props} />;
    case 'featureList':
      return <FeatureListBlock {...props} />;
    case 'image':
      return <ImageBlock {...props} />;
    case 'gallery':
      return <GalleryBlock {...props} />;
    case 'carousel':
      return <CarouselBlock {...props} />;
    case 'cta':
      return <CtaBlock {...props} />;
    case 'contact':
      return <ContactBlock {...props} />;
    case 'faq':
      return <FaqBlock {...props} />;
    case 'accordion':
      return <AccordionBlock {...props} />;
    case 'tabs':
      return <TabsBlock {...props} />;
    case 'timeline':
      return <TimelineBlock {...props} />;
    case 'table':
      return <TableBlock {...props} />;
    case 'codeEmbed':
      return <CodeEmbedBlock {...props} />;
    case 'blogArticle':
      return <BlogArticleBlock {...props} />;
    case 'features':
      return <FeaturesBlock {...props} />;
    case 'testimonials':
      return <TestimonialsBlock {...props} />;
    case 'pricing':
      return <PricingBlock {...props} />;
    case 'team':
      return <TeamBlock {...props} />;
    case 'location':
      return <LocationBlock {...props} />;
    case 'video':
      return <VideoBlock {...props} />;
    case 'footer':
      return <FooterBlock {...props} />;
    default:
      return null;
  }
});

BlockRenderer.displayName = 'BlockRenderer';
