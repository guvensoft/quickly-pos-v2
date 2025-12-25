import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../providers/electron.service';
import { MainService } from '../../services/main.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-activation',
  templateUrl: './activation.component.html',
  styleUrls: ['./activation.component.scss'],
  providers: [SettingsService, MainService]
})

export class ActivationComponent implements OnInit {
  restInfo: any;

  constructor(private settingsService: SettingsService, private mainService: MainService, private electronService: ElectronService) {
    this.settingsService.RestaurantInfo.subscribe(res => {
      this.restInfo = res.value;
      this.mainService.syncToRemote();
    });
  }

  ngOnInit() { }

}
