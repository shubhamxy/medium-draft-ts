import * as React from 'react';

import {BlockButtonsBar} from './BlockButtonsBar';
import {InlineToolbar} from './InlineButtonsBar';
import {getSelectedEntityKey, getSelection, getSelectionRect, isSelectionInsideLink} from '../../util/selection';
import {getCurrentBlock} from '../../util/helpers';
import {ENTITY_TYPE_LINK, HYPERLINK, KEY_ENTER, KEY_ESCAPE} from '../../util/constants';
import {EditorState, SelectionState} from 'draft-js';
import {ToolbarButton} from './ToolbarButton';

import './Toolbar.css';

interface ToolbarProps {
    editorState: EditorState;
    toggleBlockType: (style: string) => void;
    toggleInlineStyle: (style: string) => void;
    inlineButtons: ToolbarButtonInterface[];
    blockButtons: ToolbarButtonInterface[];
    setLink: (url: string) => void;
    focus: () => void;
}

interface ToolbarState {
    showURLInput: boolean;
    urlInputValue: string;
    selectedAddress: string;
}

export interface ToolbarButtonInterface {
    label?: string | JSX.Element;
    style: string;
    description?: string;
}

function getSelectedAddress(selState: SelectionState): string {
    return `${selState.getAnchorKey()}_${selState.getAnchorOffset()}-${selState.getFocusKey()}_${selState.getFocusOffset()}`;
}

export class Toolbar extends React.Component<ToolbarProps, ToolbarState> {

    public state = {
        selectedAddress: '',
        showURLInput: false,
        urlInputValue: '',
    };

    private toolbarRef = React.createRef<HTMLDivElement>();

    private urlInputRef = React.createRef<HTMLInputElement>();

    public componentWillReceiveProps(newProps: ToolbarProps) {
        const {editorState} = newProps;
        const selectionState = editorState.getSelection();
        const selectedAddress = getSelectedAddress(selectionState);

        if (selectionState.isCollapsed() || selectedAddress !== this.state.selectedAddress) {
            if (this.state.showURLInput) {
                this.setState({
                    selectedAddress,
                    showURLInput: false,
                    urlInputValue: '',
                });
            }
        }
    }

    public componentDidUpdate() {
        const toolbarNode = this.toolbarRef.current;
        const parent = toolbarNode.parentElement;

        if (this.state.showURLInput || !toolbarNode || !parent) {
            return;
        }

        const selectionState = this.props.editorState.getSelection();
        if (selectionState.isCollapsed()) {
            return;
        }
        const nativeSelection = getSelection(window);
        if (!nativeSelection || !nativeSelection.rangeCount) {
            return;
        }
        const selectionBoundary = getSelectionRect(nativeSelection);
        const toolbarBoundary = toolbarNode.getBoundingClientRect();

        const parentBoundary = parent.getBoundingClientRect();
        /*
        * Main logic for setting the toolbar position.
        */
        const top = (selectionBoundary.top - parentBoundary.top - toolbarBoundary.height);
        const width = toolbarBoundary.width;

        // The left side of the tooltip should be:
        // center of selection relative to parent - half width of toolbar
        const selectionCenter = (selectionBoundary.left + (selectionBoundary.width / 2)) - parentBoundary.left;
        let left = selectionCenter - (width / 2);

        if (left < 0) {
            left = 0;
        } else if (left + toolbarBoundary.width > parentBoundary.width) {
            left = parentBoundary.width - toolbarBoundary.width;
        }

        toolbarNode.style.left = `${left}px`;
        toolbarNode.style.width = `${width}px`;
        toolbarNode.style.top = `${top}px`;
    }

    public render() {
        const {editorState, inlineButtons, blockButtons} = this.props;
        const {showURLInput, urlInputValue} = this.state;
        let currentInlineButtons = [...inlineButtons];

        let isOpen = true;
        if (editorState.getSelection().isCollapsed()) {
            isOpen = false;
        }

        if (showURLInput) {
            return (
                <div
                    ref={this.toolbarRef}
                    className={`md-editor-toolbar md-editor-toolbar--link-input${(isOpen ? ' md-editor-toolbar--is-open' : '')}`}
                >
                    <div className="md-toolbar-controls md-toolbar-controls--show-input">
                        <button className="md-url-input-close md-toolbar-button" onClick={this.onSaveLink}>ok</button>
                        <input
                            ref={this.urlInputRef}
                            type="text"
                            className="md-url-input"
                            onKeyDown={this.onKeyDown}
                            onChange={this.onChange}
                            placeholder="Enter or paste url"
                            value={urlInputValue}
                        />
                    </div>
                </div>
            );
        }

        // try find hyperlink to move it in separate section
        let hyperLink: null | ToolbarButtonInterface = null;
        let isHyperLinkActive = false;
        for (let cnt = currentInlineButtons.length - 1; cnt > 0; cnt--) {
            if (currentInlineButtons[cnt].style === HYPERLINK) {
                hyperLink = currentInlineButtons.splice(cnt, 1)[0];
                isHyperLinkActive = isSelectionInsideLink(editorState);
                break;
            }
        }

        return (
            <div
                ref={this.toolbarRef}
                className={`md-editor-toolbar${(isOpen ? ' md-editor-toolbar--is-open' : '')}`}
            >
                {blockButtons.length > 0 ? (
                    <BlockButtonsBar
                        editorState={editorState}
                        onToggle={this.props.toggleBlockType}
                        buttons={blockButtons}
                    />
                ) : null}
                {currentInlineButtons.length > 0 ? (
                    <InlineToolbar
                        editorState={editorState}
                        onToggle={this.props.toggleInlineStyle}
                        buttons={currentInlineButtons}
                    />
                ) : null}
                {hyperLink && (
                    <div className="md-toolbar-controls">
                        <ToolbarButton
                            label={hyperLink.label}
                            style={hyperLink.style}
                            active={isHyperLinkActive}
                            onToggle={this.handleLinkInput}
                            description={hyperLink.description}
                        />
                    </div>
                )}
            </div>
        );
    }

    private onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.which === KEY_ENTER) {
            e.preventDefault();
            e.stopPropagation();

            this.onSaveLink();
        } else if (e.which === KEY_ESCAPE) {
            this.hideLinkInput();
        }
    }

    private onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        this.setState({
            urlInputValue: e.target.value,
        });
    }

    private handleLinkInput = () => {
        const {editorState} = this.props;
        const selection = editorState.getSelection();

        // On empty selection
        if (selection.isCollapsed()) {
            this.props.focus();

            return;
        }

        const selectedAddress = getSelectedAddress(editorState.getSelection());
        const entityKey = getSelectedEntityKey(selection, getCurrentBlock(editorState));
        let linkFound = false;

        if (entityKey) {
            const entity = editorState.getCurrentContent().getEntity(entityKey);
            if (entity.getType() === ENTITY_TYPE_LINK) {
                const {url} = entity.getData();

                this.setState({
                    selectedAddress,
                    showURLInput: true,
                    urlInputValue: url,
                }, () => {
                    setTimeout(() => {
                        this.urlInputRef.current.focus();
                        this.urlInputRef.current.select();
                    });
                });

                linkFound = true;
            }
        }

        if (!linkFound) {
            this.setState({
                selectedAddress,
                showURLInput: true,
            }, () => {
                setTimeout(() => {
                    this.urlInputRef.current.focus();
                });
            });
        }
    }

    private onSaveLink = () => {
        this.props.setLink(this.state.urlInputValue);
        this.hideLinkInput();
    }

    private hideLinkInput = () => {
        this.setState({
            selectedAddress: '',
            showURLInput: false,
            urlInputValue: '',
        }, this.props.focus);
    }
}
