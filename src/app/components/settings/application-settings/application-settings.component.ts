import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Printer } from '../../../core/models/settings.model';
import { ElectronService } from '../../../core/services/electron/electron.service';
import { MessageService } from '../../../core/services/message.service';
import { PrinterService } from '../../../core/services/printer.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-application-settings',
  templateUrl: './application-settings.component.html',
  styleUrls: ['./application-settings.component.scss'],
})
export class ApplicationSettingsComponent implements OnInit {
  restInfo: any;
  restMap!: string;
  appSettings: any;
  appLogo!: string;
  printers!: Array<any>;
  printerProcess!: string;
  printersFound!: Array<any>;
  selectedPrinter: any;
  choosenPrinter: any;
  currentSection!: string;
  @ViewChild('settingsForm') settingsForm!: NgForm;
  @ViewChild('appServerForm') appServerForm!: NgForm;
  @ViewChild('restaurantForm') restaurantForm!: NgForm;
  @ViewChild('printerForm') printerForm!: NgForm;
  @ViewChild('printerDetailForm') printerDetailForm!: NgForm;
  @ViewChild('serverSettingsForm') serverSettingsForm!: NgForm;

  constructor(private settings: SettingsService, private router: Router, private printerService: PrinterService, private electronService: ElectronService, private message: MessageService,) {
    this.appLogo = "";
    this.fillData();
  }

  ngOnInit() {
    this.currentSection = 'AppSettings';
    this.settings.AppSettings.subscribe((res: any) => {
      if (res && res.value) {
        this.appSettings = res.value;
        if (this.settingsForm) {
          this.settingsForm.setValue(this.appSettings);
        }
      }
    });
    this.settings.RestaurantInfo.subscribe((res: any) => {
      if (res && res.value) {
        delete res.value.auth;
        delete res.value.remote;
        delete res.value.settings;
        this.restInfo = res.value;
        this.restMap = res.value.geolocation;
        this.appLogo = this.restInfo.logo;
        // if (this.restInfo.last_seen) delete this.restInfo.last_seen;
        // this.restaurantForm.setValue(this.restInfo);
      }
    });
    this.settings.ServerSettings.subscribe((res: any) => {
      if (res && res.value && this.serverSettingsForm) {
        this.serverSettingsForm.setValue(res.value);
      }
    })
  }

  getSettingsDetail(section: string) {
    this.currentSection = section;
  }

  saveSettings(Form: NgForm) {
    this.settings.setAppSettings('AppSettings', Form.value);
    this.message.sendMessage('Ayarlar Kaydediliyor.. Program Yeniden Başlatılıyor.');
    setTimeout(() => {
      this.electronService.reloadProgram();
    }, 1500)
  }

  saveRestSettings(Form: NgForm) {
    this.settings.setAppSettings('RestaurantInfo', Form.value);
    this.message.sendMessage('Ayarlar Kaydediliyor.. Program Yeniden Başlatılıyor.');
    setTimeout(() => {
      this.electronService.reloadProgram();
    }, 1500)
  }

  saveServerSettings(Form: NgForm) {
    this.settings.setAppSettings('ServerSettings', Form.value);
    this.message.sendMessage('Sunucu Ayarları Kaydediliyor.. Makina Yeniden Başlatılıyor.');
    setTimeout(() => {
      this.electronService.ipcRenderer.send('closeServer');
      this.electronService.relaunchProgram();
    }, 1500)
  }

  generateKey(Form: NgForm) {
    const newKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    Form.value.key = newKey;
    Form.value.ip_address = this.electronService.getLocalIP();
    this.serverSettingsForm.setValue(Form.value);
  }

  getPrinterDetail(printer: Printer) {
    this.choosenPrinter = printer;
    if (this.printerDetailForm) {
      this.printerDetailForm.setValue(printer);
    }
  }

  addPrinter(Form: NgForm) {
    const form = Form.value;
    let address;
    if (form.port_number == undefined) {
      if (this.selectedPrinter && this.selectedPrinter.portNumbers && this.selectedPrinter.portNumbers.length > 0) {
        address = this.selectedPrinter.portNumbers[0];
      }
    }
    if (form.name) {
      if (this.printerProcess == 'LAN') {
        if (form.port_number) {
          address = form.port_number;
        } else {
          this.message.sendMessage('IP Adresi Girmek Zorundasınız.');
          return false;
        }
      }
      const printer = new Printer(form.name, this.printerProcess, form.note, address, form.mission);
      if (this.printers && Array.isArray(this.printers)) {
        const printersData = this.printers.filter(obj => obj.name == form.name);
        if (printersData.length == 0) {
          this.settings.addPrinter(printer);
          (window as any).$('#printerModal').modal('hide');
          this.message.sendMessage('Yazıcı Oluşturuldu.');
          this.fillData();
        } else {
          this.message.sendMessage('Farklı Bir İsim Girmek Zorundasınız');
        }
      } else {
        this.settings.addPrinter(printer);
        (window as any).$('#printerModal').modal('hide');
        this.message.sendMessage('Yazıcı Oluşturuldu.');
        this.fillData();
      }
    } else {
      this.message.sendMessage('Yazıcı Adı Girmek Zorundasınız.');
      return false;
    }
  }

  updatePrinter(Form: NgForm) {
    const form = Form.value;
    this.settings.updatePrinter(form, this.choosenPrinter);
    this.choosenPrinter = undefined!;
    this.message.sendMessage('Yazıcı Düzenlendi.');
    this.fillData();
  }

  removePrinter(Printer: any) {
    this.settings.removePrinter(Printer);
    this.message.sendMessage('Yazıcı Kaldırıldı..');
    this.choosenPrinter = undefined!;
    this.fillData();
  }

  getPrinters(Type: string) {
    switch (Type) {
      case 'USB':
        const usbPrinters = this.printerService.getUSBPrinters();
        if (usbPrinters && Array.isArray(usbPrinters) && usbPrinters.length > 0) {
          this.printerProcess = 'USB';
          this.printersFound = usbPrinters;
        } else {
          this.message.sendMessage('USB portlarında takılı yazıcı bulunamadı..');
          return false;
        }
        break;
      case 'LAN':
        this.printerProcess = 'LAN';
        this.printersFound = [];
        this.selectedPrinter = {};
        break;
      case 'SERIAL':
        this.printerProcess = 'SERIAL';
        const serialPrinters = this.printerService.getSerialPrinters('/dev/ttyS0');
        this.printersFound = serialPrinters || [];
        this.selectedPrinter = {};
        break;
      case 'BLUETOOTH':
        this.printerProcess = 'BLUETOOTH';
        this.printersFound = [];
        this.selectedPrinter = {};
        break;
      default:
        break;
    }
  }

  printTest(Device: any) {
    this.printerService.printTest(Device);
  }

  makeAdmin(pass: any) {
    if (pass === 'asdtd155+1' || pass === "1551903") {
      this.router.navigate(['/admin']);
      this.electronService.openDevTools();
    } else {
      alert('Yanlış Şifre');
    }
    (window as any).$('#adminModal').modal('hide');
  }

  setDefault() {
    this.printerForm.reset();
    this.choosenPrinter = undefined!;
    this.printerProcess = undefined!;
    this.selectedPrinter = undefined!;
  }

  fillData() {
    this.settings.getPrinters().subscribe((res: any) => {
      if (res && res.value) {
        this.printers = res.value;
      } else {
        this.printers = [];
      }
    });
  }
}
