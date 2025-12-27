import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotificationsReportsComponent } from './notifications-reports.component';

describe('NotificationsReportsComponent', () => {
  let component: NotificationsReportsComponent;
  let fixture: ComponentFixture<NotificationsReportsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ NotificationsReportsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationsReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
