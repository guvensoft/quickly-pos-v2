import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from '../../mocks/user';
import { MessageService } from "../../providers/message.service";
import { AuthService } from "../../services/auth.service";
import { MainService } from '../../services/main.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  buttons!: Array<any>;
  pinInput: any;
  message!: string | null;
  user!: User;
  docs: any;
  fastSelling: boolean = false;

  constructor(private mainService: MainService, private messageService: MessageService, private authService: AuthService, private router: Router, private settingsService: SettingsService) { }

  ngOnInit() {
    this.authService.logout();
    this.buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    this.pinInput = '';
    this.settingsService.AppSettings.subscribe(res => {
      if (res) {
        if (res.value.takeaway == 'Açık') {
          this.fastSelling = true;
        } else {
          this.fastSelling = false;
        }
      }
    });
  }

  logIn() {
    this.message = "İşleniyor";
    this.mainService.getAllBy('users', { pincode: { $eq: this.pinInput } }).then((result) => {
      if (result.docs && result.docs.length > 0) {
        this.user = result.docs[0];
        if (this.user) {
          this.authService.login(this.user);
          // Wait for permissions to be fetched and saved to localStorage
          this.authService.setPermissions().then(() => {
            this.messageService.sendMessage("Hoşgeldiniz " + this.user.name);
            if (this.fastSelling) {
              this.router.navigate(['/selling-screen', 'Fast', 'New']);
            } else {
              this.router.navigate(['/store']);
            }
            this.clearDigits();
          });
        }
      } else {
        this.message = "Hatalı giriş yaptınız.";
        this.clearDigits();
      }
    });
  }

  clearDigits() {
    this.pinInput = '';
    setTimeout(() => {
      this.message = '';
    }, 750)
  }

  onClick(digit: number) {
    this.message = null;
    this.pinInput = this.pinInput + '' + digit + '';
    if (this.pinInput.length == 4) {
      this.pinInput = parseInt(this.pinInput);
      this.logIn();
    }
  }
}