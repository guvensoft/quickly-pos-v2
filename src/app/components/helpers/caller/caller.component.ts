import { Component, viewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallerIDService } from '../../../core/services/caller-id.service';
import { MainService } from '../../../core/services/main.service';
import { Customer, CustomerType } from '../../../core/models/customer.model';
import { Check, CheckType, CheckStatus, CheckNo } from '../../../core/models/check.model';
import { SettingsService } from '../../../core/services/settings.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { NgxMaskPipe } from 'ngx-mask';
import { Call } from '../../../core/models/caller.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskPipe],
  selector: 'app-caller',
  templateUrl: './caller.component.html',
  styleUrls: ['./caller.component.scss']
})
export class CallerComponent {
  private readonly router = inject(Router);
  private readonly callerService = inject(CallerIDService);
  private readonly mainService = inject(MainService);
  private readonly settingsService = inject(SettingsService);
  private readonly dialogFacade = inject(DialogFacade);

  readonly owner = signal<any>(null);

  constructor() {
    this.owner.set(this.settingsService.getUser('name'));

    effect(() => {
      this.callerService.listenCallEvent().subscribe(res => {
        this.mainService.getAllBy('customers', { phone_number: res.number }).then(customers => {
          const customer = customers.docs.length > 0 ? customers.docs[0] : null;

          this.dialogFacade.openCallerModal({
            call: res,
            customer: customer
          }).closed.subscribe(result => {
            if (result?.action === 'open') {
              this.openCheck(customer);
            } else if (result?.action === 'save') {
              this.saveCustomer(res, result.formValue);
            }
          });
        });
      });
    }, { allowSignalWrites: true });
  }

  openCheck(customer: any) {
    if (customer) {
      const checkWillOpen = new Check('Paket Servis', 0, 0, this.owner(), `${customer.name} | ${customer.phone_number}`, CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo());
      this.mainService.addData('checks', checkWillOpen).then(res => {
        this.router.navigate(['/selling-screen', 'Order', res.id]);
      });
    }
  }

  saveCustomer(call: any, formValue: any) {
    const customerWillCreate = new Customer(formValue.name, formValue.surname, call.number, formValue.address, '', CustomerType.FAR, Date.now())
    this.mainService.addData('customers', customerWillCreate as any).then(res => {
      const checkWillOpen = new Check('Paket Servis', 0, 0, this.owner(), `${formValue.name} | ${call.number}`, CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo());
      this.mainService.addData('checks', checkWillOpen).then(res => {
        this.router.navigate(['/selling-screen', 'Order', res.id]);
      });
    });
  }
}
