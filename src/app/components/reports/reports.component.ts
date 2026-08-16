import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { PaginationComponent } from '../pagination/pagination.component';

export interface ReportItem {
  type: 'AI' | 'PD' | 'Calving' | 'Bill';
  date: string;
  farmer: string;
  ref: string;
  statusOrAmount: string;
  notes: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './reports.component.html'
})
export class ReportsComponent {
  dataService = inject(DataService);

  searchQuery = signal<string>('');
  fromDate = signal<string>('');
  toDate = signal<string>('');
  selectedFarmer = signal<string>('');
  selectedStatus = signal<string>('All');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  reportList(): ReportItem[] {
    const list: ReportItem[] = [];

    // AI
    this.dataService.ai().forEach(x => {
      const a = this.dataService.getAnimal(x.animal);
      list.push({
        type: 'AI',
        date: x.date,
        farmer: this.dataService.getFarmerName(a?.farmer),
        ref: this.dataService.getAnimalTag(x.animal),
        statusOrAmount: 'Recorded (Attempt #' + x.attempt + ')',
        notes: x.notes || (x.bull ? 'Bull: ' + x.bull : '')
      });
    });

    // PD
    this.dataService.pd().forEach(x => {
      const a = this.dataService.getAnimal(x.animal);
      list.push({
        type: 'PD',
        date: x.date,
        farmer: this.dataService.getFarmerName(a?.farmer),
        ref: this.dataService.getAnimalTag(x.animal),
        statusOrAmount: x.result,
        notes: x.notes || x.method
      });
    });

    // Calvings
    this.dataService.calvings().forEach(x => {
      const a = this.dataService.getAnimal(x.mother);
      list.push({
        type: 'Calving',
        date: x.date,
        farmer: this.dataService.getFarmerName(a?.farmer),
        ref: `Mother: ${this.dataService.getAnimalTag(x.mother)} / Calf: ${x.tag}`,
        statusOrAmount: x.outcome,
        notes: x.notes || (x.weight ? x.weight + ' kg' : '')
      });
    });

    // Bills
    this.dataService.bills().forEach(x => {
      list.push({
        type: 'Bill',
        date: x.date,
        farmer: this.dataService.getFarmerName(x.farmer),
        ref: x.billno + (x.animalTag ? ' (' + x.animalTag + ')' : ''),
        statusOrAmount: '₹' + x.amount + ' (' + x.payment + ')',
        notes: x.type
      });
    });

    const q = this.searchQuery().toLowerCase().trim();

    return list.filter(item => {
      if (this.fromDate() && item.date < this.fromDate()) return false;
      if (this.toDate() && item.date > this.toDate()) return false;
      if (this.selectedFarmer() && item.farmer !== this.dataService.getFarmerName(this.selectedFarmer())) return false;
      if (this.selectedStatus() !== 'All' && !item.statusOrAmount.includes(this.selectedStatus())) return false;
      if (q && !(item.farmer + ' ' + item.ref + ' ' + item.type + ' ' + item.statusOrAmount + ' ' + item.notes + ' ' + item.date).toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }

  paginatedReports(): ReportItem[] {
    const list = this.reportList();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  }

  onFilterChange() {
    this.currentPage.set(1);
  }

  exportCSV() {
    this.dataService.exportCSV();
  }

  printReport() {
    window.print();
  }
}
