import {ContentBlock, EditorState, genKey, SelectionState, Modifier} from 'draft-js';

import {BASE_BLOCK_CLASS, Block, HANDLED, NOT_HANDLED} from '../util/constants';
import {ImageBlock} from '../components/blocks/ImageBlock';
import {addNewBlock, addNewBlockAt, getCurrentBlock, resetBlockWithType, updateDataOfBlock} from '../model';
import {DraftPlugin, PluginFunctions} from '../plugin_editor/PluginsEditor';

export type ImageUploadFunction = (files: Blob[]) => Promise<string[]>;

export interface ImagePluginOptionType {
    /**
     * A method that returns a Promise and resolves with the url of uploaded image.
     */
    uploadImage?: ImageUploadFunction;
}

function shouldEarlyReturn(block: ContentBlock): boolean {
    return (block.getType() !== Block.IMAGE);
}

/**
 * If file upload function is not provided, this is used to simulate
 * uploading for 1 sec.
 * @param files
 */
function dummyUploadImage(files: Blob[]): Promise<string[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(files.map((fl) => URL.createObjectURL(fl)));
        }, 1000);
    });
}

export function imageBlockPlugin(options?: ImagePluginOptionType): DraftPlugin {
    return {
        blockRendererFn(block: ContentBlock, {getEditorState, setEditorState}: PluginFunctions) {
            if (shouldEarlyReturn(block)) {
                return null;
            }

            return {
                component: ImageBlock,
                props: {
                    getEditorState,
                    setEditorState,
                },
            };
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
            const imgClass = `${BASE_BLOCK_CLASS}-image`;

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
            let newBlockKey: string;

            if (!block.getLength() && block.getType().indexOf('atomic') < 0) {
                newBlockKey = block.getKey();
                newEditorState = addNewBlock(
                    editorState,
                    Block.IMAGE, {
                        src,
                        uploading: true,
                    }
                );
            } else {
                newBlockKey = genKey();
                newEditorState = addNewBlockAt(
                    editorState,
                    currentBlockKey,
                    Block.IMAGE, {
                        src,
                        uploading: true,
                    },
                    newBlockKey,
                );
            }

            setEditorState(EditorState.forceSelection(newEditorState, new SelectionState({
                focusKey: newBlockKey,
                anchorKey: newBlockKey,
                focusOffset: 0,
            })));

            const uploadImage = (options && options.uploadImage) ? options.uploadImage : dummyUploadImage;
            uploadImage(imageFiles).then((images) => {
                const editorStateInner = getEditorState();
                const blockInner = editorStateInner.getCurrentContent().getBlockForKey(newBlockKey);
                newEditorState = updateDataOfBlock(editorStateInner, blockInner, {
                    src: images[0],
                });
                URL.revokeObjectURL(src);
                setEditorState(newEditorState);
            }).catch(() => {
                const editorStateInner = getEditorState();
                resetBlockWithType(editorStateInner, Block.UNSTYLED, {});
            });

            return HANDLED;
        }
    };
}
