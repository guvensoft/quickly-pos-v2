import { Component, OnInit, inject, signal, input, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recipe } from '../../../core/models/product.model';
import { MainService } from '../../../core/services/main.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, GeneralPipe],
  selector: 'app-recipe-settings',
  templateUrl: './recipe-settings.component.html',
  styleUrls: ['./recipe-settings.component.scss']
})
export class RecipeSettingsComponent implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly zone = inject(NgZone);

  readonly recipes = signal<Array<Recipe>>([]);

  // Input to trigger component recreation when parent selection changes
  readonly key = input<number | undefined>(undefined);

  ngOnInit() {
    this.fillData();
  }

  fillData() {
    this.mainService.getAllBy('recipes', {}).then(res => {
      this.zone.run(() => {
        if (res && res.docs) {
          this.recipes.set(res.docs);
        } else {
          this.recipes.set([]);
        }
      });
    });
  }
}
