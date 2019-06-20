import {ContentBlock, EditorState} from 'draft-js';

export interface BlockPropsInner {
    getEditorState?: () => EditorState;
    setEditorState?: (es: EditorState) => void;
}

export interface BlockProps {
    block: ContentBlock;
    blockProps?: BlockPropsInner;
}
