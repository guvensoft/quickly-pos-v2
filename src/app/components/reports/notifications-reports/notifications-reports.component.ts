import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-notifications-reports',
  templateUrl: './notifications-reports.component.html',
  styleUrls: ['./notifications-reports.component.scss']
})
export class NotificationsReportsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
