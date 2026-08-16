import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Farmer, BillRecord } from '../../models/satviq.models';

@Component({
  selector: 'app-sms-messenger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sms-messenger.component.html'
})
export class SmsMessengerComponent {
  dataService = inject(DataService);

  // Direct message state
  selectedFarmerId = signal<string>('');
  messageText = signal<string>('Hello, this is a reminder from SatviQ Livestock Intelligence regarding your cattle schedule.');

  // Bill message state
  selectedBillId = signal<string>('');

  get selectedFarmer(): Farmer | undefined {
    return this.dataService.getFarmer(this.selectedFarmerId());
  }

  get selectedBill(): BillRecord | undefined {
    return this.dataService.bills().find(b => b.id === this.selectedBillId());
  }

  get billAsciiMessage(): string {
    const b = this.selectedBill;
    if (!b) return '';
    return this.dataService.generateSimpleBillText(b);
  }

  sendDirectSMS() {
    const f = this.selectedFarmer;
    if (!f) {
      this.dataService.showToast('Please select a farmer.');
      return;
    }
    const text = this.messageText().trim();
    if (!text) {
      this.dataService.showToast('Please enter message text.');
      return;
    }
    const url = this.dataService.getSMSUrl(f.mobile, text);
    if (url) window.location.href = url;
    else this.dataService.showToast('Invalid farmer mobile number.');
  }

  sendDirectWA() {
    const f = this.selectedFarmer;
    if (!f) {
      this.dataService.showToast('Please select a farmer.');
      return;
    }
    const text = this.messageText().trim();
    if (!text) {
      this.dataService.showToast('Please enter message text.');
      return;
    }
    const url = this.dataService.getWhatsAppUrl(f.mobile, text);
    if (url) window.open(url, '_blank');
    else this.dataService.showToast('Invalid farmer mobile number.');
  }

  sendBillViaSMS() {
    const b = this.selectedBill;
    if (!b) {
      this.dataService.showToast('Please select a bill record.');
      return;
    }
    const f = this.dataService.getFarmer(b.farmer);
    if (!f) {
      this.dataService.showToast('Farmer not found for this bill.');
      return;
    }
    const url = this.dataService.getSMSUrl(f.mobile, this.billAsciiMessage);
    if (url) window.location.href = url;
    else this.dataService.showToast('Invalid farmer mobile number.');
  }

  sendBillViaWA() {
    const b = this.selectedBill;
    if (!b) {
      this.dataService.showToast('Please select a bill record.');
      return;
    }
    const f = this.dataService.getFarmer(b.farmer);
    if (!f) {
      this.dataService.showToast('Farmer not found for this bill.');
      return;
    }
    const url = this.dataService.getWhatsAppUrl(f.mobile, this.billAsciiMessage);
    if (url) window.open(url, '_blank');
    else this.dataService.showToast('Invalid farmer mobile number.');
  }
}
