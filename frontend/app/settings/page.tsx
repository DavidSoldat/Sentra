'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { useRepoStore } from '../store/useRepoStore';
import { useChatStore } from '../store/useChatStore';
import { api } from '../lib/api';
import { ConfirmDialog } from '../components/ui/ConfirmCatalog';
import { AiModelOption } from '../types';

interface Usage {
  questionsUsed: number;
  questionsLimit: number;
  reviewsUsed: number;
  reviewsLimit: number;
  periodStart: string;
  resetsAt: string;
}

function UsageBar({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number;
  label: string;
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = pct >= 80;

  return (
    <div>
      <div className='flex items-center justify-between mb-1.5'>
        <span className='font-mono text-xs text-[#768390]'>{label}</span>
        <span className='font-mono text-xs text-[#cdd9e5]'>
          {used} / {limit}
        </span>
      </div>
      <div className='h-1.5 rounded-full bg-[#161b22] overflow-hidden'>
        <div
          className={`h-full rounded-full transition-all ${
            isNearLimit ? 'bg-[#d29922]' : 'bg-[#316dca]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const resetRepos = useRepoStore((s) => s.reset);
  const clearChat = useChatStore((s) => s.clear);

  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [models, setModels] = useState<AiModelOption[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [savingModel, setSavingModel] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    api
      .getUsage()
      .then(setUsage)
      .catch(() => setUsageError('Could not load usage data.'));
  }, []);

  useEffect(() => {
    api
      .getModels()
      .then(setModels)
      .catch(() => setModelsError('Could not load available models.'));
  }, []);

  async function handleSelectModel(modelId: string) {
    if (!user || modelId === user.preferredModel) return;
    setSavingModel(modelId);
    setSaveError(null);
    try {
      await api.updateModelPreference(modelId);
      await checkAuth();
    } catch {
      setSaveError('Could not update your model preference. Please try again.');
    } finally {
      setSavingModel(null);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      resetRepos();
      clearChat();
      router.push('/');
    } catch {
      setDeleteError(
        'Something went wrong deleting your account. Please try again.',
      );
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  }

  async function handleManageSubscription() {
    setIsLoadingPortal(true);
    try {
      const { url } = await api.getBillingPortalUrl();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Failed to open billing portal', e);
    } finally {
      setIsLoadingPortal(false);
    }
  }

  return (
    <div className='h-full overflow-y-auto bg-[#080c10] text-[#cdd9e5] px-4 sm:px-6 py-16'>
      <div className='max-w-2xl mx-auto flex flex-col gap-8'>
        <h1 className='font-mono text-2xl font-medium tracking-tight'>
          <span className='text-[#316dca]'>[</span>
          settings
          <span className='text-[#316dca]'>]</span>
        </h1>

        <section className='border border-[#2d333b] rounded-md p-6 bg-[#0d1117] flex flex-col gap-5'>
          <div>
            <h2 className='font-mono text-sm uppercase tracking-widest text-[#768390] mb-1'>
              Usage this period
            </h2>
            {usage && (
              <p className='font-mono text-xs text-[#484f58]'>
                Resets{' '}
                {new Date(usage.resetsAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          {usageError && (
            <p className='font-mono text-xs text-[#f85149]'>{usageError}</p>
          )}

          {!usage && !usageError && (
            <p className='font-mono text-xs text-[#484f58]'>Loading…</p>
          )}

          {usage && (
            <div className='flex flex-col gap-4'>
              <UsageBar
                used={usage.questionsUsed}
                limit={usage.questionsLimit}
                label='Questions'
              />
              <UsageBar
                used={usage.reviewsUsed}
                limit={usage.reviewsLimit}
                label='PR reviews'
              />
            </div>
          )}
        </section>

        {user?.tier === 'PRO' && (
          <section className='border border-[#2d333b] rounded-md p-6 bg-[#0d1117] flex flex-col gap-3'>
            <h2 className='font-mono text-sm uppercase tracking-widest text-[#768390] mb-1'>
              Billing
            </h2>
            <p className='font-mono text-xs text-[#484f58]'>
              You&apos;re on the Pro plan.
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={isLoadingPortal}
              className='self-start rounded-md border border-[#2d333b] px-3 py-1.5 font-mono text-xs text-[#cdd9e5] transition-colors hover:bg-[#161b22] disabled:opacity-50'
            >
              {isLoadingPortal ? 'Opening…' : 'Manage subscription'}
            </button>
          </section>
        )}

        <section className='border border-[#2d333b] rounded-md p-6 bg-[#0d1117] flex flex-col gap-4'>
          <div>
            <h2 className='font-mono text-sm uppercase tracking-widest text-[#768390] mb-1'>
              Model preference
            </h2>
            <p className='font-mono text-xs text-[#484f58]'>
              Which AI model answers your questions and reviews.
            </p>
          </div>

          {modelsError && (
            <p className='font-mono text-xs text-[#f85149]'>{modelsError}</p>
          )}
          {saveError && (
            <p className='font-mono text-xs text-[#f85149]'>{saveError}</p>
          )}

          {(['EFFICIENT', 'PREMIUM'] as const).map((band) => {
            const bandModels = models.filter((m) => m.band === band);
            if (bandModels.length === 0) return null;
            const locked = band === 'PREMIUM' && user?.tier !== 'PRO';

            return (
              <div key={band} className='flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='font-mono text-[11px] uppercase tracking-widest text-[#484f58]'>
                    {band === 'EFFICIENT' ? 'Efficient' : 'Premium'}
                  </span>
                  {locked && (
                    <span className='font-mono text-[10px] text-[#d29922] border border-[#d29922]/30 rounded-full px-2 py-0.5'>
                      Pro only
                    </span>
                  )}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {bandModels.map((model) => {
                    const isSelected = user?.preferredModel === model.id;
                    const isDisabled = locked || savingModel !== null;

                    return (
                      <button
                        key={model.id}
                        disabled={isDisabled}
                        onClick={() => handleSelectModel(model.id)}
                        className={`text-left rounded-md border px-4 py-3 transition-colors ${
                          isSelected
                            ? 'border-[#316dca] bg-[#316dca]/10'
                            : 'border-[#2d333b] hover:border-[#484f58]'
                        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className='flex items-center justify-between'>
                          <span className='font-mono text-sm text-[#cdd9e5]'>
                            {model.displayName}
                          </span>
                          {isSelected && (
                            <span className='text-[#316dca] text-xs'>✓</span>
                          )}
                        </div>
                        <span className='font-mono text-[11px] text-[#484f58]'>
                          {model.provider}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        <section className='border border-[#6e2b2b] rounded-md p-6 bg-[#1c1011] flex flex-col gap-3'>
          <h2 className='font-mono text-sm uppercase tracking-widest text-[#f85149] mb-1'>
            Danger zone
          </h2>
          <p className='font-mono text-xs text-[#768390]'>
            Permanently deletes your account, all indexed repos, chat history,
            and reviews. This can&apos;t be undone.
          </p>

          {deleteError && (
            <p className='font-mono text-xs text-[#f85149]'>{deleteError}</p>
          )}

          <button
            onClick={() => setConfirmOpen(true)}
            className='self-start rounded-md border border-[#f85149]/30 bg-[#f85149]/10 px-3 py-1.5 font-mono text-xs text-[#f85149] hover:bg-[#f85149]/20 transition-colors'
          >
            Delete account
          </button>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete your account, ${user?.username ?? ''}?`}
        description="This removes all your repos, chat history, and reviews permanently. If you're on Pro, your subscription will be canceled."
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete account'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
