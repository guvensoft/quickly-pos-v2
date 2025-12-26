import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpService } from '../../core/services/http.service';
import { MainService } from '../../core/services/main.service';
import { Report } from '../../core/models/report.model';

import * as fs from 'fs';
import { ServerInfo, Settings } from '../../core/models/settings.model';
import { Product } from '../../core/models/product.model';
import { Table } from '../../core/models/table.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})

export class AdminComponent implements OnInit {
  databases!: Array<string>;
  documents: any;
  selectedDoc!: any;
  selectedDB!: string;
  storeReports!: Array<any>;
  onCreate!: boolean;
  @ViewChild('editArea') editArea!: ElementRef;

  constructor(private mainService: MainService, private httpService: HttpService) {
    this.databases = Object.keys(this.mainService.LocalDB);
  }

  ngOnInit() {

  }

  syncData() {
    this.mainService.syncToLocal(this.selectedDB).then((message: any) => {
      alert(message);
    });
  }

  showDatabase(db_name: string) {
    this.selectedDB = db_name;
    this.mainService.getAllBy(db_name as any, {}).then((res: any) => {
      if (res && res.docs) {
        this.documents = res.docs;
      } else {
        this.documents = [];
      }
    }).catch(err => {
      console.error('Error showing database:', err);
      this.documents = [];
    });
  }

  showDocument(doc: any) {
    // this.editArea.nativeElement.value == '';
    this.selectedDoc = doc;
    (window as any).$('#docModal').modal('show');
  }

  editDocument(document: any) {
    try {
      const newDocument = JSON.parse(document);
      let db_name: string;
      if (this.selectedDB == 'allData') {
        db_name = newDocument.db_name;
      } else {
        db_name = this.selectedDB;
      }
      this.mainService.updateData(db_name as any, newDocument._id, newDocument).then((res: any) => {
        (window as any).$('#docModal').modal('hide');
        console.log('Döküman Güncellendi');
        if (this.editArea) {
          this.editArea.nativeElement.value = '';
        }
        this.selectedDoc = undefined!;
        this.showDatabase(this.selectedDB);
      }).catch(err => {
        console.error('Error updating document:', err);
        alert('Döküman güncellenemedi: ' + err.message);
      });
    } catch (error) {
      console.error('Error parsing document JSON:', error);
      alert('Geçersiz JSON formatı');
    }
  }


  createDocument(document: any) {
    try {
      const newDocument = JSON.parse(document);
      this.mainService.addData(this.selectedDB as any, newDocument).then((res: any) => {
        if (res.ok) {
          (window as any).$('#docModal').modal('hide');
          console.log('Döküman Oluşturuldu');
          if (this.editArea) {
            this.editArea.nativeElement.value = '';
          }
          this.selectedDoc = undefined!;
          this.showDatabase(this.selectedDB);
        }
      }).catch(err => {
        console.error('Error creating document:', err);
        alert('Döküman oluşturulamadı: ' + err.message);
      });
    } catch (error) {
      console.error('Error parsing document JSON:', error);
      alert('Geçersiz JSON formatı');
    }
  }

  getByFilter(key: string, value: any) {
    const filter = new Object() as any;
    filter[key] = value;
    if (this.selectedDB) {
      this.mainService.getAllBy(this.selectedDB as any, filter).then((res: any) => {
        if (res && res.docs) {
          this.documents = res.docs;
        } else {
          this.documents = [];
        }
      }).catch(err => {
        console.error('Error filtering documents:', err);
        this.documents = [];
      });
    }
  }

  removeDocument(id: string) {
    this.mainService.removeData(this.selectedDB as any, id).then((res: any) => {
      (window as any).$('#docModal').modal('hide');
      console.log('Döküman Silindi');
      this.selectedDoc = undefined!;
      this.showDatabase(this.selectedDB);
    }).catch(err => {
      console.error('Error removing document:', err);
      alert('Döküman silinemedi: ' + err.message);
    });
  }

  resetReports() {
    this.mainService.getAllBy('reports', {}).then((res: any) => {
      if (!res || !res.docs || res.docs.length === 0) {
        console.warn('No reports found');
        return;
      }
      console.warn(res.docs.length);
      const reports = (res.docs as any[]).filter(obj => obj.type !== 'Activity');
      reports.forEach((element, index) => {
        this.mainService.changeData('reports', element._id, (doc: any) => {
          doc.amount = 0;
          doc.count = 0;
          doc.weekly = [0, 0, 0, 0, 0, 0, 0];
          doc.weekly_count = [0, 0, 0, 0, 0, 0, 0];
          return doc;
        });
      });
      this.mainService.localSyncBeforeRemote('reports');
    }).catch(err => {
      console.error('Error resetting reports:', err);
    });
  }

  compactDB() {
    this.mainService.compactDB(this.selectedDB).then((res: any) => {
      console.log(res);
    }).catch((err: any) => {
      console.log(err);
    });
  }

  clearDB() {
    this.mainService.getAllBy(this.selectedDB as any, {}).then((res: any) => {
      if (!res || !res.docs || res.docs.length === 0) {
        console.warn('No documents to clear');
        return;
      }
      res.docs.forEach((element: any, index: number) => {
        this.mainService.removeData(this.selectedDB as any, element._id);
        console.log(index);
      });
    }).catch(err => {
      console.error('Error clearing database:', err);
    });
  }

  refreshToken() {
    // let username = prompt('username');
    // let password = prompt('password');

    const oldToken = localStorage.getItem('AccessToken');
    this.httpService.post('/store/refresh', null, oldToken).toPromise().then((res: any) => {
      if (res.ok) {
        let data = res;
        if ((res).json && typeof (res).json === 'function') {
          data = (res).json();
        }
        const token = data.token;
        localStorage.setItem('AccessToken', token);
        alert('İşlem Başarılı');
      }
    }).catch((err: any) => {
      console.error('Token refresh error:', err);
      this.httpService.post('/store/login', { username: 'quickly', password: 'asdtd155+1' }).toPromise().then((res: any) => {
        if (res.ok) {
          let data = res;
          if ((res).json && typeof (res).json === 'function') {
            data = (res).json();
          }
          const token = data.token;
          localStorage.setItem('AccessToken', token);
          alert('İşlem Başarılı');
        } else {
          alert('Başarısız');
        }
      }).catch(err => {
        console.error('Login error:', err);
        alert('Giriş başarısız');
      });
    });
  }

  resolveDB() {
    this.mainService.LocalDB[this.selectedDB].allDocs({ include_docs: true, conflicts: true }).then((res: any) => {
      if (!res || !res.rows || res.rows.length === 0) {
        console.warn('No documents to resolve');
        return;
      }
      const test = res.rows.map((obj: any) => { return obj.doc });
      test.forEach((element: any) => {
        if (element.hasOwnProperty('_conflicts')) {
          console.log(element);
          this.mainService.LocalDB[this.selectedDB].resolveConflicts(element, (a: any, b: any) => {
            if (element.hasOwnProperty('timestamp')) {
              if (a.timestamp > b.timestamp) return a;
              if (b.timestamp > a.timestamp) return b;
            } else if (element.hasOwnProperty('timestamp')) {
              if (a.timestamp > b.timestamp) return a;
              if (b.timestamp > a.timestamp) return b;
            } else if (element.hasOwnProperty('time')) {
              if (a.time > b.time) return a;
              if (b.time > a.time) return b;
            }
            return a;
          }).then((res: any) => {
            console.log(res);
          }).catch((err: any) => {
            console.log(err);
          })
        }
      });
    }).catch(err => {
      console.error('Error resolving conflicts:', err);
    });
  }

  updateProgram() {

    // this.mainService.getAllBy('floors',{}).then(res => {
    //   console.log(res);
    // })
    // let tablesArr = [];
    // this.mainService.getAllBy('tables', {}).then(res => {
    //   for (let index = 0; index < res.docs.length; index++) {
    //     let connection_id = res.docs[index]._id;
    //     let reports = new Report('Table', connection_id, 0, 0, 0, [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], '', Date.now());
    //     this.mainService.addData('reports', reports).then(res => {
    //       console.log(res);
    //     })

    //   }
    // })

    // for (let index = 1; index < 16; index++) {
    //     let table = new Table(`S${index}`,'05800961-4aaa-4add-baa8-9f8fbfb3f2fb',4,'',1,Date.now(),[]);
    //     this.mainService.addData('tables',table).then(res => {
    //       console.log(res);
    //     }); 
    // }



    // localStorage.setItem('CheckNo', "1");
    // let specifies = [
    //   {
    //     spec_name: "Sek",
    //     spec_price: 70
    //   },
    //   {
    //     spec_name: "Soda",
    //     spec_price: 70
    //   },
    //   {
    //     spec_name: "Kola",
    //     spec_price: 70
    //   },
    //   {
    //     spec_name: "Redbull",
    //     spec_price: 75
    //   }
    // ];
    // this.mainService.getAllBy('products', {cat_id :"ebb230e3-c297-4822-8c2b-6b11b0f9ca68"}).then(res => {
    //   let products = res.docs;
    //   products.forEach(element => {
    //     this.mainService.changeData('products', element._id, (doc: Product) => {
    //       doc.specifies = specifies;
    //       doc.specifies.map(obj => {
    //         if(obj.spec_name == 'Redbull'){
    //           obj.spec_price = doc.price + 5;
    //         }else{
    //           obj.spec_price = doc.price;
    //         }
    //       });
    //       console.log(doc);
    //       return doc;
    //     }).then(res => {
    //       console.log(res);
    //     });
    //   });
    // })

    // this.mainService.getAllBy('stocks', {}).then(res => {
    //   let stocks = res.docs;
    //   stocks.forEach(element => {
    //     this.mainService.changeData('stocks', element._id, (doc) => {
    //       doc.warning_value = 25;
    //       return doc;
    //     }).then(res => {
    //       console.log(res);
    //     });
    //   });
    // })

    // this.mainService.getAllBy('endday', {}).then(res => {
    //   let endday = res.docs;
    //   endday.forEach(element => {
    //     this.mainService.changeData('endday', element._id, (doc) => {
    //       let time = doc.time;
    //       delete doc.time;
    //       doc.timestamp = time;
    //       return doc;
    //     }).then(res => {
    //       console.log(res);
    //     });
    //   });
    // })

    // this.mainService.getAllBy('reports', { type: 'Product' }).then(res => {
    //   let reports = res.docs;
    //   console.log(res);
    //   reports.forEach(element => {
    //     this.mainService.changeData('reports', element._id, (doc) => {
    //       doc.weekly[0] = 0;
    //       doc.weekly_count[0] = 0;
    //       return doc;
    //     }).then(res => {
    //       console.log(res);
    //     });
    //   });
    // })

    // let value = new ServerInfo(0, 1, '192.168.1.1', 3000, 'kosmos2018');

    // this.mainService.addData('settings', new Settings('ServerSettings', value, 'Sunucu Ayarları', Date.now()));

    // this.mainService.syncToRemote().cancel();
    // this.mainService.syncToServer().cancel();
    // this.mainService.getAllBy('settings', { key: 'RestaurantInfo' }).then(res => {
    //   let restaurantID = res.docs[0].value.id;
    //   this.mainService.getAllBy('allData', {}).then(res => {
    //     let token = localStorage.getItem("AccessToken");
    //     this.httpService.post(`v1/management/restaurants/${restaurantID}/reset_database/`, { docs: [] }, token).subscribe(res => {
    //       console.log(res.json());
    //       Object.keys(this.mainService.LocalDB).forEach(db_name => {
    //         if (db_name !== 'settings') {
    //           this.mainService.destroyDB(db_name).then(res => {
    //             console.log(db_name, res);
    //           });
    //         }
    //       });
    //     });
    //   })
    // });

    // this.mainService.getAllBy('allData', {}).then(res => {
    //   return res.docs.map((obj) => {
    //     delete obj._rev;
    //     return obj;
    //   })
    // }).then((cleanDocs: Array<any>) => {
    //   console.log(cleanDocs.length);
    //   fs.writeFile('./data/all.txt', JSON.stringify(cleanDocs), err => {
    //     console.log(err);
    //   })
    // });;

    // fs.readFile('./data/all.txt', (err, data) => {
    //   let realData = JSON.parse(data.toString('utf-8'));
    //   let filteredData = realData
    //     .filter(obj => obj.db_name !== "settings")
    //     .filter(obj => obj.db_name !== "users")
    //     .filter(obj => obj.db_name !== "users_group")
    //     .filter(obj => obj.type !== "Store")
    //     .filter(obj => obj.type !== "User")
    //     .filter(obj => obj.type !== "Activity");
    //   this.mainService.putAll('allData', filteredData).then(res => {
    //     this.mainService.syncToLocal().then(res => {
    //       console.log(res);
    //     })
    //   });
    // })

    // Object.keys(this.mainService.LocalDB).forEach(db_name => {
    //   this.mainService.destroyDB(db_name);
    // });

    // this.mainService.createIndex('allData', ['db_name']).then(res => {
    //   console.log(res);
    // });


    // let t1 = performance.now();
    // this.mainService.getAllData('closed_checks').then(res => {
    //   console.log(res.rows.map(obj => { return obj.doc }));
    //   let t2 = performance.now();
    //   console.log('Bulk', t2 - t1);
    // })
    // this.mainService.getAllBy('closed_checks', {}).then(res => {
    //   console.log('Pro', res.docs);
    //   let t2 = performance.now();
    //   console.log('Normal', t2 - t1);
    // });


    // fs.readFile('./data/all.txt', (err, data) => {
    //   const rdata = JSON.parse(data.toString('utf-8'));
    //   let products = rdata.filter(obj => obj.db_name == 'products');
    //   console.log('File', products);
    //   let t2 = performance.now();
    //   console.log(t2 - t1);
    // })

    // this.mainService.getAllBy('allData', { db_name: 'products' }).then(res => {
    //   console.log('All', res.docs);
    //   let t2 = performance.now();
    //   console.log(t2 - t1);
    // });
  }

  testEndDay() {
    try {
      const token = localStorage.getItem("AccessToken") || '';
      const restaurantInfoStr = localStorage.getItem('RestaurantInfo');
      if (!restaurantInfoStr) {
        console.error('RestaurantInfo not found in localStorage');
        return;
      }
      const restaurantInfo = JSON.parse(restaurantInfoStr);
      const restaurantID = restaurantInfo.id;
      this.httpService.post(`v1/management/restaurants/${restaurantID}/report_generator/`, { timestamp: Date.now(), data: { hello: 'test' } }, token).subscribe((res: any) => {
        console.log(res);
      }, err => {
        console.error('Error in testEndDay:', err);
      });
    } catch (error) {
      console.error('Error parsing RestaurantInfo:', error);
    }
  }
}
