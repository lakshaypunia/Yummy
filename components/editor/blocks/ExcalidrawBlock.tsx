import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";

const ExcalidrawWrapper = dynamic(
    async () => (await import("@/components/ExcalidrawWrapper")).default,
    { ssr: false }
);

export const ExcalidrawBlock = createReactBlockSpec(
    {
        type: "excalidraw",
        propSchema: {
            textAlignment: defaultProps.textAlignment,
            textColor: defaultProps.textColor,
            elements: {
                default: "[]",
            },
            appState: {
                default: "null",
            },
            files: {
                default: "null",
            },
            mermaidCode: {
                default: "",
            },
        },
        content: "none",
    },
    {
        render: (props) => {
            // Use local state to handle real-time changes without causing infinite loops
            // We only want to push to BlockNote's props.update on idle/debounced changes
            const [initialData, setInitialData] = useState({
                elements: typeof props.block.props.elements === "string" ? JSON.parse(props.block.props.elements) : [],
                appState: (() => {
                    if (typeof props.block.props.appState !== "string") return null;
                    try {
                        const parsed = JSON.parse(props.block.props.appState);
                        if (parsed) {
                            delete parsed.collaborators;
                            delete parsed.pastElements;
                            delete parsed.futureElements;
                        }
                        return parsed;
                    } catch (e) {
                        return null;
                    }
                })(),
                files: typeof props.block.props.files === "string" ? JSON.parse(props.block.props.files) : null,
            });

            const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

            // Parse mermaid code if it exists and elements are empty
            useEffect(() => {
                const parseMermaid = async () => {
                    const code = props.block.props.mermaidCode;
                    if (code && typeof code === "string" && code.trim() !== "") {
                        // Check if we already have elements so we don't re-parse constantly
                        if (!initialData.elements || initialData.elements.length === 0) {
                            if (!excalidrawAPI) return; // Wait until Excalidraw is fully mounted
                            
                            try {
                                const { parseMermaidToExcalidraw } = await import("@excalidraw/mermaid-to-excalidraw");
                                const { elements, files } = await parseMermaidToExcalidraw(code);
                                
                                setInitialData(prev => ({
                                    ...prev,
                                    elements,
                                    files
                                }));

                                excalidrawAPI.updateScene({ elements });
                                if (files) {
                                    excalidrawAPI.addFiles(Object.values(files));
                                }

                                // Also update the block so it gets saved to DB and syncs to others
                                props.editor.updateBlock(props.block, {
                                    type: "excalidraw",
                                    props: {
                                        ...props.block.props,
                                        elements: JSON.stringify(elements),
                                        files: JSON.stringify(files),
                                        mermaidCode: "" // clear it so we don't re-parse
                                    },
                                });
                            } catch (e) {
                                console.error("Failed to parse mermaid on client:", e);
                            }
                        }
                    }
                };
                parseMermaid();
            }, [props.block.props.mermaidCode, initialData.elements, props.editor, props.block, excalidrawAPI]);

            const onChange = useCallback(
                (elements: readonly any[], appState: any, files: any) => {
                    const { collaborators, pastElements, futureElements, ...safeAppState } = appState || {};

                    // BlockNote update
                    props.editor.updateBlock(props.block, {
                        type: "excalidraw",
                        props: {
                            ...props.block.props,
                            elements: JSON.stringify(elements),
                            appState: JSON.stringify(safeAppState),
                            files: JSON.stringify(files),
                        },
                    });
                },
                [props.editor, props.block]
            );

            return (
                <div className="w-full relative my-4 border rounded-lg overflow-hidden border-[var(--color-border-primary)] group" contentEditable={false}>
                    {/* Height determines how large the block appears in the document */}
                    <div className="w-full aspect-video">
                        <ExcalidrawWrapper
                            excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
                            initialData={initialData}
                            onChange={onChange}
                            UIOptions={{
                                canvasActions: {
                                    changeViewBackgroundColor: true,
                                    clearCanvas: true,
                                    loadScene: false,
                                    export: { saveFileToDisk: true },
                                    saveAsImage: true,
                                    saveToActiveFile: false,
                                },
                            }}
                        />
                    </div>
                    {/* Delete handle (shown on hover) */}
                    <button
                        className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        onClick={() => {
                            props.editor.removeBlocks([props.block]);
                        }}
                        title="Remove Whiteboard"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            );
        },
    }
);
