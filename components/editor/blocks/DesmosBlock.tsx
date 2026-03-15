import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { useEffect, useRef } from "react";

export const DesmosBlock = createReactBlockSpec(
    {
        type: "desmos",
        propSchema: {
            textAlignment: defaultProps.textAlignment,
            textColor: defaultProps.textColor,
            state: {
                default: "null",
            },
        },
        content: "none",
    },
    {
        render: (props) => {
            const containerRef = useRef<HTMLDivElement>(null);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const calculatorRef = useRef<any>(null);

            // We use this flag so we don't trigger a save back to BlockNote when we are just initializing the state
            const isInitializing = useRef(true);

            useEffect(() => {
                if (!containerRef.current) return;

                // Load the Desmos script if it's not already loaded
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (!(window as any).Desmos) {
                    const script = document.createElement("script");
                    script.src = "https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
                    script.async = true;
                    script.onload = initCalculator;
                    document.body.appendChild(script);
                } else {
                    initCalculator();
                }

                function initCalculator() {
                    if (!containerRef.current || calculatorRef.current) return;

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const calculator = (window as any).Desmos.GraphingCalculator(containerRef.current, {
                        expressions: true,
                        settingsMenu: true,
                        zoomButtons: true,
                    });

                    calculatorRef.current = calculator;

                    // Load initial state
                    if (props.block.props.state !== "null") {
                        try {
                            const state = JSON.parse(props.block.props.state);
                            calculator.setState(state);
                        } catch (e) {
                            console.error("Failed to load Desmos state", e);
                        }
                    }

                    // Once initialized, allow updates
                    setTimeout(() => {
                        isInitializing.current = false;
                    }, 500);

                    // Observe change events
                    calculator.observeEvent('change', () => {
                        if (isInitializing.current) return;

                        const state = calculator.getState();
                        props.editor.updateBlock(props.block, {
                            type: "desmos",
                            props: {
                                ...props.block.props,
                                state: JSON.stringify(state),
                            },
                        });
                    });
                }

                return () => {
                    if (calculatorRef.current) {
                        calculatorRef.current.destroy();
                        calculatorRef.current = null;
                    }
                };
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, []); // Empty dependency array, we only initialize once

            return (
                <div className="w-full relative my-4 border rounded-lg overflow-hidden border-[var(--color-border-primary)] group" contentEditable={false}>
                    <div ref={containerRef} className="w-full h-[500px]" />

                    {/* Delete handle (shown on hover) */}
                    <button
                        className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-50"
                        onClick={() => {
                            props.editor.removeBlocks([props.block]);
                        }}
                        title="Remove Graph"
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
