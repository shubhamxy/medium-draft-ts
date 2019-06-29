import * as React from 'react';
import ReactDOM from 'react-dom';
import {EditorState} from 'draft-js';

import 'draft-js/dist/Draft.css';
import './index.scss';
import './demo.css';
import './components/AddButton/addbutton.scss';
import './components/Toolbar/toolbar.scss';
import './blocks/atomic.scss';
import './blocks/blockquotecaption.scss';
import './blocks/caption.scss';
import './blocks/image.scss';
import './blocks/text.scss';
import './blocks/todo.scss';
import './blocks/code.scss';

import {SideButton, MediumDraftEditor} from './MediumDraftEditor';
import {codeBlockPlugin} from './plugins/codeblockplugin';
import {imageBlockPlugin} from './plugins/imageblockPlugin';
import {inlineStylePlugin} from './plugins/style';
import {blockMovePlugin} from './plugins/blockMovePlugin';
import {keyboardPlugin} from './plugins/keyboardPlugin';
import {DraftPlugin} from './plugin_editor/PluginsEditor';
import {SeparatorButton} from './SideButtons/SeparatorButton';
import {getImageButton} from './SideButtons/ImageButton';
import {BLOCK_BUTTONS, INLINE_BUTTONS} from './components/Toolbar/Buttons';
import {blockRendererPlugin} from './plugins/blockRendererFn';
import {setRenderOptions} from './util/exporter';
import {toState} from './util/importer';

interface State {
    editorState: EditorState;
}

const rootNode = document.getElementById('root');
let demoText = '<h2><em>Castlevania: Lords of Shadow</em></h2><p><em>Lords of Shadow</em> is a third-person action-adventure game in which the player controls the main character, Gabriel Belmont. The combat involves a retractable chain whip called the Combat Cross. The player can perform up to forty unlockable <a href="https://en.wikipedia.org/wiki/Combo_(video_gaming)">combos</a> with it. The commands consist of direct attacks for dealing damage to singleenemies, and weak area attacks when surrounded by them. It is alsocapable of interactions with secondary weapons, such as knives, holywater and other items which can be upgraded. In addition, the Combat Cross&#x27;s melee skills can be combined with theLight and Shadow magic system, which are spells aimed at defense andaggression, respectively. The whip is upgradeable and can also be used to guard against an opponent&#x27;s attack.</p><p>The developers attempted to reach out to new audiences by distancing <em>Lords of Shadow</em> from previous <em>Castlevania</em> games, but kept some elements intact to not alienate franchise fans. For example, vampires and werewolves are recurring enemies in the game,but other existing enemies include trolls, giant spiders andgoblin-like creatures. The enemies can be defeated for experiencepoints, which can be used to purchase combos or to augment the player&#x27;sabilities further. <em>Lords of Shadow</em> has large-scale bosses known as titans. The Combat Cross can be used tograpple onto their bodies and navigate them, and break the runes thatanimate the titan.</p>';

function uploadImage(files: Blob[]) {
    console.log('upload file', files);
}

class App extends React.Component<{}, State> {

    public state = {
        editorState: EditorState.createWithContent(toState(demoText)),
    };

    private readonly plugins: DraftPlugin[] = [
        codeBlockPlugin(),
        imageBlockPlugin({
            uploadImage
        }),
        inlineStylePlugin(),
        blockMovePlugin(),
        keyboardPlugin(),
        blockRendererPlugin(),
    ];

    private readonly sideButtons: SideButton[] = [
        {
            component: SeparatorButton,
        },
        {
            component: getImageButton({
                uploadImage
            }),
        }
    ];

    private exporter = setRenderOptions();

    public render() {
        return (
            <MediumDraftEditor
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
        const html = this.exporter(editorState.getCurrentContent());

        if (html !== demoText) {
            demoText = html;
            console.log(demoText);
        }

        this.setState({
            editorState,
        });
    }
}

ReactDOM.render(<App/>, rootNode);
