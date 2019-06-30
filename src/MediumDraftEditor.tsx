import * as React from 'react';

import {DraftPlugin, PluginsEditor} from './plugin_editor/PluginsEditor';
import {Block, EntityTypes, KEY_CTRL} from './util/constants';
import {EditorState, RichUtils} from 'draft-js';
import {AddButton} from './components/AddButton/AddButton';
import {Toolbar, ToolbarButtonInterface} from './components/Toolbar/Toolbar';
import {Tooltip} from './components/Tooltip/Tooltip';

export interface SideButtonComponentProps {
    getEditorState: () => EditorState;
    setEditorState: (state: EditorState) => void;
    close: () => void;
}

export interface SideButton {
    component: React.ReactNode;
    props?: {};
}

export interface MediumDraftEditorProps {
    autoFocus?: boolean;
    editorEnabled?: boolean;
    toolbarEnabled?: boolean;
    editorState: EditorState;
    onChange: (editorState: EditorState) => void;
    placeholder?: string;
    plugins?: DraftPlugin[];
    sideButtons: SideButton[];
    inlineButtons: ToolbarButtonInterface[];
    blockButtons: ToolbarButtonInterface[];
    processURL?: (url: string) => string;
}

interface MediumDraftEditorState {
    isLinkTooltipOpen: boolean;
    linkTooltipTop: number;
    linkTooltipLeft: number;
    linkTooltipText: string;
}

/**
 * The main editor component with all the bells and whistles
 */
export class MediumDraftEditor extends React.PureComponent<MediumDraftEditorProps, MediumDraftEditorState> {

    public static defaultProps = {
        autoFocus: false,
        editorEnabled: true,
        placeholder: '',
        plugins: [] as DraftPlugin[],
    };

    public readonly state = {
        isLinkTooltipOpen: false,
        linkTooltipTop: 0,
        linkTooltipLeft: 0,
        linkTooltipText: ''
    };

    private mouseX: number = 0;
    private mouseY: number = 0;

    private contentEditorRef = React.createRef<HTMLDivElement>();

    private editorRef = React.createRef<PluginsEditor>();

    public componentDidMount(): void {
        if (this.props.autoFocus) {
            setTimeout(this.focus);
        }

        if (this.contentEditorRef.current) {
            this.contentEditorRef.current.addEventListener('mousemove', this.onMouseMove, {
                passive: true
            });
            window.addEventListener('keydown', this.onKeyDown);
            window.addEventListener('keyup', this.onKeyUp);
        }
    }

    public componentWillUnmount(): void {
        if (this.contentEditorRef.current) {
            this.contentEditorRef.current.removeEventListener('mousemove', this.onMouseMove);
            window.removeEventListener('keydown', this.onKeyDown);
            window.removeEventListener('keyup', this.onKeyUp);
        }
    }

    public render() {
        const {
            editorEnabled,
            toolbarEnabled,
            autoFocus,
            sideButtons,
            blockButtons,
            inlineButtons,
            ...restProps
        } = this.props;
        const {
            isLinkTooltipOpen,
            linkTooltipLeft,
            linkTooltipTop,
            linkTooltipText
        } = this.state;

        const editorClass = `md-content-editor${!editorEnabled ? ' md-content-editor--readonly' : ''}`;

        return (
            <div className="md-root">
                <div className={editorClass} ref={this.contentEditorRef}>
                    <PluginsEditor
                        {...restProps}
                        ref={this.editorRef}
                    />
                </div>
                {sideButtons.length > 0 && editorEnabled && (
                    <AddButton
                        editorState={this.props.editorState}
                        getEditorState={this.getEditorState}
                        setEditorState={this.props.onChange}
                        focus={this.focus}
                        sideButtons={this.props.sideButtons}
                    />
                )}
                {toolbarEnabled && editorEnabled && (
                    <Toolbar
                        editorState={this.props.editorState}
                        toggleBlockType={this.toggleBlockType}
                        toggleInlineStyle={this.toggleInlineStyle}
                        setLink={this.setLink}
                        focus={this.focus}
                        blockButtons={blockButtons}
                        inlineButtons={inlineButtons}
                    />
                )}
                {isLinkTooltipOpen && (
                    <Tooltip
                        left={linkTooltipLeft}
                        top={linkTooltipTop}
                        text={linkTooltipText}
                    />
                )}
            </div>
        );
    }

    private focus = () => {
        if (this.editorRef.current) {
            this.editorRef.current.focus();
        }
    }

    private getEditorState = () => this.props.editorState;

    private setLink = (url: string) => {
        let { editorState } = this.props;
        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();
        let entityKey = null;
        let newUrl = url;

        if (this.props.processURL) {
            newUrl = this.props.processURL(url);
        } else if (url && url.indexOf('http') !== 0 && url.indexOf('mailto:') !== 0) {
            if (url.indexOf('@') >= 0) {
                newUrl = `mailto:${newUrl}`;
            } else {
                newUrl = `http://${newUrl}`;
            }
        }
        if (newUrl) {
            const contentWithEntity = content.createEntity(EntityTypes.LINK, 'MUTABLE', { url: newUrl });
            editorState = EditorState.push(editorState, contentWithEntity, 'apply-entity');
            entityKey = contentWithEntity.getLastCreatedEntityKey();
        }

        this.props.onChange(RichUtils.toggleLink(editorState, selection, entityKey));
    }

    /*
    * The function documented in `draft-js` to be used to toggle block types (mainly
    * for some key combinations handled by default inside draft-js).
    */
    private toggleBlockType = (blockType: string) => {
        const type = RichUtils.getCurrentBlockType(this.props.editorState);
        if (type.indexOf(`${Block.ATOMIC}:`) === 0) {
            return;
        }

        this.props.onChange(
            RichUtils.toggleBlockType(
                this.props.editorState,
                blockType
            )
        );
    }

    /*
    * The function documented in `draft-js` to be used to toggle inline styles of selection (mainly
    * for some key combinations handled by default inside draft-js).
    */
    private toggleInlineStyle = (inlineStyle: string) => {
        this.props.onChange(
            RichUtils.toggleInlineStyle(
                this.props.editorState,
                inlineStyle
            )
        );
    }

    private onMouseMove = (event: MouseEvent) => {
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }

    private onKeyDown = (event: KeyboardEvent) => {
        if (event.keyCode === KEY_CTRL) {
            const linkClassName = 'md-link';
            const rootClassName = 'md-root';
            let element = document.elementFromPoint(this.mouseX, this.mouseY);
            let linkElement: HTMLAnchorElement | null = null;
            let rootElement: HTMLElement | null = null;

            do {
                if (element) {
                    if (element.classList.contains(linkClassName)) {
                        linkElement = element as HTMLAnchorElement;
                    }

                    if (element.classList.contains(rootClassName)) {
                        rootElement = element as HTMLElement;
                    }

                    element = element.parentElement;
                }
            } while (element && !(linkElement && rootElement));

            if (rootElement && linkElement) {
                this.openLinkTooltip(rootElement, linkElement);
            }
        }
    }

    private onKeyUp = (event: KeyboardEvent) => {
        if (event.keyCode === KEY_CTRL) {
            this.setState({
                isLinkTooltipOpen: false
            });
        }
    }

    private openLinkTooltip(root: HTMLElement, element: HTMLAnchorElement) {
        const elementBounds = element.getBoundingClientRect();
        const rootBounds = root.getBoundingClientRect();
        const MIN_TOOLTIP_WIDTH = 300;

        if (elementBounds && rootBounds) {
            let left = elementBounds.left - rootBounds.left;
            if (rootBounds.right - elementBounds.left < MIN_TOOLTIP_WIDTH) {
                left = rootBounds.right - rootBounds.left - MIN_TOOLTIP_WIDTH;
            }

            this.setState({
                isLinkTooltipOpen: true,
                linkTooltipTop: elementBounds.bottom - rootBounds.top,
                linkTooltipLeft: left,
                linkTooltipText: element.href
            });
        }
    }
}
