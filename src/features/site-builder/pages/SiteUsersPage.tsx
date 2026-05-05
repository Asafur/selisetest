import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { SetupBlocker } from '../components/shared/SetupBlocker';

export const SiteUsersPage = () => {
  const { siteId = '' } = useParams();

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to={`/vibe-builder/${siteId}`}>
            <ArrowLeft className="size-4" />
            Pages
          </Link>
        </Button>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-950">
          <ShieldCheck className="size-6 text-primary" />
          Site users and roles
        </h1>
        <p className="mt-1 text-sm text-slate-500">Owner, Editor, and Viewer require SELISE IAM role setup.</p>
      </div>
      <SetupBlocker
        title="Role schema setup required"
        error={
          new Error(
            'Create VibeUserRole schema and SELISE IAM permissions before collaborator management is enabled.'
          )
        }
      />
    </div>
  );
};
