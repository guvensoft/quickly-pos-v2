import { Component, OnInit, inject, signal, viewChild, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Report } from '../../../core/models/report.model';
import { Floor, FloorSpecs, Table } from '../../../core/models/table.model';
import { MessageService } from '../../../core/services/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { DialogFacade } from '../../../../core/services/dialog.facade';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, GeneralPipe],
  selector: 'app-restaurant-settings',
  templateUrl: './restaurant-settings.component.html',
  styleUrls: ['./restaurant-settings.component.scss']
})
export class RestaurantSettingsComponent implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly messageService = inject(MessageService);
  private readonly logService = inject(LogService);
  private readonly dialogFacade = inject(DialogFacade);

  readonly floors = signal<Array<Floor>>([]);
  readonly tables = signal<Array<Table>>([]);
  readonly onUpdate = signal<boolean>(false);
  readonly selectedTable = signal<string | undefined>(undefined);
  readonly selectedFloor = signal<string | undefined>(undefined);

  // Input to trigger component recreation when parent selection changes
  readonly key = input<number | undefined>(undefined);

  areaForm = viewChild<NgForm>('areaForm');
  areaDetailForm = viewChild<NgForm>('areaDetailForm');
  tableForm = viewChild<NgForm>('tableForm');

  // Computed properties for reactive filtering and lookups
  readonly tablesByFloor = computed(() => {
    const floorId = this.selectedFloor();
    if (!floorId) return this.tables();
    return this.tables()
      .filter(t => t.floor_id === floorId)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly selectedFloorObj = computed(() => {
    const floorId = this.selectedFloor();
    if (!floorId) return undefined;
    return this.floors().find(f => f._id === floorId);
  });

  readonly selectedTableObj = computed(() => {
    const tableId = this.selectedTable();
    if (!tableId) return undefined;
    return this.tables().find(t => t._id === tableId);
  });

  readonly floorStats = computed(() => {
    return this.floors().map(floor => ({
      floorId: floor._id,
      name: floor.name,
      tableCount: this.tables().filter(t => t.floor_id === floor._id).length
    }));
  });

  readonly isUpdatingFloor = computed(() => {
    return this.onUpdate() && this.selectedFloor() !== undefined;
  });

  readonly isUpdatingTable = computed(() => {
    return this.onUpdate() && this.selectedTable() !== undefined;
  });

  constructor() {
    this.fillData();
  }

  ngOnInit() {
  }

  setDefaultFloor() {
    this.onUpdate.set(false);
    this.selectedFloor.set(undefined);
    if (this.areaForm()) {
      this.areaForm()!.reset();
    }

    this.dialogFacade.openFloorModal().closed.subscribe((formData: any) => {
      if (formData) {
        this.submitFloorForm(formData, null);
      }
    });
  }

  getTablesByFloor(id: string | null | undefined) {
    if (id) {
      this.mainService.getAllBy('tables', { floor_id: id }).then(result => {
        if (result && result.docs) {
          const sorted = (result.docs as any).sort((a: any, b: any) => a.name.localeCompare(b.name));
          this.tables.set(sorted);
        } else {
          this.tables.set([]);
        }
      });
    } else {
      this.mainService.getAllBy('tables', {}).then(result => {
        if (result && result.docs) {
          const sorted = (result.docs as any).sort((a: any, b: any) => a.name.localeCompare(b.name));
          this.tables.set(sorted);
        } else {
          this.tables.set([]);
        }
      });
    }
  }

  getFloor(floor: any) {
    this.selectedFloor.set(floor._id);
    const floorData = { ...floor, ...floor.conditions };
    delete floorData.conditions;
    if (this.areaDetailForm()) {
      this.areaDetailForm()!.form.patchValue(floorData);
    }
  }

  private submitFloorForm(formData: any, floorId: string | null) {
    if (!formData.name) {
      this.messageService.sendMessage('Bölüm Adı Belirtmelisiniz');
      return;
    }

    if (floorId === null) {
      // Add new floor
      const areaSpecs = new FloorSpecs(formData.air, formData.cigarate, formData.reservation, formData.music, formData.events);
      const schema = new Floor(formData.name, formData.description, 1, Date.now(), formData.special, areaSpecs);
      this.mainService.addData('floors', schema as any).then(() => {
        this.fillData();
        this.messageService.sendMessage('Bölüm Oluşturuldu!');
      });
    }
  }

  updateFloor(areaDetailForm: NgForm) {
    const form = areaDetailForm.value;
    const schema = new Floor(form.name, form.description, 1, Date.now(), form.special, new FloorSpecs(form.air, form.cigarate, form.reservation, form.music, form.events), form._id, form._rev);
    this.mainService.updateData('floors', form._id, schema).then(res => {
      this.selectedFloor.set(undefined);
      this.fillData();
      this.messageService.sendMessage('Bölüm Güncellendi!');
    });
  }

  removeFloor() {
    const isOk = confirm('Bölümü Silmek Üzeresiniz. Bölüme Dahil Olan Masalarda Silinecektir.');
    const currentFloorId = this.selectedFloor();
    if (isOk && currentFloorId) {
      this.mainService.removeData('floors', currentFloorId).then(() => {
        this.mainService.getAllBy('tables', { floor_id: currentFloorId }).then(result => {
          if (result && result.docs && result.docs.length > 0) {
            const data = result.docs;
            data.forEach((table: any) => {
              if (table._id) {
                this.mainService.removeData('tables', table._id).then(res => {
                  if (res && res.id) {
                    this.mainService.getAllBy('reports', { connection_id: res.id }).then((reportRes) => {
                      if (reportRes && reportRes.docs && reportRes.docs.length > 0 && reportRes.docs[0]._id) {
                        this.mainService.removeData('reports', reportRes.docs[0]._id);
                      }
                    });
                  }
                });
              }
            });
          }
        });
        this.messageService.sendMessage('Bölüm ve Masalar Silindi!')
        this.selectedFloor.set(undefined);
        this.fillData();
      });
    }
  }

  setDefaultTable() {
    this.onUpdate.set(false);
    this.selectedTable.set(undefined);
    if (this.tableForm()) {
      this.tableForm()!.reset();
    }

    // Open table modal for adding new table
    const currentFloors = this.floors();
    this.dialogFacade.openTableModal(undefined, currentFloors).closed.subscribe((formData: any) => {
      if (formData) {
        this.submitTableForm(formData, null);
      }
    });
  }

  updateTable(id: string | undefined) {
    if (!id) return;

    // Fetch table data and open modal for editing
    this.mainService.getData('tables', id).then((tableData: any) => {
      // Remove customers array from data to avoid passing unnecessary data
      const cleanData = { ...tableData };
      delete cleanData.customers;

      const currentFloors = this.floors();
      this.dialogFacade.openTableModal(cleanData, currentFloors).closed.subscribe((formData: any) => {
        if (formData) {
          this.submitTableForm(formData, id);
        }
      });
    });
  }

  private submitTableForm(formData: any, tableId: string | null) {
    if (!formData.name) {
      this.messageService.sendMessage('Masa Adı Belirtmelisiniz');
      return;
    } else if (!formData.floor_id) {
      this.messageService.sendMessage('Bölüm Seçmelisiniz');
      return;
    }

    const schema = new Table(formData.name, formData.floor_id, formData.capacity, formData.description, 1, Date.now(), [], formData._id, formData._rev);

    if (tableId === null) {
      // Add new table
      this.mainService.addData('tables', schema).then((response) => {
        if (response && response.id) {
          this.mainService.addData('reports', new Report('Table', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), formData.name, Date.now())).then(res => {
            if (res && res.id) {
              this.logService.createLog(logType.TABLE_CREATED, res.id, `${formData.name} adlı Masa oluşturuldu.`);
            }
          });
        }
        this.fillData();
        this.messageService.sendMessage('Masa Oluşturuldu.');
      });
    } else {
      // Update existing table
      this.mainService.updateData('tables', tableId, schema).then(() => {
        this.logService.createLog(logType.TABLE_UPDATED, tableId, `${formData.name} adlı Masa Güncellendi.`);
        this.fillData();
        this.messageService.sendMessage('Masa Güncellendi.');
      });
    }
  }

  removeTable() {
    const isOk = confirm('Masayı Silmek Üzeresiniz!');
    const currentTableId = this.selectedTable();
    if (isOk && currentTableId) {
      this.mainService.removeData('tables', currentTableId).then((result) => {
        if (result && result.id) {
          const tableObj = this.selectedTableObj();
          const tableName = tableObj ? tableObj.name : 'Masa';
          this.logService.createLog(logType.TABLE_DELETED, result.id, `${tableName} adlı Masa Silindi.`);
          this.mainService.getAllBy('reports', { connection_id: result.id }).then((res) => {
            if (res && res.docs && res.docs.length > 0 && res.docs[0]._id) {
              this.mainService.removeData('reports', res.docs[0]._id);
            }
          });
        }
        this.fillData();
        this.messageService.sendMessage('Masa Silindi.');
      });
    }
  }

  filterTables(value: string) {
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('tables', { name: { $regex: regexp } }).then(res => {
      if (res && res.docs) {
        const sorted = (res.docs as any).sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.tables.set(sorted);
      } else {
        this.tables.set([]);
      }
    });
  }

  fillData() {
    this.mainService.getAllBy('floors', {}).then((result) => {
      if (result && result.docs) {
        const sorted = (result.docs as any).sort((a: any, b: any) => a.timestamp - b.timestamp);
        this.floors.set(sorted);
      } else {
        this.floors.set([]);
      }
    });
    this.mainService.getAllBy('tables', {}).then((result) => {
      if (result && result.docs) {
        const sorted = (result.docs as any).sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.tables.set(sorted);
      } else {
        this.tables.set([]);
      }
    });
  }
}