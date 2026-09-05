import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class BarcodeScannerService {
  private isBrowser: boolean;
  private stream: MediaStream | null = null;
  private detector: any = null;
  private scanning = false;
  private animationFrameId: number | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Check if BarcodeDetector API is available natively
   */
  isBarcodeDetectorSupported(): boolean {
    return this.isBrowser && 'BarcodeDetector' in window;
  }

  /**
   * Check if camera is available
   */
  isCameraAvailable(): boolean {
    return this.isBrowser && !!navigator.mediaDevices?.getUserMedia;
  }

  /**
   * Request camera access and return the media stream.
   * Prefers rear camera on mobile devices.
   */
  async openCamera(): Promise<MediaStream> {
    if (!this.isCameraAvailable()) {
      throw new Error('Camera not available on this device');
    }

    try {
      // Try rear camera first (mobile)
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    } catch {
      // Fallback to any available camera
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      } catch (err) {
        throw new Error('Camera permission denied or no camera found');
      }
    }

    return this.stream;
  }

  /**
   * Initialize the barcode detector.
   * Uses native BarcodeDetector API.
   */
  async initDetector(): Promise<void> {
    if (this.isBarcodeDetectorSupported()) {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      const supportedFormats = await BarcodeDetectorClass.getSupportedFormats();

      // Pick formats relevant to animal ear tags
      const desiredFormats = ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'data_matrix', 'upc_a', 'upc_e'];
      const formats = desiredFormats.filter((f: string) => supportedFormats.includes(f));

      this.detector = new BarcodeDetectorClass({
        formats: formats.length > 0 ? formats : supportedFormats
      });
    }
  }

  /**
   * Start continuous scanning from a video element.
   * Returns a promise that resolves with the first detected barcode value.
   */
  startScanning(videoElement: HTMLVideoElement): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.detector) {
        // No native BarcodeDetector — use canvas fallback polling
        reject(new Error('BarcodeDetector not supported. Please use Chrome or Android.'));
        return;
      }

      this.scanning = true;

      const scan = async () => {
        if (!this.scanning) return;

        try {
          if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
            const barcodes = await this.detector.detect(videoElement);
            if (barcodes && barcodes.length > 0) {
              const value = barcodes[0].rawValue;
              if (value) {
                this.scanning = false;
                resolve(value);
                return;
              }
            }
          }
        } catch {
          // Detection frame error, continue scanning
        }

        if (this.scanning) {
          this.animationFrameId = requestAnimationFrame(scan);
        }
      };

      this.animationFrameId = requestAnimationFrame(scan);
    });
  }

  /**
   * Stop scanning and release camera resources
   */
  stopScanning(): void {
    this.scanning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}
