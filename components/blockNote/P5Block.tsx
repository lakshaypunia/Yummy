import { createReactBlockSpec } from "@blocknote/react";


export const P5Block = createReactBlockSpec(
    {
        type: "p5_block",
        propSchema: {
            animationId: {
                default: "",
            },
            code: {
                default: "",
            }
        },
        content: "none",
    },
    {
        render: (props) => {
            return (
                <div className="w-200 my-4 border rounded-lg overflow-hidden bg-gray-50 shadow-sm relative group">
                    {/* Header / Title bar could go here */}
                    <div className="w-full h-[400px] bg-white relative">
                        {props.block.props.code ? (
                            <iframe
                                title="p5.js Sketch"
                                className="w-full h-full border-0"
                                sandbox="allow-scripts" // Security: restrict capabilities
                                srcDoc={props.block.props.code}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                p5.js Animation Placeholder
                            </div>
                        )}
                    </div>
                </div>
            );
        },
    }
);
