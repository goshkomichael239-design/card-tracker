import React, { useState } from 'react';

import MainApp from './app/MainApp';

import SandboxMain from './components/sandboxes/SandboxMain';
import SandboxArchive from './components/sandboxes/SandboxArchive';
import SandboxStack from './components/sandboxes/SandboxStack';
import SandboxCompletionCoupon from './components/sandboxes/SandboxCompletionCoupon';

type AppMode = 'application' | 'sandboxes';

type SandboxId =
  | 'main'
  | 'archive'
  | 'stack'
  | 'completion-coupon';

const ENABLE_SANDBOXES = true;

const SANDBOXES: Array<{
  id: SandboxId;
  label: string;
  component: React.ComponentType;
}> = [
  {
    id: 'main',
    label: 'Карточка',
    component: SandboxMain,
  },
  {
    id: 'archive',
    label: 'Архив',
    component: SandboxArchive,
  },
  {
    id: 'stack',
    label: 'Стопка',
    component: SandboxStack,
  },
  {
    id: 'completion-coupon',
    label: 'Перфорация',
    component: SandboxCompletionCoupon,
  },
];

const App: React.FC = () => {
  const [mode, setMode] =
    useState<AppMode>('application');

  const [sandboxId, setSandboxId] =
    useState<SandboxId>('main');

  const ActiveSandbox =
    SANDBOXES.find(
      (sandbox) => sandbox.id === sandboxId,
    )?.component ?? SandboxMain;

  if (mode === 'sandboxes') {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <ActiveSandbox />

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
          >
            ← Приложение
          </button>

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

      {ENABLE_SANDBOXES && (
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
        >
          Лаборатория
        </button>
      )}
    </div>
  );
};

export default App;