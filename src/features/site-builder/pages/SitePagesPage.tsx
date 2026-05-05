import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, FilePlus2, Palette, Settings, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui-kit/badge';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { createTemplateLayout, TemplateOption, templateOptions } from '../constants/templates';
import {
  createPage,
  deletePage,
  getSiteById,
  listPages,
  publishPage,
  updatePage,
  updateSite,
} from '../services/site-builder.service';
import { useBuilderUser } from '../hooks/use-builder-user';
import { ensureSlug } from '../utils/slugify';
import { parseLayout } from '../utils/layout';
import { SetupBlocker } from '../components/shared/SetupBlocker';

export const SitePagesPage = () => {
  const { siteId = '' } = useParams();
  const user = useBuilderUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [template, setTemplate] = useState<TemplateOption>('Blank');

  const siteQuery = useQuery({
    queryKey: ['vibe-site', siteId, user?.userId],
    queryFn: () => {
      if (!user) throw new Error('Current SELISE user is not loaded.');
      return getSiteById(siteId, user.userId);
    },
    enabled: Boolean(siteId && user?.userId),
  });

  const pagesQuery = useQuery({
    queryKey: ['vibe-pages', siteId, user?.userId],
    queryFn: () => {
      if (!user) throw new Error('Current SELISE user is not loaded.');
      return listPages(siteId, user.userId);
    },
    enabled: Boolean(siteId && user?.userId),
  });

  const createMutation = useMutation({
    mutationFn: createPage,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['vibe-pages'] });
      setTitle('');
      setSlug('');
      setTemplate('Blank');
      if (result.itemId) navigate(`/vibe-builder/${siteId}/editor/${result.itemId}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ pageId, ownerUserId }: { pageId: string; ownerUserId: string }) =>
      deletePage(pageId, ownerUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vibe-pages'] }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ pageId }: { pageId: string }) => {
      const page = pagesQuery.data?.items.find((item) => item.id === pageId);
      if (!page || !user) throw new Error('Page not loaded.');
      const layout = parseLayout(page.draftLayoutJson || page.layoutJson, page.siteId, page.id);
      return publishPage(page, user.userId, layout);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vibe-pages'] }),
  });

  const homeMutation = useMutation({
    mutationFn: async ({ pageId }: { pageId: string }) => {
      if (!user) throw new Error('User not loaded.');
      const result = await updateSite(siteId, user.userId, { homepagePageId: pageId });
      await Promise.all(
        (pagesQuery.data?.items || []).map((page) =>
          updatePage(page.id, user.userId, { isHomePage: page.id === pageId })
        )
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibe-site'] });
      queryClient.invalidateQueries({ queryKey: ['vibe-pages'] });
    },
  });

  const onCreatePage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    createMutation.mutate({
      siteId,
      ownerUserId: user.userId,
      workspaceId: user.workspaceId,
      title,
      slug: ensureSlug(slug || title, 'page'),
      isHomePage: (pagesQuery.data?.items || []).length === 0,
      sortOrder: (pagesQuery.data?.items || []).length + 1,
      layout: createTemplateLayout(template, siteId),
    });
  };

  if (!user) return <SetupBlocker title="Authentication required" />;

  return (
    <div className="vibe-studio-frame mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-6 rounded-xl p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase vibe-pill">
            Pages and drafts
          </div>
          <h1 className="vibe-hero-title text-4xl font-semibold text-slate-950 md:text-5xl">
            {siteQuery.data?.name || 'Website pages'}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Create draft pages, open the builder, and publish live versions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to={`/vibe-builder/${siteId}/media`}>
              <Upload className="size-4" />
              Media
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/vibe-builder/${siteId}/theme`}>
              <Palette className="size-4" />
              Theme
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/vibe-builder/${siteId}/settings`}>
              <Settings className="size-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {siteQuery.error && <SetupBlocker title="Site schema unavailable" error={siteQuery.error} />}
      {pagesQuery.error && <SetupBlocker title="Pages schema unavailable" error={pagesQuery.error} />}
      {createMutation.error && <SetupBlocker title="Could not create page" error={createMutation.error} />}
      {deleteMutation.error && <SetupBlocker title="Could not delete page" error={deleteMutation.error} />}
      {publishMutation.error && <SetupBlocker title="Could not publish page" error={publishMutation.error} />}
      {homeMutation.error && <SetupBlocker title="Could not update homepage" error={homeMutation.error} />}

      <div className="grid gap-3">
        {(pagesQuery.data?.items || []).map((page) => (
          <article key={page.id} className="vibe-page-card flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-semibold text-slate-950">{page.title}</h2>
                <Badge variant={page.status === 'published' ? 'secondary' : 'outline'}>{page.status}</Badge>
                {(siteQuery.data?.homepagePageId === page.id || page.isHomePage) && <Badge>Home</Badge>}
              </div>
              <p className="mt-1 text-sm text-slate-500">/{page.slug}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link to={`/vibe-builder/${siteId}/editor/${page.id}`}>Builder</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/vibe/${siteQuery.data?.slug || 'site'}/${page.slug}`} target="_blank">
                  <ExternalLink className="size-4" />
                  Live
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => publishMutation.mutate({ pageId: page.id })}>
                Publish
              </Button>
              <Button size="sm" variant="outline" onClick={() => homeMutation.mutate({ pageId: page.id })}>
                Set home
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => deleteMutation.mutate({ pageId: page.id, ownerUserId: user.userId })}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>

      {!pagesQuery.isLoading && !pagesQuery.error && (pagesQuery.data?.items || []).length === 0 && (
        <div className="vibe-glass-panel rounded-lg border border-dashed bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-950">No pages yet</h2>
          <p className="mt-2 text-sm text-slate-500">Create a page before opening the visual builder.</p>
        </div>
      )}

      <form onSubmit={onCreatePage} className="vibe-create-panel grid gap-4 rounded-lg border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Create page</h2>
          <p className="text-sm text-slate-500">The initial layout JSON is saved into the Page draft fields.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Page title</span>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Slug</span>
            <Input
              value={slug}
              onChange={(event) => setSlug(ensureSlug(event.target.value, ''))}
              placeholder={ensureSlug(title, 'page')}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Template</span>
            <select
              value={template}
              onChange={(event) => setTemplate(event.target.value as TemplateOption)}
              className="h-11 rounded-md border bg-white px-3 text-sm"
            >
              {templateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="vibe-template-strip">
          {templateOptions.slice(0, 6).map((option) => (
            <button
              key={option}
              type="button"
              className={`vibe-template-option ${template === option ? 'is-active' : ''}`}
              onClick={() => setTemplate(option)}
            >
              <div className="vibe-template-swatch" />
              <div className="mt-2 text-xs font-semibold text-slate-950">{option}</div>
              <div className="mt-1 text-[11px] leading-4 text-slate-500">
                {option === 'Blank' ? 'Start from an empty page.' : 'Starter JSON layout ready for editing.'}
              </div>
            </button>
          ))}
        </div>
        <div>
          <Button type="submit" loading={createMutation.isPending}>
            <FilePlus2 className="size-4" />
            Create page
          </Button>
        </div>
      </form>
    </div>
  );
};
