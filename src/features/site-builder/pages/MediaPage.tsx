import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { deleteAsset, getSiteById, listAssets, uploadAsset } from '../services/site-builder.service';
import { useBuilderUser } from '../hooks/use-builder-user';
import { SetupBlocker } from '../components/shared/SetupBlocker';

export const MediaPage = () => {
  const { siteId = '' } = useParams();
  const user = useBuilderUser();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const siteQuery = useQuery({
    queryKey: ['vibe-site', siteId, user?.userId],
    queryFn: () => {
      if (!user) throw new Error('Current SELISE user is not loaded.');
      return getSiteById(siteId, user.userId);
    },
    enabled: Boolean(siteId && user?.userId),
  });

  const assetsQuery = useQuery({
    queryKey: ['vibe-assets', siteId, user?.userId],
    queryFn: () => {
      if (!user) throw new Error('Current SELISE user is not loaded.');
      return listAssets(siteId, user.userId);
    },
    enabled: Boolean(siteId && user?.userId),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file || !user) throw new Error('Choose a file first.');
      return uploadAsset({ siteId, ownerUserId: user.userId, workspaceId: user.workspaceId, file });
    },
    onSuccess: () => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['vibe-assets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ assetId }: { assetId: string }) => {
      if (!user) throw new Error('User not loaded.');
      return deleteAsset(siteId, assetId, user.userId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vibe-assets'] }),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    uploadMutation.mutate();
  };

  if (!user) return <SetupBlocker title="Authentication required" />;

  return (
    <div className="vibe-studio-frame mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-6 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to={`/vibe-builder/${siteId}`}>
              <ArrowLeft className="size-4" />
              Pages
            </Link>
          </Button>
          <div className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase vibe-pill">
            SELISE Media
          </div>
          <h1 className="vibe-hero-title text-4xl font-semibold text-slate-950 md:text-5xl">Media Library</h1>
          <p className="mt-3 text-sm text-slate-500">{siteQuery.data?.name || 'SELISE media assets'}</p>
        </div>
      </div>

      {siteQuery.error && <SetupBlocker title="Site schema unavailable" error={siteQuery.error} />}
      {assetsQuery.error && <SetupBlocker title="Asset schema unavailable" error={assetsQuery.error} />}
      {uploadMutation.error && <SetupBlocker title="Media upload unavailable" error={uploadMutation.error} />}
      {deleteMutation.error && <SetupBlocker title="Could not delete media record" error={deleteMutation.error} />}

      <form onSubmit={onSubmit} className="vibe-create-panel flex flex-col gap-3 rounded-lg border bg-white p-5 shadow-sm md:flex-row md:items-end">
        <label className="grid flex-1 gap-1 text-sm">
          <span className="font-medium">Upload image/media</span>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="rounded-md border bg-white p-2 text-sm"
          />
        </label>
        <Button type="submit" loading={uploadMutation.isPending} disabled={!file}>
          <Upload className="size-4" />
          Upload to SELISE
        </Button>
      </form>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {(assetsQuery.data?.items || []).map((asset) => (
          <article key={asset.id} className="vibe-media-card rounded-lg border bg-white p-3 shadow-sm">
            {asset.fileType?.startsWith('image') && asset.fileUrl ? (
              <img src={asset.fileUrl} alt="" className="aspect-video w-full rounded-md object-cover" />
            ) : (
              <div className="grid aspect-video place-items-center rounded-md bg-slate-100 text-sm text-slate-500">
                {asset.fileType || 'File'}
              </div>
            )}
            <div className="mt-3 min-w-0">
              <div className="truncate text-sm font-semibold text-slate-950">{asset.fileName}</div>
              <div className="text-xs text-slate-500">{Math.round((asset.fileSize || 0) / 1024)} KB</div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-3 text-destructive"
              onClick={() => deleteMutation.mutate({ assetId: asset.id })}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </article>
        ))}
      </div>

      {!assetsQuery.isLoading && !assetsQuery.error && (assetsQuery.data?.items || []).length === 0 && (
        <div className="vibe-glass-panel rounded-lg border border-dashed bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-950">No media yet</h2>
          <p className="mt-2 text-sm text-slate-500">Uploaded files will be stored through SELISE Storage/Media.</p>
        </div>
      )}
    </div>
  );
};
