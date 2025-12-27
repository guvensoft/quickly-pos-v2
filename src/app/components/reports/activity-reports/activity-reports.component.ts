import { Component, OnInit, inject, signal } from '@angular/core';
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
  private readonly mainService = inject(MainService);

  readonly activityData = signal<any[]>([]);
  readonly activityLabels = signal<string[]>([]);
  readonly activityLegend = signal<boolean>(true);
  readonly sellingActivity = signal<Activity | null>(null);

  SalesActivityOptions: any;
  CrowdActivityOptions: any;

  readonly ChartLoaded = signal<boolean>(false);

  readonly SalesColor = signal<any[]>([{ backgroundColor: '#5bc0de' }]);
  readonly CrowdColor = signal<any[]>([{ backgroundColor: '#f0ad4e' }]);

  constructor() {

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
    this.ChartLoaded.set(false);
    const selling = this.sellingActivity();
    if (selling) {
      this.activityData.set([{ data: selling.activity, label: 'Gelir Endeksi' }]);
      this.activityLabels.set(selling.activity_time);
      this.ChartLoaded.set(true);
    }
  }

  dailyCrowdActivity() {
    this.ChartLoaded.set(false);
    const selling = this.sellingActivity();
    if (selling) {
      this.activityData.set([{ data: selling.activity_count, label: 'Doluluk Oranı ( % )' }]);
      this.activityLabels.set(selling.activity_time);
      this.ChartLoaded.set(true);
    }
  }

  fillData() {
    this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
      if (res && res.docs && res.docs.length > 0) {
        this.sellingActivity.set(res.docs[0] as any);
        this.dailySalesActivity();
      }
    });
  }

}
