import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Globe2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui-kit/badge';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Textarea } from '@/components/ui-kit/textarea';
import { createSite, deleteSite, listSites } from '../services/site-builder.service';
import { useBuilderUser } from '../hooks/use-builder-user';
import { ensureSlug } from '../utils/slugify';
import { SetupBlocker } from '../components/shared/SetupBlocker';

export const SitesPage = () => {
  const user = useBuilderUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const sitesQuery = useQuery({
    queryKey: ['vibe-sites', user?.userId],
    queryFn: () => {
      if (!user) throw new Error('Current SELISE user is not loaded.');
      return listSites(user.userId);
    },
    enabled: Boolean(user?.userId),
  });

  const createMutation = useMutation({
    mutationFn: createSite,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['vibe-sites'] });
      setName('');
      setSlug('');
      setDescription('');
      if (result.itemId) navigate(`/vibe-builder/${result.itemId}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ siteId, ownerUserId }: { siteId: string; ownerUserId: string }) =>
      deleteSite(siteId, ownerUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vibe-sites'] }),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    createMutation.mutate({
      ownerUserId: user.userId,
      workspaceId: user.workspaceId,
      name,
      slug: ensureSlug(slug || name, 'site'),
      description,
    });
  };

  if (!user) {
    return <SetupBlocker title="Authentication required" error={new Error('Current SELISE user is not loaded yet.')} />;
  }

  return (
    <div className="vibe-studio-frame mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-6 rounded-xl p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase vibe-pill">
            SELISE website builder
          </div>
          <h1 className="vibe-hero-title max-w-2xl text-4xl font-semibold text-slate-950 md:text-5xl">
            Design it. Shape it. Publish it.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Websites are filtered by the authenticated SELISE owner/workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/vibe-builder">Open builder</Link>
          </Button>
          <Button asChild>
            <a href="#create-site">
              <Plus className="size-4" />
              New site
            </a>
          </Button>
        </div>
      </div>

      {sitesQuery.error && <SetupBlocker title="Sites schema unavailable" error={sitesQuery.error} />}
      {createMutation.error && <SetupBlocker title="Could not create site" error={createMutation.error} />}
      {deleteMutation.error && <SetupBlocker title="Could not delete site" error={deleteMutation.error} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(sitesQuery.data?.items || []).map((site) => (
          <article key={site.id} className="vibe-site-card rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Globe2 className="size-4 text-primary" />
                  <h2 className="truncate text-lg font-semibold text-slate-950">{site.name}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">/{site.slug}</p>
              </div>
              <Badge variant={site.status === 'active' ? 'secondary' : 'outline'}>{site.status}</Badge>
            </div>
            <p className="mt-4 min-h-10 text-sm leading-6 text-slate-600">{site.description || 'No description yet.'}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link to={`/vibe-builder/${site.id}`}>Pages</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/vibe/${site.slug}`} target="_blank">
                  <ExternalLink className="size-4" />
                  Live
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => deleteMutation.mutate({ siteId: site.id, ownerUserId: user.userId })}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>

      {!sitesQuery.isLoading && !sitesQuery.error && (sitesQuery.data?.items || []).length === 0 && (
        <div className="vibe-glass-panel rounded-lg border border-dashed bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-950">No sites yet</h2>
          <p className="mt-2 text-sm text-slate-500">Create your first SELISE-backed website project.</p>
        </div>
      )}

      <form id="create-site" onSubmit={onSubmit} className="vibe-create-panel grid gap-4 rounded-lg border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Create website</h2>
          <p className="text-sm text-slate-500">A Site record will be inserted through SELISE Data Gateway.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Website name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Slug</span>
            <Input
              value={slug}
              onChange={(event) => setSlug(ensureSlug(event.target.value, ''))}
              placeholder={ensureSlug(name, 'my-site')}
            />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Description</span>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} height="96px" />
        </label>
        <div>
          <Button type="submit" loading={createMutation.isPending}>
            <Plus className="size-4" />
            Create site
          </Button>
        </div>
      </form>
    </div>
  );
};
