import { Component, inject, signal, effect } from '@angular/core';
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
    RestaurantSettingsComponent,
    PrinterSettingsComponent
  ],
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  private readonly electron = inject(ElectronService);
  private readonly settingsService = inject(SettingsService);

  readonly storeInfo = signal<any>(undefined);
  readonly selected = signal<number>(0);
  readonly logo = signal<string>('');

  constructor() {
    // Initialize logo path after DI is ready
    this.logo.set(this.electron.appRealPath + '/data/customer.png');

    // Set up reactive effect for RestaurantInfo changes
    effect(() => {
      this.settingsService.RestaurantInfo.subscribe(res => {
        this.storeInfo.set(res.value);
      });
    }, { allowSignalWrites: true });
  }
}
