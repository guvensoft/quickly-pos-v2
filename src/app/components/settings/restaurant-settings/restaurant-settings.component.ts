import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Report } from '../../../core/models/report.model';
import { Floor, FloorSpecs, Table } from '../../../core/models/table.model';
import { MessageService } from '../../../core/services/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, GeneralPipe],
  selector: 'app-restaurant-settings',
  templateUrl: './restaurant-settings.component.html',
  styleUrls: ['./restaurant-settings.component.scss']
})

export class RestaurantSettingsComponent implements OnInit {
  floors!: Array<Floor>;
  tables!: Array<Table>;
  onUpdate!: boolean;
  selectedTable!: string | undefined;
  selectedFloor!: string | undefined;
  @ViewChild('areaForm') areaForm!: NgForm;
  @ViewChild('areaDetailForm') areaDetailForm!: NgForm;
  @ViewChild('tableForm') tableForm!: NgForm;

  constructor(private mainService: MainService, private messageService: MessageService, private logService: LogService) {
    this.onUpdate = false;
    this.fillData();
  }

  ngOnInit() {

  }

  setDefault() {
    this.onUpdate = false;
    this.selectedTable = undefined;
    this.selectedFloor = undefined;
    this.areaForm.reset();
    this.tableForm.reset();
  }

  getTablesByFloor(id: string | null | undefined) {
    if (id) {
      this.mainService.getAllBy('tables', { floor_id: id }).then(result => {
        this.tables = result.docs as any;
        this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name));
      });
    } else {
      this.mainService.getAllBy('tables', {}).then(result => {
        this.tables = result.docs as any;
        this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name));
      });
    }
  }

  getFloor(floor: any) {
    this.selectedFloor = floor._id;
    floor = Object.assign(floor, floor.conditions);
    delete floor.conditions;
    this.areaDetailForm.setValue(floor);
  }

  addFloor(areaForm: NgForm) {
    const form = areaForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Bölüm Adı Belirtmelisiniz');
      return false;
    }
    const areaSpecs = new FloorSpecs(form.air, form.cigarate, form.reservation, form.music, form.events);
    const schema = new Floor(form.name, form.description, 1, Date.now(), form.special, areaSpecs);
    this.mainService.addData('floors', schema).then(() => {
      this.fillData();
      this.messageService.sendMessage('Bölüm Oluşturuldu!');
      areaForm.reset();
    });
    (window as any).$('#areaModal').modal('hide');
  }

  updateFloor(areaDetailForm: NgForm) {
    const form = areaDetailForm.value;
    const schema = new Floor(form.name, form.description, 1, Date.now(), form.special, new FloorSpecs(form.air, form.cigarate, form.reservation, form.music, form.events), form._id, form._rev);
    this.mainService.updateData('floors', form._id, schema).then(res => {
      this.selectedFloor = undefined;
      this.fillData();
      this.messageService.sendMessage('Bölüm Güncellendi!');
    });
  }

  removeFloor() {
    const isOk = confirm('Bölümü Silmek Üzeresiniz. Bölüme Dahil Olan Masalarda Silinecektir.');
    if (isOk) {
      this.mainService.removeData('floors', this.selectedFloor!).then(() => {
        this.mainService.getAllBy('tables', { floor_id: this.selectedFloor! }).then(result => {
          const data = result.docs
          for (const prop in data) {
            this.mainService.removeData('tables', data[prop]._id).then(result => {
              this.mainService.getAllBy('reports', { connection_id: result.id }).then((res) => {
                if (res.docs.length > 0)
                  this.mainService.removeData('reports', res.docs[0]._id);
              });
            });
          }
          this.messageService.sendMessage('Bölüm ve Masalar Silindi!')
          this.selectedFloor = undefined;
          this.fillData();
        });
      });
    }
  }

  addTable(tableForm: NgForm) {
    const form = tableForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Masa Adı Belirtmelisiniz');
      return false;
    } else if (!form.floor_id) {
      this.messageService.sendMessage('Kategori Seçmelisiniz');
      return false;
    }
    const schema = new Table(form.name, form.floor_id, form.capacity, form.description, 1, Date.now(), [], form._id, form._rev);
    if (form._id == undefined) {
      this.mainService.addData('tables', schema).then((response) => {
        this.mainService.addData('reports', new Report('Table', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), form.name, Date.now())).then(res => {
          this.logService.createLog(logType.TABLE_CREATED, res.id, `${form.name} adlı Masa oluşturuldu.`);
        });
        this.fillData();
        this.messageService.sendMessage('Masa Oluşturuldu.');
        tableForm.reset();
      })
    } else {
      this.mainService.updateData('tables', form._id, schema).then(() => {
        this.logService.createLog(logType.TABLE_UPDATED, form._id, `${this.tableForm.value.name} adlı Masa Güncellendi.`);
        this.fillData();
        this.messageService.sendMessage('Masa Güncellendi.');
        tableForm.reset();
      });
    }
    (window as any).$('#tableModal').modal('hide');
  }

  updateTable(id: string | undefined) {
    this.onUpdate = true;
    this.selectedTable = id;
    this.mainService.getData('tables', id!).then((result: Table) => {
      delete (result as any).customers;
      this.tableForm.setValue(result);
      (window as any).$('#tableModal').modal('show');
    });
  }

  removeTable() {
    const isOk = confirm('Masayı Silmek Üzeresiniz!');
    if (isOk) {
      this.mainService.removeData('tables', this.selectedTable!).then((result) => {
        this.logService.createLog(logType.TABLE_DELETED, result.id, `${this.tableForm.value.name} adlı Masa Silindi.`);
        this.mainService.getAllBy('reports', { connection_id: result.id }).then((res) => {
          if (res.docs.length > 0 && res.docs[0]._id)
            this.mainService.removeData('reports', res.docs[0]._id);
        });
        this.fillData();
        this.messageService.sendMessage('Masa Silindi.');
        (window as any).$('#tableModal').modal('hide');
      });
    } else {
      return false;
    }
  }

  filterTables(value: string) {
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('tables', { name: { $regex: regexp } }).then(res => {
      this.tables = res.docs as any;
      this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  fillData() {
    this.mainService.getAllBy('floors', {}).then((result) => {
      this.floors = result.docs as any;
      this.floors = this.floors.sort((a, b) => a.timestamp - b.timestamp);
    });
    this.mainService.getAllBy('tables', {}).then((result) => {
      this.tables = result.docs as any;
      this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name));
    });
  }
}