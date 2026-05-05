import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Code2,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  LayoutGrid,
  ListChecks,
  PanelLeft,
  Plus,
  Redo2,
  Save,
  Send,
  Settings2,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui-kit/badge';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Textarea } from '@/components/ui-kit/textarea';
import { blockDefinitions, createBlock } from '../../constants/block-registry';
import { BlockType, PageLayout, SaveState, VibeBlock } from '../../types';
import { moveItem } from '../../utils/layout';
import { BlockRenderer } from '../blocks/BlockRenderer';

type BuilderWorkspaceProps = {
  siteId: string;
  pageId: string;
  siteName?: string;
  pageTitle?: string;
  backTo?: string;
  previewTo?: string;
  themeTo?: string;
  mediaTo?: string;
  notice?: React.ReactNode;
  layout: PageLayout;
  onLayoutChange: (layout: PageLayout) => void;
  onSave: () => void;
  onPublish: () => void;
  onUploadMedia?: (file: File) => Promise<string>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveState: SaveState;
};

const stateLabel: Record<SaveState, string> = {
  idle: 'Ready',
  dirty: 'Unsaved changes',
  saving: 'Saving',
  saved: 'Saved',
  error: 'Error saving',
};

const categoryIcons = {
  Structure: LayoutGrid,
  Content: ListChecks,
  Media: ImageIcon,
  Marketing: Layers3,
  Business: Code2,
};

const LibraryItem = ({ type, label, description }: { type: BlockType; label: string; description: string }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${type}`,
    data: { source: 'library', blockType: type },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`vibe-library-card w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-primary hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">{label}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
        </div>
        <Plus className="mt-0.5 size-4 shrink-0 text-primary" />
      </div>
    </button>
  );
};

const SortableBlock = ({
  block,
  selected,
  onSelect,
  onRemove,
  onInlineChange,
}: {
  block: VibeBlock;
  selected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onInlineChange: (blockId: string, path: Array<string | number>, value: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: 'canvas', blockId: block.id },
  });
  const definition = blockDefinitions.find((item) => item.type === block.type);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`vibe-canvas-block group relative rounded-lg border bg-white shadow-sm transition ${
        selected ? 'is-selected border-primary shadow-primary/10' : 'border-slate-200'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => onSelect(block.id)}
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-950">{definition?.label || block.type}</div>
          <div className="text-xs text-slate-500">Type: {block.type}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="grid size-8 cursor-grab place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            title="Drag section"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" />
          </button>
        </div>
      </div>
      <div className="overflow-hidden">
        <BlockRenderer
          block={block}
          mode="editor"
          selected={selected}
          onSelect={onSelect}
          onInlineChange={onInlineChange}
        />
      </div>
      <div className="flex justify-end border-t px-4 py-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(block.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete section
        </button>
      </div>
    </div>
  );
};

const CanvasDropZone = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-dropzone' });
  return (
    <div
      ref={setNodeRef}
      className={`vibe-drop-zone min-h-[560px] rounded-lg border border-dashed bg-slate-50 p-4 ${
        isOver ? 'is-over border-primary bg-primary/5' : 'border-slate-200'
      }`}
    >
      {children}
    </div>
  );
};

const getPropInputType = (key: string, value: unknown) => {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'checkbox';
  if (/color/i.test(key)) return 'color';
  if (typeof value === 'string' && value.length > 80) return 'textarea';
  if (Array.isArray(value) || (value && typeof value === 'object')) return 'json';
  return 'text';
};

const setValueAtPath = (value: unknown, path: Array<string | number>, nextValue: unknown): unknown => {
  if (path.length === 0) return nextValue;
  const [head, ...tail] = path;

  if (Array.isArray(value)) {
    const copy = [...value];
    copy[Number(head)] = setValueAtPath(copy[Number(head)], tail, nextValue);
    return copy;
  }

  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    ...source,
    [head]: setValueAtPath(source[String(head)], tail, nextValue),
  };
};

const PropertyEditor = ({
  block,
  onChange,
  onUploadMedia,
}: {
  block: VibeBlock | undefined;
  onChange: (blockId: string, updater: (block: VibeBlock) => VibeBlock) => void;
  onUploadMedia?: (file: File) => Promise<string>;
}) => {
  const [jsonDrafts, setJsonDrafts] = useState<Record<string, string>>({});
  const [uploadingKey, setUploadingKey] = useState('');
  const [uploadError, setUploadError] = useState('');

  if (!block) {
    return (
      <div className="vibe-glass-panel rounded-lg border bg-white p-4 text-sm text-slate-500">
        Select a component to edit its properties.
      </div>
    );
  }

  const updateProp = (key: string, value: unknown) => {
    onChange(block.id, (current) => ({
      ...current,
      props: {
        ...current.props,
        [key]: value,
      },
    }));
  };

  const updateStyle = (key: string, value: unknown) => {
    onChange(block.id, (current) => ({
      ...current,
      style: {
        ...current.style,
        [key]: value,
      },
    }));
  };

  const renderControl = (
    key: string,
    value: unknown,
    onValueChange: (key: string, value: unknown) => void,
    group: 'props' | 'style'
  ) => {
    const inputType = getPropInputType(key, value);
    const draftKey = `${group}.${key}`;

    if (inputType === 'checkbox') {
      return (
        <label className="flex items-center gap-2 text-sm" key={draftKey}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onValueChange(key, event.target.checked)}
          />
          {key}
        </label>
      );
    }

    if (inputType === 'textarea') {
      return (
        <label className="grid gap-1 text-sm" key={draftKey}>
          <span className="font-medium">{key}</span>
          <Textarea value={String(value || '')} height="92px" onChange={(event) => onValueChange(key, event.target.value)} />
        </label>
      );
    }

    if (inputType === 'json' && Array.isArray(value)) {
      const arrayValue = value as unknown[];
      const objectKeys = Array.from(
        new Set(
          arrayValue.flatMap((item) =>
            item && typeof item === 'object' && !Array.isArray(item) ? Object.keys(item as Record<string, unknown>) : []
          )
        )
      );
      const currentDraft = jsonDrafts[draftKey] ?? JSON.stringify(value ?? null, null, 2);
      const updateArray = (nextArray: unknown[]) => onValueChange(key, nextArray);
      const updateArrayPath = (path: Array<string | number>, nextValue: unknown) =>
        updateArray(setValueAtPath(arrayValue, path, nextValue) as unknown[]);
      const createEmptyItem = () =>
        objectKeys.length
          ? objectKeys.reduce<Record<string, unknown>>((next, itemKey) => {
              next[itemKey] = '';
              return next;
            }, {})
          : '';

      return (
        <div className="grid gap-2 text-sm" key={draftKey}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{key}</span>
            <button
              type="button"
              className="rounded-md border px-2 py-1 text-xs font-semibold hover:bg-slate-100"
              onClick={() => updateArray([...arrayValue, createEmptyItem()])}
            >
              Add item
            </button>
          </div>
          <div className="grid gap-2">
            {arrayValue.map((item, itemIndex) => (
              <div key={`${draftKey}.${itemIndex}`} className="grid gap-2 rounded-md border bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase text-slate-500">Item {itemIndex + 1}</span>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    onClick={() => updateArray(arrayValue.filter((_, index) => index !== itemIndex))}
                  >
                    Remove
                  </button>
                </div>
                {Array.isArray(item) ? (
                  <Textarea
                    value={item.map((cell) => String(cell ?? '')).join(' | ')}
                    height="72px"
                    onChange={(event) =>
                      updateArrayPath([itemIndex], event.target.value.split('|').map((cell) => cell.trim()))
                    }
                  />
                ) : item && typeof item === 'object' ? (
                  <div className="grid gap-2">
                    {Object.entries(item as Record<string, unknown>).map(([itemKey, itemValue]) => (
                      <label key={`${draftKey}.${itemIndex}.${itemKey}`} className="grid gap-1">
                        <span className="text-xs font-medium text-slate-500">{itemKey}</span>
                        {Array.isArray(itemValue) ? (
                          <Textarea
                            value={itemValue.map((entry) => String(entry ?? '')).join('\n')}
                            height="84px"
                            onChange={(event) =>
                              updateArrayPath(
                                [itemIndex, itemKey],
                                event.target.value
                                  .split('\n')
                                  .map((entry) => entry.trim())
                                  .filter(Boolean)
                              )
                            }
                          />
                        ) : (
                          <Input
                            value={String(itemValue ?? '')}
                            onChange={(event) => updateArrayPath([itemIndex, itemKey], event.target.value)}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <Input value={String(item ?? '')} onChange={(event) => updateArrayPath([itemIndex], event.target.value)} />
                )}
              </div>
            ))}
          </div>
          <details className="rounded-md border bg-slate-50 p-2">
            <summary className="cursor-pointer text-xs font-semibold text-slate-500">Advanced JSON</summary>
            <Textarea
              value={currentDraft}
              height="132px"
              className="mt-2 font-mono text-xs"
              onChange={(event) => setJsonDrafts((drafts) => ({ ...drafts, [draftKey]: event.target.value }))}
              onBlur={() => {
                try {
                  onValueChange(key, JSON.parse(currentDraft));
                } catch {
                  setJsonDrafts((drafts) => ({ ...drafts, [draftKey]: JSON.stringify(value ?? null, null, 2) }));
                }
              }}
            />
          </details>
        </div>
      );
    }

    if (inputType === 'json') {
      const currentDraft = jsonDrafts[draftKey] ?? JSON.stringify(value ?? null, null, 2);
      return (
        <label className="grid gap-1 text-sm" key={draftKey}>
          <span className="font-medium">{key}</span>
          <Textarea
            value={currentDraft}
            height="132px"
            className="font-mono text-xs"
            onChange={(event) => setJsonDrafts((drafts) => ({ ...drafts, [draftKey]: event.target.value }))}
            onBlur={() => {
              try {
                onValueChange(key, JSON.parse(currentDraft));
              } catch {
                setJsonDrafts((drafts) => ({ ...drafts, [draftKey]: JSON.stringify(value ?? null, null, 2) }));
              }
            }}
          />
        </label>
      );
    }

    return (
      <label className="grid gap-1 text-sm" key={draftKey}>
        <span className="font-medium">{key}</span>
        <div className={inputType === 'color' ? 'flex gap-2' : ''}>
          <Input
            type={inputType}
            value={inputType === 'number' ? Number(value || 0) : String(value || '')}
            onChange={(event) =>
              onValueChange(
                key,
                inputType === 'number' ? Number(event.target.value) : event.target.value
              )
            }
          />
          {inputType === 'color' && (
            <Input value={String(value || '')} onChange={(event) => onValueChange(key, event.target.value)} />
          )}
        </div>
        {onUploadMedia && /(^logoUrl$|imageUrl|backgroundImageUrl)/i.test(key) ? (
          <div className="mt-2 grid gap-2 rounded-md border border-dashed bg-slate-50 p-2">
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <Upload className="size-3.5" />
              {uploadingKey === draftKey ? 'Uploading to SELISE...' : 'Upload via SELISE Media'}
              <input
                type="file"
                accept="image/*,video/*"
                className="sr-only"
                disabled={uploadingKey === draftKey}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = '';
                  if (!file) return;
                  setUploadError('');
                  setUploadingKey(draftKey);
                  try {
                    const fileUrl = await onUploadMedia(file);
                    onValueChange(key, fileUrl);
                  } catch (error) {
                    setUploadError(error instanceof Error ? error.message : 'SELISE media upload failed.');
                  } finally {
                    setUploadingKey('');
                  }
                }}
              />
            </label>
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          </div>
        ) : null}
      </label>
    );
  };

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-sm font-semibold text-slate-950">{block.type}</div>
        <div className="text-xs text-slate-500">{block.id}</div>
      </div>
      <div className="grid gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Props</div>
        {Object.entries(block.props).map(([key, value]) => renderControl(key, value, updateProp, 'props'))}
      </div>
      <div className="grid gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Style</div>
        {Object.entries(block.style || {}).map(([key, value]) => renderControl(key, value, updateStyle, 'style'))}
      </div>
    </div>
  );
};

export const BuilderWorkspace = ({
  siteId,
  pageId,
  siteName,
  pageTitle,
  backTo,
  previewTo,
  themeTo,
  mediaTo,
  notice,
  layout,
  onLayoutChange,
  onSave,
  onPublish,
  onUploadMedia,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  saveState,
}: BuilderWorkspaceProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(layout.blocks[0]?.id || null);
  const [activeType, setActiveType] = useState<BlockType | null>(null);
  const [libraryTab, setLibraryTab] = useState<'site' | 'blocks'>('blocks');

  const selectedBlock = useMemo(
    () => layout.blocks.find((block) => block.id === selectedBlockId),
    [layout.blocks, selectedBlockId]
  );
  const groupedDefinitions = useMemo(
    () =>
      blockDefinitions.reduce<Record<string, typeof blockDefinitions>>((groups, definition) => {
        groups[definition.category] = groups[definition.category] || [];
        groups[definition.category].push(definition);
        return groups;
      }, {}),
    []
  );

  const updateBlocks = (blocks: VibeBlock[]) => {
    onLayoutChange({
      ...layout,
      siteId,
      pageId,
      blocks,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateBlock = (blockId: string, updater: (block: VibeBlock) => VibeBlock) => {
    updateBlocks(layout.blocks.map((block) => (block.id === blockId ? updater(block) : block)));
  };

  const updateBlockPath = (blockId: string, path: Array<string | number>, value: string) => {
    updateBlock(blockId, (current) => setValueAtPath(current, path, value) as VibeBlock);
  };

  const removeBlock = (blockId: string) => {
    const next = layout.blocks.filter((block) => block.id !== blockId);
    updateBlocks(next);
    if (selectedBlockId === blockId) setSelectedBlockId(next[0]?.id || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveType(null);
    if (!over) return;

    const source = active.data.current?.source;
    const blockType = active.data.current?.blockType as BlockType | undefined;

    if (source === 'library' && blockType) {
      const nextBlock = createBlock(blockType);
      const overIndex = layout.blocks.findIndex((block) => block.id === over.id);
      const insertIndex = over.id === 'canvas-dropzone' || overIndex === -1 ? layout.blocks.length : overIndex;
      const next = [...layout.blocks];
      next.splice(insertIndex, 0, nextBlock);
      updateBlocks(next);
      setSelectedBlockId(nextBlock.id);
      return;
    }

    if (source === 'canvas' && active.id !== over.id) {
      const oldIndex = layout.blocks.findIndex((block) => block.id === active.id);
      const newIndex = layout.blocks.findIndex((block) => block.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) updateBlocks(moveItem(layout.blocks, oldIndex, newIndex));
    }
  };

  return (
    <div className="vibe-studio-frame vibe-builder-workspace flex h-[calc(100vh-7rem)] w-full flex-col overflow-x-auto rounded-lg border bg-[#f4f7f9] shadow-sm">
      <div className="vibe-builder-topbar flex min-h-14 min-w-[1180px] items-center justify-between border-b bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link to={backTo || `/vibe-builder/${siteId}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase text-slate-500">
              <span>Vibe Builder</span>
              <span>/</span>
              <span className="truncate">{siteName || 'Site'}</span>
              <span>/</span>
              <span>Editor</span>
            </div>
            <div className="truncate text-sm font-semibold text-slate-950">{pageTitle || 'Untitled page'}</div>
          </div>
          <Badge variant={saveState === 'error' ? 'destructive' : saveState === 'saved' ? 'secondary' : 'outline'}>
            {stateLabel[saveState]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="size-4" />
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="size-4" />
            Redo
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={previewTo || `/preview/${siteId}/${pageId}`}>
              <Eye className="size-4" />
              Preview
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="size-4" />
            Save
          </Button>
          <Button size="sm" onClick={onPublish}>
            <Send className="size-4" />
            Publish
          </Button>
        </div>
      </div>

      {notice ? <div className="vibe-builder-topbar min-w-[1180px] border-b bg-white px-4 py-3">{notice}</div> : null}

      <DndContext
        sensors={sensors}
        onDragStart={(event) => setActiveType((event.active.data.current?.blockType as BlockType) || null)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveType(null)}
      >
        <div className="grid min-h-0 min-w-[1180px] flex-1 grid-cols-[280px_minmax(0,1fr)_336px]">
          <aside className="vibe-builder-sidebar min-h-0 overflow-y-auto border-r bg-[#eef3f6] p-4">
            <div className="vibe-glass-panel rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <PanelLeft className="mt-0.5 size-4 text-slate-700" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Editor sidebar</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Switch between site setup and the block library without leaving the editor.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 rounded-md bg-slate-100 p-1 text-xs font-medium">
                {(['site', 'blocks'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`rounded px-3 py-2 capitalize transition ${
                      libraryTab === tab ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'
                    }`}
                    onClick={() => setLibraryTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {libraryTab === 'site' ? (
                <div className="mt-4 grid gap-3">
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Current site</div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">{siteName || 'VibeBuilder site'}</div>
                    <div className="mt-1 text-xs text-slate-500">Page: {pageTitle || 'Untitled page'}</div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={themeTo || `/vibe-builder/${siteId}/theme`}>
                      <Settings2 className="size-4" />
                      Theme settings
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={mediaTo || `/vibe-builder/${siteId}/media`}>
                      <ImageIcon className="size-4" />
                      Media library
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {Object.entries(groupedDefinitions).map(([category, definitions]) => {
                    const Icon = categoryIcons[category as keyof typeof categoryIcons] || Layers3;
                    return (
                      <div key={category} className="grid gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                          <Icon className="size-3.5" />
                          {category}
                        </div>
                        {definitions.map((definition) => (
                          <LibraryItem
                            key={definition.type}
                            type={definition.type}
                            label={definition.label}
                            description={definition.description}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-5">
            <div className="vibe-glass-panel rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <Layers3 className="mt-0.5 size-4 text-slate-700" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Canvas</h2>
                  <p className="text-xs text-slate-500">Reorder blocks with drag handles and click a block to edit it.</p>
                </div>
              </div>
              <CanvasDropZone>
                {layout.blocks.length === 0 ? (
                  <div className="grid min-h-[520px] place-items-center rounded-lg bg-white text-center">
                    <div>
                      <div className="text-lg font-semibold text-slate-950">Start with a component</div>
                      <p className="mt-2 max-w-sm text-sm text-slate-500">
                        Drag a Vibe Component from the left sidebar to create a SELISE-backed page layout.
                      </p>
                    </div>
                  </div>
                ) : (
                  <SortableContext items={layout.blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-4">
                      {layout.blocks.map((block) => (
                        <SortableBlock
                          key={block.id}
                          block={block}
                          selected={selectedBlockId === block.id}
                          onSelect={setSelectedBlockId}
                          onRemove={removeBlock}
                          onInlineChange={updateBlockPath}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </CanvasDropZone>
            </div>
          </main>

          <aside className="vibe-builder-sidebar min-h-0 overflow-y-auto border-l bg-[#eef3f6] p-4">
            <div className="vibe-glass-panel rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <Settings2 className="mt-0.5 size-4 text-slate-700" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Properties</h2>
                  <p className="text-xs text-slate-500">
                    {selectedBlock ? `Editing ${selectedBlock.type}` : 'Select a section to edit'}
                  </p>
                </div>
              </div>
              <PropertyEditor block={selectedBlock} onChange={updateBlock} onUploadMedia={onUploadMedia} />
            </div>
          </aside>
        </div>
        <DragOverlay>
          {activeType ? (
            <div className="vibe-drag-card rounded-lg border bg-white p-3 text-sm font-semibold shadow-lg">
              {blockDefinitions.find((definition) => definition.type === activeType)?.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
