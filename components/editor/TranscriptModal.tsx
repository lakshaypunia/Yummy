"use client";

import { useState } from "react";
import { X, Youtube, Upload, Loader2, Plus, FileText } from "lucide-react";
import { UploadDropzone } from "@/utils/uploadthing";

interface TranscriptModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageId: string;
    spaceId?: string;
}

export function TranscriptModal({ isOpen, onClose, pageId, spaceId }: TranscriptModalProps) {
    const [activeTab, setActiveTab] = useState<'youtube' | 'upload'>('youtube');
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [uploadedUrl, setUploadedUrl] = useState("");
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        const urlToUse = activeTab === 'youtube' ? youtubeUrl : uploadedUrl;
        if (!urlToUse) return;

        setIsGenerating(true);
        setTranscript("");
        
        try {
            const res = await fetch("/api/tools/generate-transcript", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlToUse, type: activeTab })
            });
            const data = await res.json();
            
            if (data.success) {
                setTranscript(data.transcript);
            } else {
                alert("Failed to generate transcript: " + (data.message || "Unknown error"));
            }
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddToPage = async () => {
        if (!transcript) return;
        const urlToUse = activeTab === 'youtube' ? youtubeUrl : uploadedUrl;
        
        setIsAdding(true);
        try {
            const res = await fetch("/api/tools/add-video-transcript", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlToUse, transcript, pageId })
            });
            const data = await res.json();
            
            if (data.success) {
                onClose(); // auto close on success
            } else {
                alert("Failed to add to page: " + data.message);
            }
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--color-secondary)] w-full max-w-2xl rounded-xl shadow-xl flex flex-col max-h-[90vh] border border-[var(--color-border-primary)] relative">
                <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-primary)]">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Video Transcript Generator
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-[var(--color-primary)] rounded-full text-[var(--color-text-muted)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6" style={{ scrollbarWidth: "thin" }}>
                    
                    {/* Tabs */}
                    <div className="flex gap-2 p-1 bg-[var(--color-primary)]/50 rounded-lg">
                        <button
                            onClick={() => setActiveTab('youtube')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                                activeTab === 'youtube' 
                                ? 'bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-primary)]/50' 
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                        >
                            <Youtube className="w-4 h-4 text-red-500" />
                            YouTube URL
                        </button>
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                                activeTab === 'upload' 
                                ? 'bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-primary)]/50' 
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                        >
                            <Upload className="w-4 h-4 text-blue-500" />
                            Upload Video
                        </button>
                    </div>

                    {/* Input Area */}
                    <div className="flex flex-col gap-3">
                        {activeTab === 'youtube' ? (
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
                                    YouTube Video URL
                                </label>
                                <input
                                    type="text"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-[var(--color-background)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-[var(--color-text-muted)]/50"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
                                    Upload Video File
                                </label>
                                {!uploadedUrl ? (
                                    <div className="bg-[var(--color-primary)] p-2 rounded-xl border border-[var(--color-border-primary)] border-dashed">
                                        <UploadDropzone
                                            endpoint="spaceDocument"
                                            headers={spaceId ? { "x-space-id": spaceId } : undefined}
                                            onClientUploadComplete={(res: any) => {
                                                if (res && res.length > 0) {
                                                    setUploadedUrl(res[0].url);
                                                }
                                            }}
                                            onUploadError={(error: Error) => {
                                                alert(`Upload failed: ${error.message}`);
                                            }}
                                            config={{ mode: "auto" }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <span className="text-sm text-green-600 dark:text-green-400 font-medium truncate">
                                            Video uploaded successfully!
                                        </span>
                                        <button 
                                            onClick={() => setUploadedUrl("")}
                                            className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded bg-red-500/10"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || (activeTab === 'youtube' ? !youtubeUrl : !uploadedUrl)}
                            className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating Transcript...
                                </>
                            ) : (
                                "Generate Transcript"
                            )}
                        </button>
                    </div>

                    {/* Result Area */}
                    {transcript && (
                        <div className="space-y-3 pt-4 border-t border-[var(--color-border-primary)]">
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                Generated Transcript
                            </label>
                            <div className="bg-[var(--color-background)] border border-[var(--color-border-primary)] rounded-lg p-4 max-h-48 overflow-y-auto text-sm text-[var(--color-text-primary)] leading-relaxed" style={{ scrollbarWidth: "thin" }}>
                                {transcript}
                            </div>
                            
                            <button
                                onClick={handleAddToPage}
                                disabled={isAdding}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                {isAdding ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Adding to Page...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Add to Page
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
