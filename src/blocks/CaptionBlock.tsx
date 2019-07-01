import * as React from 'react';
import {EditorBlock} from 'draft-js';
import {BlockProps} from '../typings';

import './CaptionBlock.scss';

export const CaptionBlock = (props: BlockProps) => (
    <EditorBlock {...props} />
);
