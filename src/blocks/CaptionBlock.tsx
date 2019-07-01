import * as React from 'react';
import {EditorBlock} from 'draft-js';
import {BlockProps} from '../typings';

import './CaptionBlock.scss';

export default (props: BlockProps) => (
    <EditorBlock {...props} />
);
