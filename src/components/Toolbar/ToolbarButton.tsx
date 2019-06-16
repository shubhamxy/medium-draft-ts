import * as React from 'react';

import {HYPERLINK} from '../../util/constants';

interface ToolbarButtonProps {
    onToggle: (style: string) => void;
    style: string;
    active?: boolean;
    icon?: string;
    label?: string | JSX.Element;
    description?: string;
}

export class ToolbarButton extends React.Component<ToolbarButtonProps> {

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
                onMouseDown={this.onToggle}
                aria-label={this.props.description}
            >
                {this.props.icon ? <i className={`fa fa-${this.props.icon}`}/> : this.props.label}
            </button>
        );
    }

    private onToggle: React.MouseEventHandler<HTMLSpanElement> = (e) => {
        e.preventDefault();
        this.props.onToggle(this.props.style);
    }
}
