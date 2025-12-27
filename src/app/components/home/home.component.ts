import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})

export class HomeComponent implements OnInit {
  private readonly router = inject(Router);

  readonly menus = signal<Array<any>>([
    { name: 'Satış', color: 'danger', icon: 'fa-glass', link: 'store' },
    { name: 'Kasa', color: 'success', icon: 'fa-money', link: 'cashbox' },
    { name: 'Gün Sonu', color: 'warning', icon: 'fa-clock-o', link: 'endoftheday' },
    { name: 'Raporlar', color: 'info', icon: 'fa-pie-chart', link: 'reports' },
    { name: 'Ayarlar', color: 'primary', icon: 'fa-cogs', link: 'settings' }
  ]);

  ngOnInit() {
  }

  closeProgram() {
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAuth');
    this.router.navigate(['/']);
  }
}