import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Textarea } from '@/components/ui-kit/textarea';
import { getSiteById, updateSite } from '../services/site-builder.service';
import { useBuilderUser } from '../hooks/use-builder-user';
import { ensureSlug } from '../utils/slugify';
import { SetupBlocker } from '../components/shared/SetupBlocker';

export const SiteSettingsPage = () => {
  const { siteId = '' } = useParams();
  const user = useBuilderUser();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const siteQuery = useQuery({
    queryKey: ['vibe-site', siteId, user?.userId],
    queryFn: () => {
      if (!user) throw new Error('Current SELISE user is not loaded.');
      return getSiteById(siteId, user.userId);
    },
    enabled: Boolean(siteId && user?.userId),
  });

  useEffect(() => {
    if (!siteQuery.data) return;
    setName(siteQuery.data.name);
    setSlug(siteQuery.data.slug);
    setDescription(siteQuery.data.description || '');
  }, [siteQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('User not loaded.');
      return updateSite(siteId, user.userId, {
        name,
        slug: ensureSlug(slug || name, 'site'),
        description,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vibe-site'] }),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  if (!user) return <SetupBlocker title="Authentication required" />;

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to={`/vibe-builder/${siteId}`}>
            <ArrowLeft className="size-4" />
            Pages
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-slate-950">Site Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Update the SELISE Site record.</p>
      </div>

      {siteQuery.error && <SetupBlocker title="Site schema unavailable" error={siteQuery.error} />}
      {saveMutation.error && <SetupBlocker title="Could not save settings" error={saveMutation.error} />}

      <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border bg-white p-5 shadow-sm">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Website name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Slug</span>
          <Input value={slug} onChange={(event) => setSlug(ensureSlug(event.target.value, ''))} required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Description</span>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} height="120px" />
        </label>
        <div>
          <Button type="submit" loading={saveMutation.isPending}>
            <Save className="size-4" />
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
};
