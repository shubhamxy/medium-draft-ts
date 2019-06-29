import * as React from 'react';

interface ToolbarButtonProps {
    onToggle: (style: string) => void;
    style: string;
    active?: boolean;
    label?: string | JSX.Element;
    description?: string;
}

export class ToolbarButton extends React.PureComponent<ToolbarButtonProps> {

    public render() {
        let className = `md-RichEditor-styleButton md-RichEditor-styleButton-${this.props.style.toLowerCase()}`;
        if (this.props.active) {
            className += ' md-RichEditor-activeButton';
        }

        return (
            <button
                className={className}
                onClick={this.onClick}
                aria-label={this.props.description}
            >
                {this.props.label}
            </button>
        );
    }

    private onClick: React.MouseEventHandler<HTMLSpanElement> = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.props.onToggle(this.props.style);
    }
}
