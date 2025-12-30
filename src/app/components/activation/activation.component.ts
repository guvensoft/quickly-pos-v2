import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../core/services/electron/electron.service';
import { MainService } from '../../core/services/main.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-activation',
  templateUrl: './activation.component.html',
  styleUrls: ['./activation.component.scss'],
})

export class ActivationComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly mainService = inject(MainService);
  private readonly electronService = inject(ElectronService);

  readonly restInfo = signal<any>(undefined);

  constructor() {
    // Set up reactive effect for RestaurantInfo changes
    effect(() => {
      this.settingsService.RestaurantInfo.subscribe(res => {
        this.restInfo.set(res.value);
        this.mainService.syncToRemote();
      });
    }, { allowSignalWrites: true });
  }

}
