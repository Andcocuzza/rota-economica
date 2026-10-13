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

  it('keeps monthly totals separate and exposes the previous month for comparison', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const currentIncome = app.totalIncome;
    const previousMonth = app.comparisonMonth;
    app.ledger.push({ id: 20, date: `${previousMonth}-15`, description: 'Receita anterior', category: 'Corridas', amount: 200, kind: 'Receita' });

    expect(app.totalIncome).toBe(currentIncome);
    expect(app.comparisonMonthIncome).toBe(200);
    app.selectedMonth = previousMonth;
    expect(app.selectedMonthIncome).toBe(200);
    expect(app.comparisonMonth).not.toBe(previousMonth);
  });

  it('clears every record only after confirmation and does not restore demo records', () => {
    const app = TestBed.createComponent(App).componentInstance;
    expect(app.fillUps.length + app.ledger.length).toBeGreaterThan(0);
    app.requestReset();
    expect(app.showResetConfirmation).toBe(true);
    expect(app.fillUps.length + app.ledger.length).toBeGreaterThan(0);

    app.confirmReset();
    expect(app.fillUps).toHaveLength(0);
    expect(app.ledger).toHaveLength(0);
    expect(app.maintenance).toHaveLength(0);

    const reopened = TestBed.createComponent(App).componentInstance;
    expect(reopened.fillUps).toHaveLength(0);
    expect(reopened.ledger).toHaveLength(0);
    expect(reopened.maintenance).toHaveLength(0);
  });

  it('shows the monthly comparison and reset control in reports', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.setSection('Relatorios');
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('COMPARAÇÃO MENSAL');
    expect(content).toContain('Zerar todos os registros');
  });
});
