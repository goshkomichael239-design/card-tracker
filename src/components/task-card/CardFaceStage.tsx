import React from 'react';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.avif';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';

export type CardFace =
  | 'view'
  | 'actions'
  | 'edit'
  | 'finish'
  | 'postpone'
  | 'list';

/** 1 wipes left to right (going deeper), -1 right to left (going back). */
export type FaceDirection = 1 | -1;

const WIPE_DURATION = 0.5;
const WIPE_EASE: [number, number, number, number] = [0.45, 0, 0.2, 1];
const SMUDGE_WIDTH = 64;

const hiddenClip = (direction: FaceDirection): string =>
  direction === 1
    ? 'inset(0% 100% 0% 0%)'
    : 'inset(0% 0% 0% 100%)';

interface FaceLayerProps {
  direction: FaceDirection;
  paperTint: string;
  children: React.ReactNode;
}

/**
 * One printed face of the card. It is an opaque sheet of the same paper, so it
 * can be revealed over the previous face without the two texts showing through
 * each other.
 */
const FaceLayer: React.FC<FaceLayerProps> = ({
  direction,
  paperTint,
  children,
}) => {
  const isPresent = useIsPresent();
  const config = INITIAL_TASK_CARD_V2_CONFIG;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ clipPath: hiddenClip(direction) }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      // The outgoing face has to stay mounted underneath for the wipe.
      exit={{ opacity: 0.99 }}
      transition={{ duration: WIPE_DURATION, ease: WIPE_EASE }}
      style={{
        padding: config.contentPadding,
        backgroundColor: paperTint,
        pointerEvents: isPresent ? 'auto' : 'none',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'multiply',
          opacity: config.paperTextureOpacity,
        }}
        aria-hidden="true"
      />
      {children}
    </motion.div>
  );
};

interface CardFaceStageProps {
  face: CardFace;
  /**
   * Identity of the thing printed on the face (the card id). It is part of the
   * layer key, so a face for a different card is always a fresh instance and
   * never revives a still-exiting layer that holds another card's state.
   */
  subjectId: string;
  direction: FaceDirection;
  /** Paper colour of the card, so every face is the same sheet. */
  paperTint: string;
  children: React.ReactNode;
}

/**
 * Swaps the card's printed face with a quick "wipe": the new face is revealed
 * behind a soft smudge of a cloth passing over the paper, like chalk being
 * rubbed off a board, in about half a second.
 */
export const CardFaceStage: React.FC<CardFaceStageProps> = ({
  face,
  subjectId,
  direction,
  paperTint,
  children,
}) => {
  // The plain face is shared by all cards (switching cards must not wipe);
  // faces that carry state are tied to the card they were opened for.
  const layerKey = face === 'view' ? 'view' : `${subjectId}:${face}`;
  const width = INITIAL_TASK_CARD_V2_CONFIG.width;
  const half = SMUDGE_WIDTH / 2;
  const from = direction === 1 ? -half : width - half;
  const to = direction === 1 ? width - half : -half;

  return (
    <>
      <AnimatePresence initial={false}>
        <FaceLayer
          key={layerKey}
          direction={direction}
          paperTint={paperTint}
        >
          {children}
        </FaceLayer>
      </AnimatePresence>

      {/* The cloth. With initial={false} it first mounts already finished and
          invisible, and replays on every face change. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={layerKey}
          className="pointer-events-none absolute bottom-0 top-0"
          style={{
            left: 0,
            width: SMUDGE_WIDTH,
            zIndex: 5,
            // The cloth is the card's own paper colour (8-digit hex alpha).
            background: `linear-gradient(90deg, ${paperTint}00 0%, ${paperTint}e0 50%, ${paperTint}00 100%)`,
          }}
          initial={{ x: from, opacity: 0 }}
          animate={{ x: to, opacity: [0, 1, 1, 0] }}
          exit={{ opacity: 0, transition: { duration: 0 } }}
          transition={{
            x: { duration: WIPE_DURATION, ease: WIPE_EASE },
            opacity: {
              duration: WIPE_DURATION,
              times: [0, 0.1, 0.82, 1],
              ease: 'linear',
            },
          }}
          aria-hidden="true"
        />
      </AnimatePresence>
    </>
  );
};
