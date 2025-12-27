import { Component, OnInit, inject, signal, viewChild, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Printer } from '../../../core/models/settings.model';
import { ElectronService } from '../../../core/services/electron/electron.service';
import { MessageService } from '../../../core/services/message.service';
import { PrinterService } from '../../../core/services/printer.service';
import { SettingsService } from '../../../core/services/settings.service';
import { SignalValidatorService } from '../../../core/services/signal-validator.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-application-settings',
  templateUrl: './application-settings.component.html',
  styleUrls: ['./application-settings.component.scss'],
})
export class ApplicationSettingsComponent implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly printerService = inject(PrinterService);
  private readonly electronService = inject(ElectronService);
  private readonly message = inject(MessageService);
  private readonly validatorService = inject(SignalValidatorService);

  readonly restInfo = signal<any>(undefined);
  readonly restMap = signal<string | null>(null);
  readonly appSettings = signal<any>(undefined);
  readonly appLogo = signal<string>('');
  readonly printers = signal<Array<any>>([]);
  readonly printerProcess = signal<string | undefined>(undefined);
  readonly printersFound = signal<Array<any>>([]);
  readonly selectedPrinter = signal<any>(undefined);
  readonly choosenPrinter = signal<any>(undefined);
  readonly currentSection = signal<string>('AppSettings');

  // Server settings validation signals
  readonly serverUrl = signal<string>('');
  readonly serverPort = signal<number>(3000);
  readonly urlError = signal<string | null>(null);
  readonly portError = signal<string | null>(null);

  // Computed properties for reactive state
  readonly isPrinterSelected = computed(() => {
    const selected = this.selectedPrinter();
    return selected !== undefined && Object.keys(selected).length > 0;
  });

  readonly isAnyPrinterFound = computed(() => {
    return this.printersFound().length > 0;
  });

  readonly hasChosenPrinter = computed(() => {
    return this.choosenPrinter() !== undefined;
  });

  readonly currentSectionLabel = computed(() => {
    const section = this.currentSection();
    const labels: Record<string, string> = {
      'AppSettings': 'Uygulama Ayarları',
      'Restaurant': 'Restoran Bilgileri',
      'Server': 'Sunucu Ayarları',
      'Printers': 'Yazıcılar'
    };
    return labels[section] || section;
  });

  readonly canAddPrinter = computed(() => {
    const process = this.printerProcess();
    return process !== undefined && process !== null;
  });

  readonly isServerSettingsValid = computed(() => {
    return !this.urlError() && !this.portError();
  });

  // Form references using Signal-based viewChild API
  settingsForm = viewChild<NgForm>('settingsForm');
  appServerForm = viewChild<NgForm>('appServerForm');
  restaurantForm = viewChild<NgForm>('restaurantForm');
  printerForm = viewChild<NgForm>('printerForm');
  printerDetailForm = viewChild<NgForm>('printerDetailForm');
  serverSettingsForm = viewChild<NgForm>('serverSettingsForm');

  constructor() {
    this.fillData();
  }

  ngOnInit() {
    this.currentSection.set('AppSettings');

    // Set up reactive effect for AppSettings changes
    effect(() => {
      this.settings.AppSettings.subscribe((res: any) => {
        if (res && res.value) {
          this.appSettings.set(res.value);
          if (this.settingsForm() && res.value) {
            this.settingsForm()!.form.patchValue(res.value);
          }
        }
      });
    }, { allowSignalWrites: true });

    // Set up reactive effect for RestaurantInfo changes
    effect(() => {
      this.settings.RestaurantInfo.subscribe((res: any) => {
        if (res && res.value) {
          const info = { ...res.value };
          delete info.auth;
          delete info.remote;
          delete info.settings;
          this.restInfo.set(info);
          this.restMap.set(info.geolocation);
          this.appLogo.set(info.logo);
        }
      });
    }, { allowSignalWrites: true });

    // Set up reactive effect for ServerSettings changes
    effect(() => {
      this.settings.ServerSettings.subscribe((res: any) => {
        if (res && res.value && this.serverSettingsForm()) {
          this.serverSettingsForm()!.form.patchValue(res.value);
        }
      });
    }, { allowSignalWrites: true });

    // Set up reactive effect for Printers changes
    effect(() => {
      this.settings.getPrinters().subscribe((res: any) => {
        if (res && res.value) {
          this.printers.set(res.value);
        } else {
          this.printers.set([]);
        }
      });
    }, { allowSignalWrites: true });

    // Validate server URL
    effect(() => {
      const url = this.serverUrl();
      if (!url) {
        this.urlError.set('Sunucu URL Belirtmelisiniz');
      } else if (!this.isValidUrl(url)) {
        this.urlError.set('Geçersiz URL formatı (örn: http://localhost:3000)');
      } else {
        this.urlError.set(null);
      }
    });

    // Validate server port
    effect(() => {
      const port = this.serverPort();
      if (port < 1 || port > 65535) {
        this.portError.set('Port 1 ile 65535 arasında olmalıdır');
      } else {
        this.portError.set(null);
      }
    });
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getSettingsDetail(section: string) {
    this.currentSection.set(section);
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
    // Update validation signals from form
    this.serverUrl.set(Form.value.url || '');
    this.serverPort.set(Form.value.port || 3000);

    // Check if server settings are valid
    if (!this.isServerSettingsValid()) {
      this.message.sendMessage('Lütfen sunucu ayarlarını kontrol ediniz.');
      return false;
    }

    this.settings.setAppSettings('ServerSettings', Form.value);
    this.message.sendMessage('Sunucu Ayarları Kaydediliyor.. Makina Yeniden Başlatılıyor.');
    setTimeout(() => {
      this.electronService.ipcRenderer.send('closeServer');
      this.electronService.relaunchProgram();
    }, 1500)
  }

  generateKey(Form: NgForm) {
    const newKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    Form.form.patchValue({
      key: newKey,
      ip_address: this.electronService.getLocalIP()
    });
  }

  getPrinterDetail(printer: Printer) {
    this.choosenPrinter.set(printer);
    if (this.printerDetailForm()) {
      this.printerDetailForm()!.form.patchValue(printer);
    }
  }

  addPrinter(Form: NgForm) {
    const form = Form.value;
    let address;
    if (form.port_number == undefined) {
      if (this.selectedPrinter() && this.selectedPrinter().portNumbers && this.selectedPrinter().portNumbers.length > 0) {
        address = this.selectedPrinter().portNumbers[0];
      }
    }
    if (form.name) {
      if (this.printerProcess() == 'LAN') {
        if (form.port_number) {
          address = form.port_number;
        } else {
          this.message.sendMessage('IP Adresi Girmek Zorundasınız.');
          return false;
        }
      }
      const printer = new Printer(form.name, this.printerProcess()!, form.note, address, form.mission);
      const currentPrinters = this.printers();
      if (currentPrinters && Array.isArray(currentPrinters)) {
        const printersData = currentPrinters.filter(obj => obj.name == form.name);
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
    return true;
  }

  updatePrinter(Form: NgForm) {
    const form = Form.value;
    this.settings.updatePrinter(form, this.choosenPrinter());
    this.choosenPrinter.set(undefined);
    this.message.sendMessage('Yazıcı Düzenlendi.');
    this.fillData();
  }

  removePrinter(Printer: any) {
    this.settings.removePrinter(Printer);
    this.message.sendMessage('Yazıcı Kaldırıldı..');
    this.choosenPrinter.set(undefined);
    this.fillData();
  }

  getPrinters(Type: string) {
    switch (Type) {
      case 'USB':
        const usbPrinters = this.printerService.getUSBPrinters();
        if (usbPrinters && Array.isArray(usbPrinters) && usbPrinters.length > 0) {
          this.printerProcess.set('USB');
          this.printersFound.set(usbPrinters);
        } else {
          this.message.sendMessage('USB portlarında takılı yazıcı bulunamadı..');
          return false;
        }
        break;
      case 'LAN':
        this.printerProcess.set('LAN');
        this.printersFound.set([]);
        this.selectedPrinter.set({});
        break;
      case 'SERIAL':
        this.printerProcess.set('SERIAL');
        const serialPrinters = this.printerService.getSerialPrinters('/dev/ttyS0');
        this.printersFound.set(serialPrinters || []);
        this.selectedPrinter.set({});
        break;
      case 'BLUETOOTH':
        this.printerProcess.set('BLUETOOTH');
        this.printersFound.set([]);
        this.selectedPrinter.set({});
        break;
      default:
        break;
    }
    return true;
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
    if (this.printerForm()) this.printerForm()!.reset();
    this.choosenPrinter.set(undefined);
    this.printerProcess.set(undefined);
    this.selectedPrinter.set(undefined);
    // Clear server settings validation signals
    this.serverUrl.set('');
    this.serverPort.set(3000);
    this.urlError.set(null);
    this.portError.set(null);
  }

  fillData() {
    // Printers are now loaded via effect() in ngOnInit()
  }
}
