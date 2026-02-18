'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Scan, AlertCircle } from 'lucide-react'

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isClosingRef = useRef(false)

  const stopScanner = useCallback(async () => {
    if (isClosingRef.current) return
    isClosingRef.current = true
    
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
        scannerRef.current = null
      }
    } catch (err) {
      console.log('Stop scanner error (can be ignored):', err)
    }
    
    isClosingRef.current = false
  }, [])

  useEffect(() => {
    let isMounted = true
    
    const initScanner = async () => {
      try {
        // Check HTTPS
        if (typeof window !== 'undefined' && 
            window.location.protocol !== 'https:' && 
            window.location.hostname !== 'localhost') {
          if (isMounted) {
            setError('Camera requires HTTPS connection')
          }
          return
        }

        // Check for cameras
        const devices = await Html5Qrcode.getCameras()
        
        if (!isMounted) return
        
        if (!devices || devices.length === 0) {
          setError('No camera found on this device')
          return
        }

        if (!containerRef.current) {
          setError('Scanner initialization failed')
          return
        }

        // Create scanner
        scannerRef.current = new Html5Qrcode(containerRef.current.id)
        
        // Find back camera
        let cameraId = { facingMode: 'environment' }
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear')
        )
        
        if (backCamera) {
          cameraId = { deviceId: { exact: backCamera.id } } as any
        }

        // Start scanner
        await scannerRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            // Success - barcode detected
            if (isMounted && !isClosingRef.current) {
              stopScanner().then(() => {
                onDetected(decodedText)
              })
            }
          },
          () => {
            // Scan error - ignore (no barcode in frame)
          }
        )

        if (isMounted) {
          setIsReady(true)
        }
        
      } catch (err: any) {
        console.error('Scanner init error:', err)
        if (isMounted) {
          let msg = 'Failed to start camera'
          if (err.name === 'NotAllowedError') {
            msg = 'Camera permission denied. Please allow camera access and try again.'
          } else if (err.message) {
            msg = err.message
          }
          setError(msg)
        }
      }
    }

    // Delay to ensure container is rendered
    setTimeout(initScanner, 100)

    return () => {
      isMounted = false
      stopScanner()
    }
  }, [onDetected, stopScanner])

  const handleClose = () => {
    stopScanner().then(() => {
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl p-4 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Scan className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Scan Barcode</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 font-medium">{error}</p>
                <button
                  onClick={handleClose}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Close and try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scanner */}
        <div className="relative">
          <div 
            ref={containerRef}
            id="barcode-scanner-container"
            className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden"
          />
          
          {!isReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-xl">
              <p className="text-white">Starting camera...</p>
            </div>
          )}

          {isReady && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/50 rounded-lg">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-500/50" />
                </div>
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">
                Align barcode within frame
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm text-gray-500 text-center">
          Point your camera at a barcode to scan
        </p>
      </div>
    </div>
  )
}
