import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Animal } from '../../models/satviq.models';

@Component({
  selector: 'app-family-tree',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './family-tree.component.html'
})
export class FamilyTreeComponent {
  dataService = inject(DataService);

  selectedAnimalId = signal<string>('');

  get selectedAnimal(): Animal | undefined {
    return this.dataService.animals().find(a => a.id === this.selectedAnimalId());
  }

  get motherAnimal(): Animal | undefined {
    const a = this.selectedAnimal;
    return a && a.mother ? this.dataService.animals().find(m => m.id === a.mother) : undefined;
  }

  get offspringAnimals(): Animal[] {
    const a = this.selectedAnimal;
    if (!a) return [];
    return this.dataService.animals().filter(k => k.mother === a.id);
  }
}
