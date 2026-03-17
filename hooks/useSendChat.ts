import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

interface Message {
    id: string;
    role: 'USER' | 'SYSTEM';
    content: string;
    isComplete: boolean;
    createdAt?: Date;
}

interface UseStreamingChatOptions {
    chatId: string;
    pageId?: string;
    onError?: (error: Error) => void;
    onStreamStart?: () => void;
    onStreamEnd?: () => void;
    onVideoIntent?: (data: any) => Promise<void>;
    onAnimationIntent?: (data: any) => Promise<void>;
    onDiagramIntent?: (data: any) => Promise<void>;
    onP5Intent?: (data: any) => Promise<void>;
    onReactFlowIntent?: (data: any) => Promise<void>;
    onRagIntent?: (data: string) => Promise<void>;
    onPageUpdate?: (data: any) => Promise<void>;
}

async function fetchMessages(chatId: string, token: any): Promise<Message[]> {
    const response = await fetch(`/api/chat/fetch-messages?chatId=${chatId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch messages');
    }
    const data = await response.json();
    return data.data?.messages || [];
}

export function useStreamingChat({
    chatId,
    pageId,
    onError,
    onStreamStart,
    onStreamEnd,
    onVideoIntent,
    onAnimationIntent,
    onDiagramIntent,
    onP5Intent,
    onReactFlowIntent,
    onRagIntent,
    onPageUpdate
}: UseStreamingChatOptions) {
    const queryClient = useQueryClient();
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { getToken } = useAuth();

    const {
        data: messages = [] as Message[],
        isLoading,
        isError,
        refetch,
    } = useQuery<Message[]>({
        queryKey: ['chat-messages', chatId],
        queryFn: async () => {
            const token = await getToken();
            if (!token) throw new Error("No auth token found");
            return fetchMessages(chatId, token);
        },
        enabled: !!chatId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const sendMessage = useCallback(
        async (content: string) => {
            const token = await getToken();
            if (!content.trim() || isStreaming) return;

            setIsStreaming(true);
            setError(null);
            onStreamStart?.();

            const controller = new AbortController();
            abortControllerRef.current = controller;

            const userMessage: Message = {
                id: `user-${Date.now()}`,
                role: 'USER',
                content,
                isComplete: true,
                createdAt: new Date(),
            };

            const aiMessageId = `ai-${Date.now()}`;
            const aiMessage: Message = {
                id: aiMessageId,
                role: 'SYSTEM',
                content: '',
                isComplete: false,
                createdAt: new Date(),
            };

            queryClient.setQueryData<Message[]>(
                ['chat-messages', chatId],
                (old = []) => [...old, userMessage, aiMessage]
            );

            try {
                const response = await fetch(`/api/chat/send-message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        chatId,
                        content,
                        pageId,
                    }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const jsonData = await response.json();

                    const resultData = jsonData.data?.[0];

                    if (resultData?.type === 'video_create_success' && onVideoIntent) {
                        setIsStreaming(false);
                        queryClient.setQueryData<Message[]>(
                            ['chat-messages', chatId],
                            (old = []) =>
                                old.map((msg) =>
                                    msg.id === aiMessageId
                                        ? { ...msg, content: jsonData.message, isComplete: true }
                                        : msg
                                )
                        );
                        await onVideoIntent(resultData.data);
                        await refetch();
                        onStreamEnd?.();
                        return;
                    }

                    if (resultData?.type === 'animation_create_success' && onAnimationIntent) {
                        setIsStreaming(false);
                        queryClient.setQueryData<Message[]>(
                            ['chat-messages', chatId],
                            (old = []) =>
                                old.map((msg) =>
                                    msg.id === aiMessageId
                                        ? { ...msg, content: jsonData.message, isComplete: true }
                                        : msg
                                )
                        );
                        await onAnimationIntent(resultData.data);
                        await refetch();
                        onStreamEnd?.();
                        return;
                    }

                    if (resultData?.type === 'diagram_create_success' && onDiagramIntent) {
                        setIsStreaming(false);
                        queryClient.setQueryData<Message[]>(
                            ['chat-messages', chatId],
                            (old = []) =>
                                old.map((msg) =>
                                    msg.id === aiMessageId
                                        ? { ...msg, content: jsonData.message, isComplete: true }
                                        : msg
                                )
                        );
                        await onDiagramIntent(resultData.data);
                        await refetch();
                        onStreamEnd?.();
                        return;
                    }

                    if (resultData?.type === 'p5_create_success' && onP5Intent) {
                        setIsStreaming(false);
                        queryClient.setQueryData<Message[]>(
                            ['chat-messages', chatId],
                            (old = []) =>
                                old.map((msg) =>
                                    msg.id === aiMessageId
                                        ? { ...msg, content: jsonData.message, isComplete: true }
                                        : msg
                                )
                        );
                        await onP5Intent(resultData.data);
                        await refetch();
                        onStreamEnd?.();
                        return;
                    }

                    if (resultData?.type === 'react_flow_create_success' && onReactFlowIntent) {
                        setIsStreaming(false);
                        queryClient.setQueryData<Message[]>(
                            ['chat-messages', chatId],
                            (old = []) =>
                                old.map((msg) =>
                                    msg.id === aiMessageId
                                        ? { ...msg, content: jsonData.message, isComplete: true }
                                        : msg
                                )
                        );
                        await onReactFlowIntent(resultData.data);
                        await refetch();
                        onStreamEnd?.();
                        return;
                    }

                    if (resultData?.type === 'rag_create_success') {
                        setIsStreaming(false);
                        queryClient.setQueryData<Message[]>(
                            ['chat-messages', chatId],
                            (old = []) =>
                                old.map((msg) =>
                                    msg.id === aiMessageId
                                        ? { ...msg, content: resultData.data, isComplete: true }
                                        : msg
                                )
                        );
                        if (onRagIntent) await onRagIntent(resultData.data);
                        await refetch();
                        onStreamEnd?.();
                        return;
                    }

                    // Handle standard orchestrator responses!
                    if (jsonData.success) {
                        queryClient.setQueryData<Message[]>(
                            ['chat-messages', chatId],
                            (old = []) =>
                                old.map((msg) =>
                                    msg.id === aiMessageId
                                        ? { ...msg, content: jsonData.message, isComplete: true }
                                        : msg
                                )
                        );
                        await refetch();
                        onStreamEnd?.();
                        return; // VERY IMPORTANT: return so we don't try to stream!
                    }
                }

                // If it's not JSON, OR if it's JSON but not one of the caught conditions above
                // Note: since response.json() consumes the body, if it was JSON but unhandled, 
                // getting a reader here would fail. The above `return` fixes the standard JSON case.
                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('No reader available');
                }

                const decoder = new TextDecoder();
                let accumulatedText = '';

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedText += chunk;

                    queryClient.setQueryData<Message[]>(
                        ['chat-messages', chatId],
                        (old = []) =>
                            old.map((msg) =>
                                msg.id === aiMessageId
                                    ? { ...msg, content: accumulatedText }
                                    : msg
                            )
                    );
                }

                queryClient.setQueryData<Message[]>(
                    ['chat-messages', chatId],
                    (old = []) =>
                        old.map((msg) =>
                            msg.id === aiMessageId ? { ...msg, isComplete: true } : msg
                        )
                );

                await refetch();
                onStreamEnd?.();
            } catch (err) {
                const error = err as Error;

                if (error.name === 'AbortError') {
                    console.log('Stream cancelled by user');
                    queryClient.setQueryData<Message[]>(
                        ['chat-messages', chatId],
                        (old = []) => old.filter((msg) => msg.id !== aiMessageId)
                    );
                } else {
                    const errorMessage = error.message || 'Failed to send message';
                    setError(errorMessage);
                    onError?.(error);

                    queryClient.setQueryData<Message[]>(
                        ['chat-messages', chatId],
                        (old = []) =>
                            old.map((msg) =>
                                msg.id === aiMessageId
                                    ? {
                                        ...msg,
                                        content: msg.content || '[Error: Failed to get response]',
                                        isComplete: false,
                                    }
                                    : msg
                            )
                    );
                }
            } finally {
                setIsStreaming(false);
                abortControllerRef.current = null;
            }
        },
        [chatId, pageId, isStreaming, onError, onStreamStart, onStreamEnd, onVideoIntent, onAnimationIntent, onDiagramIntent, onP5Intent, onReactFlowIntent, onRagIntent, onPageUpdate, queryClient, refetch, getToken]
    );

    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsStreaming(false);
        }
    }, []);

    const clearMessages = useCallback(() => {
        queryClient.setQueryData<Message[]>(['chat-messages', chatId], []);
        setError(null);
    }, [chatId, queryClient]);

    const removeMessage = useCallback(
        (messageId: string) => {
            queryClient.setQueryData<Message[]>(
                ['chat-messages', chatId],
                (old = []) => old.filter((msg) => msg.id !== messageId)
            );
        },
        [chatId, queryClient]
    );

    const invalidateMessages = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
    }, [chatId, queryClient]);

    return {
        messages,
        isLoading,
        isStreaming,
        error: error || (isError ? 'Failed to load messages' : null),
        sendMessage,
        cancelStream,
        clearMessages,
        removeMessage,
        refetchMessages: refetch,
        invalidateMessages,
    };
}
