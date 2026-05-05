import { AlertTriangle } from 'lucide-react';

export const SetupBlocker = ({ title, error }: { title: string; error?: unknown }) => {
  const message = error instanceof Error ? error.message : 'SELISE setup or schema configuration is missing.';

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-sm">{message}</p>
          <p className="mt-2 text-xs">
            Configure the required SELISE Data Gateway/Storage/IAM setup listed in
            <span className="font-medium"> dump/TODO.md</span>, then retry this action.
          </p>
        </div>
      </div>
    </div>
  );
};
