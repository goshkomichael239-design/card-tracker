import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { groupStyle, type DeckGroup } from './switcherItems';

interface DeckDividerProps {
  group: DeckGroup;
  count: number;
  isFiltered: boolean;
  onPress?: () => void;
}

/**
 * A kraft card-index divider inside the list. Pressing a dated divider keeps
 * only its group in the list and the deck; pressing it again brings it all back.
 */
export const DeckDivider: React.FC<DeckDividerProps> = ({
  group,
  count,
  isFiltered,
  onPress,
}) => {
  const style = groupStyle(group);
  const className = `deck-divider engraved${isFiltered ? ' deck-divider--active' : ''}`;
  const cssStyle: React.CSSProperties = {
    color: style.ink,
    backgroundImage: `url(${cardboardTexture})`,
  };
  const content = (
    <>
      <span className="deck-divider__mark" style={{ backgroundColor: style.mark }} />
      <span>{style.label}</span>
      <span className="ml-auto flex items-center gap-1.5">
        {isFiltered && <span className="deck-divider__all">показать всё</span>}
        <span className="deck-divider__count">{count}</span>
      </span>
    </>
  );

  return onPress ? (
    <button
      type="button"
      onClick={onPress}
      onTouchStart={() => undefined}
      aria-pressed={isFiltered}
      className={className}
      style={cssStyle}
    >
      {content}
    </button>
  ) : (
    <div className={className} style={cssStyle}>
      {content}
    </div>
  );
};
