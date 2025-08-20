import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockReceived } from './stockReceived';

describe('StockReceived', () => {
  let component: StockReceived;
  let fixture: ComponentFixture<StockReceived>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockReceived],
    }).compileComponents();

    fixture = TestBed.createComponent(StockReceived);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
