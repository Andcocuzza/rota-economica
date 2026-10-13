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
  odometer: number;
  fullTank: boolean;
}

interface LedgerEntry {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  kind: 'Receita' | 'Despesa';
}

type RecordCollection = 'fillups' | 'ledger' | 'maintenance';

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
  readonly currentMonth = this.today.slice(0, 7);
  selectedMonth = this.currentMonth;
  deleteCandidate: DeleteCandidate | null = null;
  readonly fillUps: FillUp[] = this.readRecords('rota-economica-fillups', [
    { id: 1, date: '2026-10-06', station: 'Posto Avenida', fuel: 'Gasolina comum', price: 5.89, liters: 38, total: 223.82, odometer: 31840, fullTank: true },
    { id: 2, date: '2026-10-11', station: 'Auto Posto Central', fuel: 'Gasolina comum', price: 5.79, liters: 37, total: 214.23, odometer: 32295, fullTank: true },
  ]);
  readonly ledger: LedgerEntry[] = this.readRecords('rota-economica-ledger', [
    { id: 1, date: '2026-10-12', description: 'Ganhos Uber', category: 'Corridas', amount: 438.5, kind: 'Receita' },
    { id: 2, date: '2026-10-12', description: 'Lavagem completa', category: 'Limpeza', amount: 45, kind: 'Despesa' },
    { id: 3, date: '2026-10-11', description: 'Ganhos 99', category: 'Corridas', amount: 386, kind: 'Receita' },
  ]);

  fillUpForm = { date: this.today, station: '', fuel: 'Gasolina comum' as FuelKind, price: 0, liters: 0, odometer: 0, fullTank: true };
  ledgerForm = { date: this.today, description: '', category: 'Corridas', amount: 0, kind: 'Receita' as 'Receita' | 'Despesa' };
  compareForm = { distance: 8, consumption: 11, gasoline: 5.89, additive: 6.09, ethanol: 3.89, ethanolAdditive: 4.09 };
  maintenanceForm = { description: '', category: 'Revisao', amount: 0, date: this.today };
  maintenance: LedgerEntry[] = this.readRecords('rota-economica-maintenance', []);
  notice = '';
  private noticeTimer?: ReturnType<typeof setTimeout>;

  get totalIncome(): number {
    return this.sumLedger(this.currentMonth, 'Receita');
  }

  get totalExpenses(): number {
    return this.monthExpenses(this.currentMonth);
  }

  get estimatedProfit(): number {
    return this.totalIncome - this.totalExpenses;
  }

  get averageConsumption(): number | null {
    const fullTanks = this.fillUps.filter((entry) => entry.fullTank).sort((left, right) => left.odometer - right.odometer);
    if (fullTanks.length < 2) return null;
    const previous = fullTanks.at(-2)!;
    const latest = fullTanks.at(-1)!;
    const distance = latest.odometer - previous.odometer;
    const liters = this.fillUps
      .filter((entry) => entry.odometer > previous.odometer && entry.odometer <= latest.odometer)
      .reduce((sum, entry) => sum + entry.liters, 0);
    return distance > 0 && liters > 0 ? distance / liters : null;
  }

  get costPerKm(): number | null {
    return this.averageConsumption ? this.latestPrice / this.averageConsumption : null;
  }

  get latestPrice(): number {
    return this.fillUps.at(-1)?.price ?? 0;
  }

  get fuelCostTotal(): number {
    return this.sumFillUps(this.currentMonth);
  }

  get otherExpenses(): number {
    return this.sumLedger(this.currentMonth, 'Despesa');
  }

  get maintenanceCostTotal(): number {
    return this.sumMaintenance(this.currentMonth);
  }

  get monthOptions(): string[] {
    const recordedMonths = [
      ...this.fillUps.map((entry) => entry.date.slice(0, 7)),
      ...this.ledger.map((entry) => entry.date.slice(0, 7)),
      ...this.maintenance.map((entry) => entry.date.slice(0, 7)),
      this.currentMonth,
    ];
    return [...new Set(recordedMonths)].sort((left, right) => right.localeCompare(left));
  }

  get comparisonMonth(): string {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const previous = new Date(Date.UTC(year, month - 2, 1));
    return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  get selectedMonthIncome(): number {
    return this.sumLedger(this.selectedMonth, 'Receita');
  }

  get selectedMonthExpenses(): number {
    return this.monthExpenses(this.selectedMonth);
  }

  get selectedMonthProfit(): number {
    return this.selectedMonthIncome - this.selectedMonthExpenses;
  }

  get comparisonMonthIncome(): number {
    return this.sumLedger(this.comparisonMonth, 'Receita');
  }

  get comparisonMonthExpenses(): number {
    return this.monthExpenses(this.comparisonMonth);
  }

  get comparisonMonthProfit(): number {
    return this.comparisonMonthIncome - this.comparisonMonthExpenses;
  }

  get selectedMonthLedger(): LedgerEntry[] {
    return this.sortedLedger.filter((entry) => entry.date.startsWith(this.selectedMonth));
  }

  get currentMonthBars(): { day: string; amount: number; height: number }[] {
    return this.barsForMonth(this.currentMonth);
  }

  get selectedMonthBars(): { day: string; amount: number; height: number }[] {
    return this.barsForMonth(this.selectedMonth);
  }

  monthLabel(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);
    return new Date(year, monthNumber - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  get selectedMonthMaintenance(): number {
    return this.sumMaintenance(this.selectedMonth);
  }

  get selectedMonthFuel(): number {
    return this.sumFillUps(this.selectedMonth);
  }

  get selectedMonthOtherExpenses(): number {
    return this.sumLedger(this.selectedMonth, 'Despesa');
  }

  get sortedFillUps(): FillUp[] {
    return [...this.fillUps].sort((left, right) => right.date.localeCompare(left.date));
  }

  get sortedLedger(): LedgerEntry[] {
    return [...this.ledger].sort((left, right) => right.date.localeCompare(left.date));
  }

  get fuelOptions(): { name: FuelKind; price: number; costPerKm: number; tripCost: number; station: string }[] {
    const candidates = [
      { name: 'Gasolina comum' as FuelKind, price: this.compareForm.gasoline, consumption: this.compareForm.consumption },
      { name: 'Gasolina aditivada' as FuelKind, price: this.compareForm.additive, consumption: this.compareForm.consumption },
      { name: 'Etanol comum' as FuelKind, price: this.compareForm.ethanol, consumption: this.compareForm.consumption * 0.7 },
      { name: 'Etanol aditivado' as FuelKind, price: this.compareForm.ethanolAdditive, consumption: this.compareForm.consumption * 0.7 },
    ];
    return candidates.map((item) => {
      const costPerKm = item.price / item.consumption;
      const tripCost = costPerKm * this.compareForm.distance;
      const station = this.fillUps.filter((fillUp) => fillUp.fuel === item.name).sort((a, b) => a.price - b.price)[0]?.station ?? 'Informe o preco local';
      return { name: item.name, price: item.price, costPerKm, tripCost, station };
    }).sort((left, right) => left.costPerKm - right.costPerKm);
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

    let records: Array<FillUp | LedgerEntry>;
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
    this.showNotice('Registro excluído. Os demais registros e meses foram mantidos.');
  }

  addFillUp(): void {
    const { date, station, fuel, price, liters, odometer, fullTank } = this.fillUpForm;
    if (!station.trim() || price <= 0 || liters <= 0 || odometer <= 0) {
      this.showNotice('Preencha posto, preco, litros e quilometragem com valores validos.');
      return;
    }
    if (this.fillUps.some((entry) => entry.odometer >= odometer)) {
      this.showNotice('A quilometragem deve ser maior que a do abastecimento anterior.');
      return;
    }
    this.fillUps.push({ id: Date.now(), date, station: station.trim(), fuel, price, liters, total: price * liters, odometer, fullTank });
    this.persist('rota-economica-fillups', this.fillUps);
    this.fillUpForm = { date: this.today, station: '', fuel: 'Gasolina comum', price: 0, liters: 0, odometer: 0, fullTank: true };
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

  private sumLedger(month: string, kind: LedgerEntry['kind']): number {
    return this.ledger
      .filter((entry) => entry.date.startsWith(month) && entry.kind === kind)
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  private sumFillUps(month: string): number {
    return this.fillUps.filter((entry) => entry.date.startsWith(month))
      .reduce((sum, entry) => sum + entry.total, 0);
  }

  private sumMaintenance(month: string): number {
    return this.maintenance.filter((entry) => entry.date.startsWith(month))
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  private monthExpenses(month: string): number {
    return this.sumLedger(month, 'Despesa') + this.sumFillUps(month) + this.sumMaintenance(month);
  }

  private barsForMonth(month: string): { day: string; amount: number; height: number }[] {
    const weeks = Array.from({ length: 5 }, (_, index) => ({ day: `Sem ${index + 1}`, amount: 0, height: 0 }));
    this.ledger.filter((entry) => entry.kind === 'Receita' && entry.date.startsWith(month)).forEach((entry) => {
      const weekIndex = Math.min(4, Math.floor((Number(entry.date.slice(8, 10)) - 1) / 7));
      weeks[weekIndex].amount += entry.amount;
    });
    const maxAmount = Math.max(...weeks.map((week) => week.amount), 0);
    return weeks.map((week) => ({
      ...week,
      height: maxAmount > 0 ? Math.max(8, Math.round((week.amount / maxAmount) * 100)) : 0,
    }));
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
