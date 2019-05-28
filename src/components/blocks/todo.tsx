import React from 'react';
import {EditorBlock, ContentBlock, EditorState} from 'draft-js';

import {updateDataOfBlock} from '../../model/';

interface Props {
    block: ContentBlock;
    blockProps: {
        getEditorState: () => EditorState;
        setEditorState: (es: EditorState) => void;
    };
}

export default class TodoBlock extends React.Component<Props> {

    public render() {
        const data = this.props.block.getData();
        const checked = data.get('checked') === true;
        return (
            <div className={checked ? 'block-todo-completed' : ''}>
                <span contentEditable={false}>
                    <input type="checkbox" checked={checked} onChange={this.updateData}/>
                </span>
                <EditorBlock {...this.props} />
            </div>
        );
    }

    private updateData = () => {
        const {block, blockProps} = this.props;
        const {setEditorState, getEditorState} = blockProps;
        const data = block.getData();
        const checked = (data.has('checked') && data.get('checked') === true);
        const newData = data.set('checked', !checked);
        setEditorState(updateDataOfBlock(getEditorState(), block, newData));
    }
}
