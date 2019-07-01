import * as React from 'react';

import {BlockButtonsBar} from './BlockButtonsBar';
import {InlineToolbar} from './InlineButtonsBar';
import {getSelection, getSelectionRect} from '../../util/selection';
import {getCurrentBlock, isCursorInsideLink} from '../../util/helpers';
import {EntityTypes, HYPERLINK, KEY_ENTER, KEY_ESCAPE} from '../../util/constants';
import {EditorState, DraftEntityType, Entity} from 'draft-js';
import {ToolbarButton} from './ToolbarButton';

import './Toolbar.scss';

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
}

export interface ToolbarButtonInterface {
    label?: string | JSX.Element;
    style: string;
    description?: string;
}

export class Toolbar extends React.Component<ToolbarProps, ToolbarState> {

    public state = {
        showURLInput: false,
        urlInputValue: '',
    };

    private toolbarRef = React.createRef<HTMLDivElement>();

    private urlInputRef = React.createRef<HTMLInputElement>();

    public componentWillReceiveProps(newProps: ToolbarProps) {
        const {editorState} = newProps;
        const selectionState = editorState.getSelection();

        if (selectionState.isCollapsed()) {
            if (this.state.showURLInput) {
                this.setState({
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
        if (!nativeSelection.rangeCount) {
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
            let className = `md-editor-toolbar${(isOpen ? ' md-editor-toolbar--is-open' : '')}`;
            className += ' md-editor-toolbar--link-input';

            return (
                <div
                    ref={this.toolbarRef}
                    className={className}
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
                isHyperLinkActive = isCursorInsideLink(editorState);
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

        const currentBlock = getCurrentBlock(editorState);
        let selectedEntity = '';
        let linkFound = false;

        currentBlock.findEntityRanges((character) => {
            const entityKey = character.getEntity();
            selectedEntity = entityKey;

            return entityKey !== null && editorState.getCurrentContent().getEntity(entityKey).getType() === EntityTypes.LINK;
        }, () => {
            linkFound = true;
            const {url} = editorState.getCurrentContent().getEntity(selectedEntity).getData();

            this.setState({
                showURLInput: true,
                urlInputValue: url,
            }, () => {
                setTimeout(() => {
                    this.urlInputRef.current.focus();
                    this.urlInputRef.current.select();
                }, 0);
            });
        });

        if (!linkFound) {
            this.setState({
                showURLInput: true,
            }, () => {
                setTimeout(() => {
                    this.urlInputRef.current.focus();
                }, 0);
            });
        }
    }

    private onSaveLink = () => {
        this.props.setLink(this.state.urlInputValue);
        this.hideLinkInput();
    }

    private hideLinkInput = () => {
        this.setState({
            showURLInput: false,
            urlInputValue: '',
        }, this.props.focus);
    }
}
