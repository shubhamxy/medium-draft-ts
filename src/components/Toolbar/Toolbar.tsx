import React, {ChangeEventHandler, KeyboardEventHandler, MouseEventHandler} from 'react';

import {BlockButtonsBar} from './BlockButtonsBar';
import {InlineToolbar} from './InlineButtonsBar';

import {getSelection, getSelectionRect} from '../../util';
import {getCurrentBlock} from '../../model';
import {Entity, HYPERLINK, KEY_ENTER, KEY_ESCAPE} from '../../util/constants';
import {EditorState} from 'draft-js';

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
    icon?: string;
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
            return;
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
        // eslint-disable-next-line no-undef
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
        const screenLeft = parentBoundary.left + left;
        if (screenLeft < 0) {
            // If the toolbar would be off-screen
            // move it as far left as it can without going off-screen
            left = -parentBoundary.left;
        }
        toolbarNode.style.left = `${left}px`;
        toolbarNode.style.width = `${width}px`;
        toolbarNode.style.top = `${top}px`;
    }

    public render() {
        const {editorState, inlineButtons} = this.props;
        const {showURLInput, urlInputValue} = this.state;
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
                    <div
                        className="md-RichEditor-controls md-RichEditor-show-link-input"
                        style={{display: 'block'}}
                    >
                        <span className="md-url-input-close" onClick={this.hideLinkInput}>&times;</span>
                        <input
                            ref={this.urlInputRef}
                            type="text"
                            className="md-url-input"
                            onKeyDown={this.onKeyDown}
                            onChange={this.onChange}
                            placeholder="Press ENTER or ESC"
                            value={urlInputValue}
                        />
                    </div>
                </div>
            );
        }
        let hasHyperLink = false;
        let hyperlinkLabel: string | JSX.Element = '#';
        let hyperlinkDescription = 'Add a link';

        for (let cnt = 0; cnt < inlineButtons.length; cnt++) {
            if (inlineButtons[cnt].style === HYPERLINK) {
                hasHyperLink = true;
                if (inlineButtons[cnt].label) {
                    hyperlinkLabel = inlineButtons[cnt].label;
                }
                if (inlineButtons[cnt].description) {
                    hyperlinkDescription = inlineButtons[cnt].description;
                }
                break;
            }
        }
        return (
            <div
                ref={this.toolbarRef}
                className={`md-editor-toolbar${(isOpen ? ' md-editor-toolbar--is-open' : '')}`}
            >
                {this.props.blockButtons.length > 0 ? (
                    <BlockButtonsBar
                        editorState={editorState}
                        onToggle={this.props.toggleBlockType}
                        buttons={this.props.blockButtons}
                    />
                ) : null}
                {this.props.inlineButtons.length > 0 ? (
                    <InlineToolbar
                        editorState={editorState}
                        onToggle={this.props.toggleInlineStyle}
                        buttons={this.props.inlineButtons}
                    />
                ) : null}
                {hasHyperLink && (
                    <div className="md-RichEditor-controls">
                        <span
                            className="md-RichEditor-styleButton md-RichEditor-linkButton hint--top"
                            onClick={this.handleLinkInput}
                            aria-label={hyperlinkDescription}
                        >
                            {hyperlinkLabel}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    private onKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.which === KEY_ENTER) {
            e.preventDefault();
            e.stopPropagation();
            this.props.setLink(this.state.urlInputValue);
            this.hideLinkInput(null);
        } else if (e.which === KEY_ESCAPE) {
            this.hideLinkInput(null);
        }
    }

    private onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        this.setState({
            urlInputValue: e.target.value,
        });
    }

    private handleLinkInput: MouseEventHandler<HTMLSpanElement> = (e, direct = false) => {
        if (direct !== true) {
            e.preventDefault();
            e.stopPropagation();
        }
        const {editorState} = this.props;
        const selection = editorState.getSelection();
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
            return entityKey !== null && editorState.getCurrentContent().getEntity(entityKey).getType() === Entity.LINK;
        }, (start, end) => {
            let selStart = selection.getAnchorOffset();
            let selEnd = selection.getFocusOffset();
            if (selection.getIsBackward()) {
                selStart = selection.getFocusOffset();
                selEnd = selection.getAnchorOffset();
            }
            if (start === selStart && end === selEnd) {
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
            }
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

    private hideLinkInput: MouseEventHandler<HTMLSpanElement> = (e) => {
        if (e !== null) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.setState({
            showURLInput: false,
            urlInputValue: '',
        }, this.props.focus);
    }
}
