import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-cashbox-reports',
  templateUrl: './cashbox-reports.component.html',
  styleUrls: ['./cashbox-reports.component.scss']
})
export class CashboxReportsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
