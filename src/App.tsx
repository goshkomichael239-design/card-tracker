import React, { lazy, Suspense, useState } from 'react';

import MainApp from './app/MainApp';
import { SHOW_DEV_TOOLS } from './app/devTools';
import { t } from './app/i18n';

type AppMode = 'application' | 'sandboxes';

type SandboxId =
  | 'main'
  | 'archive'
  | 'stack'
  | 'completion-coupon'
  | 'task-card-v2';

// The lab is a development tool: it is lazy-loaded and only exists in dev
// builds, so its heavy experiment assets never ship with the production app.
const ENABLE_SANDBOXES = import.meta.env.DEV;

const SANDBOXES: Array<{
  id: SandboxId;
  label: string;
  component: React.LazyExoticComponent<React.ComponentType>;
}> = import.meta.env.DEV
  ? [
      {
        id: 'main',
        label: t('Карточка'),
        component: lazy(() => import('./components/sandboxes/SandboxMain')),
      },
      {
        id: 'archive',
        label: t('Архив'),
        component: lazy(() => import('./components/sandboxes/SandboxArchive')),
      },
      {
        id: 'stack',
        label: t('Стопка'),
        component: lazy(() => import('./components/sandboxes/SandboxStack')),
      },
      {
        id: 'completion-coupon',
        label: t('Перфорация'),
        component: lazy(
          () => import('./components/sandboxes/SandboxCompletionCoupon'),
        ),
      },
      {
        id: 'task-card-v2',
        label: 'TaskCard V2',
        component: lazy(
          () => import('./components/sandboxes/SandboxTaskCardV2'),
        ),
      },
    ]
  : [];

const App: React.FC = () => {
  const [mode, setMode] =
    useState<AppMode>('application');

  const [sandboxId, setSandboxId] =
    useState<SandboxId>('main');

  const ActiveSandbox = (
    SANDBOXES.find((sandbox) => sandbox.id === sandboxId) ?? SANDBOXES[0]
  )?.component;

  if (mode === 'sandboxes' && ActiveSandbox) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <Suspense fallback={null}>
          <ActiveSandbox />
        </Suspense>

        <div
          className="
            fixed left-1/2 top-3 z-[1000]
            flex max-w-[calc(100vw-24px)]
            -translate-x-1/2 items-center gap-1.5
            overflow-x-auto rounded-2xl
            border border-white/10
            bg-black/65 p-1.5
            backdrop-blur-xl
          "
        >
          <button
            type="button"
            onClick={() =>
              setMode('application')
            }
            className="
              shrink-0 rounded-xl
              px-3 py-1.5
              font-mono text-xs text-white/80
              transition hover:bg-white/10
            "
          >{t('← Приложение')}</button>

          <div className="mx-1 h-5 w-px shrink-0 bg-white/10" />

          {SANDBOXES.map((sandbox) => {
            const isActive =
              sandboxId === sandbox.id;

            return (
              <button
                key={sandbox.id}
                type="button"
                onClick={() =>
                  setSandboxId(sandbox.id)
                }
                className="
                  shrink-0 rounded-xl
                  px-3 py-1.5
                  font-mono text-xs
                  transition
                "
                style={{
                  background: isActive
                    ? 'rgba(255,255,255,0.14)'
                    : 'transparent',

                  color: isActive
                    ? 'rgba(255,255,255,0.95)'
                    : 'rgba(255,255,255,0.45)',
                }}
              >
                {sandbox.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <MainApp />

      {ENABLE_SANDBOXES && SHOW_DEV_TOOLS && (
        <button
          type="button"
          onClick={() =>
            setMode('sandboxes')
          }
          className="
            fixed bottom-3 right-3
            z-[1000]
            rounded-xl
            border border-white/10
            bg-black/50
            px-3 py-2
            font-mono text-[10px]
            uppercase tracking-wider
            text-white/40
            backdrop-blur-xl
            transition
            hover:bg-black/70
            hover:text-white/80
          "
        >{t('Лаборатория')}</button>
      )}
    </div>
  );
};

export default App;
