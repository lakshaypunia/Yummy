import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { VideoBlock } from "./VideoBlock";
import { AiUpdateBlock } from "./AiUpdateBlock";
import { P5Block } from "./P5Block";
import { ExcalidrawBlock } from "@/components/editor/blocks/ExcalidrawBlock";
import { DesmosBlock } from "@/components/editor/blocks/DesmosBlock";
import { ReactFlowBlock } from "@/components/editor/blocks/ReactFlowBlock";

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    video_block: VideoBlock(),
    ai_update_suggestion: AiUpdateBlock(),
    p5_block: P5Block(),
    excalidraw: ExcalidrawBlock(),
    desmos: DesmosBlock(),
    react_flow: ReactFlowBlock(),
  },
});