import React from 'react';
import {addNewBlock} from '../model';
import {Block} from '../util/constants';
import {SideButtonComponentProps} from '../Editor';

export class Separator extends React.Component<SideButtonComponentProps> {

    public render() {
        return (
            <button className="md-sb-button" onClick={this.onClick} type="button">
                <i className="fa fa-minus"/>
            </button>
        );
    }

    private onClick = () => {
        this.props.setEditorState(addNewBlock(
            this.props.getEditorState(),
            Block.BREAK
        ));
    }
}
