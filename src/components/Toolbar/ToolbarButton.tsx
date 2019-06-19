import * as React from 'react';

import {HYPERLINK} from '../../util/constants';

interface ToolbarButtonProps {
    onToggle: (style: string) => void;
    style: string;
    active?: boolean;
    label?: string | JSX.Element;
    description?: string;
}

export class ToolbarButton extends React.PureComponent<ToolbarButtonProps> {

    public render() {
        if (this.props.style === HYPERLINK) {
            return null;
        }

        let className = 'md-RichEditor-styleButton';
        if (this.props.active) {
            className += ' md-RichEditor-activeButton';
        }
        className += ` md-RichEditor-styleButton-${this.props.style.toLowerCase()}`;

        return (
            <button
                className={`${className} hint--top`}
                onClick={this.onClick}
                aria-label={this.props.description}
            >
                {this.props.label}
            </button>
        );
    }

    private onClick: React.MouseEventHandler<HTMLSpanElement> = (e) => {
        e.preventDefault();
        this.props.onToggle(this.props.style);
    }
}
