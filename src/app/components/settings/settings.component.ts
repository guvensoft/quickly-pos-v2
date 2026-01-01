import { Component, inject, signal } from '@angular/core';
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
import { CashboxSettingsComponent } from './cashbox-settings/cashbox-settings.component';

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
    PrinterSettingsComponent,
    CashboxSettingsComponent
  ],
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  private readonly electron = inject(ElectronService);
  private readonly settingsService = inject(SettingsService);

  readonly storeInfo = signal<any>(undefined);
  readonly selected = signal<number | undefined>(undefined);
  readonly logo = signal<string>('');

  constructor() {
    // Initialize logo path after DI is ready
    // Use assets/data folder in development, userData in production
    if (this.electron.isElectron()) {
      // Production: use userData directory
      const basePath = this.electron.appRealPath.endsWith('/')
        ? this.electron.appRealPath
        : this.electron.appRealPath + '/';
      this.logo.set(basePath + 'data/customer.png');
    } else {
      // Development: use assets folder
      this.logo.set('assets/data/customer.png');
    }

    // Subscribe to RestaurantInfo outside of effect to avoid subscription issues
    this.settingsService.RestaurantInfo.subscribe(res => {
      this.storeInfo.set(res.value);
    });
  }
}
