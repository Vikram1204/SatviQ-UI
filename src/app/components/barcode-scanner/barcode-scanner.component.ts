import { Component, EventEmitter, Output, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarcodeScannerService } from '../../services/barcode-scanner.service';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barcode-scanner.component.html',
  styleUrl: './barcode-scanner.component.scss'
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @Output() scanned = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('videoElement', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  private scannerService = inject(BarcodeScannerService);

  status = signal<'initializing' | 'scanning' | 'success' | 'error'>('initializing');
  statusMessage = signal('Initializing camera...');
  scannedValue = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.scannerService.stopScanning();
  }

  private async startCamera(): Promise<void> {
    try {
      // Check camera availability
      if (!this.scannerService.isCameraAvailable()) {
        this.status.set('error');
        this.statusMessage.set('Camera not available on this device');
        return;
      }

      // Open camera
      this.statusMessage.set('Requesting camera permission...');
      const stream = await this.scannerService.openCamera();

      // Set video source
      const video = this.videoRef.nativeElement;
      video.srcObject = stream;
      await video.play();

      // Initialize detector
      if (!this.scannerService.isBarcodeDetectorSupported()) {
        this.status.set('error');
        this.statusMessage.set('Barcode scanning is not supported in this browser. Please use Chrome or Android.');
        return;
      }

      await this.scannerService.initDetector();

      // Start scanning
      this.status.set('scanning');
      this.statusMessage.set('Point camera at barcode');

      const value = await this.scannerService.startScanning(video);

      // Success
      this.scannedValue.set(value);
      this.status.set('success');
      this.statusMessage.set('Barcode detected!');

      // Brief delay to show success state then emit
      setTimeout(() => {
        this.scanned.emit(value);
      }, 600);

    } catch (err: any) {
      this.status.set('error');
      this.statusMessage.set(err.message || 'Failed to access camera');
    }
  }

  onClose(): void {
    this.scannerService.stopScanning();
    this.closed.emit();
  }

  async onRetry(): Promise<void> {
    this.scannerService.stopScanning();
    this.status.set('initializing');
    this.statusMessage.set('Restarting camera...');
    await this.startCamera();
  }
}
