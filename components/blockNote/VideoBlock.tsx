import { createReactBlockSpec } from "@blocknote/react";


export const VideoBlock = createReactBlockSpec(
    {
        type: "video_block",
        propSchema: {
            url: {
                default: "",
            },
            isLoading: {
                default: "false",
            }
        },
        content: "none",
    },
    {
        render: (props) => {
            console.log("🎬 VideoBlock rendering:", props.block.id, props.block.props);
            const isLoading = props.block.props.isLoading === "true";

            return (
                <div className="w-full my-2">
                    {isLoading ? (
                        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse border border-gray-200">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-500 text-sm font-medium">Generating Video...</span>
                            </div>
                        </div>
                    ) : (
                        props.block.props.url ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200">
                                <video
                                    src={props.block.props.url}
                                    controls
                                    className="w-full"
                                />
                            </div>
                        ) : (
                            <div className="p-4 border rounded bg-gray-50 text-gray-500 text-center">
                                No video URL
                            </div>
                        )
                    )}
                </div>
            );
        },
    }
);
