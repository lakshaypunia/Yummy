import { UTApi } from 'uploadthing/server'

export async function renderVideo(input: { script: string }) {
  const syncServerUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "ws://localhost:3000"
  const apiUrl = syncServerUrl.replace("ws://", "http://").replace("wss://", "https://") + "/api/generate-video"

  const response = await fetch(apiUrl, {     
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: input.script }), // Using hardcoded manim code per existing implementation
  })
  if (!response.ok) throw new Error("Failed to generate video on server")

  const blob = await response.blob()
  const videoFile = new File([blob], "ai-video.mp4", { type: "video/mp4" })
  
  const utapi = new UTApi()
  const uploadResponse = await utapi.uploadFiles([videoFile])
  const url = uploadResponse[0].data?.url
  if (!url) throw new Error("Upload failed")
  return url
}
