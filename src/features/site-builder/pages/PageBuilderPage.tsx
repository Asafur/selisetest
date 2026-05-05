import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { BuilderWorkspace } from '../components/builder/BuilderWorkspace';
import { SetupBlocker } from '../components/shared/SetupBlocker';
import { useBuilderUser } from '../hooks/use-builder-user';
import {
  getPageById,
  getSiteById,
  publishPage,
  updatePage,
  uploadAssetAndReturnUrl,
} from '../services/site-builder.service';
import { PageLayout, SaveState } from '../types';
import { parseLayout, serializeLayout } from '../utils/layout';

export const PageBuilderPage = () => {
  const { siteId = '', pageId = '' } = useParams();
  const user = useBuilderUser();
  const queryClient = useQueryClient();
  const [layout, setLayout] = useState<PageLayout | null>(null);
  const [past, setPast] = useState<PageLayout[]>([]);
  const [future, setFuture] = useState<PageLayout[]>([]);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const hydratedPageRef = useRef<string | null>(null);

  const siteQuery = useQuery({
    queryKey: ['vibe-site', siteId, user?.userId],
    queryFn: () => {
      if (!user) throw new Error('Current SELISE user is not loaded.');
      return getSiteById(siteId, user.userId);
    },
    enabled: Boolean(siteId && user?.userId),
  });

  const pageQuery = useQuery({
    queryKey: ['vibe-page', pageId, user?.userId],
    queryFn: () => {
      if (!user) throw new Error('Current SELISE user is not loaded.');
      return getPageById(pageId, user.userId, siteId);
    },
    enabled: Boolean(pageId && user?.userId),
  });

  useEffect(() => {
    if (!pageQuery.data || hydratedPageRef.current === pageQuery.data.id) return;
    const nextLayout = parseLayout(
      pageQuery.data.draftLayoutJson || pageQuery.data.layoutJson,
      pageQuery.data.siteId,
      pageQuery.data.id
    );
    setLayout(nextLayout);
    setPast([]);
    setFuture([]);
    setSaveState('saved');
    hydratedPageRef.current = pageQuery.data.id;
  }, [pageQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (layoutToSave: PageLayout) => {
      if (!user) throw new Error('User not loaded.');
      const serialized = serializeLayout(layoutToSave);
      return updatePage(pageId, user.userId, {
        layoutJson: serialized,
        draftLayoutJson: serialized,
      });
    },
    onMutate: () => setSaveState('saving'),
    onSuccess: () => {
      setSaveState('saved');
      queryClient.invalidateQueries({ queryKey: ['vibe-page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['vibe-pages', siteId] });
    },
    onError: () => setSaveState('error'),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!pageQuery.data || !user || !layout) throw new Error('Page is not ready to publish.');
      return publishPage(pageQuery.data, user.userId, layout);
    },
    onSuccess: () => {
      setSaveState('saved');
      queryClient.invalidateQueries({ queryKey: ['vibe-page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['vibe-pages', siteId] });
    },
  });

  useEffect(() => {
    if (!layout || saveState !== 'dirty') return;
    const timeout = window.setTimeout(() => saveMutation.mutate(layout), 1400);
    return () => window.clearTimeout(timeout);
  }, [layout, saveMutation, saveState]);

  const applyLayout = useCallback(
    (nextLayout: PageLayout) => {
      setLayout((current) => {
        if (current) setPast((items) => [...items.slice(-24), current]);
        return nextLayout;
      });
      setFuture([]);
      setSaveState('dirty');
    },
    [setLayout]
  );

  const undo = () => {
    const previous = past[past.length - 1];
    if (!previous || !layout) return;
    setFuture((items) => [layout, ...items]);
    setPast((items) => items.slice(0, -1));
    setLayout(previous);
    setSaveState('dirty');
  };

  const redo = () => {
    const next = future[0];
    if (!next || !layout) return;
    setPast((items) => [...items, layout]);
    setFuture((items) => items.slice(1));
    setLayout(next);
    setSaveState('dirty');
  };

  if (!user) return <SetupBlocker title="Authentication required" />;
  if (siteQuery.error) return <SetupBlocker title="Site schema unavailable" error={siteQuery.error} />;
  if (pageQuery.error) return <SetupBlocker title="Page schema unavailable" error={pageQuery.error} />;
  if (saveMutation.error) return <SetupBlocker title="Autosave failed" error={saveMutation.error} />;
  if (publishMutation.error) return <SetupBlocker title="Publish failed" error={publishMutation.error} />;
  if (!layout || pageQuery.isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading builder...</div>;
  }
  if (!pageQuery.data) return <SetupBlocker title="Page not found" />;

  return (
    <BuilderWorkspace
      siteId={siteId}
      pageId={pageId}
      siteName={siteQuery.data?.name}
      pageTitle={pageQuery.data.title}
      layout={layout}
      onLayoutChange={applyLayout}
      onSave={() => saveMutation.mutate(layout)}
      onPublish={() => {
        if (window.confirm('Publish this draft layout to the live website?')) publishMutation.mutate();
      }}
      onUploadMedia={(file) => {
        if (!user) throw new Error('User not loaded.');
        return uploadAssetAndReturnUrl({
          siteId,
          ownerUserId: user.userId,
          workspaceId: user.workspaceId,
          file,
        });
      }}
      onUndo={undo}
      onRedo={redo}
      canUndo={past.length > 0}
      canRedo={future.length > 0}
      saveState={saveState}
    />
  );
};
