import type { VisualCard } from './cardTheme';
import { isStoredVisualCard } from './cardValidation';
import { isTrashedCard, purgeExpiredTrash, type TrashedCard } from './trash';

const BACKUP_APP_ID = 'card-tracker';
// v2 adds the bin; v1 files (without it) still import.
const BACKUP_VERSION = 2;

export interface BackupPayload {
  cards: VisualCard[];
  archive: VisualCard[];
  trash: TrashedCard[];
}

export type BackupImportResult =
  | {
      ok: true;
      addedActive: number;
      addedArchive: number;
      addedTrash: number;
    }
  | { ok: false; message: string };

export const serializeBackup = (
  cards: VisualCard[],
  archive: VisualCard[],
  trash: TrashedCard[],
): string =>
  JSON.stringify(
    {
      app: BACKUP_APP_ID,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      cards: cards.filter((card) => !card.completedAt),
      archive,
      trash,
    },
    null,
    2,
  );

export const parseBackup = (text: string): BackupPayload | null => {
  try {
    const parsed: unknown = JSON.parse(text);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const backup = parsed as Record<string, unknown>;

    if (
      backup.app !== BACKUP_APP_ID ||
      !Array.isArray(backup.cards) ||
      !Array.isArray(backup.archive)
    ) {
      return null;
    }

    return {
      cards: backup.cards
        .filter(isStoredVisualCard)
        .filter((card) => !card.completedAt),
      archive: backup.archive
        .filter(isStoredVisualCard)
        .filter((card) => Boolean(card.completedAt)),
      trash: Array.isArray(backup.trash)
        ? purgeExpiredTrash(backup.trash.filter(isTrashedCard))
        : [],
    };
  } catch {
    return null;
  }
};

export const getBackupFilename = (): string => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return `card-tracker-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
};

export const downloadTextFile = (filename: string, text: string): void => {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  );
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
};
