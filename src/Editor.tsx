import React from 'react';

import PluginsEditor, {DraftPlugin} from './plugin_editor/PluginsEditor';
import {KEY_ENTER, KEY_ESCAPE} from './util/constants';
import {getSelectedBlockNode} from './util';
import {EditorState} from 'draft-js';
import AddButton from './components/AddButton';

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
    editorState: EditorState;
    onChange: (editorState: EditorState) => void;
    placeholder?: '';
    plugins?: DraftPlugin[];
    sideButtons: SideButton[];
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
export default class Editor extends React.PureComponent<EditorProps, State> {

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
        if (!this.props.autoFocus) {
            return;
        }

        setTimeout(() => {
            this.focus();
        });
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
            autoFocus,
            sideButtons,
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

    private focus() {
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
        }, () => {
            this.focus();
        });
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
}
