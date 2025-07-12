import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertHealthRecordSchema, insertAppointmentSchema, insertMedicationSchema,
  insertAiDiagnosisSchema, insertPatientConsentSchema, insertTreatmentActionSchema,
  insertTransactionSchema, insertBudgetSchema, insertExpenseSchema, insertPortfolioItemSchema,
  insertTaskSchema, insertGoalSchema, insertMoodLogSchema, insertLeadSchema,
  insertInvoiceSchema, insertApplicationSchema, insertDocumentSchema,
  insertComplaintSchema
} from "@shared/schema";
import multer from "multer";
import { extractTripletsFromText, generateSummary } from "./cohere-service";
import { createClient } from '@supabase/supabase-js';

export async function registerRoutes(app: Express): Promise<Server> {
  const userId = 1; // Mock user ID for demo
  
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept text files, log files, and common document formats
      const allowedMimeTypes = [
        'text/plain',
        'text/csv',
        'application/json',
        'text/log',
        'application/octet-stream'
      ];
      
      if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.log')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only text files, logs, and JSON files are allowed.'));
      }
    }
  });

  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // Route to get all triplets - moved to top to avoid conflicts
  app.get("/api/triplets", async (req, res) => {
    try {
      console.log('Fetching triplets from Supabase...');
      const { data, error } = await supabase
        .from('Triplets')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: "Failed to fetch triplets", details: error.message });
      }

      console.log(`Found ${data?.length || 0} triplets`);
      res.json(data || []);
    } catch (error) {
      console.error('Error fetching triplets:', error);
      res.status(500).json({ 
        error: "Failed to fetch triplets",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // File upload and triplet extraction route
  app.post("/api/triplets/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf8');
      
      if (!fileContent.trim()) {
        return res.status(400).json({ error: "File is empty" });
      }

      // Store the original log file in Supabase
      const logRecord = {
        timestamp: new Date().toISOString(),
        agent: 'LogFileUpload',
        summary: `Log file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`,
        ipfs_hash: `logfile_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        triplets: {
          type: 'log_file',
          raw_content: fileContent,
          file_name: req.file.originalname,
          file_size: req.file.size,
          upload_timestamp: new Date().toISOString(),
          status: 'uploaded'
        },
        event_timestamp: new Date().toISOString()
      };

      const { data: logData, error: logError } = await supabase
        .from('Triplets')
        .insert([logRecord])
        .select();

      if (logError) {
        console.error('Supabase error storing log:', logError);
        return res.status(500).json({ error: "Failed to save log file to database" });
      }

      res.json({
        success: true,
        message: "Log file uploaded and stored successfully",
        logRecord: logData[0],
        fileInfo: {
          name: req.file.originalname,
          size: req.file.size,
          id: logData[0].id
        }
      });

    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ 
        error: "Failed to process file",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Route to analyze a specific log file and extract triplets
  app.post("/api/triplets/:id/analyze", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the log file from Supabase
      const { data: logFile, error: fetchError } = await supabase
        .from('Triplets')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !logFile) {
        return res.status(404).json({ error: "Log file not found" });
      }

      if (!logFile.triplets?.raw_content) {
        return res.status(400).json({ error: "No log content found for analysis" });
      }

      // Extract triplets using Cohere API
      const extractionResult = await extractTripletsFromText(logFile.triplets.raw_content);
      
      // Create triplet records for the extracted relationships
      const extractedTriplets = extractionResult.triplets.map((triplet, index) => ({
        timestamp: new Date().toISOString(),
        agent: 'LogAnalyzer',
        summary: `Analysis of ${logFile.triplets.file_name}: ${triplet.subject} → ${triplet.predicate} → ${triplet.object}`,
        ipfs_hash: `analysis_${Date.now()}_${index}`,
        triplets: {
          type: 'extracted_triplet',
          source_log_id: id,
          source_file: logFile.triplets.file_name,
          ...triplet
        },
        event_timestamp: new Date().toISOString()
      }));

      if (extractedTriplets.length > 0) {
        const { data: extractedData, error: extractedError } = await supabase
          .from('Triplets')
          .insert(extractedTriplets)
          .select();

        if (extractedError) {
          console.error('Supabase error storing extracted triplets:', extractedError);
          return res.status(500).json({ error: "Failed to save extracted triplets to database" });
        }

        // Update the original log file record to mark as analyzed
        await supabase
          .from('Triplets')
          .update({
            triplets: {
              ...logFile.triplets,
              status: 'analyzed',
              analysis_timestamp: new Date().toISOString(),
              extracted_count: extractionResult.triplets.length
            }
          })
          .eq('id', id);

        res.json({
          success: true,
          message: "Log file analyzed successfully",
          extractedTriplets: extractedData,
          extractedCount: extractionResult.triplets.length,
          summary: extractionResult.summary
        });
      } else {
        res.json({
          success: true,
          message: "Log file analyzed but no triplets extracted",
          extractedTriplets: [],
          extractedCount: 0,
          summary: extractionResult.summary
        });
      }

    } catch (error) {
      console.error('Error analyzing log file:', error);
      res.status(500).json({ 
        error: "Failed to analyze log file",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Route to get triplets extracted from a specific log file
  app.get("/api/triplets/:id/extracted", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get all triplets extracted from this log file
      const { data: extractedTriplets, error } = await supabase
        .from('Triplets')
        .select('*')
        .eq('triplets->>source_log_id', id)
        .eq('triplets->>type', 'extracted_triplet')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: "Failed to fetch extracted triplets" });
      }

      res.json({
        success: true,
        extractedTriplets: extractedTriplets || [],
        count: extractedTriplets?.length || 0
      });

    } catch (error) {
      console.error('Error fetching extracted triplets:', error);
      res.status(500).json({ 
        error: "Failed to fetch extracted triplets",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Route to get insights from extracted triplets
  app.post("/api/triplets/:id/insights", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get all triplets extracted from this log file
      const { data: extractedTriplets, error } = await supabase
        .from('Triplets')
        .select('*')
        .eq('triplets->>source_log_id', id)
        .eq('triplets->>type', 'extracted_triplet');

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: "Failed to fetch extracted triplets" });
      }

      if (!extractedTriplets || extractedTriplets.length === 0) {
        return res.json({
          success: true,
          insights: "No triplets found for analysis. Please analyze the log file first.",
          tripletCount: 0
        });
      }

      // Generate insights using Cohere
      const tripletsText = extractedTriplets.map(t => 
        `${t.triplets.subject} → ${t.triplets.predicate} → ${t.triplets.object}`
      ).join('\n');

      const insightsResult = await generateSummary(`
        Analyze these extracted triplets and provide insights:
        ${tripletsText}
        
        Provide insights about patterns, relationships, and key findings.
      `);

      res.json({
        success: true,
        insights: insightsResult,
        tripletCount: extractedTriplets.length,
        patterns: {
          mostCommonSubjects: Array.from(new Set(extractedTriplets.map(t => t.triplets.subject))).slice(0, 5),
          mostCommonPredicates: Array.from(new Set(extractedTriplets.map(t => t.triplets.predicate))).slice(0, 5),
          mostCommonObjects: Array.from(new Set(extractedTriplets.map(t => t.triplets.object))).slice(0, 5)
        }
      });

    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({ 
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Route moved to top of file to avoid conflicts

  // Health Routes
  app.get("/api/health/records", async (req, res) => {
    try {
      const records = await storage.getHealthRecords(userId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health records" });
    }
  });

  app.post("/api/health/records", async (req, res) => {
    try {
      const data = insertHealthRecordSchema.parse({ ...req.body, userId });
      const record = await storage.createHealthRecord(data);
      res.json(record);
    } catch (error) {
      res.status(400).json({ error: "Invalid health record data" });
    }
  });

  app.get("/api/health/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointments(userId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/health/appointments", async (req, res) => {
    try {
      const data = insertAppointmentSchema.parse({ ...req.body, userId });
      const appointment = await storage.createAppointment(data);
      res.json(appointment);
    } catch (error) {
      res.status(400).json({ error: "Invalid appointment data" });
    }
  });

  app.get("/api/health/medications", async (req, res) => {
    try {
      const medications = await storage.getMedications(userId);
      res.json(medications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  app.post("/api/health/medications", async (req, res) => {
    try {
      const data = insertMedicationSchema.parse({ ...req.body, userId });
      const medication = await storage.createMedication(data);
      res.json(medication);
    } catch (error) {
      res.status(400).json({ error: "Invalid medication data" });
    }
  });

  app.patch("/api/health/medications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const medication = await storage.updateMedication(id, req.body);
      res.json(medication);
    } catch (error) {
      res.status(404).json({ error: "Medication not found" });
    }
  });

  // Healthcare Log Analysis Route
  app.post("/api/health/analyze-logs", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf8');
      
      if (!fileContent.trim()) {
        return res.status(400).json({ error: "File is empty" });
      }

      // Analyze for healthcare-related content
      const healthcareKeywords = [
        'patient', 'doctor', 'nurse', 'hospital', 'clinic', 'medical', 'diagnosis', 'treatment',
        'medication', 'prescription', 'surgery', 'appointment', 'vital signs', 'blood pressure',
        'heart rate', 'temperature', 'symptoms', 'disease', 'illness', 'therapy', 'consent',
        'HIPAA', 'EMR', 'EHR', 'lab results', 'radiology', 'pathology'
      ];

      const hasHealthcareContent = healthcareKeywords.some(keyword => 
        fileContent.toLowerCase().includes(keyword.toLowerCase())
      );

      let analysis = "No healthcare-related content detected in the uploaded logs.";
      
      if (hasHealthcareContent) {
        // Generate more detailed analysis using AI
        try {
          const { generateSummary } = await import('./cohere-service');
          analysis = await generateSummary(`
            Analyze this healthcare log for medical events, patient interactions, and compliance issues:
            ${fileContent.substring(0, 2000)}...
            
            Focus on:
            - Patient care events
            - Medical procedures
            - Consent and privacy compliance
            - Staff interactions
            - System access logs
          `);
        } catch (aiError) {
          analysis = `Healthcare content detected including: ${healthcareKeywords.filter(k => 
            fileContent.toLowerCase().includes(k.toLowerCase())
          ).slice(0, 5).join(', ')}. Enable AI analysis for deeper insights.`;
        }
      }

      res.json({
        success: true,
        analysis,
        hasHealthcareContent,
        fileInfo: {
          name: req.file.originalname,
          size: req.file.size
        }
      });

    } catch (error) {
      console.error('Error analyzing healthcare logs:', error);
      res.status(500).json({ 
        error: "Failed to analyze healthcare logs",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // AI Diagnosis Routes
  app.get("/api/health/ai-diagnoses", async (req, res) => {
    try {
      const diagnoses = await storage.getAiDiagnoses(userId);
      res.json(diagnoses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI diagnoses" });
    }
  });

  app.post("/api/health/ai-diagnoses", async (req, res) => {
    try {
      const data = insertAiDiagnosisSchema.parse({ ...req.body, userId });
      const diagnosis = await storage.createAiDiagnosis(data);
      res.json(diagnosis);
    } catch (error) {
      res.status(400).json({ error: "Invalid AI diagnosis data" });
    }
  });

  // Patient Consent Routes
  app.get("/api/health/patient-consents", async (req, res) => {
    try {
      const consents = await storage.getPatientConsents(userId);
      res.json(consents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient consents" });
    }
  });

  app.post("/api/health/patient-consents", async (req, res) => {
    try {
      const data = insertPatientConsentSchema.parse(req.body);
      const consent = await storage.createPatientConsent(data);
      res.json(consent);
    } catch (error) {
      res.status(400).json({ error: "Invalid patient consent data" });
    }
  });

  // Treatment Action Routes
  app.get("/api/health/treatment-actions", async (req, res) => {
    try {
      const actions = await storage.getTreatmentActions(userId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch treatment actions" });
    }
  });

  app.post("/api/health/treatment-actions", async (req, res) => {
    try {
      const data = insertTreatmentActionSchema.parse(req.body);
      const action = await storage.createTreatmentAction(data);
      res.json(action);
    } catch (error) {
      res.status(400).json({ error: "Invalid treatment action data" });
    }
  });

  // Finance Routes
  app.get("/api/finance/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/finance/transactions", async (req, res) => {
    try {
      const data = insertTransactionSchema.parse({ ...req.body, userId });
      const transaction = await storage.createTransaction(data);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  app.get("/api/finance/budgets", async (req, res) => {
    try {
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });

  app.post("/api/finance/budgets", async (req, res) => {
    try {
      const data = insertBudgetSchema.parse({ ...req.body, userId });
      const budget = await storage.createBudget(data);
      res.json(budget);
    } catch (error) {
      res.status(400).json({ error: "Invalid budget data" });
    }
  });

  // Financial Log Analysis Route
  app.post("/api/finance/analyze-logs", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf8');
      
      if (!fileContent.trim()) {
        return res.status(400).json({ error: "File is empty" });
      }

      // Analyze for finance-related content
      const financeKeywords = [
        'transaction', 'payment', 'transfer', 'deposit', 'withdrawal', 'balance', 'account',
        'credit', 'debit', 'loan', 'interest', 'fee', 'charge', 'refund', 'invoice',
        'expense', 'income', 'revenue', 'cost', 'budget', 'portfolio', 'investment',
        'stock', 'bond', 'crypto', 'bitcoin', 'ethereum', 'trading', 'market',
        'bank', 'ATM', 'card', 'currency', 'exchange', 'rate'
      ];

      const hasFinanceContent = financeKeywords.some(keyword => 
        fileContent.toLowerCase().includes(keyword.toLowerCase())
      );

      let analysis = "No finance-related content detected in the uploaded logs.";
      
      if (hasFinanceContent) {
        // Generate more detailed analysis using AI
        try {
          const { generateSummary } = await import('./cohere-service');
          analysis = await generateSummary(`
            Analyze this financial log for transactions, market activities, and financial events:
            ${fileContent.substring(0, 2000)}...
            
            Focus on:
            - Transaction patterns and amounts
            - Account activities
            - Market movements
            - Investment activities
            - Expense categories
            - Security and compliance events
          `);
        } catch (aiError) {
          analysis = `Financial content detected including: ${financeKeywords.filter(k => 
            fileContent.toLowerCase().includes(k.toLowerCase())
          ).slice(0, 5).join(', ')}. Enable AI analysis for deeper insights.`;
        }
      }

      res.json({
        success: true,
        analysis,
        hasFinanceContent,
        fileInfo: {
          name: req.file.originalname,
          size: req.file.size
        }
      });

    } catch (error) {
      console.error('Error analyzing financial logs:', error);
      res.status(500).json({ 
        error: "Failed to analyze financial logs",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Expense Routes (Real-time expense tracking)
  app.get("/api/finance/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses(userId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/finance/expenses", async (req, res) => {
    try {
      const data = insertExpenseSchema.parse({ ...req.body, userId });
      const expense = await storage.createExpense(data);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  // Portfolio Routes (Crypto/Stock tracking)
  app.get("/api/finance/portfolio", async (req, res) => {
    try {
      const portfolioItems = await storage.getPortfolioItems(userId);
      res.json(portfolioItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  app.post("/api/finance/portfolio", async (req, res) => {
    try {
      const data = insertPortfolioItemSchema.parse({ ...req.body, userId });
      // Calculate initial values
      const quantity = parseFloat(data.quantity);
      const averagePrice = parseFloat(data.averagePrice);
      const currentPrice = parseFloat(data.currentPrice) || averagePrice;
      
      const totalValue = quantity * currentPrice;
      const gainLoss = totalValue - (quantity * averagePrice);
      const gainLossPercent = averagePrice > 0 ? ((gainLoss / (quantity * averagePrice)) * 100) : 0;
      
      const enrichedData = {
        ...data,
        currentPrice: currentPrice.toString(),
        totalValue: totalValue.toString(),
        gainLoss: gainLoss.toString(),
        gainLossPercent: gainLossPercent.toString(),
      };
      
      const portfolioItem = await storage.createPortfolioItem(enrichedData);
      res.json(portfolioItem);
    } catch (error) {
      res.status(400).json({ error: "Invalid portfolio data" });
    }
  });

  // Personal Routes
  app.get("/api/personal/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/personal/tasks", async (req, res) => {
    try {
      const data = insertTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createTask(data);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.patch("/api/personal/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateTask(id, req.body);
      res.json(task);
    } catch (error) {
      res.status(404).json({ error: "Task not found" });
    }
  });

  app.get("/api/personal/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/personal/goals", async (req, res) => {
    try {
      const data = insertGoalSchema.parse({ ...req.body, userId });
      const goal = await storage.createGoal(data);
      res.json(goal);
    } catch (error) {
      res.status(400).json({ error: "Invalid goal data" });
    }
  });

  app.get("/api/personal/mood-logs", async (req, res) => {
    try {
      const moodLogs = await storage.getMoodLogs(userId);
      res.json(moodLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mood logs" });
    }
  });

  app.post("/api/personal/mood-logs", async (req, res) => {
    try {
      const data = insertMoodLogSchema.parse({ ...req.body, userId });
      const moodLog = await storage.createMoodLog(data);
      res.json(moodLog);
    } catch (error) {
      res.status(400).json({ error: "Invalid mood log data" });
    }
  });

  // B2B Routes
  app.get("/api/b2b/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads(userId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/b2b/leads", async (req, res) => {
    try {
      const data = insertLeadSchema.parse({ ...req.body, userId });
      const lead = await storage.createLead(data);
      res.json(lead);
    } catch (error) {
      res.status(400).json({ error: "Invalid lead data" });
    }
  });

  app.get("/api/b2b/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices(userId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.post("/api/b2b/invoices", async (req, res) => {
    try {
      const data = insertInvoiceSchema.parse({ ...req.body, userId });
      const invoice = await storage.createInvoice(data);
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  // Government Routes
  app.get("/api/government/applications", async (req, res) => {
    try {
      const applications = await storage.getApplications(userId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.post("/api/government/applications", async (req, res) => {
    try {
      const data = insertApplicationSchema.parse({ ...req.body, userId });
      const application = await storage.createApplication(data);
      res.json(application);
    } catch (error) {
      res.status(400).json({ error: "Invalid application data" });
    }
  });

  app.get("/api/government/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments(userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/government/documents", async (req, res) => {
    try {
      const data = insertDocumentSchema.parse({ ...req.body, userId });
      const document = await storage.createDocument(data);
      res.json(document);
    } catch (error) {
      res.status(400).json({ error: "Invalid document data" });
    }
  });

  app.get("/api/government/complaints", async (req, res) => {
    try {
      const complaints = await storage.getComplaints(userId);
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  app.post("/api/government/complaints", async (req, res) => {
    try {
      const data = insertComplaintSchema.parse({ ...req.body, userId });
      const complaint = await storage.createComplaint(data);
      res.json(complaint);
    } catch (error) {
      res.status(400).json({ error: "Invalid complaint data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
