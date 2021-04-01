import * as React from "react";
import { DraftBlockType, EditorState } from "draft-js";

import { getSelectedBlockNode } from "../../util/selection";
import { SideButton } from "../../MediumDraftEditor";
import "./AddButton.css";

interface AddButtonProps {
  editorState: EditorState;
  sideButtons: SideButton[];
  getEditorState: () => EditorState;
  setEditorState: (state: EditorState) => void;
  focus: () => void;
}

interface AddButtonState {
  top: number;
  blockType: DraftBlockType;
  blockKey: string;
}

/**
 * Implementation of the medium-link side `+` button to insert various rich blocks
 * like Images/Embeds/Videos.
 */
export class AddButton extends React.Component<AddButtonProps, AddButtonState> {
  public state: Readonly<AddButtonState> = {
    blockType: "unstyled",
    blockKey: "",
    top: 0,
  };

  private node: HTMLElement = null;

  // To show + button only when text length == 0
  public static getDerivedStateFromProps(newProps: AddButtonProps) {
    const { editorState } = newProps;
    const selectionState = editorState.getSelection();
    const anchorKey = selectionState.getAnchorKey();

    if (
      selectionState.isCollapsed() &&
      anchorKey === selectionState.getFocusKey()
    ) {
      const contentState = editorState.getCurrentContent();
      const block = contentState.getBlockForKey(anchorKey);

      if (
        block &&
        block.getType().indexOf("atomic") !== 0 &&
        block.getLength() === 0
      ) {
        return {
          visible: true,
          blockType: block.getType(),
          blockKey: block.getKey(),
        };
      }
    }

    return {
      blockType: "unstyled",
      blockKey: "",
    };
  }

  public componentDidUpdate(
    prevProps: Readonly<AddButtonProps>,
    prevState: Readonly<AddButtonState>
  ): void {
    if (
      prevState.blockKey !== this.state.blockKey ||
      this.state.blockType !== prevState.blockType
    ) {
      this.findNode();
    }
  }

  public render() {
    return (
      <div className="md-side-toolbar">
        <div className="mb-side-menu">
          {this.props.sideButtons.map((button, index) => {
            const Button = button.component;
            const extraProps = button.props ? button.props : {};

            return (
              <Button
                {...extraProps}
                key={index}
                getEditorState={this.props.getEditorState}
                setEditorState={this.props.setEditorState}
                close={() => {}}
              />
            );
          })}
        </div>
      </div>
    );
  }

  private findNode() {
    const node = getSelectedBlockNode(window);
    if (node !== this.node) {
      if (node) {
        this.node = node;
      }
    }
  }

}
