import React, { useRef, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import type { BackupImportResult } from '../../app/backupUtils';

interface BackupControlsProps {
  onExport: () => void;
  onImport: (text: string) => BackupImportResult;
}

const BUTTON_STYLE: React.CSSProperties = {
  borderColor: 'rgba(82,69,56,0.22)',
  color: 'rgba(63,57,50,0.78)',
  backgroundColor: 'rgba(235,229,214,0.76)',
  backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.35), transparent 58%), url(${cardboardTexture})`,
  backgroundSize: '100% 100%, cover',
  backgroundBlendMode: 'soft-light, multiply',
  boxShadow: '0 4px 9px rgba(67,56,43,0.14), inset 0 1px rgba(255,255,255,0.65)',
};

const describeResult = (result: BackupImportResult): string => {
  if (!result.ok) {
    return result.message;
  }

  const added = result.addedActive + result.addedArchive;

  return added === 0
    ? 'Все карточки из копии уже здесь'
    : `Добавлено карточек: ${added}`;
};

export const BackupControls: React.FC<BackupControlsProps> = ({
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState('');

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      setStatus(describeResult(onImport(await file.text())));
    } catch {
      setStatus('Не удалось прочитать файл');
    }
  };

  return (
    <div className="mt-8 flex shrink-0 flex-col items-center gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            onExport();
            setStatus('Копия сохранена в загрузки');
          }}
          className="cursor-pointer rounded-[10px] border px-4 py-2 font-mono text-[12.5px] font-bold uppercase tracking-[0.12em]"
          style={BUTTON_STYLE}
        >
          Сохранить копию
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-[10px] border px-4 py-2 font-mono text-[12.5px] font-bold uppercase tracking-[0.12em]"
          style={BUTTON_STYLE}
        >
          Загрузить копию
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <p
        className="min-h-[14px] font-mono text-[12.5px] uppercase tracking-[0.1em]"
        style={{ color: 'rgba(63,57,50,0.62)' }}
        role="status"
      >
        {status}
      </p>
    </div>
  );
};
