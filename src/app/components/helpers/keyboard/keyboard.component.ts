import { Component, OnInit, inject, signal, computed, effect, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss'],
})

export class KeyboardComponent implements OnInit {
  private readonly keyboardService = inject(KeyboardService);
  private readonly settings = inject(SettingsService);

  // Keyboard layout configuration (initialized in constructor)
  private readonly keyboardLayout = [
    [["1", "!"], ["2", "@"], ["3", "#"], ["4", "$"], ["5", "%"], ["6", "¨"], ["7", "&"], ["8", "*"], ["9", "("], ["0", ")"], ["*", "?"], ["-", "_"], ["◂", "◂"]],
    [["q", "Q"], ["w", "W"], ["e", "E"], ["r", "R"], ["t", "T"], ["y", "Y"], ["u", "U"], ["ı", "I"], ["o", "O"], ["p", "P"], ["ğ", "Ğ"], ["ü", "Ü"], ["▴", "▴"]],
    [["a", "A"], ["s", "S"], ["d", "D"], ["f", "F"], ["g", "G"], ["h", "H"], ["j", "J"], ["k", "K"], ["l", "L"], ["ş", "Ş"], ["i", "İ"], [",", ";"], ["▾", "▾"]],
    [["\\", "|"], ["z", "Z"], ["x", "X"], ["c", "C"], ["v", "V"], ["b", "B"], ["n", "N"], ["m", "M"], ["ö", "Ö"], ["ç", "Ç"], [".", ":"], ["/", "/"], ["✔", "✔"]],
    [[" ", " "]]
  ];

  private readonly numboardLayout = [
    [[1], [2], [3]],
    [[4], [5], [6]],
    [[7], [8], [9]],
    [["."], [0], ["◂"]],
    [["✔"]]
  ];

  // Signal properties
  readonly keytype = signal<Array<any>>(this.keyboardLayout);
  readonly keyIndex = signal<number>(0);
  readonly selectedInput = signal<ElementRef | undefined>(undefined);
  readonly onAir = signal<boolean>(false);
  readonly onNumb = signal<boolean>(false);
  readonly keyboardInput = signal<string>("");
  readonly inputType = signal<string>("");
  readonly keyboardStatus = signal<boolean>(false);
  readonly placeholder = signal<string>("");

  // Computed properties for each key row
  readonly keyRow0 = computed(() => this.keytype()?.[0] ?? []);
  readonly keyRow1 = computed(() => this.keytype()?.[1] ?? []);
  readonly keyRow2 = computed(() => this.keytype()?.[2] ?? []);
  readonly keyRow3 = computed(() => this.keytype()?.[3] ?? []);
  readonly keyRow4 = computed(() => this.keytype()?.[4] ?? []);

  ngOnInit() {
    // Set up reactive effect for AppSettings changes
    effect(() => {
      this.settings.AppSettings.subscribe(res => {
        if (res) {
          this.keyboardStatus.set(res.value.keyboard === 'Açık');
        } else {
          this.keyboardStatus.set(false);
        }
      });
    }, { allowSignalWrites: true });

    // Set up reactive effect for keyboard input changes
    effect(() => {
      this.keyboardService.listenInput().subscribe(element => {
        this.selectedInput.set(element);
        const nativeElement = element.nativeElement;
        this.inputType.set(nativeElement.type);
        this.keyboardInput.set(nativeElement.value);
        this.placeholder.set(nativeElement.placeholder);

        switch (nativeElement.type) {
          case "text":
            this.keytype.set(this.keyboardLayout);
            this.onNumb.set(false);
            break;
          case "number":
            this.keytype.set(this.numboardLayout);
            this.onNumb.set(true);
            break;
          case "password":
            this.keytype.set(this.numboardLayout);
            this.onNumb.set(true);
            break;
          default:
            this.keytype.set(this.keyboardLayout);
            this.onNumb.set(false);
            break;
        }
      });
    }, { allowSignalWrites: true });

    // Set up reactive effect for keyboard open/close signals
    effect(() => {
      this.keyboardService.listenKeyboard().subscribe(signal => {
        if (signal === "Open") {
          this.onAir.set(true);
        } else if (signal === "Close") {
          this.onAir.set(false);
        }
      });
    }, { allowSignalWrites: true });
  }

  pushKey(key: string) {
    const currentInput = this.selectedInput();
    if (!currentInput) return;

    switch (key) {
      case "▴":
        this.keyIndex.set(1);
        break;
      case "▾":
        this.keyIndex.set(0);
        break;
      case "◂":
        this.keyboardInput.set(this.keyboardInput().slice(0, -1));
        break;
      case "✔":
        this.closeKeyboard();
        break;
      default:
        if (this.inputType() === "number") {
          currentInput.nativeElement.type = "text";
          this.keyboardInput.set(this.keyboardInput() + key);
        } else {
          this.keyboardInput.set(this.keyboardInput() + key);
        }
        break;
    }

    const nativeElement = currentInput.nativeElement;
    nativeElement.value = this.keyboardInput();
    nativeElement.dispatchEvent(new Event('keyup'));
    nativeElement.dispatchEvent(new Event('input'));
    nativeElement.dispatchEvent(new Event('keydown'));
  }

  closeKeyboard() {
    this.keyboardInput.set("");
    this.keyIndex.set(0);
    const currentInput = this.selectedInput();
    if (currentInput && this.onNumb()) {
      currentInput.nativeElement.type = 'number';
    }
    if (currentInput) {
      this.keyboardService.triggerKeyboard('Close', currentInput);
    }
  }

}
