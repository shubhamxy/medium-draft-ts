import {EditorState, genKey, Modifier, SelectionState} from 'draft-js';
import {Block} from './constants';
import {addNewBlock, addNewBlockAt} from './helpers';

export interface UploadImageData {
    src: string;
    srcSet?: string;
    sizes?: string;
    data?: {
        [key: string]: string;
    };
}

export interface UploadHelperOptions {
    uploadImage?: (file: Blob) => Promise<UploadImageData>;
}

export interface StateGetterSetter {
    getEditorState: () => EditorState;
    setEditorState: (state: EditorState) => void;
}

export function uploadHelper({getEditorState, setEditorState}: StateGetterSetter, files: Blob[], options: UploadHelperOptions, selection?: SelectionState) {
    let newEditorState: EditorState;
    let src = URL.createObjectURL(files[0]);
    let blockKey: string;

    const editorState = getEditorState();
    const currentSelection = selection || editorState.getSelection();
    const currentBlockKey = currentSelection.getIsBackward() ? currentSelection.getFocusKey() : currentSelection.getAnchorKey();
    const block = editorState.getCurrentContent().getBlockForKey(currentBlockKey);

    if (block && !block.getLength() && block.getType().indexOf(Block.ATOMIC) < 0) {

        // Replace empty block
        blockKey = block.getKey();
        newEditorState = addNewBlock(
            editorState,
            Block.IMAGE,
            {
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
            Block.IMAGE,
            {
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
        options.uploadImage(files[0]).then((data) => {

            if (data && data.src) {
                const state = getEditorState();
                const content = state.getCurrentContent();
                const imageBlock = content.getBlockForKey(blockKey);

                // Create new selection because Modifier.setBlockData() works only with selection,
                // but on long uploading user can select somethings else
                const targetSelection = new SelectionState({
                    anchorKey: blockKey,
                    anchorOffset: 0,
                    focusKey: blockKey,
                    focusOffset: 0
                });
                const oldSelection = state.getSelection();
                let blockData = imageBlock.getData();

                blockData = blockData.merge({
                    ...data,
                    uploading: false
                });

                setEditorState(EditorState.push(
                    state,
                    Modifier.setBlockData(
                        content,
                        targetSelection,
                        blockData
                    ),
                    'change-block-data'
                ));

                // Return correct selection position
                setEditorState(EditorState.forceSelection(getEditorState(), oldSelection));
            }
        });
    }
}
