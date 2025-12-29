import { Component, OnInit, inject, signal, viewChild, computed, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Report } from '../../../core/models/report.model';
import { ComponentsAuth, User, UserAuth, UserGroup } from '../../../core/models/user.model';
import { MessageService } from '../../../core/services/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { DialogFacade } from '../../../../core/services/dialog.facade';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, GeneralPipe],
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly messageService = inject(MessageService);
  private readonly logService = inject(LogService);
  private readonly dialogFacade = inject(DialogFacade);

  readonly users = signal<Array<User>>([]);
  readonly groups = signal<Array<UserGroup>>([]);
  readonly selectedGroup = signal<string | undefined>(undefined);
  readonly selectedUser = signal<string | undefined>(undefined);
  readonly onUpdate = signal<boolean>(false);

  // Input to trigger component recreation when parent selection changes
  readonly key = input<number | undefined>(undefined);

  userForm = viewChild<NgForm>('userForm');
  groupForm = viewChild<NgForm>('groupForm');
  groupDetailForm = viewChild<NgForm>('groupDetailForm');

  // Computed properties for reactive state and lookups
  readonly selectedGroupObj = computed(() => {
    const groupId = this.selectedGroup();
    if (!groupId) return undefined;
    return this.groups().find(g => g._id === groupId);
  });

  readonly hasSelectedGroup = computed(() => {
    return this.selectedGroup() !== undefined;
  });

  readonly isInUpdateMode = computed(() => {
    return this.onUpdate() && this.selectedUser() !== undefined;
  });

  readonly selectedUserObj = computed(() => {
    const userId = this.selectedUser();
    if (!userId) return undefined;
    return this.users().find(u => u._id === userId);
  });

  constructor() {
    // Load group details when selected
    effect(() => {
      const groupId = this.selectedGroup();
      if (groupId) {
        this.getGroup(groupId);
      }
    });

    // Load users when group selected
    effect(() => {
      const groupId = this.selectedGroup();
      this.getUsersByGroup(groupId);
    });
  }

  ngOnInit() {
    this.onUpdate.set(false);
    this.fillData();
  }

  setDefault() {
    this.onUpdate.set(false);
    this.selectedGroup.set(undefined);
    this.selectedUser.set(undefined);
    if (this.groupForm()) this.groupForm()!.reset();
    if (this.userForm()) this.userForm()!.reset();
  }

  getGroup(id: string | undefined) {
    if (!id) return;
    this.selectedGroup.set(id);
    this.mainService.getData('users_group', id).then(res => {
      const data = { ...res };
      if (data.auth) {
        if (data.auth.components) {
          Object.assign(data, data.auth.components);
          delete data.auth.components;
        }
        Object.assign(data, data.auth);
        delete data.auth;
      }
      if (this.groupDetailForm()) {
        this.groupDetailForm()!.form.patchValue(data);
      }
    });
  }

  getUsersByGroup(id: string | null | undefined) {
    if (id) {
      this.mainService.getAllBy('users', { role_id: id }).then(res => {
        if (res && res.docs) {
          this.users.set(res.docs as any);
        } else {
          this.users.set([]);
        }
      });
    } else {
      this.mainService.getAllBy('users', {}).then(res => {
        if (res && res.docs) {
          this.users.set(res.docs as any);
        } else {
          this.users.set([]);
        }
      });
    }
  }

  addGroup(groupForm: NgForm) {
    const form = groupForm.value;
    if (form.name == undefined) {
      this.messageService.sendMessage('Grup Adı Girmek Zorundasınız.');
      return false;
    }
    const userAuth = new UserAuth(new ComponentsAuth(form.store, form.cashbox, form.endoftheday, form.reports, form.settings), form.cancelCheck, form.cancelProduct, form.discount, form.payment, form.end);
    const schema = new UserGroup(form.name, form.description, userAuth, 1, Date.now());
    this.mainService.getAllBy('users_group', { name: form.name }).then(result => {
      if (result.docs.length > 0 && result.docs[0].name == form.name) {
        this.messageService.sendMessage('Belirtilen Grup İsmi Kullanılmaktadır..');
      } else {
        this.mainService.addData('users_group', schema).then(() => {
          this.fillData();
          this.messageService.sendMessage('Grup Oluşturuldu!');
          groupForm.reset();
          this.selectedGroup.set(undefined);
        });
      }
    });
    return true;
  }

  setDefaultGroup() {
    this.onUpdate.set(false);
    if (this.groupForm()) this.groupForm()!.reset();

    this.dialogFacade.openUserGroupModal().closed.subscribe((formData: any) => {
      if (formData) {
        this.submitGroupForm(formData, null);
      }
    });
  }

  private submitGroupForm(formData: any, groupId: string | null) {
    if (formData.name == undefined) {
      this.messageService.sendMessage('Grup Adı Girmek Zorundasınız.');
      return;
    }
    const userAuth = new UserAuth(new ComponentsAuth(formData.store, formData.cashbox, formData.endoftheday, formData.reports, formData.settings), formData.cancelCheck, formData.cancelProduct, formData.discount, formData.payment, formData.end);

    if (groupId === null) {
      // Add new group
      const schema = new UserGroup(formData.name, formData.description, userAuth, 1, Date.now());
      this.mainService.getAllBy('users_group', { name: formData.name }).then(result => {
        if (result.docs.length > 0) {
          this.messageService.sendMessage('Belirtilen Grup İsmi Kullanılmaktadır..');
        } else {
          this.mainService.addData('users_group', schema).then(() => {
            this.fillData();
            this.messageService.sendMessage('Grup Oluşturuldu!');
          });
        }
      });
    }
  }

  updateGroup(groupDetailForm: NgForm) {
    const form = groupDetailForm.value;
    this.mainService.getAllBy('users_group', { name: form.name }).then(result => {
      const docs = result.docs;
      if (docs.length > 0 && docs[0].name != form.name) {
        this.messageService.sendMessage('Belirtilen Grup İsmi Kullanılmaktadır..');
      } else {
        const userAuth = new UserAuth(new ComponentsAuth(form.store, form.cashbox, form.endoftheday, form.reports, form.settings), form.cancelCheck, form.cancelProduct, form.discount, form.payment, form.end);
        const schema = new UserGroup(form.name, form.description, userAuth, 1, Date.now(), form._id, form._rev);
        this.mainService.updateData('users_group', form._id, schema).then(() => {
          this.messageService.sendMessage('Grup Bilgileri Güncellendi!');
          this.selectedGroup.set(undefined);
          this.fillData();
        });
      }
    });
  }

  removeGroup(id: string | undefined) {
    if (!id) return;
    const isOk = confirm('Grubu Silmek Üzeresiniz. Gruba Bağlı Üyeleride Silmiş Olacaksınız.');
    if (isOk) {
      this.mainService.removeData('users_group', id).then(() => {
        this.mainService.getAllBy('users', { role_id: id }).then(result => {
          if (result && result.docs) {
            const data = result.docs;
            data.forEach((element: any) => {
              if (element._id) {
                this.mainService.removeData('users', element._id).then((res) => {
                  this.mainService.getAllBy('reports', { connection_id: res.id }).then(reportRes => {
                    if (reportRes && reportRes.docs && reportRes.docs[0]?._id) {
                      this.mainService.removeData('reports', reportRes.docs[0]._id);
                    }
                  });
                });
              }
            });
          }
          this.messageService.sendMessage('Grup ve Kullanıcılar Silindi.');
          this.selectedGroup.set(undefined);
          this.fillData();
        })
      });
    }
  }

  addUser(userForm: NgForm) {
    const form = userForm.value;
    if (form.name == undefined) {
      this.messageService.sendMessage('Kullanıcı Girmek Zorundasınız.');
      return false;
    }
    if (form.role_id == undefined) {
      this.messageService.sendMessage('Görev Seçmek Zorundasınız.');
      return false;
    }
    if (form.pincode == undefined) {
      this.messageService.sendMessage('Şifre Girmek Zorundasınız.');
      return false;
    }
    form.pincode = parseInt(form.pincode);
    if (form._id == undefined) {
      this.mainService.getAllBy('users', { pincode: form.pincode }).then(result => {
        if (result.docs.length > 0) {
          this.messageService.sendMessage('Bu giriş kodu ile başka bir kullanıcı kayıtlı. Lütfen başka bir giriş kodu deneyin.');
          userForm.reset();
        } else {
          this.mainService.getData('users_group', form.role_id).then(res => {
            const role = res.name;
            const schema = new User(form.name, role, form.role_id, form.pincode, 1, Date.now());
            this.mainService.addData('users', schema as any).then((response) => {
              this.mainService.addData('reports', new Report('User', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), form.name, Date.now()) as any).then(reportRes => {
                this.logService.createLog(logType.USER_CREATED, response.id, `${form.name} Adlı Kullanıcı Oluşturuldu`);
              });
              this.messageService.sendMessage('Kullanıcı Oluşturuldu!');
              this.fillData();
              userForm.reset();
              this.selectedUser.set(undefined);
            });
          });
        }
      });
    } else {
      this.mainService.getAllBy('users', { pincode: form.pincode }).then(result => {
        const docs = result.docs;
        if (docs.length > 0 && docs[0].name != form.name) {
          this.messageService.sendMessage('Bu giriş kodu ile başka bir kullanıcı kayıtlı. Lütfen başka bir giriş kodu deneyin.');
        } else {
          this.mainService.updateData('users', form._id, form).then((res) => {
            this.logService.createLog(logType.USER_UPDATED, res.id, `${form.name} Adlı Kullanıcı Güncellendi`);
            this.messageService.sendMessage('Bilgiler Güncellendi!');
            this.fillData();
            userForm.reset();
            this.selectedUser.set(undefined);
          });
        }
      });
    }
    return true;
  }

  setDefaultUser() {
    this.onUpdate.set(false);
    if (this.userForm()) this.userForm()!.reset();

    this.dialogFacade.openUserModal(undefined, this.groups()).closed.subscribe((formData: any) => {
      if (formData) {
        this.submitUserForm(formData, null);
      }
    });
  }

  private submitUserForm(formData: any, userId: string | null) {
    if (formData.name == undefined || formData.role_id == undefined || formData.pincode == undefined) {
      this.messageService.sendMessage('Gerekli alanları doldurunuz.');
      return;
    }

    formData.pincode = parseInt(formData.pincode);

    if (userId === null) {
      // Add new user
      this.mainService.getAllBy('users', { pincode: formData.pincode }).then(result => {
        if (result.docs.length > 0) {
          this.messageService.sendMessage('Bu giriş kodu ile başka bir kullanıcı kayıtlı. Lütfen başka bir giriş kodu deneyin.');
        } else {
          this.mainService.getData('users_group', formData.role_id).then(res => {
            const schema = new User(formData.name, res.name, formData.role_id, formData.pincode, 1, Date.now());
            this.mainService.addData('users', schema as any).then((response) => {
              this.mainService.addData('reports', new Report('User', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), formData.name, Date.now()) as any).then(() => {
                this.logService.createLog(logType.USER_CREATED, response.id, `${formData.name} Adlı Kullanıcı Oluşturuldu`);
              });
              this.fillData();
              this.messageService.sendMessage('Kullanıcı Oluşturuldu!');
            });
          });
        }
      });
    }
  }

  updateUser(id: string | undefined) {
    if (!id) return;
    this.onUpdate.set(true);
    this.selectedUser.set(id);
    this.mainService.getData('users', id).then(result => {
      const resultCopy = { ...result } as any;
      delete resultCopy.role;

      this.dialogFacade.openUserModal(resultCopy, this.groups()).closed.subscribe((formData: any) => {
        if (formData && id) {
          this.submitUpdateUserForm(formData, id);
        }
      });
    });
  }

  private submitUpdateUserForm(formData: any, userId: string) {
    formData.pincode = parseInt(formData.pincode);

    this.mainService.getAllBy('users', { pincode: formData.pincode }).then(result => {
      const docs = result.docs;
      if (docs.length > 0 && docs[0]._id != userId) {
        this.messageService.sendMessage('Bu giriş kodu ile başka bir kullanıcı kayıtlı. Lütfen başka bir giriş kodu deneyin.');
      } else {
        this.mainService.updateData('users', userId, formData).then((res) => {
          this.logService.createLog(logType.USER_UPDATED, res.id, `${formData.name} Adlı Kullanıcı Güncellendi`);
          this.fillData();
          this.selectedUser.set(undefined);
          this.messageService.sendMessage('Bilgiler Güncellendi!');
        });
      }
    });
  }

  removeUser(id: string | undefined) {
    if (!id) return;
    const isOk = confirm('Kulanıcıyı Silmek Üzerisiniz. Bu işlem Geri Alınamaz.');
    if (isOk) {
      this.mainService.removeData('users', id).then((result) => {
        const selectedUserObj = this.selectedUserObj();
        const userName = selectedUserObj?.name || 'Kullanıcı';
        this.logService.createLog(logType.USER_DELETED, result.id, `${userName} Adlı Kullanıcı Silindi`);
        this.mainService.getAllBy('reports', { connection_id: result.id }).then(res => {
          if (res && res.docs && res.docs[0]?._id) {
            this.mainService.removeData('reports', res.docs[0]._id);
          }
        });
        this.selectedUser.set(undefined);
        this.fillData();
        this.messageService.sendMessage('Kullanıcı Silindi!');
      });
    }
  }

  filterUsers(value: string) {
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('users', { name: { $regex: regexp } }).then(res => {
      if (res && res.docs) {
        this.users.set(res.docs as any);
      } else {
        this.users.set([]);
      }
    });
  }

  fillData() {
    this.mainService.getAllBy('users', {}).then(result => {
      if (result && result.docs) {
        this.users.set(result.docs as any);
      } else {
        this.users.set([]);
      }
    });
    this.mainService.getAllBy('users_group', {}).then(result => {
      if (result && result.docs) {
        this.groups.set(result.docs as any);
      } else {
        this.groups.set([]);
      }
    });
  }
}
