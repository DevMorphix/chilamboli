interface R2Config {
  publicUrl: string
}

export const uploadFileToR2 = async (
  r2Bucket: any,
  file: Buffer | Uint8Array,
  filename: string,
  contentType: string,
  config: R2Config,
  options?: {
    folder?: string
    customFilename?: string
  },
): Promise<string> => {
  let key: string
  
  if (options?.folder && options?.customFilename) {
    // Use custom folder and filename
    const extension = filename.split('.').pop() || ''
    key = `${options.folder}/${options.customFilename}.${extension}`
  } else {
    // Default behavior: uploads folder with timestamp
    key = `uploads/${Date.now()}-${filename}`
  }

  await r2Bucket.put(key, file, {
    httpMetadata: {
      contentType,
    },
  })

  return `${config.publicUrl}/${key}`
}
