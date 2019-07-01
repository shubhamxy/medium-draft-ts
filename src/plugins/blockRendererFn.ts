import QuoteCaptionBlock from '../blocks/BlockQuoteCaption';
import CaptionBlock from '../blocks/CaptionBlock';
import AtomicBlock from '../blocks/Atomic';
import {SeparatorBlock} from '../blocks/SeparatorBlock';
import {TextBlock} from '../blocks/TextBlock';
import {Block} from '../util/constants';
import {DraftPlugin, PluginFunctions} from '../plugins_editor/PluginsEditor';
import {ContentBlock, DraftBlockType} from 'draft-js';

export function blockRendererPlugin(): DraftPlugin {
    return {
        blockRendererFn(contentBlock: ContentBlock, pluginFns: PluginFunctions) {
            const {getEditorState, setEditorState} = pluginFns;
            const blockType = contentBlock.getType();

            switch (blockType) {
                case Block.UNSTYLED:
                case Block.PARAGRAPH:
                    return {
                        component: TextBlock,
                    };
                case Block.BLOCKQUOTE_CAPTION:
                    return {
                        component: QuoteCaptionBlock,
                    };
                case Block.CAPTION:
                    return {
                        component: CaptionBlock,
                    };
                case Block.ATOMIC:
                    return {
                        component: AtomicBlock,
                        editable: false,
                        props: {
                            getEditorState,
                        },
                    };
                case Block.BREAK:
                    return {
                        component: SeparatorBlock,
                        editable: false,
                    };
                default:
                    return null;
            }
        }
    };
}
