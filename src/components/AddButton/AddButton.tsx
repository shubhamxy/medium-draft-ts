import React from 'react';
import {DraftBlockType, EditorState, SelectionState} from 'draft-js';

import {getSelectedBlockNode} from '../../util';
import {SideButton} from '../../MediumDraftEditor';
import {Block} from '../../util/constants';

interface AddButtonProps {
    editorState: EditorState;
    sideButtons: SideButton[];
    getEditorState: () => EditorState;
    setEditorState: (state: EditorState) => void;
    focus: () => void;
}

interface AddButtonState {
    visible: boolean;
    isOpen: boolean;
    top: number;
}

interface ExtendedSelectionState extends SelectionState {
    anchorKey: string;
    focusKey: string;
}

/**
 * Implementation of the medium-link side `+` button to insert various rich blocks
 * like Images/Embeds/Videos.
 */
export class AddButton extends React.Component<AddButtonProps, AddButtonState> {

    public state: Readonly<AddButtonState> = {
        visible: false,
        isOpen: false,
        top: 0,
    };

    private node: HTMLElement = null;

    private blockType: DraftBlockType = 'unstyled';

    private blockKey: string = '';

    // To show + button only when text length == 0
    public componentWillReceiveProps(newProps: AddButtonProps) {
        const {editorState} = newProps;
        const contentState = editorState.getCurrentContent();
        const selectionState = editorState.getSelection() as ExtendedSelectionState;
        if (!selectionState.isCollapsed()
            || selectionState.anchorKey !== selectionState.focusKey
            || contentState.getBlockForKey(selectionState.getAnchorKey()).getType().indexOf('atomic') >= 0) {
            this.hideBlock();
            return;
        }
        const block = contentState.getBlockForKey(selectionState.anchorKey as string);
        const bkey = block.getKey();
        if (block.getLength() > 0) {
            this.hideBlock();
            return;
        }
        if (block.getType() !== this.blockType) {
            this.blockType = block.getType();
            if (block.getLength() === 0) {
                setTimeout(this.findNode, 0);
            }
            this.blockKey = bkey;
            return;
        }
        if (this.blockKey === bkey) {
            if (block.getLength() > 0) {
                this.hideBlock();
            } else {
                this.setState({
                    visible: true,
                });
            }
            return;
        }
        this.blockKey = bkey;
        if (block.getLength() > 0) {
            this.hideBlock();
            return;
        }
        setTimeout(this.findNode, 0);
    }

    public render() {
        if (!this.state.visible) {
            return null;
        }

        return (
            <div className="md-side-toolbar" style={{top: this.state.top + 'px'}}>
                <button
                    onClick={this.toggleToolbar}
                    className={`md-sb-button md-add-button${this.state.isOpen ? ' md-open-button' : ''}`}
                    type="button"
                >
                    <svg viewBox="0 0 14 14" height="14" width="14">
                        <polygon points="14,5 9,5 9,0 5,0 5,5 0,5 0,9 5,9 5,14 9,14 9,9 14,9 "/>
                    </svg>
                </button>
                {
                    this.state.isOpen ? (
                        <div className="mb-side-menu">
                            {
                                this.props.sideButtons.map((button, index) => {
                                    const Button = button.component;
                                    const extraProps = button.props ? button.props : {};
                                    return (
                                        <Button
                                            {...extraProps}
                                            key={index}
                                            getEditorState={this.props.getEditorState}
                                            setEditorState={this.props.setEditorState}
                                            close={this.toggleToolbar}
                                        />
                                    );
                                })
                            }
                        </div>
                    ) : null
                }
            </div>
        );
    }

    private hideBlock = () => {
        if (this.state.visible) {
            this.setState({
                visible: false,
                isOpen: false,
            });
        }
    }

    private toggleToolbar = () => {
        this.setState({
            isOpen: !this.state.isOpen,
        }, () => { // callback function
            // save page state
            const x = window.scrollX;
            const y = window.scrollY;
            // do focus
            this.props.focus();
            // back previous window state
            window.scrollTo(x, y);
        });
    }

    private findNode = () => {
        const node = getSelectedBlockNode(window);
        if (node === this.node) {
            return;
        }

        if (!node) {
            this.setState({
                visible: false,
                isOpen: false,
            });
            return;
        }

        this.node = node;

        this.setState({
            visible: true,
            top: node.offsetTop
        });
    }
}
