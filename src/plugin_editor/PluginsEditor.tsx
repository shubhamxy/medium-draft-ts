import * as React from 'react';
import {
    CompositeDecorator,
    ContentBlock,
    ContentState,
    DefaultDraftBlockRenderMap,
    DraftBlockRenderMap,
    DraftDragType,
    DraftHandleValue,
    Editor,
    EditorProps,
    EditorState,
    SelectionState
} from 'draft-js';
import {Map} from 'immutable';
import memoizeOne from 'memoize-one';

import {MultiDecorator} from './MultiDecorator';
import {HANDLED, NOT_HANDLED} from '../util/constants';
import {BlockProps, BlockPropsInner} from '../typings';

export interface PluginFunctions {
    /**
     * Get the list of plugins passed to the editor
     */
    getPlugins: () => DraftPlugin[];
    /**
     * Get all the props passed to the editor
     */
    getProps: () => PluginEditorProps;
    /**
     * Update the editorState
     */
    setEditorState: (editorState: EditorState) => void;
    /**
     * Get the latest editorState
     */
    getEditorState: () => EditorState;
    /**
     * Get if the editor is readOnly or not
     */
    getReadOnly: () => boolean;
    /**
     * Make the editor non-editable
     */
    setReadOnly: (readOnly: boolean) => void;

    getEditorRef?: () => Editor;
}

export interface PluginEditorProps extends EditorProps {
    plugins?: DraftPlugin[];
    getParentMethods?: () => {
        getInput: (title: string) => Promise<string>,
    };
}

export interface SimpleDecorator {
    strategy: (block: ContentBlock, callback: (start: number, end: number) => void, contentState: ContentState) => void;
    component: (props: any) => JSX.Element;
    props?: any;
}

export type DraftDecoratorType = SimpleDecorator | CompositeDecorator;

export interface DraftPlugin {
    blockRendererFn?: (cb: ContentBlock, draftPluginFns: PluginFunctions) => {
        component: React.ComponentType<BlockProps> | React.FunctionComponent<BlockProps>;
        editable?: boolean;
        props?: BlockPropsInner,
    } | null;
    keyBindingFn?: (ev: React.KeyboardEvent<{}>, draftPluginFns: PluginFunctions) => string | void;
    blockStyleFn?: (contentBlock: ContentBlock) => string | null;
    blockRenderMap?: Map<string, {
        element: string;
        wrapper?: React.ReactElement;
        aliasedElements?: string[];
    }>;
    customStyleMap?: {};
    handleReturn?: (ev: React.KeyboardEvent<{}>, es: EditorState, draftPluginFns: PluginFunctions) => DraftHandleValue;
    handleKeyCommand?: (command: string, es: EditorState, draftPluginFns: PluginFunctions) => DraftHandleValue;
    handleBeforeInput?: (input: string, es: EditorState, draftPluginFns: PluginFunctions) => DraftHandleValue;
    handlePastedText?: (text: string, html: string, editorState: EditorState, draftPluginFns: PluginFunctions) => DraftHandleValue;
    handlePastedFiles?: (files: Blob[]) => DraftHandleValue;
    handleDroppedFiles?: (selection: SelectionState, files: Blob[], draftPluginFns: PluginFunctions) => DraftHandleValue;
    handleDrop?: (selection: EditorState, dataTransfer: DataTransfer, isInternal: DraftDragType, draftPluginFns: PluginFunctions) => DraftHandleValue;
    onEscape?: (ev: React.KeyboardEvent<{}>, draftPluginFns: PluginFunctions) => void;
    onTab?: (ev: React.KeyboardEvent<{}>, draftPluginFns: PluginFunctions) => void;
    onUpArrow?: (ev: React.KeyboardEvent<{}>, draftPluginFns: PluginFunctions) => void;
    onChange?: (es: EditorState, draftPluginFns: PluginFunctions) => EditorState;
    onRightArrow?: (ev: React.KeyboardEvent<{}>, draftPluginFns: PluginFunctions) => void;
    onDownArrow?: (ev: React.KeyboardEvent<{}>, draftPluginFns: PluginFunctions) => void;
    onLeftArrow?: (ev: React.KeyboardEvent<{}>, draftPluginFns: PluginFunctions) => void;
    onFocus?: (e: React.SyntheticEvent<{}>) => void;
    onBlur?: (e: React.SyntheticEvent<{}>) => void;
    decorators?: DraftDecoratorType[];
    willUnmount?: (draftPluginFns: PluginFunctions) => void;
    initialize?: (draftPluginFns: PluginFunctions) => void;
}

interface ExtraPropTypes {
    plugins?: DraftPlugin[];
}

type DraftPluginKeys = keyof DraftPlugin;
type DraftPluginArray = {
    [K in DraftPluginKeys]?: Array<DraftPlugin[keyof DraftPlugin]>
};
type DraftPluginFunctionsArray = {
    [K in DraftPluginKeys]?: (() => null | DraftHandleValue);
};

function getMainPropsFromPlugins(plugins: DraftPlugin[], getters?: () => PluginFunctions): DraftPluginFunctionsArray {
    const props: DraftPluginArray = {};

    plugins.forEach((plugin) => {
        (Object.keys(plugin) as DraftPluginKeys[]).forEach((key) => {
            props[key] = props[key] || [];
            props[key].push(plugin[key]);
        });
    });

    const mainProps: DraftPluginFunctionsArray = {};

    (Object.keys(props) as DraftPluginKeys[]).forEach((key) => {
        if (key === 'onChange' || key === 'blockRenderMap') {
            return;
        }

        const handlers = props[key];

        if (key.indexOf('handle') === 0) {
            mainProps[key] = (...args) => {
                const returnVal = handlers.some((handler: any) => {
                    const returnVal2: string | boolean = handler(...args, getters());

                    return (typeof returnVal2 === 'string' && returnVal2 === HANDLED) || returnVal2 === true;
                });

                return returnVal ? HANDLED : NOT_HANDLED;
            };
        } else if (key.indexOf('on') === 0) {
            mainProps[key] = (...args) => {
                handlers.some((handler: any) => {
                    const retVal: boolean = handler(...args, getters());

                    return !!retVal;
                });

                return null;
            };
        } else if (key.indexOf('Fn') === (key.length - 'Fn'.length)) {
            mainProps[key] = (...args) => {
                for (let i = 0; i < handlers.length; i++) {
                    const handler = handlers[i] as any;
                    const result = handler(...args, getters());

                    if (result !== null && result !== undefined) {
                        return result;
                    }
                }

                return null;
            };
        } else if (key === 'customStyleMap') {
            mainProps[key] = handlers.reduce((acc, handler) => {
                return Object.assign(acc, handler);
            }, {}) as any;
        }
    });

    return mainProps;
}

function getBlockRenderMap(plugins: DraftPlugin[]): DraftBlockRenderMap {
    const blockRenderMap = plugins
        .filter((plugin) => !!plugin.blockRenderMap)
        .reduce((acc, plugin) => (acc.merge(plugin.blockRenderMap)), Map({}));

    return blockRenderMap.merge(DefaultDraftBlockRenderMap) as DraftBlockRenderMap;
}

function getDecorators(plugins: DraftPlugin[]): MultiDecorator {
    const finalDecorators = plugins.filter((pl) => !!pl.decorators).reduce(
        (acc, plugin) => {
            plugin.decorators.forEach((dec: DraftDecoratorType) => {
                if ((dec as CompositeDecorator).getComponentForKey) {
                    acc.push(dec);
                } else {
                    acc.push(new CompositeDecorator([dec as SimpleDecorator]));
                }
            });

            return acc;
        },
        []
    );

    if (!finalDecorators.length) {
        return null;
    }

    return new MultiDecorator(finalDecorators);
}

export class PluginsEditor extends React.PureComponent<PluginEditorProps> {

    public static defaultProps: ExtraPropTypes = {
        plugins: [],
    };

    constructor(props: PluginEditorProps) {
        super(props);

        const {plugins} = props;
        this.parsePlugins = memoizeOne<(plugins: DraftPlugin[], getters?: () => PluginFunctions) => DraftPluginFunctionsArray>(getMainPropsFromPlugins);
        this.blockRenderMapPlugins = memoizeOne<(plugins: DraftPlugin[]) => DraftBlockRenderMap>(getBlockRenderMap);
        this.pluginDecorators = memoizeOne(getDecorators);

        const decorator = this.pluginDecorators(plugins);
        this.onChange(EditorState.set(props.editorState, {
            decorator,
        }));
        // Only for compatibility with other draft-js plugins
        plugins
            .filter((pl) => !!pl.initialize)
            .forEach((pl) => pl.initialize(this.getters()));
    }

    private parsePlugins: (plugins: DraftPlugin[], getters?: () => PluginFunctions) => DraftPluginFunctionsArray;

    private blockRenderMapPlugins: (plugins: DraftPlugin[]) => DraftBlockRenderMap;

    private pluginDecorators: (plugins: DraftPlugin[]) => MultiDecorator;

    private editor: Editor;

    public componentDidUpdate(prevProps: PluginEditorProps) {
        const {plugins, editorState} = this.props;

        if (prevProps.plugins !== plugins) {
            const decorator = this.pluginDecorators(plugins);

            if (decorator !== editorState.getDecorator()) {
                this.onChange(EditorState.set(editorState, {
                    decorator,
                }));
            }
        }
    }

    public componentWillUnmount() {
        this.props.plugins
            .filter((pl) => !!pl.willUnmount)
            .forEach((pl) => pl.willUnmount(this.getters()));
    }

    public render() {
        const draftProps = this.parsePlugins(this.props.plugins, this.getters);
        const blockRenderMap = this.blockRenderMapPlugins(this.props.plugins);

        return (
            <Editor
                {...this.props}
                {...draftProps}
                ref={this.editorRefCb}
                blockRenderMap={blockRenderMap}
                onChange={this.onChange}
            />
        );
    }

    public focus() {
        if (!this.editor) {
            return;
        }

        this.editor.focus();
    }

    private editorRefCb = (node: Editor) => {
        this.editor = node;
    }

    private onChange = (es: EditorState) => {
        let newEs = es;
        const {plugins, onChange} = this.props;
        plugins
            .filter((pl) => !!pl.onChange)
            .forEach((pl) => {
                const tmpEs = pl.onChange(newEs, this.getters());

                if (tmpEs) {
                    newEs = tmpEs;
                }
            });

        onChange(newEs);
    }

    private blur() {
        if (!this.editor) {
            return;
        }

        this.editor.blur();
    }

    private getters = (): PluginFunctions => ({
        setEditorState: this.onChange,
        getEditorState: () => this.props.editorState,
        getPlugins: () => this.props.plugins,
        getProps: (): PluginEditorProps => this.props,
        getReadOnly: () => this.props.readOnly,
        setReadOnly: () => {
            // nothing
        },
        getEditorRef: () => this.editor,
    })
}
