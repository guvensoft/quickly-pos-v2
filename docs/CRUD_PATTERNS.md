src/app/core/services/printer.service.ts:        .addData('prints', newPrint)
src/app/core/services/settings.service.ts:    this.mainService.getAllBy('settings', {}).then((res) => {
src/app/core/services/settings.service.ts:    return this.mainService.getAllBy('settings', { key: Key }).then(res => {
src/app/core/services/settings.service.ts:        return this.mainService.updateData('settings', res.docs[0]._id, AppSettings);
src/app/core/services/settings.service.ts:    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => {
src/app/core/services/settings.service.ts:        this.mainService.updateData('settings', res.docs[0]._id, res.docs[0]);
src/app/core/services/settings.service.ts:        this.mainService.addData('settings', printerSettings);
src/app/core/services/settings.service.ts:    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => {
src/app/core/services/settings.service.ts:        this.mainService.updateData('settings', res.docs[0]._id, res.docs[0]);
src/app/core/services/settings.service.ts:    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => {
src/app/core/services/settings.service.ts:        this.mainService.updateData('settings', res.docs[0]._id, res.docs[0]);
src/app/core/services/database.service.ts:            this.mainService.getAllBy('tables', {}),
src/app/core/services/database.service.ts:            this.mainService.getAllBy('orders', {}),
src/app/core/services/database.service.ts:            this.mainService.getAllBy('checks', {}),
src/app/core/services/database.service.ts:            this.mainService.getAllBy('categories', {}),
src/app/core/services/database.service.ts:            this.mainService.getAllBy('sub_categories', {}),
src/app/core/services/database.service.ts:            this.mainService.getAllBy('products', {}),
src/app/core/services/database.service.ts:            this.mainService.getAllBy('floors', {}),
src/app/core/services/database.service.ts:            this.mainService.getAllBy('receipts', {}),
src/app/core/services/database.service.ts:            this.mainService.getAllBy('customers', {}),
src/app/core/services/database.service.ts:            this.mainService.getAllBy('reports', {})
src/app/core/services/database.service.ts:    async addData<K extends DatabaseName>(db: K, doc: any) {
src/app/core/services/database.service.ts:        return this.mainService.addData(db, doc);
src/app/core/services/database.service.ts:    async updateData<K extends DatabaseName>(db: K, id: string, doc: any) {
src/app/core/services/database.service.ts:        return this.mainService.updateData(db, id, doc);
src/app/core/services/database.service.ts:    async removeData<K extends DatabaseName>(db: K, id: string) {
src/app/core/services/database.service.ts:        return this.mainService.removeData(db, id);
src/app/core/services/http.service.ts:    this.mainService.getAllBy('settings', { key: 'RestaurantInfo' }).then(res => {
src/app/core/services/log.service.ts:    this.mainService.addData('logs', log).catch(err => {
src/app/core/services/log.service.ts:    this.mainService.removeData('logs', id).catch(err => {
src/app/core/services/main.service.ts:    const authPromise = this.getAllBy('settings', { key: 'AuthInfo' }).then(res => {
src/app/core/services/main.service.ts:    const serverPromise = this.getAllBy('settings', { key: 'ServerSettings' }).then(res => {
src/app/core/services/main.service.ts:  getAllData<K extends DatabaseName>(db: K): Promise<PouchDBAllDocsResult<DatabaseModelMap[K]>> {
src/app/core/services/main.service.ts:  getAllBy<K extends DatabaseName>(
src/app/core/services/main.service.ts:   * Observable-based version of getAllBy for reactive patterns.
src/app/core/services/main.service.ts:  getAllByObservable<T = PouchDBDocument>(
src/app/core/services/main.service.ts:   * Signal version of getAllBy for direct Signal-based components.
src/app/core/services/main.service.ts:  getAllBySignal<T = PouchDBDocument>(
src/app/core/services/main.service.ts:      this.getAllByObservable<T>(db, $schema),
src/app/core/services/main.service.ts:  addData<K extends DatabaseName>(
src/app/core/services/main.service.ts:        if (err.status !== 409) console.log('addData-All', err);
src/app/core/services/main.service.ts:      console.log('addData-Local', err);
src/app/core/services/main.service.ts:  updateData<K extends DatabaseName>(
src/app/core/services/main.service.ts:      if (err.status !== 409) console.log('updateData-All', err);
src/app/core/services/main.service.ts:      if (err.status !== 409) console.log('updateData-Local', err);
src/app/core/services/main.service.ts:  removeData<K extends DatabaseName>(db: K, id: string): Promise<PouchDBResponse> {
src/app/core/services/main.service.ts:        console.log('removeData-All', err);
src/app/core/services/main.service.ts:      console.log('removeData-Local', err);
src/app/core/services/main.service.ts:        this.getAllBy(db as any, $schema || {}).then(res => {
src/app/core/services/main.service.ts:        this.getAllBy('allData', {}).then(res => {
src/app/core/services/main.service.ts:        this.getAllBy('allData', selector).then(res => {
src/app/shared/modals/product-modal/product-modal.component.ts:    this.mainService.getAllBy('categories', {}).then((res: any) => {
src/app/shared/modals/product-modal/product-modal.component.ts:      ? this.mainService.updateData('products', this.data._id, formValue)
src/app/shared/modals/product-modal/product-modal.component.ts:      : this.mainService.addData('products', formValue);
src/app/shared/modals/category-modal/category-modal.component.ts:      ? this.mainService.updateData('categories', this.data._id, formValue)
src/app/shared/modals/category-modal/category-modal.component.ts:      : this.mainService.addData('categories', formValue);
src/app/app.component.ts:      .getAllBy('settings', {})
src/app/app.component.ts:    this.mainService.getAllBy('settings', { key: 'Printers' }).then(prints => {
src/app/app.component.ts:            this.mainService.getAllBy('categories', {}).then(cats => {
src/app/app.component.ts:                this.mainService.updateData('prints', printId, { status: PrintOutStatus.PRINTED }).then(() => {
src/app/app.component.ts:                this.mainService.updateData('prints', printId, { status: PrintOutStatus.ERROR });
src/app/app.component.ts:              this.mainService.updateData('prints', printId, { status: PrintOutStatus.ERROR });
src/app/app.component.ts:    this.mainService.getAllBy('allData', { key: 'ServerSettings' }).then(res => {
src/app/app.component.ts:      this.mainService.getAllBy('tables', {}).then(tables => {
src/app/app.component.ts:        this.mainService.getAllBy('checks', {}).then(res => {
src/app/app.component.ts:          this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
src/app/app.component.ts:              this.mainService.updateData('reports', sellingAct._id, sellingAct);
src/app/components/settings/user-settings/user-settings.component.ts:      this.mainService.getAllBy('users', { role_id: id }).then(res => {
src/app/components/settings/user-settings/user-settings.component.ts:      this.mainService.getAllBy('users', {}).then(res => {
src/app/components/settings/user-settings/user-settings.component.ts:    this.mainService.getAllBy('users_group', { name: form.name }).then(result => {
src/app/components/settings/user-settings/user-settings.component.ts:        this.mainService.addData('users_group', schema).then(() => {
src/app/components/settings/user-settings/user-settings.component.ts:      this.mainService.getAllBy('users_group', { name: formData.name }).then(result => {
src/app/components/settings/user-settings/user-settings.component.ts:          this.mainService.addData('users_group', schema).then(() => {
src/app/components/settings/user-settings/user-settings.component.ts:    this.mainService.getAllBy('users_group', { name: form.name }).then(result => {
src/app/components/settings/user-settings/user-settings.component.ts:        this.mainService.updateData('users_group', form._id, schema).then(() => {
src/app/components/settings/user-settings/user-settings.component.ts:      this.mainService.removeData('users_group', id).then(() => {
src/app/components/settings/user-settings/user-settings.component.ts:        this.mainService.getAllBy('users', { role_id: id }).then(result => {
src/app/components/settings/user-settings/user-settings.component.ts:                this.mainService.removeData('users', element._id).then((res) => {
src/app/components/settings/user-settings/user-settings.component.ts:                  this.mainService.getAllBy('reports', { connection_id: res.id }).then(reportRes => {
src/app/components/settings/user-settings/user-settings.component.ts:                      this.mainService.removeData('reports', reportRes.docs[0]._id);
src/app/components/settings/user-settings/user-settings.component.ts:      this.mainService.getAllBy('users', { pincode: form.pincode }).then(result => {
src/app/components/settings/user-settings/user-settings.component.ts:            this.mainService.addData('users', schema as any).then((response) => {
src/app/components/settings/user-settings/user-settings.component.ts:              this.mainService.addData('reports', new Report('User', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), form.name, Date.now()) as any).then(reportRes => {
src/app/components/settings/user-settings/user-settings.component.ts:      this.mainService.getAllBy('users', { pincode: form.pincode }).then(result => {
src/app/components/settings/user-settings/user-settings.component.ts:          this.mainService.updateData('users', form._id, form).then((res) => {
src/app/components/settings/user-settings/user-settings.component.ts:      this.mainService.getAllBy('users', { pincode: formData.pincode }).then(result => {
src/app/components/settings/user-settings/user-settings.component.ts:            this.mainService.addData('users', schema as any).then((response) => {
src/app/components/settings/user-settings/user-settings.component.ts:              this.mainService.addData('reports', new Report('User', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), formData.name, Date.now()) as any).then(() => {
src/app/components/settings/user-settings/user-settings.component.ts:    this.mainService.getAllBy('users', { pincode: formData.pincode }).then(result => {
src/app/components/settings/user-settings/user-settings.component.ts:        this.mainService.updateData('users', userId, formData).then((res) => {
src/app/components/settings/user-settings/user-settings.component.ts:      this.mainService.removeData('users', id).then((result) => {
src/app/components/settings/user-settings/user-settings.component.ts:        this.mainService.getAllBy('reports', { connection_id: result.id }).then(res => {
src/app/components/settings/user-settings/user-settings.component.ts:            this.mainService.removeData('reports', res.docs[0]._id);
src/app/components/settings/user-settings/user-settings.component.ts:    this.mainService.getAllBy('users', { name: { $regex: regexp } }).then(res => {
src/app/components/settings/user-settings/user-settings.component.ts:    this.mainService.getAllBy('users', {}).then(result => {
src/app/components/settings/user-settings/user-settings.component.ts:    this.mainService.getAllBy('users_group', {}).then(result => {
src/app/components/settings/stock-settings/stock-settings.component.ts:    this.mainService.getAllBy('stocks', { sub_category: id }).then((result) => {
src/app/components/settings/stock-settings/stock-settings.component.ts:        this.mainService.removeData('stocks', id).then(res => {
src/app/components/settings/stock-settings/stock-settings.component.ts:      this.mainService.updateData('stocks', stockId, formData).then(() => {
src/app/components/settings/stock-settings/stock-settings.component.ts:      this.mainService.addData('stocks_cat', schema).then(() => {
src/app/components/settings/stock-settings/stock-settings.component.ts:    this.mainService.updateData('stocks_cat', form._id, form).then(() => {
src/app/components/settings/stock-settings/stock-settings.component.ts:      this.mainService.removeData('stocks_cat', id).then(() => {
src/app/components/settings/stock-settings/stock-settings.component.ts:        this.mainService.getAllBy('stocks', { cat_id: id }).then(result => {
src/app/components/settings/stock-settings/stock-settings.component.ts:                  this.mainService.removeData('stocks', element._id);
src/app/components/settings/stock-settings/stock-settings.component.ts:    this.mainService.getAllBy('stocks', { name: { $regex: regexp } }).then(res => {
src/app/components/settings/stock-settings/stock-settings.component.ts:    this.mainService.getAllBy('stocks_cat', {}).then(result => {
src/app/components/settings/stock-settings/stock-settings.component.ts:    this.mainService.getAllBy('stocks', {}).then(result => {
src/app/components/settings/customer-settings/customer-settings.component.ts:      this.mainService.getAllBy('customers', { phone_number: phoneNumber }).then((result: any) => {
src/app/components/settings/customer-settings/customer-settings.component.ts:          this.mainService.addData('customers', schema as any).then((response: any) => {
src/app/components/settings/customer-settings/customer-settings.component.ts:            this.mainService.addData('reports', new Report('Customer', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), formData.name, Date.now()) as any).then((res: any) => {
src/app/components/settings/customer-settings/customer-settings.component.ts:      this.mainService.getAllBy('customers', { phone_number: phoneNumber }).then((result: any) => {
src/app/components/settings/customer-settings/customer-settings.component.ts:          this.mainService.updateData('customers', customerId, formData).then((res: any) => {
src/app/components/settings/customer-settings/customer-settings.component.ts:      this.mainService.removeData('customers', id).then((result: any) => {
src/app/components/settings/customer-settings/customer-settings.component.ts:        this.mainService.getAllBy('reports', { connection_id: result.id! }).then((res: any) => {
src/app/components/settings/customer-settings/customer-settings.component.ts:            this.mainService.removeData('reports', res.docs[0]._id);
src/app/components/settings/customer-settings/customer-settings.component.ts:    this.mainService.addData('checks', checkWillReOpen).then(() => {
src/app/components/settings/customer-settings/customer-settings.component.ts:      this.mainService.removeData('credits', check._id!).then(() => {
src/app/components/settings/customer-settings/customer-settings.component.ts:        this.mainService.updateData('closed_checks', id, { description: note, type: 3 }).then((res: any) => {
src/app/components/settings/customer-settings/customer-settings.component.ts:    this.mainService.getAllBy('customers', { name: { $regex: regexp } }).then((res: any) => {
src/app/components/settings/customer-settings/customer-settings.component.ts:    this.mainService.getAllBy('customers', {}).then((result: any) => {
src/app/components/settings/customer-settings/customer-settings.component.ts:    this.mainService.getAllBy('credits', {}).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.getAllBy('sub_categories', { cat_id: category._id }).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.getAllBy('sub_categories', { cat_id: id }).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.getAllBy('products', {}).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.getAllBy('sub_categories', { cat_id: id }).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.getAllBy('products', { cat_id: id }).then((result: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.getAllBy('products', { subcat_id: id }).then((result: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.updateData('categories', form._id, form).then(() => {
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.addData('categories', schema).then(() => {
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.getAllBy('products', { cat_id: id }).then((result: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:            this.mainService.removeData('products', item._id);
src/app/components/settings/menu-settings/menu-settings.component.ts:            this.mainService.getAllBy('reports', { connection_id: item._id }).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:                this.mainService.removeData('reports', res.docs[0]._id);
src/app/components/settings/menu-settings/menu-settings.component.ts:            this.mainService.getAllBy('recipes', { product_id: item._id }).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:                this.mainService.removeData('recipes', res.docs[0]._id);
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.getAllBy('sub_categories', { cat_id: id }).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:            this.mainService.removeData('sub_categories', item._id);
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.removeData('categories', id).then(() => {
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.addData('sub_categories', schema).then(() => {
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.updateData('sub_categories', subCategoryId, formData).then(() => {
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.removeData('sub_categories', id).then(() => {
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.getAllBy('sub_categories', { cat_id: result.cat_id }).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.getAllBy('recipes', { product_id: id }).then((result: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.addData('products', schema).then((response: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:        this.mainService.addData('reports', new Report('Product', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), schema.name, Date.now())).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:          this.mainService.addData('recipes', recipeSchema);
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.updateData('products', productId, schema).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:              this.mainService.addData('recipes', recipeSchema);
src/app/components/settings/menu-settings/menu-settings.component.ts:              this.mainService.updateData('recipes', currentRecipeId, { recipe: combined });
src/app/components/settings/menu-settings/menu-settings.component.ts:      this.mainService.removeData('products', id).then((result) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:        this.mainService.getAllBy('reports', { connection_id: result.id }).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:            this.mainService.removeData('reports', res.docs[0]._id);
src/app/components/settings/menu-settings/menu-settings.component.ts:        this.mainService.getAllBy('recipes', { product_id: result.id }).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:            this.mainService.removeData('recipes', res.docs[0]._id);
src/app/components/settings/menu-settings/menu-settings.component.ts:          if (currentRecipeId) this.mainService.removeData('recipes', currentRecipeId);
src/app/components/settings/menu-settings/menu-settings.component.ts:          this.mainService.updateData('recipes', currentRecipeId, { recipe: this.recipe() });
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.getAllBy('products', { name: { $regex: regexp } }).then((res: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.getAllBy('categories', {}).then((result: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.getAllBy('products', {}).then((result: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.getAllBy('stocks', {}).then((result: any) => {
src/app/components/settings/menu-settings/menu-settings.component.ts:    this.mainService.getAllBy('settings', { key: 'Printers' }).then((res: any) => {
src/app/components/settings/recipe-settings/recipe-settings.component.ts:    this.mainService.getAllBy('recipes', {}).then(res => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:      this.mainService.getAllBy('tables', { floor_id: id }).then(result => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:      this.mainService.getAllBy('tables', {}).then(result => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:    this.mainService.addData('floors', schema as any).then(() => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:    this.mainService.updateData('floors', form._id, schema).then(res => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:      this.mainService.removeData('floors', currentFloorId).then(() => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:        this.mainService.getAllBy('tables', { floor_id: currentFloorId }).then(result => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:                this.mainService.removeData('tables', table._id).then(res => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:                    this.mainService.getAllBy('reports', { connection_id: res.id }).then((reportRes) => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:                        this.mainService.removeData('reports', reportRes.docs[0]._id);
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:      this.mainService.addData('tables', schema).then((response) => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:          this.mainService.addData('reports', new Report('Table', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), formData.name, Date.now())).then(res => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:      this.mainService.updateData('tables', tableId, schema).then(() => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:      this.mainService.removeData('tables', currentTableId).then((result) => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:          this.mainService.getAllBy('reports', { connection_id: result.id }).then((res) => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:              this.mainService.removeData('reports', res.docs[0]._id);
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:    this.mainService.getAllBy('tables', { name: { $regex: regexp } }).then(res => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:    this.mainService.getAllBy('floors', {}).then((result) => {
src/app/components/settings/restaurant-settings/restaurant-settings.component.ts:    this.mainService.getAllBy('tables', {}).then((result) => {
src/app/components/settings/application-settings/application-settings.component.ts:    this.mainService.getAllBy('settings', {}).then((res) => {
src/app/components/cashbox/cashbox.component.ts:  addData(cashboxForm: NgForm) {
src/app/components/cashbox/cashbox.component.ts:      this.mainService.addData('cashbox', schema as any).then(res => {
src/app/components/cashbox/cashbox.component.ts:      this.mainService.updateData('cashbox', form._id, schema as any).then(res => {
src/app/components/cashbox/cashbox.component.ts:  updateData(data: Cashbox) {
src/app/components/cashbox/cashbox.component.ts:  removeData(id: string) {
src/app/components/cashbox/cashbox.component.ts:    this.mainService.removeData('cashbox', id).then(res => {
src/app/components/cashbox/cashbox.component.ts:    this.mainService.getAllBy('cashbox', {}).then(result => {
src/app/components/cashbox/cashbox.component.ts:        this.mainService.getAllBy('reports', { type: 'Store' }).then(res => {
src/app/components/cashbox/cashbox.component.html:            <tr (click)="updateData(cash)"
src/app/components/cashbox/cashbox.component.html:      <form #cashboxForm="ngForm" (ngSubmit)="addData(cashboxForm)">
src/app/components/cashbox/cashbox.component.html:          <button type="button" (click)="removeData(selectedData()?._id!)" class="btn btn-danger btn-lg"
src/app/components/setup/setup.component.ts:        this.mainService.addData('settings', serverSettings);
src/app/components/setup/setup.component.ts:    this.mainService.addData('settings', restaurantInfo);
src/app/components/setup/setup.component.ts:    this.mainService.addData('settings', authInfo);
src/app/components/setup/setup.component.ts:    this.mainService.addData('settings', appSettings);
src/app/components/setup/setup.component.ts:    this.mainService.addData('settings', printerSettings);
src/app/components/setup/setup.component.ts:    this.mainService.addData('settings', serverSettings);
src/app/components/setup/setup.component.ts:    // this.mainService.addData('settings', Object.assign({ _id: 'lastseen' }, lastSeenSettings));
src/app/components/setup/setup.component.ts:    this.mainService.addData('settings', dateSettings);
src/app/components/setup/setup.component.ts:    this.mainService.addData('settings', activationStatus).then((result) => {
src/app/components/setup/setup.component.ts:    this.mainService.addData('users_group', new UserGroup('Yönetici', 'Yönetici Grubu', userAuth, 1, Date.now()) as any)
src/app/components/setup/setup.component.ts:        return this.mainService.addData('users', new User(Form.admin_name, 'Yönetici', res.id, parseInt(Form.admin_pass), 1, Date.now()) as any)
src/app/components/setup/setup.component.ts:              this.mainService.addData('reports', new Report('User', user.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), (user as any).name, Date.now()) as any);
src/app/components/setup/setup.component.ts:        this.mainService.addData('reports', new Report('Store', 'Nakit', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'Nakit Satış Raporu', Date.now()) as any);
src/app/components/setup/setup.component.ts:        this.mainService.addData('reports', new Report('Store', 'Kart', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'Kart Satış Raporu', Date.now()) as any);
src/app/components/setup/setup.component.ts:        this.mainService.addData('reports', new Report('Store', 'Kupon', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'Kupon Satış Raporu', Date.now()) as any);
src/app/components/setup/setup.component.ts:        this.mainService.addData('reports', new Report('Store', 'İkram', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'İkram Satış Raporu', Date.now()) as any);
src/app/components/setup/setup.component.ts:        this.mainService.addData('reports', new Activity('Activity', 'Selling', [0], ['GB'], [0]) as any);
src/app/components/admin/admin.component.ts:    this.mainService.getAllBy(db_name as any, {}).then((res: any) => {
src/app/components/admin/admin.component.ts:      this.mainService.updateData(db_name as any, newDocument._id, newDocument).then((res: any) => {
src/app/components/admin/admin.component.ts:      this.mainService.addData(this.selectedDB() as any, newDocument).then((res: any) => {
src/app/components/admin/admin.component.ts:      this.mainService.getAllBy(this.selectedDB() as any, filter).then((res: any) => {
src/app/components/admin/admin.component.ts:    this.mainService.removeData(this.selectedDB() as any, id).then((res: any) => {
src/app/components/admin/admin.component.ts:    this.mainService.getAllBy('reports', {}).then((res: any) => {
src/app/components/admin/admin.component.ts:    this.mainService.getAllBy(this.selectedDB() as any, {}).then((res: any) => {
src/app/components/admin/admin.component.ts:        this.mainService.removeData(this.selectedDB() as any, element._id);
src/app/components/admin/admin.component.ts:    // this.mainService.getAllBy('floors',{}).then(res => {
src/app/components/admin/admin.component.ts:    // this.mainService.getAllBy('tables', {}).then(res => {
src/app/components/admin/admin.component.ts:    //     this.mainService.addData('reports', reports).then(res => {
src/app/components/admin/admin.component.ts:    //     this.mainService.addData('tables',table).then(res => {
src/app/components/admin/admin.component.ts:    // this.mainService.getAllBy('products', {cat_id :"ebb230e3-c297-4822-8c2b-6b11b0f9ca68"}).then(res => {
src/app/components/admin/admin.component.ts:    // this.mainService.getAllBy('stocks', {}).then(res => {
src/app/components/admin/admin.component.ts:    // this.mainService.getAllBy('endday', {}).then(res => {
src/app/components/admin/admin.component.ts:    // this.mainService.getAllBy('reports', { type: 'Product' }).then(res => {
src/app/components/admin/admin.component.ts:    // this.mainService.addData('settings', new Settings('ServerSettings', value, 'Sunucu Ayarları', Date.now()));
src/app/components/admin/admin.component.ts:    // this.mainService.getAllBy('settings', { key: 'RestaurantInfo' }).then(res => {
src/app/components/admin/admin.component.ts:    //   this.mainService.getAllBy('allData', {}).then(res => {
src/app/components/admin/admin.component.ts:    // this.mainService.getAllBy('allData', {}).then(res => {
src/app/components/admin/admin.component.ts:    // this.mainService.getAllData('closed_checks').then(res => {
src/app/components/admin/admin.component.ts:    // this.mainService.getAllBy('closed_checks', {}).then(res => {
src/app/components/admin/admin.component.ts:    // this.mainService.getAllBy('allData', { db_name: 'products' }).then(res => {
src/app/components/endoftheday/endoftheday.component.ts:      this.mainService.getAllBy('reports', { type: 'Activity' }).then((res: { docs: any[] }) => {
src/app/components/endoftheday/endoftheday.component.ts:        this.mainService.getAllBy('reports', {}).then(res => {
src/app/components/endoftheday/endoftheday.component.ts:      this.mainService.getAllBy('checks', {}).then((res) => {
src/app/components/endoftheday/endoftheday.component.ts:    this.mainService.getAllBy('closed_checks', {}).then(res => {
src/app/components/endoftheday/endoftheday.component.ts:    this.mainService.getAllBy('cashbox', {}).then(res => {
src/app/components/endoftheday/endoftheday.component.ts:    this.mainService.getAllBy('reports', {}).then(res => {
src/app/components/endoftheday/endoftheday.component.ts:    this.mainService.getAllBy('logs', {}).then(res => {
src/app/components/endoftheday/endoftheday.component.ts:    this.mainService.getAllBy('orders', {}).then(res => {
src/app/components/endoftheday/endoftheday.component.ts:    this.mainService.getAllBy('receipts', {}).then(res => {
src/app/components/endoftheday/endoftheday.component.ts:    this.mainService.addData('endday', this.endDayReport() as any).then(() => {
src/app/components/endoftheday/endoftheday.component.ts:    this.mainService.getAllBy('allData', {}).then(res => {
src/app/components/endoftheday/endoftheday.component.ts:    this.mainService.getAllBy('allData', {}).then(res => {
src/app/components/endoftheday/endoftheday.component.ts:    this.mainService.getAllBy('endday', {}).then((result) => {
src/app/components/helpers/caller/caller.component.ts:        this.mainService.getAllBy('customers', { phone_number: res.number }).then(customers => {
src/app/components/helpers/caller/caller.component.ts:      this.mainService.addData('checks', checkWillOpen).then(res => {
src/app/components/helpers/caller/caller.component.ts:    this.mainService.addData('customers', customerWillCreate as any).then(res => {
src/app/components/helpers/caller/caller.component.ts:      this.mainService.addData('checks', checkWillOpen).then(res => {
src/app/components/login/login.component.ts:    this.mainService.getAllBy('users', { pincode: { $eq: Number(this.pinInput()) } }).then((result) => {
src/app/components/reports/reports.component.ts:    this.mainService.getAllBy('endday', {}).then((res: any) => {
src/app/components/reports/reports.component.ts:    this.mainService.getAllBy('reports', { type: 'Activity' }).then((res: any) => {
src/app/components/reports/reports.component.ts:    this.mainService.getAllBy('reports', { type: 'Store' }).then((res: any) => {
src/app/components/reports/reports.component.ts:    this.mainService.getAllBy('closed_checks', { type: 3 }).then((res: any) => {
src/app/components/reports/reports.component.ts:    this.mainService.getAllBy('reports', { type: 'Activity' }).then((res: any) => {
src/app/components/reports/reports.component.ts:    this.mainService.getAllBy('checks', {}).then((res: any) => {
src/app/components/reports/reports.component.ts:    this.mainService.getAllBy('closed_checks', {}).then((res: any) => {
src/app/components/reports/product-reports/product-reports.component.ts:      this.mainService.getAllBy('products', { cat_id: selected }).then(res => {
src/app/components/reports/product-reports/product-reports.component.ts:    this.mainService.getAllBy('products', { cat_id: cat_id }).then(res => {
src/app/components/reports/product-reports/product-reports.component.ts:      this.mainService.getAllBy('products', { cat_id: selected }).then(res => {
src/app/components/reports/product-reports/product-reports.component.ts:      this.mainService.getAllBy('products', {}).then(res => {
src/app/components/reports/product-reports/product-reports.component.ts:    this.mainService.getAllBy('reports', { type: 'Product' }).then(res => {
src/app/components/reports/product-reports/product-reports.component.ts:    this.mainService.getAllBy('categories', {}).then(res => {
src/app/components/reports/product-reports/product-reports.component.ts:    this.mainService.getAllBy('logs', {}).then(res => {
src/app/components/reports/activity-reports/activity-reports.component.ts:    this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
src/app/components/reports/stock-reports/stock-reports.component.ts:    this.mainService.getAllBy('stocks', {}).then(result => {
src/app/components/reports/stock-reports/stock-reports.component.ts:    this.mainService.getAllBy('stocks_cat', {}).then(result => {
src/app/components/reports/stock-reports/stock-reports.component.ts:    this.mainService.getAllBy('logs', {}).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:      this.mainService.getAllBy('tables', { name: { $regex: regexp } }).then(data => {
src/app/components/reports/store-reports/store-reports.component.ts:    this.mainService.addData('checks', checkWillReOpen).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:        this.mainService.removeData('closed_checks', (check as any)._id).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:      this.mainService.getAllBy('reports', { connection_id: check.payment_method }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:        this.mainService.getAllBy('reports', { connection_id: element.method }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:      this.mainService.getAllBy('reports', { connection_id: detail.payment_method }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:      this.mainService.getAllBy('reports', { connection_id: Form.payment_method }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:      this.mainService.updateData('closed_checks', detail._id, { total_price: Form.total_price, payment_method: Form.payment_method }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:        this.mainService.getAllBy('reports', { connection_id: detail.payment_method }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:        this.mainService.updateData('closed_checks', detail._id, { total_price: Form.total_price }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:        this.mainService.updateData('closed_checks', id, { description: note, type: 3 }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:      this.mainService.getAllBy('reports', { connection_id: selectedPay.method }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:        this.mainService.getAllBy('reports', { connection_id: Form.method }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:          this.mainService.updateData('closed_checks', detail._id, { total_price: detail.total_price, payment_flow: detail.payment_flow }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:        this.mainService.getAllBy('reports', { connection_id: selectedPay.method }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:          this.mainService.updateData('closed_checks', detail._id, { total_price: detail.total_price, payment_flow: detail.payment_flow }).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:    this.mainService.getAllBy('logs', {}).then(res => {
src/app/components/reports/store-reports/store-reports.component.ts:    this.mainService.getAllBy('closed_checks', {}).then(res => {
src/app/components/reports/table-reports/table-reports.component.ts:      this.mainService.getAllBy('tables', { floor_id: selected }).then(res => {
src/app/components/reports/table-reports/table-reports.component.ts:    this.mainService.getAllBy('tables', { floor_id: cat_id }).then(res => {
src/app/components/reports/table-reports/table-reports.component.ts:    this.mainService.getAllBy('logs', {}).then(res => {
src/app/components/reports/table-reports/table-reports.component.ts:    this.mainService.getAllBy('reports', { type: 'Table' }).then(res => {
src/app/components/reports/table-reports/table-reports.component.ts:    this.mainService.getAllBy('floors', {}).then(res => {
src/app/components/reports/user-reports/user-reports.component.ts:    this.mainService.getAllBy('logs', {}).then(res => {
src/app/components/reports/user-reports/user-reports.component.ts:    this.mainService.getAllBy('reports', { type: 'User' }).then(res => {
src/app/components/store/store.component.ts:    const res = await this.mainService.getAllBy('closed_checks', { type: CheckType.ORDER });
src/app/components/store/store.component.ts:    this.mainService.updateData('orders', order._id!, { status: OrderStatus.PREPARING });
src/app/components/store/store.component.ts:      this.mainService.updateData('orders', order._id!, { status: OrderStatus.APPROVED, timestamp: approveTime });
src/app/components/store/store.component.ts:    this.mainService.updateData('orders', order._id!, { status: OrderStatus.CANCELED });
src/app/components/store/store.component.ts:    this.mainService.updateData('receipts', receipt._id!, { status: ReceiptStatus.READY, timestamp: Date.now() });
src/app/components/store/store.component.ts:      this.mainService.updateData('receipts', receipt._id!, { status: ReceiptStatus.APPROVED, timestamp: Date.now() }).then(() => {
src/app/components/store/store.component.ts:        this.mainService.updateData('checks', Check._id!, Check);
src/app/components/store/store.component.ts:    this.mainService.updateData('receipts', receipt._id!, { status: ReceiptStatus.CANCELED, timestamp: Date.now() });
src/app/components/store/payment-screen/payment-screen.component.ts:        this.mainService.updateData('checks', currentCheck._id, currentCheck);
src/app/components/store/payment-screen/payment-screen.component.ts:          this.mainService.updateData('checks', c._id!, checkToUpdate).then(() => {
src/app/components/store/payment-screen/payment-screen.component.ts:          this.mainService.updateData('checks', c._id!, checkToUpdate);
src/app/components/store/payment-screen/payment-screen.component.ts:    this.mainService.addData('closed_checks', checkWillClose).then((res: any) => {
src/app/components/store/payment-screen/payment-screen.component.ts:        this.mainService.removeData('checks', c._id!).then(() => {
src/app/components/store/payment-screen/payment-screen.component.ts:            this.mainService.updateData('tables', c.table_id, { status: 1 });
src/app/components/store/payment-screen/payment-screen.component.ts:      this.mainService.addData('closed_checks', checkWillClose);
src/app/components/store/payment-screen/payment-screen.component.ts:    this.mainService.addData('credits', creditData as any).then((res: any) => {
src/app/components/store/payment-screen/payment-screen.component.ts:          this.mainService.updateData('tables', c.table_id, { status: 1 });
src/app/components/store/payment-screen/payment-screen.component.ts:        this.mainService.removeData('checks', c._id!).then((result: any) => {
src/app/components/store/payment-screen/payment-screen.component.ts:        this.mainService.updateData('reports', doc._id, updated);
src/app/components/store/payment-screen/payment-screen.component.ts:          this.mainService.updateData('reports', updated._id, updated);
src/app/components/store/payment-screen/payment-screen.component.ts:    this.mainService.updateData('reports', updated._id, updated);
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.removeData('checks', currentCheck._id);
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.addData('checks', currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:    return this.mainService.getAllBy('checks', filter).then((result: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:      this.mainService.getAllBy('recipes', { product_id: product._id! }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.updateData('tables', this.id() as string, { status: 2 });
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:      this.mainService.updateData('checks', this.check_id(), currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:            this.mainService.addData('orders', newOrder).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.updateData('tables', this.id() as string, { status: 2, timestamp: Date.now() });
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:      this.mainService.addData('checks', currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:            this.mainService.addData('orders', newOrder).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:          this.mainService.updateData('checks', currentCheck._id, currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:          this.mainService.updateData('closed_checks', this.check_id(), currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.addData('closed_checks', checkWillClose).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:          this.mainService.removeData('checks', currentCheck._id);
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:          this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:    this.mainService.addData('closed_checks', checkWillClose).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:      this.mainService.removeData('checks', currentCheck._id);
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:      this.mainService.getAllBy('reports', { connection_id: method }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:            this.mainService.updateData('reports', doc._id, doc);
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:      this.mainService.getAllBy('reports', { type: "Store" }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                  this.mainService.updateData('reports', report._id, report);
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:    this.mainService.getAllBy('reports', { connection_id: check.table_id }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:          this.mainService.updateData('reports', report._id, report);
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.updateData('checks', this.check_id(), { note: note }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.updateData(currentCheck.type == CheckType.ORDER ? 'closed_checks' : 'checks', this.check_id(), currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.addData('closed_checks', checkToCancel).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.removeData('checks', currentCheck._id);
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:          this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:      this.mainService.getAllBy('reports', { connection_id: this.ownerId() }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:            this.mainService.updateData('reports', doc._id, doc).then();
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:      this.mainService.getAllBy('reports', { connection_id: obj.product }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:      this.mainService.getAllBy('recipes', { product_id: obj.product }).then((result: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.addData('checks', currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:            this.mainService.updateData('tables', this.table()._id, { status: 2, timestamp: Date.now() }).then(() => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.addData('checks', currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:            this.mainService.updateData('tables', this.table()._id, { status: 2, timestamp: Date.now() }).then(() => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:            this.mainService.updateData('tables', this.id()!, { status: 3 }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:            this.mainService.addData('checks', newCheck).then(res => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                this.mainService.updateData('tables', selectedTab._id, { status: 2, timestamp: Date.now() }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                          this.mainService.getAllBy('reports', { connection_id: obj.method }).then((r: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                        this.mainService.addData('closed_checks', checksForPayed);
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                      this.mainService.removeData('checks', currentCheck._id).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                          this.mainService.updateData('tables', currentCheck.table_id, { status: 1 }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                      this.mainService.updateData('checks', currentCheck._id, currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:      this.mainService.getAllBy('checks', { table_id: selectedTab._id! }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:            this.mainService.updateData('checks', otherCheck._id!, otherCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                      this.mainService.getAllBy('reports', { connection_id: obj.method }).then((r: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                    this.mainService.addData('closed_checks', checksForPayed);
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                  this.mainService.removeData('checks', currentCheck._id).then((r: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                      this.mainService.updateData('tables', currentCheck.table_id, { status: 1 }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                  this.mainService.updateData('checks', currentCheck._id, currentCheck).then((r: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:          this.mainService.updateData('tables', currentCheck.table_id, { status: 1, timestamp: Date.now() });
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.updateData('tables', selectedTab._id, { status: 2, timestamp: Date.now() });
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:        this.mainService.updateData('checks', this.check_id(), { table_id: selectedTab._id!, type: 1 }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:          this.mainService.getAllBy('checks', { table_id: selectedTab._id }).then(res => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                this.mainService.updateData('checks', otherCheck._id!, otherCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                      this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
src/app/components/store/selling-screen/selling-screen.component kopyası.ts:                    this.mainService.removeData('checks', currentCheck._id).then((r: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.removeData('checks', currentCheck._id);
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.addData('checks', currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:    return this.mainService.getAllBy('checks', filter).then((result: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:      this.mainService.getAllBy('recipes', { product_id: product._id! }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.updateData('tables', this.id() as string, { status: 2 });
src/app/components/store/selling-screen/selling-screen.component.ts:      this.mainService.updateData('checks', this.check_id(), currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:            this.mainService.addData('orders', newOrder).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.updateData('tables', this.id() as string, { status: 2, timestamp: Date.now() });
src/app/components/store/selling-screen/selling-screen.component.ts:      this.mainService.addData('checks', currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:            this.mainService.addData('orders', newOrder).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:          this.mainService.updateData('checks', currentCheck._id, currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:          this.mainService.updateData('closed_checks', this.check_id(), currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.addData('closed_checks', checkWillClose).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:          this.mainService.removeData('checks', currentCheck._id);
src/app/components/store/selling-screen/selling-screen.component.ts:          this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
src/app/components/store/selling-screen/selling-screen.component.ts:    this.mainService.addData('closed_checks', checkWillClose).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:      this.mainService.removeData('checks', currentCheck._id);
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
src/app/components/store/selling-screen/selling-screen.component.ts:      this.mainService.getAllBy('reports', { connection_id: method }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:            this.mainService.updateData('reports', doc._id, doc);
src/app/components/store/selling-screen/selling-screen.component.ts:      this.mainService.getAllBy('reports', { type: "Store" }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:                  this.mainService.updateData('reports', report._id, report);
src/app/components/store/selling-screen/selling-screen.component.ts:    this.mainService.getAllBy('reports', { connection_id: check.table_id }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:          this.mainService.updateData('reports', report._id, report);
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.updateData('checks', this.check_id(), { note: note }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.updateData(currentCheck.type == CheckType.ORDER ? 'closed_checks' : 'checks', this.check_id(), currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.addData('closed_checks', checkToCancel).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.removeData('checks', currentCheck._id);
src/app/components/store/selling-screen/selling-screen.component.ts:          this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
src/app/components/store/selling-screen/selling-screen.component.ts:      this.mainService.getAllBy('reports', { connection_id: this.ownerId() }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:            this.mainService.updateData('reports', doc._id, doc).then();
src/app/components/store/selling-screen/selling-screen.component.ts:      this.mainService.getAllBy('reports', { connection_id: obj.product }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:      this.mainService.getAllBy('recipes', { product_id: obj.product }).then((result: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.addData('checks', currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:            this.mainService.updateData('tables', this.table()._id, { status: 2, timestamp: Date.now() }).then(() => {
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.addData('checks', currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:            this.mainService.updateData('tables', this.table()._id, { status: 2, timestamp: Date.now() }).then(() => {
src/app/components/store/selling-screen/selling-screen.component.ts:            this.mainService.updateData('tables', this.id()!, { status: 3 }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:            this.mainService.addData('checks', newCheck).then(res => {
src/app/components/store/selling-screen/selling-screen.component.ts:                this.mainService.updateData('tables', selectedTab._id, { status: 2, timestamp: Date.now() }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:                          this.mainService.getAllBy('reports', { connection_id: obj.method }).then((r: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:                        this.mainService.addData('closed_checks', checksForPayed);
src/app/components/store/selling-screen/selling-screen.component.ts:                      this.mainService.removeData('checks', currentCheck._id).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:                          this.mainService.updateData('tables', currentCheck.table_id, { status: 1 }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:                      this.mainService.updateData('checks', currentCheck._id, currentCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:      this.mainService.getAllBy('checks', { table_id: selectedTab._id! }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:            this.mainService.updateData('checks', otherCheck._id!, otherCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:                      this.mainService.getAllBy('reports', { connection_id: obj.method }).then((r: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:                    this.mainService.addData('closed_checks', checksForPayed);
src/app/components/store/selling-screen/selling-screen.component.ts:                  this.mainService.removeData('checks', currentCheck._id).then((r: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:                      this.mainService.updateData('tables', currentCheck.table_id, { status: 1 }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:                  this.mainService.updateData('checks', currentCheck._id, currentCheck).then((r: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:          this.mainService.updateData('tables', currentCheck.table_id, { status: 1, timestamp: Date.now() });
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.updateData('tables', selectedTab._id, { status: 2, timestamp: Date.now() });
src/app/components/store/selling-screen/selling-screen.component.ts:        this.mainService.updateData('checks', this.check_id(), { table_id: selectedTab._id!, type: 1 }).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:          this.mainService.getAllBy('checks', { table_id: selectedTab._id }).then(res => {
src/app/components/store/selling-screen/selling-screen.component.ts:                this.mainService.updateData('checks', otherCheck._id!, otherCheck).then((res: any) => {
src/app/components/store/selling-screen/selling-screen.component.ts:                      this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
src/app/components/store/selling-screen/selling-screen.component.ts:                    this.mainService.removeData('checks', currentCheck._id).then((r: any) => {
