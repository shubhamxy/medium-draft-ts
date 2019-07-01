import {Map} from 'immutable';
import {Block, Inline} from '../util/constants';
import {DraftPlugin} from '../plugins_editor/PluginsEditor';
import {Link, findLinkEntities} from '../entities/link';
import {ContentBlock} from 'draft-js';
import {BlockType} from '../typings';

const BASE_BLOCK_CLASS = 'md-block';

/**
 * Base plugin that provides styling and structure to the editor.
 */
export function inlineStylePlugin(): DraftPlugin {
    return {
        blockStyleFn(contentBlock: ContentBlock): string | null {
            const blockType = contentBlock.getType() as BlockType;

            switch (blockType) {
                case Block.BLOCKQUOTE:
                    return `${BASE_BLOCK_CLASS} ${BASE_BLOCK_CLASS}--quote`;
                case Block.UNSTYLED:
                    return `${BASE_BLOCK_CLASS} ${BASE_BLOCK_CLASS}--paragraph`;
                case Block.ATOMIC:
                    return `${BASE_BLOCK_CLASS} ${BASE_BLOCK_CLASS}--atomic`;
                case Block.CAPTION:
                    return `${BASE_BLOCK_CLASS} ${BASE_BLOCK_CLASS}-caption`;
                case Block.BLOCKQUOTE_CAPTION: {
                    const cls = `${BASE_BLOCK_CLASS} ${BASE_BLOCK_CLASS}--quote`;

                    return `${cls} ${BASE_BLOCK_CLASS}-quote-caption`;
                }
                default:
                    return null;
            }
        },
        customStyleMap: {
            [Inline.HIGHLIGHT]: {
                backgroundColor: 'yellow',
            },
        },
        blockRenderMap: Map({
            [Block.CAPTION]: {
                element: 'cite',
            },
            [Block.BLOCKQUOTE_CAPTION]: {
                element: 'blockquote',
            },
            [Block.IMAGE]: {
                element: 'figure',
            },
            [Block.BREAK]: {
                element: 'div',
            },
            [Block.UNSTYLED]: {
                element: 'div',
                aliasedElements: ['p', 'div'],
            },
        }),
        decorators: [{
            strategy: findLinkEntities,
            component: Link,
        }],
    };
}
