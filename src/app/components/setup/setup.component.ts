import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgForm } from '@angular/forms'
import { Router } from '@angular/router'
import { MainService } from '../../core/services/main.service';
import { SettingsService } from '../../core/services/settings.service';
import { ElectronService } from '../../core/services/electron/electron.service';
import { MessageService } from '../../core/services/message.service';
import { Settings, AuthInfo } from '../../core/models/settings.model';
import { Report, Activity } from '../../core/models/report.model';
import { UserGroup, User, UserAuth, ComponentsAuth } from '../../core/models/user.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss'],
})

export class SetupComponent implements OnInit {
  progress!: string;
  stores!: Array<any>;
  status: number = 0;
  statusMessage!: string;
  showMessage: boolean = false;
  setupStep: number = 0;
  headers: HttpHeaders;
  options: any;
  baseUrl: string;

  constructor(private mainService: MainService, private settingsService: SettingsService, private http: HttpClient, private electron: ElectronService, private message: MessageService, private router: Router) {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json', 'charset': 'UTF-8' });
    this.options = { headers: this.headers };
    this.baseUrl = 'https://hq.quickly.com.tr';
  }

  ngOnInit() {
    if (!navigator.onLine) {
      alert('İnternet Bağlantınızı Kontol Edin...');
      setTimeout(() => {
        this.electron.reloadProgram();
      }, 5000)
    }
    this.settingsService.ActivationStatus.subscribe(res => {
      if (res) {
        this.router.navigate(['']);
      }
    })
  }

  getConfigrations(connectionForm: NgForm) {
    const Form = connectionForm.value;
    const serverSettings = new Settings('ServerSettings', { type: 1, status: 1, ip_address: Form.address, ip_port: parseInt(Form.port), key: Form.key }, 'Sunucu Ayarları', Date.now());
    localStorage.setItem('AppType', 'Secondary');
    this.electron.openDevTools();
    this.mainService.replicateDB(serverSettings.value)

      .on('active', () => {
        this.progressBar(5);
      })
      .on('denied', (ass: any) => {
        console.log(ass, 'denied')
      })
      .on('error', (err: any) => {
        console.log(err)
        this.mainService.syncToLocal().then(res => {
          this.getConfigrations(connectionForm);
        });
      })
      .on('change', (sync: any) => {
        this.statusMessage = `${sync.docs_written} - Senkronize Ediliyor `;
      })
      .on('complete', (info: any) => {
        this.mainService.addData('settings', serverSettings);
        this.mainService.syncToLocal().then(res => {
          if (res) {
            this.statusMessage = 'Kurulum Tamamlandı !'
            setTimeout(() => {
              this.electron.relaunchProgram();
            }, 30000)
          }
        });
      }).catch((err: any) => {
        // connectionForm.reset();
        // this.message.sendMessage('Sunucuya Bağlanılamıyor.');
        console.log(err)
        this.mainService.syncToLocal().then(res => {
          this.getConfigrations(connectionForm);
        });
      });
  }

  makeLogin(loginForm: NgForm) {
    const Form = loginForm.value;
    this.http.post(this.baseUrl + '/store/login/', { username: Form.username, password: Form.password }, this.options).subscribe((res: any) => {
      localStorage.setItem('AccessToken', res.token);
      this.headers = this.headers.append('Authorization', res.token);
      this.http.get(this.baseUrl + '/store/list/', { headers: this.headers }).subscribe((body: any) => {
        this.message.sendMessage('Giriş Başarılı!');
        // Angular 21 HttpClient returns parsed JSON by default
        let data = body;
        if (typeof body.json === 'function') {
          data = body.json();
        }

        if (data.length > 1) {
          this.stores = data;
          this.setupStep = 2;
        } else {
          this.makeAuth(data[0]);
        }
      }, (err: any) => {
        this.message.sendMessage('Giriş Başarısız!');
      });
    }, (err: any) => {
      let response = err._body
      response = JSON.parse(response)
      if (response.non_field_errors) {
        this.message.sendMessage(response.non_field_errors)
      }
      else {
        this.message.sendMessage("Geçerli bir kullanıcı adı ve şifre giriniz.");
      }
    });
  }

  makeAuth(Data: any) {
    this.electron.saveLogo(Data.logo);
    const activationStatus = new Settings('ActivationStatus', true, Data.auth.database_name, Date.now());
    const dateSettings = new Settings('DateSettings', { started: true, day: new Date().getDay(), time: Date.now() }, 'Tarih-Zaman Ayarları', Date.now());
    const authInfo = new Settings('AuthInfo', new AuthInfo('31.210.51.22', '5984', Data.auth.database_name, Data.auth.database_user, Data.auth.database_password), 'Giriş Bilgileri Oluşturuldu', Date.now());
    const restaurantInfo = new Settings('RestaurantInfo', Data, 'Restoran Bilgileri', Date.now());
    const appSettings = new Settings('AppSettings', { timeout: 120, keyboard: 'Kapalı', takeaway: 'Açık', ask_print_order: 'Sor', ask_print_check: 'Sor', last_day: 0 }, 'Uygulama Ayarları', Date.now());
    const serverSettings = new Settings('ServerSettings', { type: 0, status: 0, ip_address: this.electron.getLocalIP(), ip_port: 3000, key: Data.auth.database_id }, 'Sunucu Ayarları', Date.now());
    const printerSettings = new Settings('Printers', [], 'Yazıcılar', Date.now());
    // let lastSeenSettings = new Settings('LastSeen', { last_seen: new Date().toLocaleString('tr-TR'), user: 'Setup' }, 'Son Görülme', Date.now());
    localStorage.setItem('AppType', 'Primary');
    this.mainService.addData('settings', restaurantInfo);
    this.mainService.addData('settings', authInfo);
    this.mainService.addData('settings', appSettings);
    this.mainService.addData('settings', printerSettings);
    this.mainService.addData('settings', serverSettings);
    // this.mainService.addData('settings', Object.assign({ _id: 'lastseen' }, lastSeenSettings));
    this.mainService.addData('settings', dateSettings);
    this.mainService.addData('settings', activationStatus).then((result) => {
      this.progressBar(3);
    });
    this.progressBar(3);
  }

  makeAdmin(adminForm: NgForm) {
    const Form = adminForm.value;
    const userAuth = new UserAuth(new ComponentsAuth(true, true, true, true, true), true, true, true, true, true);
    this.mainService.addData('users_group', new UserGroup('Yönetici', 'Yönetici Grubu', userAuth, 1, Date.now()) as any).then(res => {
      this.mainService.addData('users', new User(Form.admin_name, 'Yönetici', res.id, parseInt(Form.admin_pass), 1, Date.now()) as any).then((user) => {
        this.mainService.addData('reports', new Report('User', user.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), (user as any).name, Date.now()) as any);
        localStorage.setItem('userName', Form.admin_name);
        localStorage.setItem('userType', 'Yönetici');
        localStorage.setItem('userAuth', res.id);
      });
    }).then(() => {
      this.mainService.addData('reports', new Report('Store', 'Nakit', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'Nakit Satış Raporu', Date.now()) as any);
      this.mainService.addData('reports', new Report('Store', 'Kart', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'Kart Satış Raporu', Date.now()) as any);
      this.mainService.addData('reports', new Report('Store', 'Kupon', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'Kupon Satış Raporu', Date.now()) as any);
      this.mainService.addData('reports', new Report('Store', 'İkram', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'İkram Satış Raporu', Date.now()) as any);
      this.mainService.addData('reports', new Activity('Activity', 'Selling', [0], ['GB'], [0]) as any);
      this.message.sendMessage('Program Yeniden Başlatıyor..');
      setTimeout(() => {
        // Fallback to window.location.reload() for web/dev environment
        if (this.electron.isElectron()) {
          this.electron.reloadProgram();
        } else {
          window.location.reload();
        }
      }, 3000)
    });
  }

  progressBar(step: number) {
    this.statusMessage = 'Program Ayarlanıyor...';
    this.setupStep = 5;
    const stat = setInterval(() => {
      this.progress = this.status + '%';
      this.status++;
      this.showMessage = true;
      if (this.status == 25) {
        this.statusMessage = 'Bilgiler Kontrol Ediliyor...';
        this.showMessage = false;
      }
      if (this.status == 50) {
        this.statusMessage = 'Yapılandırma Yapılıyor...';
        this.showMessage = true;
      }
      if (this.status == 75) {
        this.statusMessage = 'Yapılandırma Kontrol Ediliyor...';
        this.showMessage = true;
      }
      if (this.status == 101) {
        clearInterval(stat);
        this.statusMessage = 'Kurulum Tamamlanıyor...';
        this.showMessage = true;
        this.setupStep = step;
        this.progress = '100%';
      }
    }, 200);
  }
}