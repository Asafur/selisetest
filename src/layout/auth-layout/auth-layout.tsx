import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useGetLoginOptions } from '@/modules/auth/hooks/use-auth';
import { useAuthState } from '@/state/client-middleware';
import { ExtensionBanner, LanguageSelector, ThemeSwitcher } from '@/components/core';
import './vibe-auth.css';

export const AuthLayout = () => {
  const { isLoading, error: loginOptionsError } = useGetLoginOptions();
  const navigate = useNavigate();
  const { isMounted, isAuthenticated } = useAuthState();

  useEffect(() => {
    // Don't redirect if we're on the MFA verification page
    if (isAuthenticated && !window.location.pathname.includes('/verify-mfa')) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!isMounted) return null;

  const is404Error = (error: any) => {
    return (
      error?.message?.includes('HTTP 404') ||
      error?.message?.includes('HTTP 403') ||
      error?.message?.includes('HTTP 406') ||
      error?.message?.includes('HTTP 424') ||
      error?.response?.status === 404 ||
      error?.response?.status === 403 ||
      error?.response?.status === 406 ||
      error?.response?.status === 424 ||
      error?.status === 404 ||
      error?.status === 403 ||
      error?.status === 406 ||
      error?.status === 424
    );
  };

  const is500Error = (error: any) => {
    const status = error?.response?.status || error?.status;
    if (status && status >= 500 && status < 600) {
      return true;
    }

    if (error?.message) {
      const httpMatch = error.message.match(/HTTP (\d{3})/);
      if (httpMatch) {
        const statusFromMessage = parseInt(httpMatch[1], 10);
        return statusFromMessage >= 500 && statusFromMessage < 600;
      }
    }

    return false;
  };

  const renderAuthContent = () => {
    if (is404Error(loginOptionsError)) {
      return (
        <div className="w-full max-w-xl mx-auto">
          <div className="relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 to-transparent"></div>
            <div className="relative z-10">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-red-900 tracking-tight">
                  Incorrect Project Key
                </h2>
                <div className="space-y-3 text-red-700">
                  <p className="text-base leading-relaxed">
                    It seems your project is not set up in the Blocks Cloud.
                  </p>
                  <p className="text-sm leading-relaxed">
                    Please create a project at{' '}
                    <a
                      href="https://cloud.seliseblocks.com"
                      className="font-semibold underline decoration-red-400 underline-offset-2 hover:decoration-red-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      cloud.seliseblocks.com
                    </a>
                    , then update your{' '}
                    <code className="inline-flex items-center px-2 py-1 rounded-md bg-red-200/60 text-red-800 font-mono text-xs border border-red-300/50">
                      .env
                    </code>{' '}
                    configuration in Construct accordingly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (is500Error(loginOptionsError)) {
      return (
        <div className="w-full max-w-xl mx-auto">
          <div className="relative overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 to-transparent"></div>
            <div className="relative z-10">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-orange-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-orange-900 tracking-tight">
                  Services Temporarily Unavailable
                </h2>
                <div className="space-y-3 text-orange-700">
                  <p className="text-base leading-relaxed">
                    The services are temporarily unavailable.
                  </p>
                  <p className="text-base leading-relaxed font-semibold">
                    Everything will be back to normal soon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <Outlet />;
  };

  if (isLoading) return null;

  return (
    <div className="vibe-auth-page flex w-full flex-col h-screen">
      <ExtensionBanner />
      <div className="vibe-auth-shell flex w-full min-h-screen relative">
        <div className="vibe-auth-showcase hidden md:flex w-[52%] relative">
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
            <div className="flex items-center gap-3">
              <div className="vibe-auth-mark">VB</div>
              <div>
                <div className="text-sm font-bold text-white">VibeBuilder</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-teal-200/80">
                  Build your site, fast
                </div>
              </div>
            </div>

            <div className="vibe-auth-preview" aria-hidden="true">
              <div className="vibe-auth-preview-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="vibe-auth-preview-body">
                <div className="vibe-auth-toolbar">
                  <span className="is-active" />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="vibe-auth-canvas">
                  <div className="vibe-auth-image-card" />
                  <div className="vibe-auth-copy">
                    <span />
                    <span />
                    <span className="short" />
                    <button type="button" tabIndex={-1}>Publish</button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-teal-300">
                Website builder
              </div>
              <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[0.95] text-white">
                Design it. Shape it. Publish it.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
                A calm studio for turning polished site ideas into live pages, backed by SELISE Blocks.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {['Drafts', 'Media', 'Publish'].map((item) => (
                  <span key={item} className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase text-white/80">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="vibe-auth-form-zone flex items-center justify-center w-full px-6 sm:px-20 md:w-[48%] md:px-[7%] lg:px-[9%] 2xl:px-[11%]">
          <div className="absolute top-2 right-4">
            <div className="flex flex-row gap-2">
              <ThemeSwitcher />
              <LanguageSelector />
            </div>
          </div>
          <div className="vibe-auth-card">
            {renderAuthContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
