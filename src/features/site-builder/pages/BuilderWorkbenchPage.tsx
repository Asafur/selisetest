import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, Database, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';
import { BuilderWorkspace } from '../components/builder/BuilderWorkspace';
import { createTemplateLayout } from '../constants/templates';
import { PageLayout } from '../types';

export const BuilderWorkbenchPage = () => {
  const initialLayout = useMemo(
    () => createTemplateLayout('Business', 'workbench-site', 'workbench-page'),
    []
  );
  const [layout, setLayout] = useState<PageLayout>(initialLayout);
  const [past, setPast] = useState<PageLayout[]>([]);
  const [future, setFuture] = useState<PageLayout[]>([]);

  const applyLayout = useCallback((nextLayout: PageLayout) => {
    setLayout((current) => {
      setPast((items) => [...items.slice(-24), current]);
      return nextLayout;
    });
    setFuture([]);
  }, []);

  const undo = () => {
    const previous = past[past.length - 1];
    if (!previous) return;
    setFuture((items) => [layout, ...items]);
    setPast((items) => items.slice(0, -1));
    setLayout(previous);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setPast((items) => [...items, layout]);
    setFuture((items) => items.slice(1));
    setLayout(next);
  };

  const showSetupMessage = () => {
    window.alert(
      'This demo canvas is only for trying the editor. To save for real, open SELISE Sites, create a site and page, then open that page in Builder.'
    );
  };

  return (
    <BuilderWorkspace
      siteId="workbench-site"
      pageId="workbench-page"
      siteName="YourBrand"
      pageTitle="Business landing page"
      backTo="/vibe-builder/sites"
      previewTo="/vibe/demo-site"
      themeTo="/vibe-builder/sites"
      mediaTo="/vibe-builder/sites"
      notice={
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <div className="font-semibold">Visual builder workbench</div>
              <div className="text-amber-800">
                Try drag, reorder, and double-click editing here. To save/autosave/publish for real, create a site and page in SELISE Sites, then open that page in Builder.
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/vibe-builder/sites">
                <Database className="size-4" />
                SELISE sites
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/vibe/demo-site" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Live routes
              </a>
            </Button>
          </div>
        </div>
      }
      layout={layout}
      onLayoutChange={applyLayout}
      onSave={showSetupMessage}
      onPublish={showSetupMessage}
      onUndo={undo}
      onRedo={redo}
      canUndo={past.length > 0}
      canRedo={future.length > 0}
      saveState={past.length > 0 ? 'dirty' : 'idle'}
    />
  );
};
