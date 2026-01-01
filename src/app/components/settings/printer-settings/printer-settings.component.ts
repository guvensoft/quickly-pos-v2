import { Component, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-printer-settings',
  templateUrl: './printer-settings.component.html',
  styleUrls: ['./printer-settings.component.scss']
})
export class PrinterSettingsComponent implements OnInit {

  // Input to trigger component recreation when parent selection changes
  readonly key = input<number | undefined>(undefined);

  constructor() { }

  ngOnInit() {
  }

}
