import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainService } from '../../../core/services/main.service';
import { Activity } from '../../../core/models/report.model';

import { BaseChartDirective } from 'ng2-charts';

@Component({
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  selector: 'app-activity-reports',
  templateUrl: './activity-reports.component.html',
  styleUrls: ['./activity-reports.component.scss']
})
export class ActivityReportsComponent implements OnInit {

  activityData!: Array<any>;
  activityLabels!: Array<string>;
  activityLegend: boolean = true;
  sellingActivity!: Activity;


  SalesActivityOptions: any;
  CrowdActivityOptions: any;

  ChartLoaded!: boolean;

  SalesColor: Array<any> = [{ backgroundColor: '#5bc0de' }];
  CrowdColor: Array<any> = [{ backgroundColor: '#f0ad4e' }];

  constructor(private mainService: MainService) {

    this.SalesActivityOptions = {
      responsive: false,
      legend: {
        labels: {
          fontColor: 'rgb(255, 255, 255)',
          fontStyle: 'bolder'
        }
      },
      tooltips: {
        callbacks: {
          label: function (value: any) {
            return ' ' + Number(value.yLabel).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
          }
        }
      },
      elements: {
        line: {
          tension: 0.5,
        }
      },
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            fontColor: 'rgba(255,255,255)'
          },
          gridLines: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }],
        yAxes: [{
          ticks: {
            fontColor: 'rgba(255,255,255)',
            callback: function (value: any, index: any, values: any) {
              return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
            }

          },
          gridLines: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }]
      },
    };
    this.CrowdActivityOptions = {
      responsive: false,
      legend: {
        labels: {
          fontColor: 'rgb(255, 255, 255)',
          fontStyle: 'bolder'
        }
      },
      tooltips: {
        callbacks: {
          label: function (value: any) {
            return 'Masaların %' + Number(value.yLabel) + ' Dolu';
          }
        }
      },
      elements: {
        line: {
          tension: 0.5,
        }
      },
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            fontColor: 'rgba(255,255,255)'
          },
          gridLines: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }],
        yAxes: [{
          ticks: {
            fontColor: 'rgba(255,255,255)',
            callback: function (value: any, index: any, values: any) {
              return ' %' + value + ' ';
            }

          },
          gridLines: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }]
      },
    };
  }

  ngOnInit() {
    this.fillData();
  }

  dailySalesActivity() {
    this.ChartLoaded = false;
    this.activityData = [{ data: this.sellingActivity.activity, label: 'Gelir Endeksi' }];
    this.activityLabels = this.sellingActivity.activity_time;
    this.ChartLoaded = true;
  }

  dailyCrowdActivity() {
    this.ChartLoaded = false;
    this.activityData = [{ data: this.sellingActivity.activity_count, label: 'Doluluk Oranı ( % )' }];
    this.activityLabels = this.sellingActivity.activity_time;
    this.ChartLoaded = true;
  }

  fillData() {
    this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
      this.sellingActivity = res.docs[0];
      this.dailySalesActivity();
    });
  }

}
