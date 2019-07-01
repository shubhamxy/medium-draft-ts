/*
Some of the constants which are used throughout this project instead of
directly using string.
*/

export const KEY_ENTER = 13;
export const KEY_ESCAPE = 27;
export const KEY_CTRL = 17;
export const KEY_K = 75;
export const KEY_L = 76;
export const KEY_ONE = 49;
export const KEY_TWO = 50;
export const KEY_THREE = 51;
export const KEY_EIGHT = 56;
export const KEY_COMMA = 188;
export const KEY_PERIOD = 190;

export const Block = {
  UNSTYLED: 'unstyled',
  PARAGRAPH: 'unstyled',
  OL: 'ordered-list-item',
  UL: 'unordered-list-item',
  H1: 'header-one',
  H2: 'header-two',
  H3: 'header-three',
  H4: 'header-four',
  H5: 'header-five',
  H6: 'header-six',
  CODE: 'code-block',
  BLOCKQUOTE: 'blockquote',
  ATOMIC: 'atomic',
  BLOCKQUOTE_CAPTION: 'block-quote-caption',
  CAPTION: 'caption',
  IMAGE: 'atomic:image',
  BREAK: 'atomic:break',
};

export const Inline = {
  BOLD: 'BOLD',
  CODE: 'CODE',
  ITALIC: 'ITALIC',
  STRIKETHROUGH: 'STRIKETHROUGH',
  UNDERLINE: 'UNDERLINE',
  HIGHLIGHT: 'HIGHLIGHT',
};

export const EntityTypes = {
  LINK: 'LINK',
};

export const HYPERLINK = 'hyperlink';
export const HANDLED = 'handled';
export const NOT_HANDLED = 'not-handled';

export const KEY_COMMANDS = {
  addNewBlock: () => 'add-new-block',
  changeType: (type = '') => `changetype:${type}`,
  showLinkInput: () => 'showlinkinput',
  unlink: () => 'unlink',
  toggleInline: (type = '') => `toggleinline:${type}`,
  deleteBlock: () => 'delete-block',
};

export const StringToTypeMap: {[key: string]: string} = {
  '--': `${Block.BLOCKQUOTE}:${Block.BLOCKQUOTE_CAPTION}:${Block.CAPTION}`,
  '> ': Block.BLOCKQUOTE,
  '*.': Block.UL,
  '* ': Block.UL,
  '- ': Block.UL,
  '1.': Block.OL,
  '# ': Block.H1,
  '##': Block.H2,
  '==': Block.UNSTYLED,
  '``': Block.CODE,
};

export const continuousBlocks = [
  Block.UNSTYLED,
  Block.BLOCKQUOTE,
  Block.OL,
  Block.UL,
];

export const BASE_BLOCK_CLASS = 'md-block';
