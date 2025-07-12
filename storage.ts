import {
  users, healthRecords, appointments, medications, aiDiagnoses, patientConsents, treatmentActions,
  transactions, budgets, expenses, portfolioItems, tasks, goals, moodLogs, 
  leads, invoices, applications, documents, complaints,
  type User, type InsertUser, type HealthRecord, type InsertHealthRecord,
  type Appointment, type InsertAppointment, type Medication, type InsertMedication,
  type AiDiagnosis, type InsertAiDiagnosis, type PatientConsent, type InsertPatientConsent,
  type TreatmentAction, type InsertTreatmentAction, type Transaction, type InsertTransaction, 
  type Budget, type InsertBudget, type Expense, type InsertExpense,
  type PortfolioItem, type InsertPortfolioItem, type Task, type InsertTask, type Goal, type InsertGoal,
  type MoodLog, type InsertMoodLog, type Lead, type InsertLead,
  type Invoice, type InsertInvoice, type Application, type InsertApplication,
  type Document, type InsertDocument, type Complaint, type InsertComplaint
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Health methods
  getHealthRecords(userId: number): Promise<HealthRecord[]>;
  createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord>;
  getAppointments(userId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getMedications(userId: number): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, medication: Partial<Medication>): Promise<Medication>;
  getAiDiagnoses(userId: number): Promise<AiDiagnosis[]>;
  createAiDiagnosis(diagnosis: InsertAiDiagnosis): Promise<AiDiagnosis>;
  getPatientConsents(userId: number): Promise<PatientConsent[]>;
  createPatientConsent(consent: InsertPatientConsent): Promise<PatientConsent>;
  getTreatmentActions(userId: number): Promise<TreatmentAction[]>;
  createTreatmentAction(action: InsertTreatmentAction): Promise<TreatmentAction>;

  // Finance methods
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getBudgets(userId: number): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<Budget>): Promise<Budget>;
  getExpenses(userId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  getPortfolioItems(userId: number): Promise<PortfolioItem[]>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;

  // Personal methods
  getTasks(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task>;
  getGoals(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal>;
  getMoodLogs(userId: number): Promise<MoodLog[]>;
  createMoodLog(moodLog: InsertMoodLog): Promise<MoodLog>;

  // B2B methods
  getLeads(userId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<Lead>): Promise<Lead>;
  getInvoices(userId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice>;

  // Government methods
  getApplications(userId: number): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: Partial<Application>): Promise<Application>;
  getDocuments(userId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  getComplaints(userId: number): Promise<Complaint[]>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private healthRecords: Map<number, HealthRecord> = new Map();
  private appointments: Map<number, Appointment> = new Map();
  private medications: Map<number, Medication> = new Map();
  private aiDiagnoses: Map<number, AiDiagnosis> = new Map();
  private patientConsents: Map<number, PatientConsent> = new Map();
  private treatmentActions: Map<number, TreatmentAction> = new Map();
  private transactions: Map<number, Transaction> = new Map();
  private budgets: Map<number, Budget> = new Map();
  private expenses: Map<number, Expense> = new Map();
  private portfolioItems: Map<number, PortfolioItem> = new Map();
  private tasks: Map<number, Task> = new Map();
  private goals: Map<number, Goal> = new Map();
  private moodLogs: Map<number, MoodLog> = new Map();
  private leads: Map<number, Lead> = new Map();
  private invoices: Map<number, Invoice> = new Map();
  private applications: Map<number, Application> = new Map();
  private documents: Map<number, Document> = new Map();
  private complaints: Map<number, Complaint> = new Map();

  private currentId = 1;

  private generateId(): number {
    return this.currentId++;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.generateId();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Health methods
  async getHealthRecords(userId: number): Promise<HealthRecord[]> {
    return Array.from(this.healthRecords.values()).filter(record => record.userId === userId);
  }

  async createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord> {
    const id = this.generateId();
    const healthRecord: HealthRecord = { ...record, id };
    this.healthRecords.set(id, healthRecord);
    return healthRecord;
  }

  async getAppointments(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(appointment => appointment.userId === userId);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.generateId();
    const newAppointment: Appointment = { ...appointment, id, status: appointment.status || 'scheduled' };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async getMedications(userId: number): Promise<Medication[]> {
    return Array.from(this.medications.values()).filter(medication => medication.userId === userId);
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const id = this.generateId();
    const newMedication: Medication = { ...medication, id, taken: medication.taken || false };
    this.medications.set(id, newMedication);
    return newMedication;
  }

  async updateMedication(id: number, medication: Partial<Medication>): Promise<Medication> {
    const existing = this.medications.get(id);
    if (!existing) throw new Error('Medication not found');
    const updated = { ...existing, ...medication };
    this.medications.set(id, updated);
    return updated;
  }

  // Enhanced Health methods
  async getAiDiagnoses(userId: number): Promise<AiDiagnosis[]> {
    return Array.from(this.aiDiagnoses.values()).filter(diagnosis => diagnosis.userId === userId);
  }

  async createAiDiagnosis(diagnosis: InsertAiDiagnosis): Promise<AiDiagnosis> {
    const id = this.generateId();
    const newDiagnosis: AiDiagnosis = { 
      ...diagnosis, 
      id, 
      timestamp: new Date(),
      verified: diagnosis.verified || false 
    };
    this.aiDiagnoses.set(id, newDiagnosis);
    return newDiagnosis;
  }

  async getPatientConsents(userId: number): Promise<PatientConsent[]> {
    return Array.from(this.patientConsents.values()).filter(consent => consent.userId === userId);
  }

  async createPatientConsent(consent: InsertPatientConsent): Promise<PatientConsent> {
    const id = this.generateId();
    const newConsent: PatientConsent = { 
      ...consent, 
      id, 
      timestamp: new Date(),
      granted: consent.granted || false 
    };
    this.patientConsents.set(id, newConsent);
    return newConsent;
  }

  async getTreatmentActions(userId: number): Promise<TreatmentAction[]> {
    return Array.from(this.treatmentActions.values()).filter(action => action.userId === userId);
  }

  async createTreatmentAction(action: InsertTreatmentAction): Promise<TreatmentAction> {
    const id = this.generateId();
    const newAction: TreatmentAction = { 
      ...action, 
      id, 
      timestamp: new Date(),
      verified: action.verified || false 
    };
    this.treatmentActions.set(id, newAction);
    return newAction;
  }

  // Finance methods
  async getTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(transaction => transaction.userId === userId);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.generateId();
    const newTransaction: Transaction = { ...transaction, id };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(budget => budget.userId === userId);
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const id = this.generateId();
    const newBudget: Budget = { ...budget, id, spent: budget.spent || "0" };
    this.budgets.set(id, newBudget);
    return newBudget;
  }

  async updateBudget(id: number, budget: Partial<Budget>): Promise<Budget> {
    const existing = this.budgets.get(id);
    if (!existing) throw new Error('Budget not found');
    const updated = { ...existing, ...budget };
    this.budgets.set(id, updated);
    return updated;
  }

  // Enhanced Finance methods
  async getExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => expense.userId === userId);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.generateId();
    const newExpense: Expense = { 
      ...expense, 
      id, 
      date: expense.date || new Date(),
      isRecurring: expense.isRecurring || false,
      tags: expense.tags || [],
      location: expense.location || null,
      subcategory: expense.subcategory || null
    };
    this.expenses.set(id, newExpense);
    return newExpense;
  }

  async getPortfolioItems(userId: number): Promise<PortfolioItem[]> {
    return Array.from(this.portfolioItems.values()).filter(item => item.userId === userId);
  }

  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const id = this.generateId();
    const newItem: PortfolioItem = { 
      ...item, 
      id, 
      lastUpdated: new Date()
    };
    this.portfolioItems.set(id, newItem);
    return newItem;
  }

  // Personal methods
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.generateId();
    const newTask: Task = { 
      ...task, 
      id, 
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      completed: task.completed || false,
      description: task.description || null,
      dueDate: task.dueDate || null
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    const existing = this.tasks.get(id);
    if (!existing) throw new Error('Task not found');
    const updated = { ...existing, ...task };
    this.tasks.set(id, updated);
    return updated;
  }

  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.generateId();
    const newGoal: Goal = { 
      ...goal, 
      id, 
      current: goal.current || "0",
      description: goal.description || null,
      deadline: goal.deadline || null
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<Goal>): Promise<Goal> {
    const existing = this.goals.get(id);
    if (!existing) throw new Error('Goal not found');
    const updated = { ...existing, ...goal };
    this.goals.set(id, updated);
    return updated;
  }

  async getMoodLogs(userId: number): Promise<MoodLog[]> {
    return Array.from(this.moodLogs.values()).filter(moodLog => moodLog.userId === userId);
  }

  async createMoodLog(moodLog: InsertMoodLog): Promise<MoodLog> {
    const id = this.generateId();
    const newMoodLog: MoodLog = { ...moodLog, id, notes: moodLog.notes || null };
    this.moodLogs.set(id, newMoodLog);
    return newMoodLog;
  }

  // B2B methods
  async getLeads(userId: number): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.userId === userId);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.generateId();
    const newLead: Lead = { 
      ...lead, 
      id, 
      status: lead.status || 'cold',
      source: lead.source || null,
      phone: lead.phone || null
    };
    this.leads.set(id, newLead);
    return newLead;
  }

  async updateLead(id: number, lead: Partial<Lead>): Promise<Lead> {
    const existing = this.leads.get(id);
    if (!existing) throw new Error('Lead not found');
    const updated = { ...existing, ...lead };
    this.leads.set(id, updated);
    return updated;
  }

  async getInvoices(userId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.userId === userId);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.generateId();
    const newInvoice: Invoice = { ...invoice, id, status: invoice.status || 'pending' };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice> {
    const existing = this.invoices.get(id);
    if (!existing) throw new Error('Invoice not found');
    const updated = { ...existing, ...invoice };
    this.invoices.set(id, updated);
    return updated;
  }

  // Government methods
  async getApplications(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(application => application.userId === userId);
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const id = this.generateId();
    const newApplication: Application = { ...application, id, status: application.status || 'pending' };
    this.applications.set(id, newApplication);
    return newApplication;
  }

  async updateApplication(id: number, application: Partial<Application>): Promise<Application> {
    const existing = this.applications.get(id);
    if (!existing) throw new Error('Application not found');
    const updated = { ...existing, ...application };
    this.applications.set(id, updated);
    return updated;
  }

  async getDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(document => document.userId === userId);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.generateId();
    const newDocument: Document = { 
      ...document, 
      id, 
      status: document.status || 'pending',
      verificationDate: document.verificationDate || null
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async getComplaints(userId: number): Promise<Complaint[]> {
    return Array.from(this.complaints.values()).filter(complaint => complaint.userId === userId);
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const id = this.generateId();
    const newComplaint: Complaint = { ...complaint, id, status: complaint.status || 'pending' };
    this.complaints.set(id, newComplaint);
    return newComplaint;
  }
}

export const storage = new MemStorage();
