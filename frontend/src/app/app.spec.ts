import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { appConfig } from './app.config';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show the localized dashboard and sample data disclosure', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Bom dia, Anderson');
    expect(compiled.textContent).toContain('Dados de demonstração');
  });

  it('calculates consumption between successive full-tank fill-ups', () => {
    const app = TestBed.createComponent(App).componentInstance;
    expect(app.averageConsumption).toBeCloseTo(455 / 37, 2);
    expect(app.costPerKm).toBeCloseTo(5.79 / (455 / 37), 2);
  });

  it('does not save a fill-up with an odometer reading older than the latest record', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.fillUpForm = { date: app.today, station: 'Posto Teste', fuel: 'Gasolina comum', price: 5.5, liters: 20, odometer: 32000, fullTank: true };
    app.addFillUp();
    expect(app.fillUps).toHaveLength(2);
    expect(app.notice).toContain('quilometragem');
  });

  it('calculates the fill-up total from price per liter and liters', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.fillUpForm = { date: app.today, station: 'Posto Teste', fuel: 'Gasolina comum', price: 5.79, liters: 10, odometer: 33000, fullTank: false };
    app.addFillUp();
    expect(app.fillUps.at(-1)?.total).toBe(57.9);
    expect(JSON.parse(localStorage.getItem('rota-economica-fillups') ?? '[]')).toHaveLength(3);
  });
});
