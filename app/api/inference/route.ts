import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const serviceUrl = process.env.INFERENCE_SERVICE_URL ?? "http://127.0.0.1:8000"

  try {
    const incoming = await request.formData()
    const upstreamForm = new FormData()

    const image = incoming.get("image")
    const conf = incoming.get("conf")
    const iou = incoming.get("iou")
    const imgsz = incoming.get("imgsz")

    if (!(image instanceof File)) {
      return NextResponse.json({ detail: "Missing image file." }, { status: 400 })
    }

    upstreamForm.append("image", image, image.name || "sonar.png")
    if (conf) upstreamForm.append("conf", String(conf))
    if (iou) upstreamForm.append("iou", String(iou))
    if (imgsz) upstreamForm.append("imgsz", String(imgsz))

    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/predict`, {
      method: "POST",
      body: upstreamForm,
      cache: "no-store",
    })

    const body = await response.text()
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? `Inference service unavailable: ${error.message}`
            : "Inference service unavailable.",
      },
      { status: 503 },
    )
  }
}
