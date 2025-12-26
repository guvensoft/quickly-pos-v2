import { Component, OnInit, ViewChild } from '@angular/core';
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
  call: Call = {} as Call;
  customer!: Customer | null;
  owner: any;
  onUpdate: boolean = false;
  Date: any = Date;

  @ViewChild('customerForm') customerForm!: NgForm;

  constructor(
    private router: Router,
    private callerService: CallerIDService,
    private mainService: MainService,
    private settingsService: SettingsService
  ) {
    this.owner = this.settingsService.getUser('name');
  }

  ngOnInit() {
    this.callerService.listenCallEvent().subscribe(res => {
      this.call = res;
      this.mainService.getAllBy('customers', { phone_number: this.call.number }).then(customers => {
        if (customers.docs.length > 0) {
          this.customer = customers.docs[0];
        } else {
          this.customer = null;
        }
        (window as any).$('#callerModal').modal('show');
      });
    });
  }


  openCheck() {
    if (this.customer) {
      const checkWillOpen = new Check('Paket Servis', 0, 0, this.owner, `${this.customer.name} | ${this.customer.phone_number}`, CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo());
      this.mainService.addData('checks', checkWillOpen).then(res => {
        (window as any).$('#callerModal').modal('hide');
        this.router.navigate(['/selling-screen', 'Order', res.id]);
      });
    }
  }

  saveCustomer(form?: any) {
    const unknownCustomer = this.customerForm.value;
    const customerWillCreate = new Customer(unknownCustomer.name, unknownCustomer.surname, this.call.number, unknownCustomer.address, '', CustomerType.FAR, Date.now())
    this.mainService.addData('customers', customerWillCreate as any).then(res => {
      const checkWillOpen = new Check('Paket Servis', 0, 0, this.owner, `${unknownCustomer.name} | ${this.call.number}`, CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo());
      this.mainService.addData('checks', checkWillOpen).then(res => {
        (window as any).$('#callerModal').modal('hide');
        this.router.navigate(['/selling-screen', 'Order', res.id]);
      });
    });
  }

}
