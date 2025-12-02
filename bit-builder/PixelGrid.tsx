import type { DrawingTool } from "@/components/DrawingTools"
import { PixelGridCell } from "@/components/PixelGridCell"
import { useEffect, useRef, useState } from "react"

type PixelGridProps = {
    height: number
    width: number
    currentColor: string
    backgroundColor: string
    borderColor: string
    currentTool: DrawingTool
    showGridLines: boolean
}

export const PixelGrid = ({ height, width, currentColor, backgroundColor, borderColor, currentTool, showGridLines }: PixelGridProps) => {
    const cells = Array.from({ length: height }, (_) => Array.from({ length: width }, (_, index) => index + 1))

    const [isMouseDown, setIsMouseDown] = useState<boolean>(false)

    const pixelGridContainerRef = useRef<HTMLDivElement>(null)
    const zoomScaleRef = useRef(1)

    // Refs for zooming on mobile
    const pointerCache = useRef<PointerEvent[]>([])
    const prevDistance = useRef<number | null>(null)

    // Handle zooming in and out on desktop (scrolling on mouse or trackpad)
    useEffect(() => {
        const handleMouseUp = () => setIsMouseDown(false)

        const handleZoom = (event: WheelEvent) => {
            if (!pixelGridContainerRef.current || !pixelGridContainerRef.current.contains(event.target as Node)) {
                return
            }

            // Prevent regular scrolling behaviour
            event.preventDefault()

            const zoomFactor = 0.0015
            zoomScaleRef.current = Math.min(Math.max(zoomScaleRef.current - event.deltaY * zoomFactor, 0.3), 4)

            pixelGridContainerRef.current.style.transform = `scale(${zoomScaleRef.current})`
            pixelGridContainerRef.current.style.transformOrigin = 'center center'
        }

        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('wheel', handleZoom, { passive: false })
        return () => {
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('wheel', handleZoom)
        }
    }, [])

    // Handle zooming in and out on mobile (pinch to zoom)
    useEffect(() => {
        const pixelGridElement = pixelGridContainerRef.current
        if (!pixelGridElement) {
                return
        }

        const handlePointerDown = (event: PointerEvent) => {
            pointerCache.current.push(event)
        }

        const handlePointerMove = (event: PointerEvent) => {
            if (!pixelGridElement) {
                return
            }
            for (let i = 0; i < pointerCache.current.length; i++) {
                if (pointerCache.current[i].pointerId === event.pointerId) {
                    pointerCache.current[i] = event
                    break
                }
            }

            // This is where we will zoom in or out
            if (pointerCache.current.length === 2) {
                event.preventDefault()

                const [pointer1, pointer2] = pointerCache.current
                const currDistance = Math.hypot(pointer1.clientX - pointer2.clientX, pointer1.clientY - pointer2.clientY)

                if (prevDistance.current !== null) {
                    const distanceDifference = currDistance - prevDistance.current
                    const zoomFactor = distanceDifference * 0.002

                    zoomScaleRef.current = Math.min(
                        Math.max(zoomScaleRef.current + zoomFactor, 0.3),
                        4
                    )

                    pixelGridElement.style.transform = `scale(${zoomScaleRef.current})`
                    pixelGridElement.style.transformOrigin = 'center center'
                }

                prevDistance.current = currDistance
            }
        }

        const handlePointerUp = (event: PointerEvent) => {
            pointerCache.current = pointerCache.current.filter(
                (p) => p.pointerId !== event.pointerId
            )

            if (pointerCache.current.length < 2) {
                prevDistance.current = null
            }
        }

        pixelGridElement.addEventListener('pointerdown', handlePointerDown, { passive: false })
        pixelGridElement.addEventListener('pointermove', handlePointerMove, { passive: false })
        pixelGridElement.addEventListener('pointerup', handlePointerUp)
        pixelGridElement.addEventListener('pointercancel', handlePointerUp)
        pixelGridElement.addEventListener('pointerout', handlePointerUp)
        pixelGridElement.addEventListener('pointerleave', handlePointerUp)

        return () => {
            pixelGridElement.removeEventListener('pointerdown', handlePointerDown)
            pixelGridElement.removeEventListener('pointermove', handlePointerMove)
            pixelGridElement.removeEventListener('pointerup', handlePointerUp)
            pixelGridElement.removeEventListener('pointercancel', handlePointerUp)
            pixelGridElement.removeEventListener('pointerout', handlePointerUp)
            pixelGridElement.removeEventListener('pointerleave', handlePointerUp)
        }
    }, [])

    return(
        <div 
            className="pixelGridContainer flex h-full flex-1 items-center justify-center touch-none"
            ref={pixelGridContainerRef}
        >
            <div 
                className="grid gap-0"
                style={{
                    gridTemplateColumns: `repeat(${width}, 0.5rem)`,
                    gridTemplateRows: `repeat(${height}, 0.5rem)`,
                }}
                onMouseDown={() => setIsMouseDown(true)}
                onMouseUp={() => setIsMouseDown(false)}
            >
                {cells.flatMap((row, rowIndex) => 
                    row.map((_, colIndex) => (
                        <PixelGridCell 
                            key={`grid-cell-${rowIndex}-${colIndex}`}
                            currentColor={currentColor}
                            backgroundColor={backgroundColor}
                            borderColor={borderColor}
                            currentTool={currentTool}
                            isMouseDown={isMouseDown}
                            showGridLines={showGridLines}
                        />
                    ))
                )}
            </div>
        </div>
    )
}