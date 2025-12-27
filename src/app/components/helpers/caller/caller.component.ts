import { Component, OnInit, viewChild, inject, signal, effect } from '@angular/core';
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
export class CallerComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly callerService = inject(CallerIDService);
  private readonly mainService = inject(MainService);
  private readonly settingsService = inject(SettingsService);

  readonly call = signal<Call>({} as Call);
  readonly customer = signal<Customer | null>(null);
  readonly owner = signal<any>(this.settingsService.getUser('name'));
  readonly onUpdate = signal<boolean>(false);
  readonly Date = signal<any>(Date);

  customerForm = viewChild<NgForm>('customerForm');

  ngOnInit() {
    // Set up reactive effect for call events
    effect(() => {
      this.callerService.listenCallEvent().subscribe(res => {
        this.call.set(res);
        this.mainService.getAllBy('customers', { phone_number: res.number }).then(customers => {
          if (customers.docs.length > 0) {
            this.customer.set(customers.docs[0]);
          } else {
            this.customer.set(null);
          }
          (window as any).$('#callerModal').modal('show');
        });
      });
    }, { allowSignalWrites: true });
  }


  openCheck() {
    const currentCustomer = this.customer();
    if (currentCustomer) {
      const checkWillOpen = new Check('Paket Servis', 0, 0, this.owner(), `${currentCustomer.name} | ${currentCustomer.phone_number}`, CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo());
      this.mainService.addData('checks', checkWillOpen).then(res => {
        (window as any).$('#callerModal').modal('hide');
        this.router.navigate(['/selling-screen', 'Order', res.id]);
      });
    }
  }

  saveCustomer(form?: any) {
    const unknownCustomer = this.customerForm()?.value;
    const currentCall = this.call();
    const customerWillCreate = new Customer(unknownCustomer.name, unknownCustomer.surname, currentCall.number, unknownCustomer.address, '', CustomerType.FAR, Date.now())
    this.mainService.addData('customers', customerWillCreate as any).then(res => {
      const checkWillOpen = new Check('Paket Servis', 0, 0, this.owner(), `${unknownCustomer.name} | ${currentCall.number}`, CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo());
      this.mainService.addData('checks', checkWillOpen).then(res => {
        (window as any).$('#callerModal').modal('hide');
        this.router.navigate(['/selling-screen', 'Order', res.id]);
      });
    });
  }

}
