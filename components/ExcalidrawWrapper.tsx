"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

export default function ExcalidrawWrapper(props: any) {
    return <Excalidraw {...props} />;
}
