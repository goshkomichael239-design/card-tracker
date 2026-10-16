import React, { useEffect, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { formatArchiveMoment } from '../../app/archiveUtils';
import {
  listSnapshots,
  loadSnapshotPayload,
} from '../../app/storage/autoBackup';
import type { SnapshotMeta } from '../../app/storage/idb';
import { t } from '../../app/i18n';

interface AutoBackupSheetProps {
  /** Receives the backup text of the chosen copy. */
  onRestore: (text: string) => void;
  onClose: () => void;
}

const REASON_LABEL: Record<SnapshotMeta['reason'], string> = {
  start: t('при запуске'),
  auto: t('по ходу работы'),
  'before-import': t('перед загрузкой копии'),
};

/**
 * The copies the app keeps for itself. Taking one out only adds the cards
 * that are missing right now, so it cannot overwrite anything.
 */
export const AutoBackupSheet: React.FC<AutoBackupSheetProps> = ({
  onRestore,
  onClose,
}) => {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[] | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void listSnapshots().then((list) => {
      if (isCurrent) {
        setSnapshots(list);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const restore = async (id: string) => {
    const payload = await loadSnapshotPayload(id);

    if (payload) {
      onRestore(payload);
    } else {
      setFailedId(id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 text-left"
      style={{ backgroundColor: 'rgba(48,38,26,0.32)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('Автоматические копии')}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="engraved flex max-h-[min(560px,86vh)] w-[min(440px,100%)] flex-col rounded-[18px] border p-5"
        style={{
          borderColor: 'rgba(91,76,59,0.2)',
          backgroundColor: '#F4EEE0',
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundBlendMode: 'multiply',
          boxShadow: '0 18px 40px rgba(20,17,14,0.35)',
        }}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h3
              className="font-mono text-[14px] font-bold uppercase tracking-[0.14em]"
              style={{ color: '#5a4520' }}
            >{t('Автокопии')}</h3>
            <p
              className="mt-1 text-[13px] leading-[1.35]"
              style={{ color: 'rgba(63,57,50,0.75)' }}
            >{t('Приложение само хранит копии: последние часы подробно и по одной на день за две недели. Из копии вернутся только те карточки, которых сейчас нет.')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Закрыть')}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-transparent text-[22px] font-light leading-none"
            style={{ color: '#4a3c2c', borderColor: 'rgba(74,60,44,0.3)' }}
          >
            ×
          </button>
        </header>

        <div
          className="mt-4 min-h-0 flex-1 overflow-y-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          {snapshots === null ? (
            <p className="text-[14px]" style={{ color: 'rgba(63,57,50,0.6)' }}>{t('Загрузка…')}</p>
          ) : snapshots.length === 0 ? (
            <p className="text-[14px]" style={{ color: 'rgba(63,57,50,0.6)' }}>{t('Копий пока нет: первая появится, как только в приложении что-то будет.')}</p>
          ) : (
            <ul>
              {snapshots.map((snapshot) => (
                <li
                  key={snapshot.id}
                  className="flex items-center gap-3 border-b py-2.5"
                  style={{
                    borderColor: 'rgba(69,57,44,0.12)',
                    borderBottomStyle: 'dashed',
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[15px] font-semibold"
                      style={{ color: '#28231D' }}
                    >
                      {formatArchiveMoment(snapshot.id)}
                    </p>
                    <p
                      className="font-mono text-[11.5px] uppercase tracking-[0.08em]"
                      style={{ color: 'rgba(63,57,50,0.6)' }}
                    >{t('{v} · на столе {active} · в архиве {archived} · в корзине {trash}', { v: REASON_LABEL[snapshot.reason], active: snapshot.active, archived: snapshot.archived, trash: snapshot.trash })}</p>
                    {failedId === snapshot.id && (
                      <p className="text-[12px]" style={{ color: '#7a2519' }}>{t('Не удалось прочитать эту копию')}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void restore(snapshot.id)}
                    className="shrink-0 cursor-pointer rounded-[10px] border px-3 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em]"
                    style={{
                      borderColor: 'rgba(82,69,56,0.25)',
                      color: '#5a4520',
                      backgroundColor: 'rgba(222,196,140,0.5)',
                    }}
                  >{t('Достать')}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};
