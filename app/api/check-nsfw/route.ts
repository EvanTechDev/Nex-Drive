import { NextResponse } from "next/server"
import * as tf from "@tensorflow/tfjs-node"
import * as nsfwjs from "nsfwjs"

// 加载 NSFW 检测模型
let model: nsfwjs.NSFWJS | null = null

async function loadModel() {
  if (!model) {
    model = await nsfwjs.load()
  }
  return model
}

export async function POST(request: Request) {
  try {
    // 获取表单数据
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: true, isNSFW: false, message: "Not an image, skipping NSFW check" })
    }

    // 将文件转换为 buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      // 加载模型
      const nsfwModel = await loadModel()

      // 将图像转换为 tensor
      const image = await tf.node.decodeImage(buffer, 3)

      // 进行 NSFW 检测
      const predictions = await nsfwModel.classify(image as tf.Tensor3D)

      // 释放 tensor 资源
      image.dispose()

      console.log("NSFW predictions:", predictions)

      // 检查是否包含不适当内容
      // 我们将 Porn 和 Sexy 类别的分数相加，如果超过阈值则认为是 NSFW
      const pornScore = predictions.find((p) => p.className === "Porn")?.probability || 0
      const sexyScore = predictions.find((p) => p.className === "Sexy")?.probability || 0
      const hentaiScore = predictions.find((p) => p.className === "Hentai")?.probability || 0

      const nsfwScore = pornScore + sexyScore + hentaiScore
      const isNSFW = nsfwScore > 0.5 // 阈值可以根据需要调整

      return NextResponse.json({
        success: true,
        isNSFW,
        score: nsfwScore,
        predictions,
        message: isNSFW ? "Content detected as NSFW" : "Content is safe",
      })
    } catch (error) {
      console.error("Error during NSFW detection:", error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to perform NSFW detection",
        // 如果检测失败，我们允许上传继续
        isNSFW: false,
        message: "NSFW detection failed, allowing upload",
      })
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
