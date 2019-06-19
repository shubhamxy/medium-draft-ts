import * as React from 'react';

import {ToolbarButton} from './ToolbarButton';
import {ToolbarButtonInterface} from './Toolbar';
import {EditorState} from 'draft-js';

interface InlineToolbarProps {
    buttons: ToolbarButtonInterface[];
    editorState: EditorState;
    onToggle: (blockType: string) => void;
}

export const InlineToolbar: React.FunctionComponent<InlineToolbarProps> = (props) => {
    if (props.buttons.length < 1) {
        return null;
    }
    const currentStyle = props.editorState.getCurrentInlineStyle();

    return (
        <div className="md-RichEditor-controls md-RichEditor-controls-inline">
            {props.buttons.map((button) => {
                return (
                    <ToolbarButton
                        label={button.label}
                        key={button.style}
                        active={currentStyle.has(button.style)}
                        onToggle={props.onToggle}
                        style={button.style}
                        description={button.description}
                    />
                );
            })}
        </div>
    );
};
