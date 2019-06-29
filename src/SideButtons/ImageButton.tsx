import * as React from 'react';

import {addNewBlock} from '../model';
import {Block} from '../util/constants';
import {SideButtonComponentProps} from '../MediumDraftEditor';

interface ImageButtonOptions {
    uploadImage: (files: Blob[]) => void;
}

export function getImageButton(options: ImageButtonOptions) {
    return class ImageButton extends React.PureComponent<SideButtonComponentProps> {

        private inputRef = React.createRef<HTMLInputElement>();

        public render() {
            return (
                <button
                    className="md-sb-button md-sb-button--img"
                    type="button"
                    onClick={this.onClick}
                >
                    <svg viewBox="0 0 14 14" height="14" width="14">
                        <path d="M13.9,11L13.9,11L10,7.5L7.5,10L4,5.5L0,11"/>
                        <path d="M10,5.3c0.7,0,1.2-0.6,1.2-1.2c0-0.7-0.6-1.3-1.2-1.3C9.3,2.8,8.8,3.3,8.8,4C8.8,4.7,9.3,5.3,10,5.3z"/>
                    </svg>
                    <input
                        type="file"
                        accept="image/*"
                        ref={this.inputRef}
                        onChange={this.onChange}
                        className="md-sb-button-file-input"
                    />
                </button>
            );
        }

        private onClick = () => {
            this.inputRef.current.value = null;
            this.inputRef.current.click();
        }

        private onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files[0];

            if (file.type.indexOf('image/') === 0) {
                const src = URL.createObjectURL(file);

                this.props.setEditorState(addNewBlock(
                    this.props.getEditorState(),
                    Block.IMAGE, {
                        src,
                        uploading: true,
                    }
                ));

                if (options && options.uploadImage) {
                    options.uploadImage([file]);
                }
            }

            this.props.close();
        }
    };
}
