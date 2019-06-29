import * as React from 'react';

import {DraftPlugin, PluginsEditor} from './plugin_editor/PluginsEditor';
import {Block, EntityTypes} from './util/constants';
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
    placeholder?: string;
    plugins?: DraftPlugin[];
    sideButtons: SideButton[];
    inlineButtons: ToolbarButtonInterface[];
    blockButtons: ToolbarButtonInterface[];
    processURL?: (url: string) => string;
}

/**
 * The main editor component with all the bells and whistles
 */
export class MediumDraftEditor extends React.PureComponent<EditorProps> {

    public static defaultProps = {
        autoFocus: false,
        editorEnabled: true,
        placeholder: '',
        plugins: [] as DraftPlugin[],
    };

    constructor(props: EditorProps) {
        super(props);

        this.editorRef = React.createRef<PluginsEditor>();
    }

    private readonly editorRef: React.RefObject<PluginsEditor>;

    public componentDidMount() {
        if (this.props.autoFocus) {
            setTimeout(this.focus);
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

        const editorClass = `md-content-editor${!editorEnabled ? ' md-content-editor--readonly' : ''}`;

        return (
            <div className="md-root">
                <div className={editorClass}>
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
}
