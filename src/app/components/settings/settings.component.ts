import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../core/services/electron/electron.service';
import { SettingsService } from '../../core/services/settings.service';
import { UserSettingsComponent } from './user-settings/user-settings.component';
import { StockSettingsComponent } from './stock-settings/stock-settings.component';
import { CustomerSettingsComponent } from './customer-settings/customer-settings.component';
import { MenuSettingsComponent } from './menu-settings/menu-settings.component';
import { RecipeSettingsComponent } from './recipe-settings/recipe-settings.component';
import { ApplicationSettingsComponent } from './application-settings/application-settings.component';
import { PrinterSettingsComponent } from './printer-settings/printer-settings.component';
import { RestaurantSettingsComponent } from './restaurant-settings/restaurant-settings.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    UserSettingsComponent,
    StockSettingsComponent,
    CustomerSettingsComponent,
    MenuSettingsComponent,
    RecipeSettingsComponent,
    ApplicationSettingsComponent,
    PrinterSettingsComponent,
    RestaurantSettingsComponent
  ],
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  storeInfo: any;
  selected!: number;
  logo!: string;

  constructor(private electron: ElectronService, private settingsService: SettingsService) {
    this.logo = this.electron.appRealPath + '/data/customer.png';
  }

  ngOnInit() {
    this.settingsService.RestaurantInfo.subscribe(res => {
      this.storeInfo = res.value;
    })
  }

  ngOnDestroy() {

  }
}
