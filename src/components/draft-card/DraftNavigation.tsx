import { AnimatePresence, motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.svg';
import type { DraftStep } from '../../app/cardTheme';
import { EmbossedArrow } from '../shared/EmbossedArrow';
import { t } from '../../app/i18n';

export interface DraftNavigationProps {
  draftStep: DraftStep;
  canAdvanceDraft: boolean;
  disabled: boolean;
  nextLabel?: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
}

const buttonStyle = {
  color: 'rgba(30,28,26,0.68)',
  backgroundColor: 'rgba(245,236,218,0.16)',
  backgroundImage: 'url(' + cardboardTexture + ')',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  backgroundBlendMode: 'multiply' as const,
  border: '1px solid rgba(70,52,38,0.28)',
  boxShadow:
    '0 3px 0 rgba(83,61,43,0.3), 0 5px 7px rgba(0,0,0,0.12), inset 1px 1px 1px rgba(255,255,255,0.24)',
};

const hover = { y: -1, filter: 'brightness(1.025)' };
const tap = {
  y: 2,
  filter: 'brightness(0.98)',
  boxShadow:
    'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
  transition: { duration: 0.15, ease: 'easeOut' as const },
};

export function DraftNavigation({
  draftStep,
  canAdvanceDraft,
  disabled,
  nextLabel = (
    <>
      {t('Дальше')} <EmbossedArrow direction="right" size="1.1em" />
    </>
  ),
  onBack,
  onNext,
}: DraftNavigationProps) {
  return (
    <div className="mt-auto flex min-h-[58px] shrink-0 items-end justify-between gap-3 pt-4">
      <div className="w-[108px]">
        {draftStep !== 'kind' && draftStep !== 'confirm' && (
          <motion.button
            type="button"
            onClick={onBack}
            disabled={disabled}
            whileHover={hover}
            whileTap={tap}
            className="min-h-[46px] w-full whitespace-nowrap rounded-[11px] border-0 px-2 py-3 font-mono text-[11.5px] font-semibold uppercase tracking-[0.13em] disabled:opacity-40"
            style={buttonStyle}
          >
            <EmbossedArrow direction="left" size="1.1em" /> {t('Назад')}
          </motion.button>
        )}
      </div>

      <div className="w-[108px]">
        <AnimatePresence>
          {canAdvanceDraft && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              whileHover={hover}
              whileTap={tap}
              onClick={onNext}
              className="min-h-[46px] w-full whitespace-nowrap rounded-[11px] border-0 px-2 py-3 font-mono text-[11.5px] font-semibold uppercase tracking-[0.13em]"
              style={buttonStyle}
            >
              {nextLabel}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
