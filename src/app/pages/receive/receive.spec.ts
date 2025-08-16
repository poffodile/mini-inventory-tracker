import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Receive } from './receive';

describe('Receive', () => {
  let component: Receive;
  let fixture: ComponentFixture<Receive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Receive]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Receive);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
