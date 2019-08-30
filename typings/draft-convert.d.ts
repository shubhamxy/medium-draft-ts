declare module 'draft-convert' {
    import {
        ContentState,
        DraftBlockType,
        DraftEntityMutability,
        DraftInlineStyle,
        Entity
    } from 'draft-js';

    type ContentStateConverter = (contentState: ContentState) => string;

    export type Tag =
        JSX.Element |
        { start: string, end: string, empty?: string } |
        { element: JSX.Element, empty?: JSX.Element };

    export interface RawEntity {
        type: string;
        mutability: DraftEntityMutability;
        data: {
            [key: string]: string;
        };
    }

    export interface RawBlock {
        type: string;
        depth: number;
        data?: {
            [key: string]: string | null | number | {[key: string]: string | null | number};
        };
        text: string;
    }

    export interface ContentStateConverterOptions {
        styleToHTML?: (style: string) => Tag;
        blockToHTML?: (block: RawBlock) => Tag;
        entityToHTML?: (entity: RawEntity, originalText: string) => Tag | string;
    }

    export function convertToHTML(options: ContentStateConverterOptions): ContentStateConverter;

    interface HTMLConverterProps {
        flat: boolean;
    }

    type HTMLConverter = (html: string, props?: HTMLConverterProps, DOMBuilder?: () => void, generateKey?: () => void) => ContentState;

    type EntityKey = string;

    interface ConvertFromHTMLOptions {
        htmlToStyle?: (nodeName: string, node: Node, currentStyle: DraftInlineStyle) => DraftInlineStyle;
        htmlToBlock?: (nodeName: string, node: Node) => (DraftBlockType | { type: DraftBlockType | string, data: object } | false);
        htmlToEntity?: (
            nodeName: string,
            node: Node,
            createEntity: (type: string, mutability: string, data: object) => EntityKey,
            getEntity: (key: EntityKey) => Entity,
            mergeEntityData: (key: string, data: object) => void,
            replaceEntityData: (key: string, data: object) => void
        ) => EntityKey;
        textToEntity?: (
            text: string,
            createEntity: (type: string, mutability: string, data: object) => EntityKey,
            getEntity: (key: EntityKey) => Entity,
            mergeEntityData: (key: string, data: object) => void,
            replaceEntityData: (key: string, data: object) => void
        ) => Array<{ entity: EntityKey, offset: number, length: number, result: string }>;
    }

    export function convertFromHTML(options: ConvertFromHTMLOptions): HTMLConverter;
}
