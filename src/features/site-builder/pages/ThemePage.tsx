import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Textarea } from '@/components/ui-kit/textarea';
import { getSiteById, saveSiteTheme } from '../services/site-builder.service';
import { useBuilderUser } from '../hooks/use-builder-user';
import { SetupBlocker } from '../components/shared/SetupBlocker';

const defaultColors = JSON.stringify(
  {
    background: '#ffffff',
    text: '#111827',
    primary: '#2563eb',
    muted: '#f8fafc',
  },
  null,
  2
);

export const ThemePage = () => {
  const { siteId = '' } = useParams();
  const user = useBuilderUser();
  const queryClient = useQueryClient();
  const [name, setName] = useState('Default theme');
  const [templateType, setTemplateType] = useState('business');
  const [colorsJson, setColorsJson] = useState(defaultColors);
  const [typographyJson, setTypographyJson] = useState('{"fontFamily":"Inter, sans-serif"}');
  const [spacingJson, setSpacingJson] = useState('{"sectionPadding":64}');
  const [buttonStyleJson, setButtonStyleJson] = useState('{"radius":6}');
  const [sectionStyleJson, setSectionStyleJson] = useState('{"radius":8}');
  const [headerStyleJson, setHeaderStyleJson] = useState('{"sticky":false}');
  const [footerStyleJson, setFooterStyleJson] = useState('{"variant":"dark"}');

  const siteQuery = useQuery({
    queryKey: ['vibe-site', siteId, user?.userId],
    queryFn: () => {
      if (!user) throw new Error('Current SELISE user is not loaded.');
      return getSiteById(siteId, user.userId);
    },
    enabled: Boolean(siteId && user?.userId),
  });

  useEffect(() => {
    if (!siteQuery.data?.themeJson) return;
    try {
      const theme = JSON.parse(siteQuery.data.themeJson);
      setName(theme.name || 'Default theme');
      setTemplateType(theme.templateType || 'business');
      setColorsJson(theme.colorsJson || defaultColors);
      setTypographyJson(theme.typographyJson || '{"fontFamily":"Inter, sans-serif"}');
      setSpacingJson(theme.spacingJson || '{"sectionPadding":64}');
      setButtonStyleJson(theme.buttonStyleJson || '{"radius":6}');
      setSectionStyleJson(theme.sectionStyleJson || '{"radius":8}');
      setHeaderStyleJson(theme.headerStyleJson || '{"sticky":false}');
      setFooterStyleJson(theme.footerStyleJson || '{"variant":"dark"}');
    } catch {
      // Keep default editable theme values if existing metadata is malformed.
    }
  }, [siteQuery.data?.themeJson]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveSiteTheme({
        siteId,
        ownerUserId: user?.userId || '',
        workspaceId: user?.workspaceId,
        name,
        templateType,
        colorsJson,
        typographyJson,
        spacingJson,
        buttonStyleJson,
        sectionStyleJson,
        headerStyleJson,
        footerStyleJson,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vibe-site'] }),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  if (!user) return <SetupBlocker title="Authentication required" />;

  return (
    <div className="vibe-studio-frame mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl gap-6 rounded-xl p-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to={`/vibe-builder/${siteId}`}>
            <ArrowLeft className="size-4" />
            Pages
          </Link>
        </Button>
        <div className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase vibe-pill">
          Visual system
        </div>
        <h1 className="vibe-hero-title text-4xl font-semibold text-slate-950 md:text-5xl">Theme Settings</h1>
        <p className="mt-3 text-sm text-slate-500">{siteQuery.data?.name || 'Global site theme'}</p>
      </div>

      {siteQuery.error && <SetupBlocker title="Site schema unavailable" error={siteQuery.error} />}
      {saveMutation.error && <SetupBlocker title="Could not save theme" error={saveMutation.error} />}

      <form onSubmit={onSubmit} className="vibe-theme-panel grid gap-4 rounded-lg border bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Theme name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Template type</span>
            <Input value={templateType} onChange={(event) => setTemplateType(event.target.value)} />
          </label>
        </div>
        {[
          ['Colors JSON', colorsJson, setColorsJson],
          ['Typography JSON', typographyJson, setTypographyJson],
          ['Spacing JSON', spacingJson, setSpacingJson],
          ['Button style JSON', buttonStyleJson, setButtonStyleJson],
          ['Section style JSON', sectionStyleJson, setSectionStyleJson],
          ['Header style JSON', headerStyleJson, setHeaderStyleJson],
          ['Footer style JSON', footerStyleJson, setFooterStyleJson],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="grid gap-1 text-sm">
            <span className="font-medium">{label as string}</span>
            <Textarea
              value={value as string}
              height="104px"
              className="font-mono text-xs"
              onChange={(event) => (setter as (value: string) => void)(event.target.value)}
            />
          </label>
        ))}
        <div>
          <Button type="submit" loading={saveMutation.isPending}>
            <Save className="size-4" />
            Save theme
          </Button>
        </div>
      </form>
    </div>
  );
};
