/**
 * How the card file (the deck tabs and the edges under them) is put together.
 * The "box" is the one that stayed: the edges lie in one box of the deck's
 * back, and the tabs grow out of it. The other looks were tried and dropped;
 * the type keeps their names because the file's drawing still branches on them.
 */
export type FileStyle = 'current' | 'box' | 'leather' | 'folder' | 'flat';

const FILE_STYLE: FileStyle = 'box';

export const useFileStyle = (): FileStyle => FILE_STYLE;
