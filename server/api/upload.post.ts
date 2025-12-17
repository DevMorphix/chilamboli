import { uploadFileToR2 } from "../utils/r2"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  try {
    const form = await readMultipartFormData(event)

    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        message: "No file uploaded",
      })
    }

    const fileItem = form.find((item) => item.name === "file")

    if (!fileItem || !fileItem.data) {
      throw createError({
        statusCode: 400,
        message: "File data is missing",
      })
    }

    const filename = fileItem.filename || "upload"
    const contentType = fileItem.type || "application/octet-stream"

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(contentType)) {
      throw createError({
        statusCode: 400,
        message: "Invalid file type. Only images (JPEG, PNG, WebP) and PDF files are allowed",
      })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (fileItem.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        message: "File size exceeds 5MB limit",
      })
    }

    const r2Config = {
      endpoint: config.r2Endpoint,
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
      bucketName: config.r2BucketName,
      publicUrl: config.r2PublicUrl,
    }

    const url = await uploadFileToR2(fileItem.data, filename, contentType, r2Config)

    return {
      success: true,
      url,
    }
  } catch (error: any) {
    console.error("Upload error:", error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to upload file",
    })
  }
})
