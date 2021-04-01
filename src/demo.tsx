import * as React from "react";
import * as ReactDOM from "react-dom";
import { EditorState } from "draft-js";
import { AddButton as BottomBar } from "./components/AddButton/AddButton";

import "./index.css";
import "./demo.css";

import { SideButton, MediumDraftEditor } from "./MediumDraftEditor";
import { codeBlockPlugin } from "./plugins/codeblockplugin";
import { imageBlockPlugin } from "./plugins/imageblockPlugin";
import { inlineStylePlugin } from "./plugins/style";
import { blockMovePlugin } from "./plugins/blockMovePlugin";
import { keyboardPlugin } from "./plugins/keyboardPlugin";
import { DraftPlugin } from "./plugins_editor/PluginsEditor";
import { SeparatorButton } from "./side_buttons/SeparatorButton";
import { getImageButton } from "./side_buttons/ImageButton";
import { BLOCK_BUTTONS, INLINE_BUTTONS } from "./components/Toolbar/Buttons";
import { blockRendererPlugin } from "./plugins/blockRendererFn";
import { setRenderOptions } from "./util/exporter";
import { toState } from "./util/importer";
import { UploadImageData } from "./util/uploadImage";

interface State {
  editorState: EditorState;
}

const rootNode = document.getElementById("root");
const textNode = document.getElementById("data");
let demoText = textNode.innerText;

function uploadImage(file: File): Promise<UploadImageData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      /*
            resolve({
                error: 'Network error',
            });
            */

      resolve({
        src: URL.createObjectURL(file),
      });
    }, 1000);
  });
}

class App extends React.Component<{}, State> {
  ref = React.createRef<any>();
  public state = {
    editorState: EditorState.createWithContent(toState(demoText)),
  };

  private readonly plugins: DraftPlugin[] = [
    // codeBlockPlugin(),
    imageBlockPlugin({
      uploadImage,
    }),
    // inlineStylePlugin(),
    // blockMovePlugin(),
    // keyboardPlugin(),
    // blockRendererPlugin(),
  ];

  private readonly sideButtons: SideButton[] = [
    {
      component: getImageButton({
        uploadImage,
      }),
    },
  ];

  private exporter = setRenderOptions();

  public render() {
    return (
      <MediumDraftEditor
        autoFocus
        ref={this.ref}
        editorState={this.state.editorState}
        onChange={this.onChange}
        plugins={this.plugins}
        inlineButtons={INLINE_BUTTONS}
        blockButtons={BLOCK_BUTTONS}
        sideButtons={this.sideButtons}
        toolbarEnabled={true}
        spellCheck={true}
        children={BottomBar}
      />
    );
  }

  private onExport(editorState: EditorState) {
    const html = this.exporter(editorState.getCurrentContent());

    if (html !== demoText) {
      demoText = html;
      console.log(demoText);
    }
  }

  private onChange = (editorState: EditorState) => {
    if (
      editorState.getCurrentContent() !==
      this.state.editorState.getCurrentContent()
    ) {
      this.onExport(editorState);
    }

    this.setState({
      editorState,
    });
  };
}

ReactDOM.render(<App />, rootNode);
