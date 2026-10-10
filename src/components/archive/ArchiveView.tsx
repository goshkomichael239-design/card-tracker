import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import whiteMarbleTexture from '../../assets/white_marble.png';
import { pluralDays, summarizeArchive } from '../../app/archiveUtils';
import type { BackupImportResult } from '../../app/backupUtils';
import type { VisualCard } from '../../app/cardTheme';
import { ArchiveCardViewer } from './ArchiveCardViewer';
import { ArchiveCatalog } from './ArchiveCatalog';
import { BackupControls } from './BackupControls';

interface ArchiveViewProps {
  isOpen: boolean;
  archivedCards: VisualCard[];
  /** Cards still on the table: their series steps and checked items count as activity. */
  liveCards: VisualCard[];
  /** Ids that cannot be returned yet (their completion is still settling). */
  settlingCardId: string | null;
  onReturnCard: (cardId: string) => void;
  onTrashCard: (cardId: string) => void;
  onExportBackup: () => void;
  onImportBackup: (text: string) => BackupImportResult;
}

const CUBIC_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

const TITLE_STYLE: React.CSSProperties = {
  color: 'rgba(174,143,75,0.78)',
  textShadow:
    '0 1px 0 rgba(255,255,255,0.72), 0 -1px 0 rgba(105,82,42,0.42), 0 2px 5px rgba(76,59,29,0.22)',
};

/**
 * Everything on the marble while it is open. Mounted per opening, so search,
 * filters and the pulled-out card start fresh every time the archive opens.
 */
const ArchiveContents: React.FC<Omit<ArchiveViewProps, 'isOpen'>> = ({
  archivedCards,
  liveCards,
  settlingCardId,
  onReturnCard,
  onTrashCard,
  onExportBackup,
  onImportBackup,
}) => {
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [summaryNow] = useState(() => Date.now());
  const summary = useMemo(
    () => summarizeArchive(archivedCards, liveCards, summaryNow),
    [archivedCards, liveCards, summaryNow],
  );
  const openCard = archivedCards.find((card) => card.id === openCardId);
  const closeViewer = useCallback(() => setOpenCardId(null), []);

  return (
    <>
      <h2
        className="mt-[2.5vh] shrink-0 font-mono text-[clamp(24px,4vw,40px)] font-bold uppercase tracking-[0.2em]"
        style={TITLE_STYLE}
      >
        Журнал карточек
      </h2>

      {/* Summary pressed into the marble, under the title. */}
      <p
        className="mt-1 shrink-0 font-mono text-[12px] font-bold uppercase tracking-[0.12em]"
        style={{ ...TITLE_STYLE, color: 'rgba(120,96,52,0.75)' }}
      >
        За неделю {summary.week} · В {summary.monthName} {summary.month} · Всего{' '}
        {summary.total}
      </p>

      {/* The run of active days, only once it is a run (two days or more). */}
      {summary.streak >= 2 && (
        <p
          className="mt-0.5 shrink-0 font-mono text-[12px] font-bold uppercase tracking-[0.12em]"
          style={{ ...TITLE_STYLE, color: 'rgba(150,104,40,0.85)' }}
        >
          {summary.streak} {pluralDays(summary.streak)} подряд
        </p>
      )}

      <ArchiveCatalog cards={archivedCards} onOpenCard={setOpenCardId} />

      <BackupControls onExport={onExportBackup} onImport={onImportBackup} />

      {openCard && (
        <ArchiveCardViewer
          key={openCard.id}
          card={openCard}
          canReturn={openCard.id !== settlingCardId}
          onClose={closeViewer}
          onReturn={() => {
            setOpenCardId(null);
            onReturnCard(openCard.id);
          }}
          onTrash={() => {
            setOpenCardId(null);
            onTrashCard(openCard.id);
          }}
        />
      )}
    </>
  );
};

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  isOpen,
  ...contentProps
}) => {
  useEffect(() => {
    const image = new Image();
    image.src = whiteMarbleTexture;
    void image.decode?.().catch(() => undefined);
  }, []);

  return (
    <div
      className={`absolute inset-0 z-[25] h-full w-full overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <motion.div
        initial={false}
        animate={{ y: isOpen ? '0%' : '100%' }}
        transition={{ duration: 0.85, ease: CUBIC_EASE }}
        className="absolute inset-0 h-full w-full"
        style={{ willChange: 'transform' }}
      >
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backgroundImage: `url(${whiteMarbleTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-white/10" />
        <AnimatePresence>
          {isOpen && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col items-center overflow-y-auto px-4 pb-[110px] text-center sm:px-5"
            >
              <ArchiveContents {...contentProps} />
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
