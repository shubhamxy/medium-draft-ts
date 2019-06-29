import * as React from 'react';

interface TooltipProps {
    left: number;
    top: number;
    text: string;
}

export class Tooltip extends React.Component<TooltipProps> {

    public render() {
        return (
            <div className="md-tooltip md-tooltip--link" style={{left: this.props.left, top: this.props.top}}>
                {this.props.text}
            </div>
        );
    }
}
