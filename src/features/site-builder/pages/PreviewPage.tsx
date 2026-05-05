import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';
import { PageRenderer } from '../components/blocks/PageRenderer';
import { SetupBlocker } from '../components/shared/SetupBlocker';
import { useBuilderUser } from '../hooks/use-builder-user';
import { getPageById } from '../services/site-builder.service';
import { parseLayout } from '../utils/layout';

export const PreviewPage = () => {
  const { siteId = '', pageId = '' } = useParams();
  const user = useBuilderUser();

  const pageQuery = useQuery({
    queryKey: ['vibe-page-preview', pageId, user?.userId],
    queryFn: () => {
      if (!user) throw new Error('Current SELISE user is not loaded.');
      return getPageById(pageId, user.userId, siteId);
    },
    enabled: Boolean(pageId && user?.userId),
  });

  if (!user) return <SetupBlocker title="Authentication required" />;
  if (pageQuery.error) return <SetupBlocker title="Preview unavailable" error={pageQuery.error} />;
  if (pageQuery.isLoading) return <div className="p-6 text-sm text-slate-500">Loading preview...</div>;
  if (!pageQuery.data) return <SetupBlocker title="Page not found" />;

  const layout = parseLayout(pageQuery.data.draftLayoutJson || pageQuery.data.layoutJson, siteId, pageId);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3">
        <div>
          <div className="text-sm font-semibold">{pageQuery.data.title}</div>
          <div className="text-xs text-slate-500">Draft preview</div>
        </div>
        <Button size="sm" asChild>
          <Link to={`/vibe-builder/${siteId}/editor/${pageId}`}>Back to builder</Link>
        </Button>
      </div>
      <PageRenderer layout={layout} mode="preview" siteId={siteId} pageId={pageId} />
    </div>
  );
};
