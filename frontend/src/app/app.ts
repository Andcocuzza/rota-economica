import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type FuelKind = 'Gasolina comum' | 'Gasolina aditivada' | 'Etanol comum' | 'Etanol aditivado';
type Section = 'Visao geral' | 'Abastecimentos' | 'Comparador' | 'Financeiro' | 'Manutencao' | 'Relatorios' | 'Mapa';

interface FillUp {
  id: number;
  date: string;
  station: string;
  fuel: FuelKind;
  price: number;
  liters: number;
  total: number;
  distanceDriven?: number;
}

interface LedgerEntry {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  kind: 'Receita' | 'Despesa';
}

interface WorkDay {
  id: number;
  date: string;
  hours: number;
}

type DeletableRecord = FillUp | LedgerEntry | WorkDay;
type RecordCollection = 'fillups' | 'ledger' | 'maintenance' | 'workdays';

interface DeleteCandidate {
  collection: RecordCollection;
  id: number;
  description: string;
}

@Component({
  imports: [FormsModule, CurrencyPipe, DatePipe, DecimalPipe],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  readonly Math = Math;
  readonly sections: Section[] = ['Visao geral', 'Abastecimentos', 'Comparador', 'Financeiro', 'Manutencao', 'Relatorios', 'Mapa'];
  activeSection: Section = 'Visao geral';
  readonly fuelKinds: FuelKind[] = ['Gasolina comum', 'Gasolina aditivada', 'Etanol comum', 'Etanol aditivado'];
  readonly today = new Date().toISOString().slice(0, 10);
  readonly currentWeek = this.weekStart(this.today);
  selectedWeek = this.currentWeek;
  deleteCandidate: DeleteCandidate | null = null;
  readonly fillUps: FillUp[] = this.readRecords('rota-economica-fillups', [
    { id: 1, date: '2026-10-06', station: 'Posto Avenida', fuel: 'Gasolina comum', price: 5.89, liters: 38, total: 223.82 },
    { id: 2, date: '2026-10-11', station: 'Auto Posto Central', fuel: 'Gasolina comum', price: 5.79, liters: 37, total: 214.23 },
  ]);
  readonly ledger: LedgerEntry[] = this.readRecords('rota-economica-ledger', [
    { id: 1, date: '2026-10-12', description: 'Ganhos Uber', category: 'Corridas', amount: 438.5, kind: 'Receita' },
    { id: 2, date: '2026-10-12', description: 'Lavagem completa', category: 'Limpeza', amount: 45, kind: 'Despesa' },
    { id: 3, date: '2026-10-11', description: 'Ganhos 99', category: 'Corridas', amount: 386, kind: 'Receita' },
  ]);
  readonly workDays: WorkDay[] = this.readRecords('rota-economica-workdays', []);

  fillUpForm = { date: this.today, station: '', fuel: 'Gasolina comum' as FuelKind, price: 0, totalPaid: 0, distanceDriven: 0 };
  ledgerForm = { date: this.today, description: '', category: 'Corridas', amount: 0, kind: 'Receita' as 'Receita' | 'Despesa' };
  workDayForm = { date: this.today, hours: 0 };
  compareForm = { distance: 8 };
  maintenanceForm = { description: '', category: 'Revisao', amount: 0, date: this.today };
  maintenance: LedgerEntry[] = this.readRecords('rota-economica-maintenance', []);
  notice = '';
  private noticeTimer?: ReturnType<typeof setTimeout>;

  get totalIncome(): number {
    return this.sumLedger(this.currentWeek, 'Receita');
  }

  get currentWeekHours(): number {
    return this.sumHours(this.currentWeek);
  }

  get currentWeekHourlyIncome(): number | null {
    return this.currentWeekHours > 0 ? this.totalIncome / this.currentWeekHours : null;
  }

  get totalExpenses(): number {
    return this.weekExpenses(this.currentWeek);
  }

  get estimatedProfit(): number {
    return this.totalIncome - this.totalExpenses;
  }

  get costPerKm(): number | null {
    const latest = this.latestFillUp;
    return latest?.distanceDriven && latest.distanceDriven > 0 ? latest.total / latest.distanceDriven : null;
  }

  get fuelCostTotal(): number {
    return this.sumFillUps(this.currentWeek);
  }

  get otherExpenses(): number {
    return this.sumLedger(this.currentWeek, 'Despesa');
  }

  get maintenanceCostTotal(): number {
    return this.sumMaintenance(this.currentWeek);
  }

  get weekOptions(): string[] {
    const recordedWeeks = [
      ...this.fillUps.map((entry) => this.weekStart(entry.date)),
      ...this.ledger.map((entry) => this.weekStart(entry.date)),
      ...this.maintenance.map((entry) => this.weekStart(entry.date)),
      ...this.workDays.map((entry) => this.weekStart(entry.date)),
      this.currentWeek,
    ];
    return [...new Set(recordedWeeks)].sort((left, right) => right.localeCompare(left));
  }

  get comparisonWeek(): string {
    return this.addDays(this.selectedWeek, -7);
  }

  get selectedWeekIncome(): number {
    return this.sumLedger(this.selectedWeek, 'Receita');
  }

  get selectedWeekHours(): number {
    return this.sumHours(this.selectedWeek);
  }

  get selectedWeekHourlyIncome(): number | null {
    return this.selectedWeekHours > 0 ? this.selectedWeekIncome / this.selectedWeekHours : null;
  }

  get selectedWeekExpenses(): number {
    return this.weekExpenses(this.selectedWeek);
  }

  get selectedWeekProfit(): number {
    return this.selectedWeekIncome - this.selectedWeekExpenses;
  }

  get comparisonWeekIncome(): number {
    return this.sumLedger(this.comparisonWeek, 'Receita');
  }

  get comparisonWeekHours(): number {
    return this.sumHours(this.comparisonWeek);
  }

  get comparisonWeekExpenses(): number {
    return this.weekExpenses(this.comparisonWeek);
  }

  get comparisonWeekProfit(): number {
    return this.comparisonWeekIncome - this.comparisonWeekExpenses;
  }

  get selectedWeekLedger(): LedgerEntry[] {
    return this.sortedLedger.filter((entry) => this.isInWeek(entry.date, this.selectedWeek));
  }

  get currentWeekBars(): { day: string; amount: number; height: number }[] {
    return this.barsForWeek(this.currentWeek);
  }

  get selectedWeekBars(): { day: string; amount: number; height: number }[] {
    return this.barsForWeek(this.selectedWeek);
  }

  weekLabel(week: string): string {
    const start = this.localDate(week);
    const end = this.localDate(this.addDays(week, 6));
    const startLabel = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const endLabel = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${startLabel} a ${endLabel}`;
  }

  get selectedWeekMaintenance(): number {
    return this.sumMaintenance(this.selectedWeek);
  }

  get selectedWeekFuel(): number {
    return this.sumFillUps(this.selectedWeek);
  }

  get selectedWeekOtherExpenses(): number {
    return this.sumLedger(this.selectedWeek, 'Despesa');
  }

  get sortedFillUps(): FillUp[] {
    return [...this.fillUps].sort((left, right) => right.date.localeCompare(left.date));
  }

  get sortedLedger(): LedgerEntry[] {
    return [...this.ledger].sort((left, right) => right.date.localeCompare(left.date));
  }

  get selectedWeekWorkDays(): WorkDay[] {
    return this.workDays.filter((entry) => this.isInWeek(entry.date, this.selectedWeek))
      .sort((left, right) => right.date.localeCompare(left.date));
  }

  get latestFillUp(): FillUp | undefined {
    return this.fillUps.at(-1);
  }

  get fuelOptions(): { name: 'Gasolina' | 'Etanol'; distanceMeasured: number; costPerKm: number | null; tripCost: number | null }[] {
    const options = (['Gasolina', 'Etanol'] as const).map((name) => {
      const entries = this.fillUps.filter((entry) =>
        entry.fuel.startsWith(name) && (entry.distanceDriven ?? 0) > 0);
      const distanceMeasured = entries.reduce((sum, entry) => sum + (entry.distanceDriven ?? 0), 0);
      const totalPaid = entries.reduce((sum, entry) => sum + entry.total, 0);
      const costPerKm = distanceMeasured > 0 ? totalPaid / distanceMeasured : null;
      return {
        name,
        distanceMeasured,
        costPerKm,
        tripCost: costPerKm === null ? null : costPerKm * this.compareForm.distance,
      };
    });
    return options.sort((left, right) => {
      if (left.costPerKm === null) return 1;
      if (right.costPerKm === null) return -1;
      return left.costPerKm - right.costPerKm;
    });
  }

  setSection(section: Section): void {
    this.activeSection = section;
    this.notice = '';
  }

  labelFor(section: Section): string {
    switch (section) {
      case 'Visao geral': return 'Visão geral';
      case 'Comparador': return 'Comparador';
      case 'Manutencao': return 'Manutenção';
      case 'Relatorios': return 'Relatórios';
      case 'Mapa': return 'Mapa de postos';
      default: return section;
    }
  }

  isIncome(entry: LedgerEntry): boolean {
    return entry.kind === 'Receita';
  }

  sumAmounts(total: number, entry: LedgerEntry): number {
    return total + entry.amount;
  }

  requestDelete(collection: RecordCollection, id: number, description: string): void {
    this.deleteCandidate = { collection, id, description };
  }

  cancelDelete(): void {
    this.deleteCandidate = null;
  }

  confirmDelete(): void {
    const candidate = this.deleteCandidate;
    if (!candidate) return;

    let records: DeletableRecord[];
    let storageKey: string;
    switch (candidate.collection) {
      case 'fillups':
        records = this.fillUps;
        storageKey = 'rota-economica-fillups';
        break;
      case 'ledger':
        records = this.ledger;
        storageKey = 'rota-economica-ledger';
        break;
      case 'maintenance':
        records = this.maintenance;
        storageKey = 'rota-economica-maintenance';
        break;
      case 'workdays':
        records = this.workDays;
        storageKey = 'rota-economica-workdays';
        break;
    }
    const index = records.findIndex((record) => record.id === candidate.id);
    if (index < 0) {
      this.cancelDelete();
      this.showNotice('Este registro já não está disponível.');
      return;
    }

    records.splice(index, 1);
    this.persist(storageKey, records);
    this.deleteCandidate = null;
    this.showNotice('Registro excluído. Os demais registros foram mantidos.');
  }

  addFillUp(): void {
    const { date, station, fuel, price, totalPaid, distanceDriven } = this.fillUpForm;
    if (!station.trim() || price <= 0 || totalPaid <= 0 || distanceDriven <= 0) {
      this.showNotice('Preencha posto, preço, valor pago e distância percorrida com valores válidos.');
      return;
    }
    const liters = Math.round((totalPaid / price) * 1000) / 1000;
    this.fillUps.push({ id: Date.now(), date, station: station.trim(), fuel, price, liters, total: totalPaid, distanceDriven });
    this.persist('rota-economica-fillups', this.fillUps);
    this.fillUpForm = { date: this.today, station: '', fuel: 'Gasolina comum', price: 0, totalPaid: 0, distanceDriven: 0 };
    this.showNotice('Abastecimento registrado.');
  }

  addLedgerEntry(): void {
    const { date, description, category, amount, kind } = this.ledgerForm;
    if (!description.trim() || amount <= 0) {
      this.showNotice('Informe uma descricao e um valor maior que zero.');
      return;
    }
    this.ledger.unshift({ id: Date.now(), date, description: description.trim(), category, amount, kind });
    this.persist('rota-economica-ledger', this.ledger);
    this.ledgerForm = { date: this.today, description: '', category: 'Corridas', amount: 0, kind };
    this.showNotice('Lancamento financeiro salvo.');
  }

  addWorkDay(): void {
    const { date, hours } = this.workDayForm;
    if (!date || hours <= 0 || hours > 24) {
      this.showNotice('Informe uma jornada entre 0,25 e 24 horas.');
      return;
    }
    const existing = this.workDays.find((entry) => entry.date === date);
    if (existing) {
      existing.hours = hours;
    } else {
      this.workDays.push({ id: Date.now(), date, hours });
    }
    this.persist('rota-economica-workdays', this.workDays);
    this.workDayForm = { date: this.today, hours: 0 };
    this.showNotice(existing ? 'Jornada do dia atualizada.' : 'Jornada do dia registrada.');
  }

  addMaintenance(): void {
    const { date, description, category, amount } = this.maintenanceForm;
    if (!description.trim() || amount <= 0) {
      this.showNotice('Informe a manutencao e o custo.');
      return;
    }
    this.maintenance.unshift({ id: Date.now(), date, description: description.trim(), category, amount, kind: 'Despesa' });
    this.persist('rota-economica-maintenance', this.maintenance);
    this.maintenanceForm = { description: '', category: 'Revisao', amount: 0, date: this.today };
    this.showNotice('Custo de manutencao registrado.');
  }

  private showNotice(message: string): void {
    this.notice = message;
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => this.notice = '', 3200);
  }

  private sumLedger(week: string, kind: LedgerEntry['kind']): number {
    return this.ledger
      .filter((entry) => this.isInWeek(entry.date, week) && entry.kind === kind)
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  private sumHours(week: string): number {
    return this.workDays.filter((entry) => this.isInWeek(entry.date, week))
      .reduce((sum, entry) => sum + entry.hours, 0);
  }

  private sumFillUps(week: string): number {
    return this.fillUps.filter((entry) => this.isInWeek(entry.date, week))
      .reduce((sum, entry) => sum + entry.total, 0);
  }

  private sumMaintenance(week: string): number {
    return this.maintenance.filter((entry) => this.isInWeek(entry.date, week))
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  private weekExpenses(week: string): number {
    return this.sumLedger(week, 'Despesa') + this.sumFillUps(week) + this.sumMaintenance(week);
  }

  private barsForWeek(week: string): { day: string; amount: number; height: number }[] {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
      .map((day) => ({ day, amount: 0, height: 0 }));
    this.ledger.filter((entry) => entry.kind === 'Receita' && this.isInWeek(entry.date, week)).forEach((entry) => {
      const date = this.localDate(entry.date);
      const dayIndex = (date.getDay() + 6) % 7;
      days[dayIndex].amount += entry.amount;
    });
    const maxAmount = Math.max(...days.map((day) => day.amount), 0);
    return days.map((day) => ({
      ...day,
      height: maxAmount > 0 ? Math.max(8, Math.round((day.amount / maxAmount) * 100)) : 0,
    }));
  }

  private isInWeek(date: string, week: string): boolean {
    return date >= week && date <= this.addDays(week, 6);
  }

  private weekStart(date: string): string {
    const localDate = this.localDate(date);
    localDate.setDate(localDate.getDate() - ((localDate.getDay() + 6) % 7));
    return this.dateKey(localDate);
  }

  private addDays(date: string, days: number): string {
    const result = this.localDate(date);
    result.setDate(result.getDate() + days);
    return this.dateKey(result);
  }

  private localDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private readRecords<T>(key: string, demoRecords: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored) as T;
      return demoRecords;
    } catch {
      return demoRecords;
    }
  }

  private read<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) as T : fallback;
    } catch {
      return fallback;
    }
  }

  private persist(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      this.showNotice('Nao foi possivel salvar neste dispositivo.');
    }
  }
}
