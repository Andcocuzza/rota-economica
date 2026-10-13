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

  it('deletes only the selected record after confirmation and preserves other records', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const ledgerBefore = [...app.ledger];
    const fillUpsBefore = [...app.fillUps];
    const expensesBefore = app.totalExpenses;
    const target = app.ledger.find((entry) => entry.id === 2)!;
    app.requestDelete('ledger', target.id, target.description);
    expect(app.deleteCandidate?.id).toBe(target.id);
    expect(app.ledger).toHaveLength(ledgerBefore.length);

    app.confirmDelete();
    expect(app.ledger).toHaveLength(ledgerBefore.length - 1);
    expect(app.ledger.some((entry) => entry.id === target.id)).toBe(false);
    expect(app.fillUps).toEqual(fillUpsBefore);
    expect(app.totalExpenses).toBe(expensesBefore - target.amount);
    expect(JSON.parse(localStorage.getItem('rota-economica-ledger') ?? '[]')).toHaveLength(ledgerBefore.length - 1);

    const reopened = TestBed.createComponent(App).componentInstance;
    expect(reopened.ledger).toHaveLength(ledgerBefore.length - 1);
    expect(reopened.fillUps).toEqual(fillUpsBefore);
  });

  it('deletes a single fill-up without deleting financial or maintenance records', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const target = app.fillUps[0];
    const ledgerBefore = [...app.ledger];
    app.requestDelete('fillups', target.id, target.station);
    app.confirmDelete();

    expect(app.fillUps.some((entry) => entry.id === target.id)).toBe(false);
    expect(app.fillUps).toHaveLength(1);
    expect(app.ledger).toEqual(ledgerBefore);
  });

  it('deletes a single maintenance record without removing other entries', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.maintenance.push({ id: 42, date: app.today, description: 'Troca de óleo', category: 'Oleo', amount: 120, kind: 'Despesa' });
    app.ledger.push({ id: 43, date: app.today, description: 'Corridas', category: 'Corridas', amount: 300, kind: 'Receita' });
    const incomeBefore = app.totalIncome;
    app.requestDelete('maintenance', 42, 'Troca de óleo');
    app.confirmDelete();

    expect(app.maintenance).toHaveLength(0);
    expect(app.totalIncome).toBe(incomeBefore);
    expect(app.ledger.some((entry) => entry.id === 43)).toBe(true);
  });

  it('shows the monthly comparison in reports and individual delete actions in finance', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.setSection('Relatorios');
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('COMPARAÇÃO MENSAL');
    expect((fixture.nativeElement.textContent as string)).not.toContain('Zerar todos os registros');

    const financeFixture = TestBed.createComponent(App);
    const financeApp = financeFixture.componentInstance;
    financeApp.selectedMonth = financeApp.ledger[0].date.slice(0, 7);
    financeApp.setSection('Financeiro');
    financeFixture.detectChanges();
    const deleteButtons = financeFixture.nativeElement.querySelectorAll('.delete-record-button') as NodeListOf<HTMLButtonElement>;
    expect(deleteButtons.length).toBeGreaterThan(0);
    expect(deleteButtons[0].getAttribute('aria-label')).toContain('Excluir lançamento');
  });
});
