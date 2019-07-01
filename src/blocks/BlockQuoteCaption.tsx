import * as React from 'react';
import {EditorBlock} from 'draft-js';
import {BlockProps} from '../typings';
import './BlockQuoteCaption.scss';

export default (props: BlockProps) => (
    <cite>
        <EditorBlock {...props} />
    </cite>
);
