"use client";

import { useState, useEffect } from "react";
import { UploadDropzone } from "@/utils/uploadthing";
import { getSpaceDocuments, deleteDocument } from "@/lib/actions/document.actions";
import { X, File, FileText, Image as ImageIcon, Trash2, Download, Loader2 } from "lucide-react";

interface SpaceDocumentsModalProps {
    spaceId: string;
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

interface DocumentData {
    id: string;
    name: string;
    url: string;
    key: string;
    size: number;
    type: string;
    authorId: string;
}

export function SpaceDocumentsModal({ spaceId, isOpen, onClose, userId }: SpaceDocumentsModalProps) {
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadDocuments();
        }
    }, [isOpen, spaceId]);

    const loadDocuments = async () => {
        setIsLoading(true);
        const result = await getSpaceDocuments(spaceId);
        if (result.success && result.documents) {
            setDocuments(result.documents);
        }
        setIsLoading(false);
    };

    const handleDelete = async (documentId: string) => {
        setIsDeleting(documentId);
        const result = await deleteDocument(documentId);
        if (result.success) {
            setDocuments(documents.filter((d) => d.id !== documentId));
        } else {
            console.error(result.error);
        }
        setIsDeleting(null);
    };

    const getFileIcon = (type: string) => {
        if (type.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
        if (type.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
        return <File className="w-8 h-8 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--color-secondary)] w-full max-w-3xl rounded-xl shadow-xl flex flex-col max-h-[90vh] border border-[var(--color-border-primary)] relative">
                <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Space Documents</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-primary)] rounded-full text-[var(--color-text-muted)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                    {/* Upload Section */}
                    <div className="bg-[var(--color-primary)] p-4 rounded-xl border border-[var(--color-border-primary)] border-dashed">
                        <UploadDropzone
                            endpoint="spaceDocument"
                            onClientUploadComplete={(res) => {
                                console.log("Files: ", res);
                                loadDocuments();
                            }}
                            onUploadError={(error: Error) => {
                                alert(`ERROR! ${error.message}`);
                            }}
                            config={{
                                mode: "auto"
                            }}
                            headers={{ "x-space-id": spaceId }}
                        />
                    </div>

                    {/* Documents List Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Uploaded Documents</h3>
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center p-8 text-[var(--color-text-muted)] bg-[var(--color-primary)] rounded-xl border border-[var(--color-border-primary)]">
                                No documents have been uploaded to this space yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-start gap-4 p-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-primary)] hover:border-[var(--color-text-muted)] transition-colors group"
                                    >
                                        <div className="shrink-0">{getFileIcon(doc.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                <p className="font-medium text-[var(--color-text-primary)] truncate" title={doc.name}>
                                                    {doc.name}
                                                </p>
                                            </a>
                                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                                {formatFileSize(doc.size)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-[var(--color-secondary)] rounded-lg text-[var(--color-text-muted)] transition-colors"
                                                title="Download/View"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            {(userId === doc.authorId) && (
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    disabled={isDeleting === doc.id}
                                                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-[var(--color-text-muted)] transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {isDeleting === doc.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
