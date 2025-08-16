import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pick } from './pick';

describe('Pick', () => {
  let component: Pick;
  let fixture: ComponentFixture<Pick>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pick]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pick);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
