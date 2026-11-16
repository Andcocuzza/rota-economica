import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { appConfig } from './app.config';

function weekFor(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

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

  it('calculates the actual cost per kilometer for each fuel type', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.fillUps.splice(0,
      app.fillUps.length,
      { id: 1, date: app.today, station: 'Posto Gasolina', fuel: 'Gasolina comum', price: 5, liters: 20, total: 100, distanceDriven: 180 },
      { id: 2, date: app.today, station: 'Posto Etanol', fuel: 'Etanol comum', price: 4, liters: 22.5, total: 90, distanceDriven: 160 },
    );

    expect(app.costPerKm).toBeCloseTo(90 / 160, 4);
    expect(app.fuelOptions.find((option) => option.name === 'Gasolina')?.costPerKm).toBeCloseTo(100 / 180, 4);
    expect(app.fuelOptions.find((option) => option.name === 'Etanol')?.costPerKm).toBeCloseTo(90 / 160, 4);
    expect(app.fuelOptions[0].name).toBe('Gasolina');
  });

  it('requires the real distance driven before saving a fill-up', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.fillUpForm = { date: app.today, station: 'Posto Teste', fuel: 'Gasolina comum', price: 5.5, totalPaid: 100, distanceDriven: 0 };
    app.addFillUp();
    expect(app.fillUps).toHaveLength(2);
    expect(app.notice).toContain('distância percorrida');
  });

  it('records the entered distance and calculates the cost from amount paid', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.fillUpForm = { date: app.today, station: 'Posto Teste', fuel: 'Gasolina comum', price: 5, totalPaid: 100, distanceDriven: 180 };
    app.addFillUp();
    expect(app.fillUps.at(-1)?.liters).toBe(20);
    expect(app.fillUps.at(-1)?.total).toBe(100);
    expect(app.fillUps.at(-1)?.distanceDriven).toBe(180);
    expect(app.costPerKm).toBeCloseTo(100 / 180, 4);
    expect(JSON.parse(localStorage.getItem('rota-economica-fillups') ?? '[]')).toHaveLength(3);
  });

  it('shows no fuel comparison until actual distances are registered', () => {
    const app = TestBed.createComponent(App).componentInstance;
    expect(app.fuelOptions.every((option) => option.costPerKm === null)).toBe(true);
  });

  it('tracks one editable work-hours total per date, independent of income entries', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.ledger.splice(0);
    app.ledger.push(
      { id: 10, date: app.today, description: 'Uber', category: 'Corridas', amount: 180, kind: 'Receita' },
      { id: 11, date: app.today, description: '99', category: 'Corridas', amount: 120, kind: 'Receita' },
    );
    app.workDayForm = { date: app.today, hours: 7.5 };
    app.addWorkDay();

    expect(app.currentWeekHours).toBe(7.5);
    expect(app.currentWeekHourlyIncome).toBe(40);
    app.workDayForm = { date: app.today, hours: 8 };
    app.addWorkDay();
    expect(app.workDays).toHaveLength(1);
    expect(app.currentWeekHours).toBe(8);
    expect(app.currentWeekHourlyIncome).toBe(37.5);
    expect(JSON.parse(localStorage.getItem('rota-economica-workdays') ?? '[]')).toHaveLength(1);
  });

  it('groups totals Monday through Sunday and exposes the previous week for comparison', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const previousWeek = app.comparisonWeek;
    const previousWeekEnd = new Date(`${previousWeek}T00:00:00`);
    previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);
    const sunday = `${previousWeekEnd.getFullYear()}-${String(previousWeekEnd.getMonth() + 1).padStart(2, '0')}-${String(previousWeekEnd.getDate()).padStart(2, '0')}`;
    app.ledger.push(
      { id: 20, date: sunday, description: 'Receita anterior', category: 'Corridas', amount: 200, kind: 'Receita' },
      { id: 21, date: app.currentWeek, description: 'Receita atual', category: 'Corridas', amount: 500, kind: 'Receita' },
    );

    expect(app.comparisonWeekIncome).toBe(200);
    expect(app.totalIncome).toBe(500);
    app.selectedWeek = previousWeek;
    expect(app.selectedWeekIncome).toBe(200);
    expect(app.comparisonWeek).not.toBe(previousWeek);
  });

  it('deletes only the selected record after confirmation and preserves other records', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const ledgerBefore = [...app.ledger];
    const fillUpsBefore = [...app.fillUps];
    const target = app.ledger.find((entry) => entry.id === 2)!;
    app.selectedWeek = weekFor(target.date);
    const expensesBefore = app.selectedWeekExpenses;
    app.requestDelete('ledger', target.id, target.description);
    expect(app.deleteCandidate?.id).toBe(target.id);
    expect(app.ledger).toHaveLength(ledgerBefore.length);

    app.confirmDelete();
    expect(app.ledger).toHaveLength(ledgerBefore.length - 1);
    expect(app.ledger.some((entry) => entry.id === target.id)).toBe(false);
    expect(app.fillUps).toEqual(fillUpsBefore);
    expect(app.selectedWeekExpenses).toBe(expensesBefore - target.amount);
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

  it('shows the weekly comparison in reports and individual delete actions in finance', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.setSection('Relatorios');
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('COMPARAÇÃO SEMANAL');
    expect((fixture.nativeElement.textContent as string)).not.toContain('Zerar todos os registros');

    const financeFixture = TestBed.createComponent(App);
    const financeApp = financeFixture.componentInstance;
    financeApp.selectedWeek = weekFor(financeApp.ledger[0].date);
    financeApp.setSection('Financeiro');
    financeFixture.detectChanges();
    const deleteButtons = financeFixture.nativeElement.querySelectorAll('.delete-record-button') as NodeListOf<HTMLButtonElement>;
    expect(deleteButtons.length).toBeGreaterThan(0);
    expect(deleteButtons[0].getAttribute('aria-label')).toContain('Excluir lançamento');
  });
});
