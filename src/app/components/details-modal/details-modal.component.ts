import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DetailField {
  label: string;
  value: string | number | boolean | null | undefined;
}

@Component({
  selector: 'app-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ title }}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ subtitle || 'Detailed clinical & administrative record' }}</p>
            </div>
          </div>
          <button (click)="close.emit()" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Details List -->
        <div class="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm max-h-[60vh] overflow-y-auto pr-1">
          <div *ngFor="let item of fields" class="py-2.5 flex justify-between gap-4 items-center">
            <span class="text-slate-500 dark:text-slate-400 font-medium shrink-0">{{ item.label }}</span>
            <span class="text-slate-900 dark:text-slate-100 font-semibold text-right break-words">{{ item.value ?? '-' }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button (click)="close.emit()" class="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  `
})
export class DetailsModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Details';
  @Input() subtitle = '';
  @Input() fields: DetailField[] = [];
  @Output() close = new EventEmitter<void>();
}
