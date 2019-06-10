import {Block, HYPERLINK, Inline} from '../../util/constants';
import React from 'react';
import {ToolbarButtonInterface} from './Toolbar';

export const BLOCK_BUTTONS: ToolbarButtonInterface[] = [
    {
        label: 'H2',
        style: Block.H2,
        description: 'Heading 2',
    },
    {
        label: 'H3',
        style: Block.H3,
        description: 'Heading 3',
    },
    {
        label: (
            <svg width="10.8" height="10" viewBox="0 0 13 12">
                <path d="M12.5 0l.5.6c-2 1.5-3 3-3 4.8 0 1.5.8 2.7 2.4 3.8L9.5 12C8 10.8 7.1 9.3 7.1 7.7c0-2.4 1.8-5 5.4-7.7zM5.4 0l.5.6c-2 1.5-3 3-3 4.8 0 1.5.7 2.7 2.3 3.8L2.4 12C.8 10.8 0 9.3 0 7.7c0-2.4 1.8-5 5.4-7.7z" fill="#FFF"/>
            </svg>
        ),
        style: Block.BLOCKQUOTE,
        description: 'Blockquote',
    },
    {
        label: 'UL',
        style: Block.UL,
        description: 'Unordered List',
    },
    {
        label: 'OL',
        style: Block.OL,
        description: 'Ordered List',
    }
];

export const INLINE_BUTTONS: ToolbarButtonInterface[] = [
    {
        label: 'B',
        style: Inline.BOLD,
        description: 'Bold',
    },
    {
        label: 'I',
        style: Inline.ITALIC,
        description: 'Italic',
    },
    {
        label: 'U',
        style: Inline.UNDERLINE,
        description: 'Underline',
    },
    {
        label: 'Hi',
        style: Inline.HIGHLIGHT,
        description: 'Highlight selection',
    },
    {
        label: 'St',
        style: Inline.STRIKETHROUGH,
        description: 'Strikethrough selection',
    },
    {
        label: (
            <svg width="24" height="24">
                <path d="M12 9.2l2.7-2.8.7-.4c.6-.2 1.1-.1 1.6.4l1.4 1.5c.6.6.7 1.1.5 1.5l-.4.8-3 3c-.5.5-1.1.6-1.6.4l-.6-.3L12 9.2zm1.1 6.6l-3 2.7-.8.4c-.5.2-1.1 0-1.5-.4L6.3 17c-.5-.5-.6-1.1-.4-1.6 0-.3.2-.5.4-.7l3-3c.5-.5 1.1-.8 1.5-.6.3.1.5.4.6.5l1.7 4.2z" stroke="#FFF" fill="none"/>
            </svg>
        ),
        style: HYPERLINK,
        description: 'Add a link',
    },
];
