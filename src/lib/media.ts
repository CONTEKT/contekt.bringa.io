import { appConfig } from "@/lib/app-config"
import {
  buildImageCompressionOptions,
  buildImageThumbnailCompressionOptions,
  buildImageUploadAccept,
  formatBytes,
  validateImageFileAgainstConfig,
} from "@/lib/media-policy"

export const imageUploadAccept = buildImageUploadAccept(appConfig.media)

export function validateImageFile(file: File) {
  return validateImageFileAgainstConfig(file, appConfig.media)
}

export function getImageCompressionOptions() {
  return buildImageCompressionOptions(appConfig.media)
}

export function getImageThumbnailCompressionOptions() {
  return buildImageThumbnailCompressionOptions(appConfig.media)
}

export { formatBytes }
