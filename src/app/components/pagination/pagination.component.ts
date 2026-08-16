import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="totalItems > 0" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
      
      <!-- Range indicator & Page size selector -->
      <div class="flex items-center space-x-3">
        <span>
          Showing <span class="font-bold text-slate-900 dark:text-white">{{ startItem }}</span> to 
          <span class="font-bold text-slate-900 dark:text-white">{{ endItem }}</span> of 
          <span class="font-bold text-slate-900 dark:text-white">{{ totalItems }}</span> entries
        </span>

        <div class="flex items-center space-x-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <span>Rows:</span>
          <select 
            [value]="pageSize" 
            (change)="onPageSizeChange($event)" 
            class="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
          </select>
        </div>
      </div>

      <!-- Navigation buttons -->
      <div class="flex items-center space-x-1">
        <button 
          (click)="setPage(currentPage - 1)" 
          [disabled]="currentPage === 1"
          class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Previous
        </button>

        <button 
          *ngFor="let p of visiblePages"
          (click)="setPage(p)"
          [ngClass]="p === currentPage ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'"
          class="min-w-[28px] h-7 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer"
        >
          {{ p }}
        </button>

        <button 
          (click)="setPage(currentPage + 1)" 
          [disabled]="currentPage === totalPages || totalPages === 0"
          class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Next
        </button>
      </div>

    </div>
  `
})
export class PaginationComponent {
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const range: number[] = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift(-1); // ellipsis representation or bounded
    }
    if (current + delta < total - 1) {
      range.push(-1);
    }

    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }

    return Array.from(new Set(range.filter(p => p > 0)));
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newSize = Number(select.value) || 10;
    this.pageSizeChange.emit(newSize);
  }
}
