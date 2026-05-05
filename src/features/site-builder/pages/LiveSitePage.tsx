import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';
import { PageRenderer } from '../components/blocks/PageRenderer';
import { SetupBlocker } from '../components/shared/SetupBlocker';
import { getPublishedPage, getPublishedSiteBySlug, listPages } from '../services/site-builder.service';
import { parseLayout } from '../utils/layout';

export const LiveSitePage = () => {
  const { siteSlug = '', pageSlug } = useParams();

  const siteQuery = useQuery({
    queryKey: ['vibe-public-site', siteSlug],
    queryFn: () => getPublishedSiteBySlug(siteSlug),
    enabled: Boolean(siteSlug),
  });

  const pageQuery = useQuery({
    queryKey: ['vibe-public-page', siteQuery.data?.id, pageSlug],
    queryFn: () => {
      if (!siteQuery.data) throw new Error('Published site is not loaded.');
      return getPublishedPage(siteQuery.data.id, pageSlug);
    },
    enabled: Boolean(siteQuery.data?.id),
  });

  const publishedPagesQuery = useQuery({
    queryKey: ['vibe-public-nav-pages', siteQuery.data?.id],
    queryFn: async () => {
      if (!siteQuery.data?.ownerUserId) return { items: [], totalCount: 0 };
      return listPages(siteQuery.data.id, siteQuery.data.ownerUserId);
    },
    enabled: Boolean(siteQuery.data?.id && siteQuery.data?.ownerUserId),
  });

  if (siteQuery.error) return <SetupBlocker title="Public site unavailable" error={siteQuery.error} />;
  if (pageQuery.error) return <SetupBlocker title="Published page unavailable" error={pageQuery.error} />;
  if (siteQuery.isLoading || pageQuery.isLoading) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading live site...</div>;
  }
  if (!siteQuery.data || !pageQuery.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold text-slate-950">Published page not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            The site/page either is not published or public SELISE read access is not configured.
          </p>
          <Button className="mt-5" asChild>
            <Link to="/vibe-builder">Open builder</Link>
          </Button>
        </div>
      </div>
    );
  }

  const layout = parseLayout(pageQuery.data.publishedLayoutJson, siteQuery.data.id, pageQuery.data.id);
  const navPages = (publishedPagesQuery.data?.items || []).filter((page) => page.status === 'published');

  return (
    <div className="min-h-screen bg-white">
      {navPages.length > 0 && (
        <div className="sticky top-0 z-20 border-b bg-white/95 px-6 py-3 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between">
            <Link to={`/vibe/${siteSlug}`} className="text-sm font-semibold text-slate-950">
              {siteQuery.data.name}
            </Link>
            <div className="flex gap-4 text-sm">
              {navPages.map((page) => (
                <Link key={page.id} to={`/vibe/${siteSlug}/${page.slug}`} className="text-slate-600 hover:text-primary">
                  {page.title}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
      <PageRenderer layout={layout} mode="live" siteId={siteQuery.data.id} pageId={pageQuery.data.id} />
    </div>
  );
};
