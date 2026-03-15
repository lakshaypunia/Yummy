import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { useCallback, useEffect, useState } from "react";
import {
    ReactFlow,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    Node,
    Edge,
    NodeChange,
    EdgeChange,
    Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
    { id: '1', position: { x: 100, y: 100 }, data: { label: 'Start Node' } },
    { id: '2', position: { x: 300, y: 100 }, data: { label: 'End Node' } },
];
const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

export const ReactFlowBlock = createReactBlockSpec(
    {
        type: "react_flow",
        propSchema: {
            textAlignment: defaultProps.textAlignment,
            textColor: defaultProps.textColor,
            nodes: {
                default: JSON.stringify(initialNodes),
            },
            edges: {
                default: JSON.stringify(initialEdges),
            },
        },
        content: "none",
    },
    {
        render: (props) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [nodes, setNodes] = useState<Node[]>(() => {
                try {
                    return JSON.parse(props.block.props.nodes);
                } catch {
                    return initialNodes;
                }
            });

            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [edges, setEdges] = useState<Edge[]>(() => {
                try {
                    return JSON.parse(props.block.props.edges);
                } catch {
                    return initialEdges;
                }
            });

            // eslint-disable-next-line react-hooks/rules-of-hooks
            const onNodesChange = useCallback(
                (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
                []
            );

            // eslint-disable-next-line react-hooks/rules-of-hooks
            const onEdgesChange = useCallback(
                (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
                []
            );

            // eslint-disable-next-line react-hooks/rules-of-hooks
            const onConnect = useCallback(
                (params: Connection) => setEdges((eds) => addEdge(params, eds)),
                []
            );

            // Sync local state to props so it gets saved
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useEffect(() => {
                const timeoutId = setTimeout(() => {
                    props.editor.updateBlock(props.block, {
                        type: "react_flow",
                        props: {
                            ...props.block.props,
                            nodes: JSON.stringify(nodes),
                            edges: JSON.stringify(edges)
                        }
                    });
                }, 500); // debounce save
                return () => clearTimeout(timeoutId);
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [nodes, edges]);

            return (
                <div className="w-full relative my-4 border rounded-lg overflow-hidden border-[var(--color-border-primary)] group" contentEditable={false}>
                    <div className="w-full h-[500px]">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            fitView
                        >
                            <Controls />
                            <Background />
                        </ReactFlow>
                    </div>

                    {/* Delete handle (shown on hover) */}
                    <button
                        className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-50 pointer-events-auto"
                        onClick={() => {
                            props.editor.removeBlocks([props.block]);
                        }}
                        title="Remove Diagram"
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
