import React from 'react';
import ReactDOM from 'react-dom';
import {EditorState} from 'draft-js';

import 'draft-js/dist/Draft.css';
import './index.scss';
import './demo.css';
import './components/addbutton.scss';
import './components/addbutton.scss';
import './components/toolbar.scss';
import './components/blocks/atomic.scss';
import './components/blocks/blockquotecaption.scss';
import './components/blocks/caption.scss';
import './components/blocks/image.scss';
import './components/blocks/text.scss';
import './components/blocks/todo.scss';
import './components/blocks/code.scss';
import {EditorProps, SideButton} from './Editor';
import {createEditorState, Editor as EditorDraft } from './';
import codeBlockPlugin from './plugins/codeblockplugin';
import imageBlockPlugin from './plugins/imageblockPlugin';
import stylePlugin from './plugins/style';
import rendererPlugin from './plugins/blockRendererFn';
import blockMovePlugin from './plugins/blockMovePlugin';
import keyboardPlugin from './plugins/keyboardPlugin';
import {DraftPlugin} from './plugin_editor/PluginsEditor';
import {Separator} from './SideButtons/Separator';
import {Image} from './SideButtons/Image';

interface State {
    editorState: Draft.EditorState;
}

interface Props {
    Component?: new (props: EditorProps) => EditorDraft;
}

const rootNode = document.getElementById('root');

class App extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.plugins = [
            codeBlockPlugin(),
            imageBlockPlugin(),
            stylePlugin(),
            rendererPlugin(),
            blockMovePlugin(),
            keyboardPlugin(),
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
        const {Component: Editor = EditorDraft} = this.props;

        return (
            <Editor
                autoFocus
                editorState={this.state.editorState}
                onChange={this.onChange}
                plugins={this.plugins}
                sideButtons={this.sideButtons}
            />
        );
    }

    private onChange = (editorState: EditorState) => {
        this.setState({
            editorState,
        });
    }
}

ReactDOM.render(<App/>, rootNode);

if (process.env.NODE_ENV === 'development') {
    if (module.hot) {
        module.hot.accept('./Editor', () => {
            const {Editor} = require('./Editor');
            ReactDOM.render(<App Component={Editor}/>, rootNode);
        });
    }
}
