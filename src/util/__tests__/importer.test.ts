import {toState} from '../importer';
import {convertToRaw} from 'draft-js';

test('paragraph', () => {
    const html = '<p>bla-bla</p>';
    const contentState = toState(html);
    const blocks = convertToRaw(contentState).blocks;

    expect(blocks).toHaveLength(1);
    expect(blocks[0].text).toEqual('bla-bla');
    expect(blocks[0].type).toEqual('unstyled');
    expect(blocks[0].data).toEqual({});
});

test('ImageBlock.scss', () => {
    const html = '<figure><img src="./image.jpeg" ' +
        'srcset="image-320w.jpg 320w,image-800w.jpg 800w" ' +
        'sizes="(max-width: 320px) 280px,800px" alt="" ' +
        'data-id="775" /><figcaption>bla-bla</figcaption></figure>';
    const contentState = toState(html);
    const blocks = convertToRaw(contentState).blocks;

    expect(blocks).toHaveLength(1);
    expect(blocks[0].data).toEqual({
        src: './image.jpeg',
        srcSet: 'image-320w.jpg 320w,image-800w.jpg 800w',
        sizes: '(max-width: 320px) 280px,800px',
        dataId: '775'
    });
    expect(blocks[0].text).toEqual('bla-bla');
});
