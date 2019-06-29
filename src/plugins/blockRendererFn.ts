import QuoteCaptionBlock from '../blocks/blockquotecaption';
import CaptionBlock from '../blocks/caption';
import AtomicBlock from '../blocks/atomic';
import {SeparatorBlock} from '../blocks/SeparatorBlock';
import {TextBlock} from '../blocks/TextBlock';
import {Block} from '../util/constants';
import {DraftPlugin, PluginFunctions} from '../plugin_editor/PluginsEditor';
import {ContentBlock} from 'draft-js';

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
