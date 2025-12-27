import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from '../../core/models/user.model';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { MainService } from '../../core/services/main.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);

  readonly buttons = signal<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  readonly pinInput = signal<string>('');
  readonly message = signal<string | null>(null);
  readonly user = signal<User | undefined>(undefined);
  readonly fastSelling = signal<boolean>(false);

  ngOnInit() {
    this.authService.logout();
    this.pinInput.set('');
    this.settingsService.AppSettings.subscribe(res => {
      if (res) {
        this.fastSelling.set(res.value.takeaway === 'Açık');
      }
    });
  }

  logIn() {
    this.message.set("İşleniyor");
    this.mainService.getAllBy('users', { pincode: { $eq: this.pinInput() } }).then((result) => {
      if (result.docs && result.docs.length > 0) {
        const loggedInUser = result.docs[0];
        this.user.set(loggedInUser);
        if (loggedInUser) {
          this.authService.login(loggedInUser);
          this.authService.setPermissions().then(() => {
            this.messageService.sendMessage("Hoşgeldiniz " + loggedInUser.name);
            if (this.fastSelling()) {
              this.router.navigate(['/selling-screen', 'Fast', 'New']);
            } else {
              this.router.navigate(['/store']);
            }
            this.clearDigits();
          });
        }
      } else {
        this.message.set("Hatalı giriş yaptınız.");
        this.clearDigits();
      }
    });
  }

  clearDigits() {
    this.pinInput.set('');
    setTimeout(() => {
      this.message.set(null);
    }, 750)
  }

  onClick(digit: number) {
    this.message.set(null);
    this.pinInput.update(v => v + digit.toString());
    if (this.pinInput().length == 4) {
      this.logIn();
    }
  }
}