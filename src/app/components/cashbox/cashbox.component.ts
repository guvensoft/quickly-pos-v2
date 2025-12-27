import { Component, inject, signal, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Cashbox } from '../../core/models/cashbox.model';
import { MessageService } from '../../core/services/message.service';
import { LogService, logType } from '../../core/services/log.service';
import { MainService } from '../../core/services/main.service';
import { SettingsService } from '../../core/services/settings.service';
import { PricePipe } from '../../shared/pipes/price.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, PricePipe],
  selector: 'app-cashbox',
  templateUrl: './cashbox.component.html',
  styleUrls: ['./cashbox.component.scss'],
})
export class CashboxComponent {
  private readonly mainService = inject(MainService);
  private readonly settingsService = inject(SettingsService);
  private readonly messageService = inject(MessageService);
  private readonly logService = inject(LogService);

  readonly cashboxData = signal<Cashbox[]>([]);
  readonly selectedData = signal<Cashbox | undefined>(undefined);
  readonly sellingIncomes = signal<number>(0);
  readonly incomes = signal<number>(0);
  readonly outcomes = signal<number>(0);
  readonly leftTotal = signal<number>(0);
  readonly type = signal<string>('');
  readonly user = signal<string>('');
  readonly onUpdate = signal<boolean>(false);
  readonly day = signal<number>(0);

  cashboxForm = viewChild<NgForm>('cashboxForm');

  constructor() {
    this.user.set(this.settingsService.getUser('name') as string || '');

    effect(() => {
      this.settingsService.DateSettings.subscribe(res => {
        if (res && res.value) {
          this.day.set(res.value.day);
        }
      });
    }, { allowSignalWrites: true });

    this.fillData();
  }

  addData(cashboxForm: NgForm) {
    const form = cashboxForm.value;
    if (!form.description || form.description === '') {
      this.messageService.sendMessage('Açıklama Girmek Zorundasınız.');
      return false;
    }
    if (form.cash == null && form.card == null && form.coupon == null) {
      this.messageService.sendMessage('Herhangi Bir ' + this.type() + ' Miktarı Belirtmelisiniz.');
      return false;
    }
    if (form.cash == null) { form.cash = 0 }
    if (form.card == null) { form.card = 0 }
    if (form.coupon == null) { form.coupon = 0 }

    if (!form._id) {
      const schema = new Cashbox(this.type(), form.description, Date.now(), form.cash, form.card, form.coupon, this.user());
      this.mainService.addData('cashbox', schema as any).then(res => {
        this.logService.createLog(logType.CASHBOX_CREATED, res.id, `Kasaya ${(form.cash + form.card + form.coupon)} tutarında ${this.type()} eklendi.`);
        this.fillData();
        this.messageService.sendMessage(this.type() + ' Eklendi');
      });
    } else {
      const schema = new Cashbox(this.type(), form.description, Date.now(), form.cash, form.card, form.coupon, this.user(), form._id, form._rev);
      this.mainService.updateData('cashbox', form._id, schema as any).then(res => {
        this.fillData();
        this.messageService.sendMessage(this.type() + ' Düzenlendi');
      });
    }
    this.cashboxForm()?.reset();
    (window as any).$('#cashboxModal').modal('hide');
    return true;
  }

  updateData(data: Cashbox) {
    this.onUpdate.set(true);
    this.selectedData.set(data);
    this.type.set(data.type);
    this.mainService.getData('cashbox', data._id!).then(res => {
      this.logService.createLog(logType.CASHBOX_UPDATED, (res as any).id, `Kasa '${data.description}' adlı ${this.type()}'i güncellendi.`);
      if (this.cashboxForm()) {
        this.cashboxForm()!.setValue(res);
      }
      this.fillData();
      (window as any).$('#cashboxModal').modal('show');
    })
  }

  removeData(id: string) {
    const selected = this.selectedData();
    this.mainService.removeData('cashbox', id).then(res => {
      this.logService.createLog(logType.CASHBOX_DELETED, res.id, `Kasadan '${selected?.description}' adlı ${this.type()}'i silindi.`);
      this.messageService.sendMessage('Kayıt Silindi');
      this.fillData();
    });
    (window as any).$('#cashboxModal').modal('hide');
  }

  setDefault() {
    if (this.cashboxForm()) {
      this.cashboxForm()!.reset();
    }
    this.onUpdate.set(false);
  }

  fillData() {
    this.sellingIncomes.set(0);
    this.mainService.getAllBy('cashbox', {}).then(result => {
      const data = result.docs as unknown as Cashbox[];
      data.sort((a, b) => b.timestamp - a.timestamp);
      this.cashboxData.set(data);

      try {
        const inc = data.filter(obj => obj.type == 'Gelir').map(obj => obj.card + obj.cash + obj.coupon).reduce((a, b) => a + b, 0);
        this.incomes.set(inc);
      } catch (error) {
        this.incomes.set(0);
      }

      try {
        const out = data.filter(obj => obj.type == 'Gider').map(obj => obj.card + obj.cash + obj.coupon).reduce((a, b) => a + b, 0);
        this.outcomes.set(out);
      } catch (error) {
        this.outcomes.set(0);
      }

      const left = this.incomes() - this.outcomes();
      this.mainService.getAllBy('reports', { type: 'Store' }).then(res => {
        let report = res.docs;
        report = report.filter((obj: any) => obj.connection_id !== 'Genel').sort((a: any, b: any) => b.connection_id.localeCompare(a.connection_id));
        let selling = 0;
        report.forEach((element: any, index: number) => {
          if (element.connection_id !== 'İkram') {
            selling += element.weekly[this.day()];
          }
          if (report.length - 1 == index) {
            this.sellingIncomes.set(selling);
            this.leftTotal.set(Math.round(selling + left));
          }
        });
      });
    });
  }
}
