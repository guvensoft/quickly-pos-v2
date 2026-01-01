import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CashboxCategory, CashboxCategoryType } from '../../../core/models/cashbox.model';
import { MessageService } from '../../../core/services/message.service';
import { SettingsService } from '../../../core/services/settings.service';

type CategoryFilter = 'Tümü' | CashboxCategoryType;

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-cashbox-settings',
  templateUrl: './cashbox-settings.component.html',
  styleUrls: ['./cashbox-settings.component.scss']
})
export class CashboxSettingsComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly messageService = inject(MessageService);

  readonly key = input<number | undefined>(undefined);

  readonly categories = signal<CashboxCategory[]>([]);
  readonly selected = signal<CashboxCategory | null>(null);
  readonly filter = signal<CategoryFilter>('Tümü');
  readonly onUpdate = computed(() => this.selected() !== null);

  readonly name = signal<string>('');
  readonly type = signal<CashboxCategoryType>('Gelir');

  readonly filteredCategories = computed(() => {
    const filter = this.filter();
    const categories = this.categories();
    if (filter === 'Tümü') return categories;
    return categories.filter(c => c.type === filter);
  });

  readonly canSubmit = computed(() => {
    return !!this.name().trim();
  });

  categoryForm = viewChild<NgForm>('categoryForm');

  constructor() {
    this.settingsService.getCashboxCategories()
      .pipe(takeUntilDestroyed())
      .subscribe(res => {
        const next = (res?.value ?? []) as CashboxCategory[];
        this.categories.set(next);
        const selected = this.selected();
        if (selected) {
          const refreshed = next.find(c => c.id === selected.id) ?? null;
          this.selected.set(refreshed);
        }
      });
  }

  setDefault(): void {
    this.selected.set(null);
    this.name.set('');
    this.type.set('Gelir');
    this.categoryForm()?.resetForm();
  }

  selectCategory(category: CashboxCategory): void {
    this.selected.set(category);
    this.name.set(category.name);
    this.type.set(category.type);
    this.categoryForm()?.form.patchValue({ name: category.name, type: category.type });
  }

  save(form: NgForm): void {
    const rawName = (form.value?.name as string | undefined) ?? this.name();
    const name = rawName.trim();
    const type = (form.value?.type as CashboxCategoryType | undefined) ?? this.type();

    if (!name) {
      this.messageService.sendMessage('Kategori adı belirtmelisiniz', 'warning');
      return;
    }

    const existing = this.selected();
    if (existing) {
      this.settingsService.updateCashboxCategory(new CashboxCategory(existing.id, name, type));
      this.messageService.sendMessage('Kategori güncellendi');
    } else {
      const id = this.createId();
      this.settingsService.addCashboxCategory(new CashboxCategory(id, name, type));
      this.messageService.sendMessage('Kategori eklendi');
    }

    this.setDefault();
  }

  async confirmDelete(): Promise<void> {
    const selected = this.selected();
    if (!selected) return;

    const ok = await this.messageService.sendConfirm('Kategoriyi silmek üzeresiniz. Bu işlem geri alınamaz.');
    if (!ok) return;

    this.settingsService.removeCashboxCategory(selected.id);
    this.messageService.sendMessage('Kategori silindi');
    this.setDefault();
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

