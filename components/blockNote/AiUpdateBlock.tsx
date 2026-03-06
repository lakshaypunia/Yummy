
import { createReactBlockSpec } from "@blocknote/react";
import { Copy, Check, X } from "lucide-react";
import { useState } from "react";

export const AiUpdateBlock = createReactBlockSpec(
    {
        type: "ai_update_suggestion",
        propSchema: {
            originalContent: {
                default: "",
            },
            originalType: {
                default: "paragraph",
            },
            newContent: {
                default: "",
            },
            targetBlockId: {
                default: "",
            },
            explanation: {
                default: "",
            },
        },
        content: "none",
    },
    {
        render: (props) => {
            const { block, editor } = props;
            const { originalContent, originalType, newContent, explanation } = block.props;
            const [status, setStatus] = useState<"pending" | "accepted" | "rejected">("pending");

            const handleAccept = () => {
                setStatus("accepted");

                try {
                    // Restore to original block type with NEW content
                    editor.updateBlock(block.id, {
                        type: originalType as any,
                        props: {},
                        content: [{ type: "text", text: newContent, styles: {} }] as any
                    });

                } catch (e) {
                    console.error("Failed to update block:", e);
                }
            };

            const handleReject = () => {
                setStatus("rejected");
                // Restore to original block type with ORIGINAL content
                editor.updateBlock(block.id, {
                    type: originalType as any,
                    props: {},
                    content: [{ type: "text", text: originalContent || "", styles: {} }] as any
                });
            };

            if (status !== "pending") return null;

            return (
                <div className="my-4 border border-blue-200 rounded-lg overflow-hidden shadow-sm bg-white">
                    <div className="bg-blue-50 px-4 py-2 border-b border-blue-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
                            ✨ AI Suggestion
                        </span>
                        {explanation && <span className="text-xs text-blue-600">{explanation}</span>}
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Original */}
                        <div className="space-y-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase">Original</div>
                            <div className="p-3 bg-red-50 text-gray-700 rounded text-sm min-h-[60px] border border-red-100">
                                {originalContent || "(Empty)"}
                            </div>
                        </div>

                        {/* New */}
                        <div className="space-y-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase">Suggested</div>
                            <div className="p-3 bg-green-50 text-gray-900 rounded text-sm min-h-[60px] border border-green-100 font-medium">
                                {newContent}
                            </div>
                        </div>
                    </div>

                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                        <button
                            onClick={handleReject}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
                        >
                            <X className="w-4 h-4" /> Reject
                        </button>
                        <button
                            onClick={handleAccept}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1 shadow-sm"
                        >
                            <Check className="w-4 h-4" /> Accept Update
                        </button>
                    </div>
                </div>
            );
        },
    }
);
