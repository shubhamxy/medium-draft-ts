import React from 'react';

import PluginsEditor, {DraftPlugin} from './plugin_editor/PluginsEditor';
import {Block, Entity as E, KEY_ENTER, KEY_ESCAPE} from './util/constants';
import {getSelectedBlockNode} from './util';
import {EditorState, RichUtils} from 'draft-js';
import {AddButton} from './components/AddButton/AddButton';
import {Toolbar, ToolbarButtonInterface} from './components/Toolbar/Toolbar';

export interface SideButtonComponentProps {
    getEditorState: () => EditorState;
    setEditorState: (state: EditorState) => void;
    close: () => void;
}

export type SideButtonComponent = React.Component<SideButtonComponentProps>;

export interface SideButton {
    component: new (props: SideButtonComponentProps) => SideButtonComponent;
    props?: {};
}

export interface EditorProps {
    autoFocus?: boolean;
    editorEnabled?: boolean;
    toolbarEnabled?: boolean;
    editorState: EditorState;
    onChange: (editorState: EditorState) => void;
    placeholder?: '';
    plugins?: DraftPlugin[];
    sideButtons: SideButton[];
    inlineButtons: ToolbarButtonInterface[];
    blockButtons: ToolbarButtonInterface[];
    processURL?: (url: string) => string;
}

type EditorRefCb = (editor: PluginsEditor) => void;
type InputRefCb = (node: HTMLInputElement) => void;

interface Styles {
    top?: string | 0;
}

interface State {
    showInput: boolean;
    title: string;
    style: Styles;
}

/**
 * The main editor component with all the bells and whistles
 */
export class MediumDraftEditor extends React.PureComponent<EditorProps, State> {

    public static defaultProps = {
        autoFocus: false,
        editorEnabled: true,
        placeholder: '',
        plugins: [] as DraftPlugin[],
    };

    constructor(props: EditorProps) {
        super(props);

        this.editorRef = React.createRef();
        this.inputRef = React.createRef();

        this.state = {
            showInput: false,
            title: '',
            style: {},
        };
    }

    private readonly editorRef: React.RefObject<PluginsEditor> | EditorRefCb;

    private readonly inputRef: React.RefObject<HTMLInputElement> | InputRefCb;

    private inputPromise?: {
        resolve: (input: string) => void,
        reject: () => void,
    } = null;

    public componentDidMount() {
        if (this.props.autoFocus) {
            setTimeout(this.focus);
        }

        document.addEventListener('selectionchange', this.onSelectionChange);
    }

    public componentWillUnmount(): void {
        document.removeEventListener('selectionchange', this.onSelectionChange);
    }

    public componentDidUpdate(prevProps: EditorProps, prevState: State) {
        if (this.state.showInput && (!prevState.showInput)) {
            if (typeof this.inputRef === 'object' && this.inputRef.current) {
                this.inputRef.current.focus();
            }
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

        const editorClass = `md-RichEditor-editor${!editorEnabled ? ' md-RichEditor-readonly' : ''}`;

        return (
            <div className="md-RichEditor-root">
                <div className={editorClass}>
                    <PluginsEditor
                        {...restProps}
                        ref={this.editorRef}
                        getParentMethods={this.getMethods}
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
                {this.renderInput()}
            </div>
        );
    }

    private renderInput() {
        const {showInput, title, style} = this.state;

        if (!showInput) {
            return null;
        }

        return (
            <div className="md-modal-container" tabIndex={-1}>
                <div className="md-modal-input" style={style}>
                    <div className="md-modal-input__wrapper">
                        <label>
                            {title}
                            <input
                                type="text"
                                defaultValue=""
                                ref={this.inputRef}
                                onKeyDown={this.handleInputKeyDown}
                            />
                        </label>
                    </div>
                </div>
            </div>
        );
    }

    private focus = () => {
        if (typeof this.editorRef === 'object' && this.editorRef.current) {
            this.editorRef.current.focus();
        }
    }

    private getEditorState = () => this.props.editorState;

    private handleInputKeyDown = (ev: React.KeyboardEvent) => {
        if (ev.which !== KEY_ENTER && ev.which !== KEY_ESCAPE) {
            return;
        }

        ev.preventDefault();
        ev.stopPropagation();

        if (this.inputPromise) {
            if (ev.which === KEY_ENTER) {
                this.inputPromise.resolve((ev.target as HTMLInputElement).value);
            } else {
                this.inputPromise.reject();
            }
            this.inputPromise = null;
        }

        this.setState({
            title: '',
            showInput: false,
            style: {},
        }, this.focus);
    }

    private getInput = (title: string): Promise<string> => {
        const currentBlockElement = getSelectedBlockNode(window);

        let style: Styles = {
            top: 0,
        };

        if (currentBlockElement) {
            style.top = currentBlockElement.getBoundingClientRect().top + window.scrollY + 'px';
        }

        this.setState({
            title,
            style,
            showInput: true,
        });

        return new Promise<string>((resolve, reject) => {
            this.inputPromise = {
                resolve,
                reject,
            };
        });
    }

    private getMethods = () => {
        return {
            getInput: this.getInput,
        };
    }

    private setLink = (url: string) => {
        let { editorState } = this.props;
        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();
        let entityKey = null;
        let newUrl = url;
        if (this.props.processURL) {
            newUrl = this.props.processURL(url);
        } else if (url.indexOf('http') !== 0 && url.indexOf('mailto:') !== 0) {
            if (url.indexOf('@') >= 0) {
                newUrl = `mailto:${newUrl}`;
            } else {
                newUrl = `http://${newUrl}`;
            }
        }
        if (newUrl !== '') {
            const contentWithEntity = content.createEntity(E.LINK, 'MUTABLE', { url: newUrl });
            editorState = EditorState.push(editorState, contentWithEntity, 'apply-entity');
            entityKey = contentWithEntity.getLastCreatedEntityKey();
        }

        this.props.onChange(RichUtils.toggleLink(editorState, selection, entityKey));
    }

    /*
    The function documented in `draft-js` to be used to toggle block types (mainly
    for some key combinations handled by default inside draft-js).
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
    The function documented in `draft-js` to be used to toggle inline styles of selection (mainly
    for some key combinations handled by default inside draft-js).
    */
    private toggleInlineStyle = (inlineStyle: string) => {
        this.props.onChange(
            RichUtils.toggleInlineStyle(
                this.props.editorState,
                inlineStyle
            )
        );
    }

    private onSelectionChange = () => {

    }
}
