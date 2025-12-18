interface R2Config {
  publicUrl: string
}

export const uploadFileToR2 = async (
  r2Bucket: any,
  file: Buffer | Uint8Array,
  filename: string,
  contentType: string,
  config: R2Config,
): Promise<string> => {
  const key = `uploads/${Date.now()}-${filename}`

  await r2Bucket.put(key, file, {
    httpMetadata: {
      contentType,
    },
  })

  return `${config.publicUrl}/${key}`
}
