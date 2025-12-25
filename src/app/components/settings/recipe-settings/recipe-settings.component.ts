import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recipe, Ingredient, Product } from '../../../core/models/product.model';
import { MainService } from '../../../services/main.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, GeneralPipe],
  selector: 'app-recipe-settings',
  templateUrl: './recipe-settings.component.html',
  styleUrls: ['./recipe-settings.component.scss']
})
export class RecipeSettingsComponent implements OnInit {
  recipes!: Array<Recipe>;

  constructor(private mainService: MainService) { }

  ngOnInit() {
    this.fillData();
  }

  fillData() {
    this.mainService.getAllBy('recipes', {}).then(res => {
      this.recipes = res.docs;
    })
  }

}
