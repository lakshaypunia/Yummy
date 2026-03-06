import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { VideoBlock } from "./VideoBlock";
import { AiUpdateBlock } from "./AiUpdateBlock";
import { P5Block } from "./P5Block";

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    video_block: VideoBlock(),
    ai_update_suggestion: AiUpdateBlock(),
    p5_block: P5Block(),
  },
});