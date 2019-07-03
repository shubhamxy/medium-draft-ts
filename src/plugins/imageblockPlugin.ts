import {ContentBlock, EditorState, genKey, SelectionState, Modifier} from 'draft-js';

import {BASE_BLOCK_CLASS, Block, HANDLED, NOT_HANDLED} from '../util/constants';
import {ImageBlock} from '../blocks/ImageBlock';
import {addNewBlock, addNewBlockAt, getCurrentBlock} from '../util/helpers';
import {DraftPlugin, PluginFunctions} from '../plugins_editor/PluginsEditor';

export interface ImagePluginOptionType {
    /**
     * A method that returns a Promise and resolves with the url of uploaded image.
     */
    uploadImage?: (files: Blob[]) => void;
}

function shouldEarlyReturn(block: ContentBlock): boolean {
    return (block.getType() !== Block.IMAGE);
}

export function imageBlockPlugin(options?: ImagePluginOptionType): DraftPlugin {
    return {
        blockRendererFn(block: ContentBlock, {getEditorState, setEditorState}: PluginFunctions) {
            if (!shouldEarlyReturn(block)) {
                return {
                    component: ImageBlock,
                    props: {
                        getEditorState,
                        setEditorState,
                    },
                };
            }
        },

        /**
         * Handle pasting when cursor is in an image block. Paste the text as the
         * caption. Otherwise, let Draft do its thing.
         */
        handlePastedText(text: string, html: string, editorState: EditorState, {setEditorState}: PluginFunctions) {
            const currentBlock = getCurrentBlock(editorState);
            if (currentBlock.getType() === Block.IMAGE) {
                const content = editorState.getCurrentContent();

                setEditorState(EditorState.push(
                    editorState,
                    Modifier.insertText(
                        content,
                        editorState.getSelection(),
                        text
                    ),
                    'change-block-data'
                ));

                return HANDLED;
            }

            return NOT_HANDLED;
        },

        blockStyleFn(block: ContentBlock) {
            if (shouldEarlyReturn(block)) {
                return null;
            }

            const blockData = block.getData();
            const uploading = blockData.has('uploading') && blockData.get('uploading', false);
            const imgClass = `${BASE_BLOCK_CLASS}--image`;

            return `${BASE_BLOCK_CLASS} ${imgClass} ${uploading ? `${imgClass}--uploading` : ''}`;
        },

        handleDroppedFiles(selection: SelectionState, files: Blob[], {getEditorState, setEditorState}: PluginFunctions) {
            if (!selection.isCollapsed() || !files.length) {
                return NOT_HANDLED;
            }

            const imageFiles = files.filter((file) => file.type.indexOf('image/') === 0);

            if (!imageFiles) {
                return NOT_HANDLED;
            }

            const editorState = getEditorState();
            const currentBlockKey = selection.getIsBackward() ? selection.getFocusKey() : selection.getAnchorKey();
            const block = editorState.getCurrentContent().getBlockForKey(currentBlockKey);

            let newEditorState: EditorState;
            let src = URL.createObjectURL(imageFiles[0]);
            let blockKey: string;

            if (!block.getLength() && block.getType().indexOf(Block.ATOMIC) < 0) {

                // Replace empty block
                blockKey = block.getKey();
                newEditorState = addNewBlock(
                    editorState,
                    Block.IMAGE, {
                        src,
                        uploading: true,
                    }
                );
            } else {

                // Insert after current block
                blockKey = genKey();
                newEditorState = addNewBlockAt(
                    editorState,
                    currentBlockKey,
                    Block.IMAGE, {
                        src,
                        uploading: true,
                    },
                    blockKey,
                );
            }

            setEditorState(EditorState.forceSelection(newEditorState, new SelectionState({
                focusKey: blockKey,
                anchorKey: blockKey,
                focusOffset: 0,
            })));

            if (options && options.uploadImage) {
                options.uploadImage([imageFiles[0]]);
            }

            return HANDLED;
        }
    };
}
