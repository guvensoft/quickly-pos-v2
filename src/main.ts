import { enableProdMode, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNgxMask } from 'ngx-mask';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { AppComponent } from './app/app.component';
import { APP_CONFIG } from './environments/environment';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { PageNotFoundComponent } from './app/shared/components';

// Guards
import { AnonymousCanActivate, CanActivateViaAuthGuard, DayStarted } from './app/core/guards/auth.guard';

// Components
import { ActivationComponent } from './app/components/activation/activation.component';
import { AdminComponent } from './app/components/admin/admin.component';
import { CashboxComponent } from './app/components/cashbox/cashbox.component';
import { EndofthedayComponent } from './app/components/endoftheday/endoftheday.component';
import { HomeComponent } from './app/components/home/home.component';
import { LoginComponent } from './app/components/login/login.component';
import { ReportsComponent } from './app/components/reports/reports.component';
import { SettingsComponent } from './app/components/settings/settings.component';
import { SetupComponent } from './app/components/setup/setup.component';
import { PaymentScreenComponent } from './app/components/store/payment-screen/payment-screen.component';
import { SellingScreenComponent } from './app/components/store/selling-screen/selling-screen.component';
import { StoreComponent } from './app/components/store/store.component';

if (APP_CONFIG.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(), provideHttpClient(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'en',
      lang: 'en'
    }),
    provideRouter([
      {
        path: '',
        component: LoginComponent
      },
      {
        path: 'home',
        component: HomeComponent,
        canActivate: [AnonymousCanActivate]
      },
      {
        path: 'activation',
        component: ActivationComponent
      },
      {
        path: 'store',
        component: StoreComponent,
        canActivate: [CanActivateViaAuthGuard, DayStarted]
      },
      {
        path: 'cashbox',
        component: CashboxComponent,
        canActivate: [CanActivateViaAuthGuard, DayStarted]
      },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [CanActivateViaAuthGuard, DayStarted]
      },
      {
        path: 'endoftheday',
        component: EndofthedayComponent,
        canActivate: [CanActivateViaAuthGuard]
      },
      {
        path: 'endoftheday_no_guard',
        component: EndofthedayComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [CanActivateViaAuthGuard]
      },
      {
        path: 'admin',
        component: AdminComponent,
      },
      {
        path: 'selling-screen/:type/:id',
        component: SellingScreenComponent,
        canActivate: [CanActivateViaAuthGuard, DayStarted]
      },
      {
        path: 'payment/:id',
        component: PaymentScreenComponent,
      },
      {
        path: 'setup',
        component: SetupComponent
      },
      {
        path: '**',
        component: PageNotFoundComponent
      }
    ]),
    provideNgxMask(),
    provideCharts(withDefaultRegisterables()),
    provideAnimations()
  ]
}).catch(err => console.error(err));
