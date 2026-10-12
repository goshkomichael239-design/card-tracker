import React, { useSyncExternalStore } from 'react';

import {
  getStorageStatus,
  subscribeStorageStatus,
} from '../app/storage/kv';

/**
 * A quiet strip across the top when saving cannot be trusted: another tab
 * changed the data (this one stopped writing), or a save failed.
 */
export const StorageNotice: React.FC = () => {
  const status = useSyncExternalStore(
    subscribeStorageStatus,
    getStorageStatus,
    getStorageStatus,
  );

  if (!status.isStale && !status.hasWriteError && !status.isUnavailable) {
    return null;
  }

  return (
    <div
      role="alert"
      className="engraved absolute inset-x-3 top-1 z-[60] flex items-center justify-center gap-3 rounded-[10px] px-3 py-2 text-center font-mono text-[12px] font-bold uppercase tracking-[0.08em]"
      style={{
        color: '#7a2519',
        backgroundColor: 'rgba(255,226,214,0.96)',
        boxShadow: '0 4px 10px rgba(40,12,8,0.3)',
      }}
    >
      {status.isUnavailable ? (
        <span>Хранилище не отвечает — изменения не сохранятся</span>
      ) : status.isStale ? (
        <>
          <span>Данные изменены в другой вкладке</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="pill-action"
            style={
              {
                padding: '6px 12px',
                ['--pill-bg' as string]: 'rgba(255,255,255,0.7)',
                ['--pill-ink' as string]: '#7a2519',
                ['--pill-glow' as string]: '#FFC2A6',
              } as React.CSSProperties
            }
          >
            Обновить
          </button>
        </>
      ) : (
        <span>Не удаётся сохранить — сделайте копию в архиве</span>
      )}
    </div>
  );
};
