import { PageLayout } from '../../types';
import { BlockRenderer } from './BlockRenderer';

export const PageRenderer = ({
  layout,
  mode = 'live',
  siteId,
  pageId,
}: {
  layout: PageLayout;
  mode?: 'editor' | 'preview' | 'live';
  siteId?: string;
  pageId?: string;
}) => (
  <div className="min-h-screen bg-white">
    {layout.blocks.map((block) => (
      <BlockRenderer key={block.id} block={block} mode={mode} siteId={siteId} pageId={pageId} />
    ))}
  </div>
);
