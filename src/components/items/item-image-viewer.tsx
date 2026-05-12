"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import type { ItemDetailImage } from "@/lib/item-detail-images"
import { AppImage } from "@/components/ui/app-image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type ItemImageViewerProps = {
  images: ItemDetailImage[]
  initialIndex?: number
  trigger: ReactNode
  itemName: string
}

function clampIndex(index: number, length: number) {
  if (length === 0) return 0
  return Math.min(Math.max(index, 0), length - 1)
}

export function ItemImageViewer({
  images,
  initialIndex = 0,
  trigger,
  itemName,
}: ItemImageViewerProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => clampIndex(initialIndex, images.length))
  const safeActiveIndex = clampIndex(activeIndex, images.length)
  const activeImage = images[safeActiveIndex]
  const hasMultipleImages = images.length > 1

  const title = useMemo(() => {
    if (!activeImage) return `${itemName} image`
    if (!hasMultipleImages) return `${itemName} image`
    return `${itemName} image ${safeActiveIndex + 1} of ${images.length}`
  }, [activeImage, safeActiveIndex, hasMultipleImages, images.length, itemName])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        return
      }

      if (!hasMultipleImages) return

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        setActiveIndex((currentIndex) => (currentIndex - 1 + images.length) % images.length)
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        setActiveIndex((currentIndex) => (currentIndex + 1) % images.length)
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    window.addEventListener("keyup", handleKeyUp, true)
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true)
      window.removeEventListener("keyup", handleKeyUp, true)
    }
  }, [hasMultipleImages, images.length, open])

  if (!activeImage) return null

  const goToPrevious = () => {
    setActiveIndex((currentIndex) => (currentIndex - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % images.length)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setActiveIndex(clampIndex(initialIndex, images.length))
    }
    setOpen(nextOpen)
  }
  const closeViewer = () => setOpen(false)
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="inset-0 left-0 top-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-0 bg-background p-0 shadow-none">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Full item image viewer. Use left and right arrow keys to move between images when multiple images are available.
        </DialogDescription>

        <div className="flex h-14 shrink-0 items-center border-b bg-background/95 px-3 sm:px-4">
          <div className="min-w-0 text-sm font-medium">
            {hasMultipleImages ? (
              <span>
                {safeActiveIndex + 1} / {images.length}
              </span>
            ) : (
              <span>{itemName}</span>
            )}
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-muted/40">
          <AppImage
            key={activeImage.id}
            src={activeImage.src}
            alt={activeImage.alt}
            width={1600}
            height={1200}
            sizes="100vw"
            className="h-full w-full cursor-zoom-out object-contain"
            onClick={closeViewer}
            priority
          />

          {hasMultipleImages && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon-lg"
                aria-label="Previous image"
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/85 shadow-md hover:bg-background sm:left-4",
                )}
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon-lg"
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/85 shadow-md hover:bg-background sm:right-4"
                onClick={goToNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="secondary"
            size="icon-lg"
            aria-label="Close image viewer"
            className="pointer-events-auto absolute bottom-3 right-3 z-10 h-12 w-12 rounded-full bg-background/85 shadow-md hover:bg-background sm:bottom-4 sm:right-4"
            onMouseDown={closeViewer}
            onClick={closeViewer}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {activeImage.caption && (
          <div className="shrink-0 border-t bg-background/95 px-4 py-3 text-center text-sm text-muted-foreground">
            {activeImage.caption}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
