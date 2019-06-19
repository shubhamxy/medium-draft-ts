import * as React from 'react';
import ReactDOM from 'react-dom';
import {EditorState} from 'draft-js';
import {stateToHTML} from 'draft-js-export-html';

import 'draft-js/dist/Draft.css';
import './index.scss';
import './demo.css';
import './components/AddButton/addbutton.scss';
import './components/Toolbar/toolbar.scss';
import './components/blocks/atomic.scss';
import './components/blocks/blockquotecaption.scss';
import './components/blocks/caption.scss';
import './components/blocks/image.scss';
import './components/blocks/text.scss';
import './components/blocks/todo.scss';
import './components/blocks/code.scss';

import {EditorProps, SideButton, MediumDraftEditor} from './MediumDraftEditor';
import {createEditorState} from './model';
import {codeBlockPlugin} from './plugins/codeblockplugin';
import {imageBlockPlugin} from './plugins/imageblockPlugin';
import {inlineStylePlugin} from './plugins/style';
import {blockMovePlugin} from './plugins/blockMovePlugin';
import {keyboardPlugin} from './plugins/keyboardPlugin';
import {DraftPlugin} from './plugin_editor/PluginsEditor';
import {Separator} from './SideButtons/Separator';
import {Image} from './SideButtons/Image';
import {BLOCK_BUTTONS, INLINE_BUTTONS} from './components/Toolbar/Buttons';
import {blockRendererPlugin} from './plugins/blockRendererFn';

interface State {
    editorState: EditorState;
}

interface Props {
    Component?: new (props: EditorProps) => MediumDraftEditor;
}

const rootNode = document.getElementById('root');

class App extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.plugins = [
            codeBlockPlugin(),
            imageBlockPlugin(),
            inlineStylePlugin(),
            blockMovePlugin(),
            keyboardPlugin(),
            blockRendererPlugin(),
        ];

        this.sideButtons = [
            {
                component: Separator,
            },
            {
                component: Image,
            }
        ];

        this.state = {
            editorState: createEditorState(),
        };
    }

    private readonly plugins: DraftPlugin[];

    private readonly sideButtons: SideButton[];

    public render() {
        const {Component: Editor = MediumDraftEditor} = this.props;

        return (
            <Editor
                autoFocus
                editorState={this.state.editorState}
                onChange={this.onChange}
                plugins={this.plugins}
                inlineButtons={INLINE_BUTTONS}
                blockButtons={BLOCK_BUTTONS}
                sideButtons={this.sideButtons}
                toolbarEnabled={true}
            />
        );
    }

    private onChange = (editorState: EditorState) => {
        console.log(stateToHTML(editorState.getCurrentContent()));

        this.setState({
            editorState,
        });
    }
}

ReactDOM.render(<App/>, rootNode);
