import { getLecture } from "@/lib/actions/lecture.actions";
import { notFound } from "next/navigation";
import CustomVideoPlayer from "./CustomVideoPlayer";

export default async function LectureDetailPage({
    params,
}: {
    params: Promise<{ spaceId: string; lectureId: string }>;
}) {
    const { spaceId, lectureId } = await params;
    const lecture = await getLecture(lectureId);

    if (!lecture) return notFound();

    return (
        <div className="flex-1 h-full w-full bg-[var(--color-background)] flex flex-col">
            <header className="shrink-0 h-14 border-b border-[var(--color-border-primary)]/40 flex items-center px-6">
                <h1 className="text-[15px] font-medium text-[var(--color-text-primary)]">{lecture.title}</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
                <div className="w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-lg border border-[var(--color-border-primary)]/30 aspect-video relative">
                    <div className="absolute inset-0">
                        <CustomVideoPlayer url={lecture.videoUrl} />
                    </div>
                </div>
                {lecture.description && (
                    <div className="w-full max-w-5xl mt-6 p-6 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-border-primary)]/30">
                        <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Description</h3>
                        <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-wrap">{lecture.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
