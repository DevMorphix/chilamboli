import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

interface R2Config {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl: string
}

let r2Client: S3Client | null = null
let currentConfig: R2Config | null = null

export const getR2Client = (config: R2Config) => {
  // Recreate client if config changed
  if (
    r2Client &&
    currentConfig &&
    currentConfig.endpoint === config.endpoint &&
    currentConfig.accessKeyId === config.accessKeyId
  ) {
    return r2Client
  }

  currentConfig = config
  r2Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  return r2Client
}

export const uploadFileToR2 = async (
  file: Buffer,
  filename: string,
  contentType: string,
  config: R2Config,
): Promise<string> => {
  const client = getR2Client(config)

  const key = `uploads/${Date.now()}-${filename}`

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  )

  return `${config.publicUrl}/${key}`
}
