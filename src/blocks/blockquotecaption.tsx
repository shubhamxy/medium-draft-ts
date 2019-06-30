import * as React from 'react';
import {EditorBlock} from 'draft-js';
import './blockquotecaption.scss';

export default (props: any) => (
    <cite>
        <EditorBlock {...props} />
    </cite>
);
