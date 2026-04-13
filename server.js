import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import hpp from 'hpp';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { OllamaEmbeddings } from '@langchain/ollama';
import winston from 'winston';

const require = createRequire(import.meta.url);
const { PDFParse: pdfParse } = require('pdf-parse');
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const app = express();

// Configuration from environment variables with fallbacks
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
const CHAT_MODEL = process.env.CHAT_MODEL || 'gemma3:4b';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY;
const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID;
const BHASHINI_PIPELINE_ID = process.env.BHASHINI_PIPELINE_ID || '64392f96daac500b55c543cd';
const BHASHINI_BASE_URL = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/chat/completions';
const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_MODEL = process.env.GROK_MODEL || 'grok-2-latest';
const GROK_BASE_URL = 'https://api.x.ai/v1/chat/completions';

// Helper function for translating text using Gemini (Highly accurate for Indian languages)
async function translateText(text, sourceLang, targetLang) {
  if (!GEMINI_API_KEY || sourceLang === targetLang || !text) {
    return text;
  }

  try {
    const langMap = {
      'en': 'English', 'hi': 'Hindi', 'bn': 'Bengali', 'ta': 'Tamil', 'te': 'Telugu',
      'mr': 'Marathi', 'gu': 'Gujarati', 'kn': 'Kannada', 'ml': 'Malayalam', 'pa': 'Punjabi',
      'or': 'Odia', 'as': 'Assamese', 'ur': 'Urdu', 'sa': 'Sanskrit', 'ks': 'Kashmiri',
      'gom': 'Konkani', 'brx': 'Bodo', 'doi': 'Dogri', 'mai': 'Maithili', 'mni': 'Manipuri',
      'ne': 'Nepali', 'sd': 'Sindhi', 'sat': 'Santali', 'bho': 'Bhojpuri', 'tcy': 'Tulu',
      'raj': 'Rajasthani', 'bgc': 'Haryanvi', 'hne': 'Chhattisgarhi', 'mag': 'Magahi',
      'anp': 'Angika', 'kmu': 'Kumaoni', 'gbm': 'Garhwali', 'awa': 'Awadhi', 'mwr': 'Marwari',
      'mww': 'Mewati', 'mup': 'Malvi'
    };

    const sourceName = langMap[sourceLang] || sourceLang;
    const targetName = langMap[targetLang] || targetLang;

    console.log(`📡 BRIDGE_INIT: [${sourceName} -> ${targetName}] (Length: ${text.length})`);

    const prompt = `TASK: TRANSLATE TO ${targetName.toUpperCase()}
SOURCE: ${sourceName.toUpperCase()}
TONE: PROFESSIONAL LEGAL COUNSEL
RULE: ONLY PROVIDE THE TRANSLATED TEXT. NO INTRO. NO OUTRO. 100% ${targetName.toUpperCase()}.

TEXT_TO_TRANSLATE:
${text}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini Error ${response.status}: ${errBody}`);
    }
    
    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!translatedText || translatedText.length < 2) {
      console.warn('⚠️ Bridge returned empty result. Returning original.');
      return text;
    }

    console.log(`✅ BRIDGE_SUCCESS: [${targetName}]`);
    return translatedText;
  } catch (err) {
    console.error(`❌ BRIDGE_FAILURE [${sourceLang}->${targetLang}]:`, err.message);
    return text; // Return original on absolute failure
  }
}

// Security: Validate required environment variables
const requiredEnvVars = ['PORT', 'NODE_ENV', 'OLLAMA_BASE_URL', 'EMBEDDING_MODEL', 'CHAT_MODEL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

logger.info('Environment validation passed', { nodeEnv: NODE_ENV, port: PORT });

// ===== SECURITY MIDDLEWARE =====

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.googleapis.com", "https://*.gstatic.com"],
      connectSrc: ["'self'", "http://localhost:11434", "http://localhost:3001", "https://*.bhashini.gov.in", "https://*.googleapis.com", "https://api.deepseek.com", "https://api.x.ai"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"]
    }
  },
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeUnsubmitted: true,
    preload: true
  } : false,
  // Allow React DevTools in development
  sourceMaps: NODE_ENV === 'development'
}));

// CORS with better security
app.use(cors({
  origin: process.env.CORS_ORIGIN || (NODE_ENV === 'production' ? false : '*'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression({
  level: 6,
  threshold: 1024 // Only compress responses > 1KB
}));

// Body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prevent parameter pollution
app.use(hpp());

// Custom XSS protection middleware
const xssMiddleware = (req, res, next) => {
  const escapeHtml = (str) => {
    if (!str) return str;
    return str
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  };

  const sanitize = (obj) => {
    if (typeof obj === 'string') return escapeHtml(obj);
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize body and query (req.params is read-only in Express 5)
  if (req.body) req.body = sanitize(req.body);
  if (req.query) {
    // For query params, we need to handle them differently
    Object.keys(req.query).forEach(key => {
      req.query[key] = sanitize(req.query[key]);
    });
  }

  next();
};

app.use(xssMiddleware);

// ===== RATE LIMITING =====

// General API rate limiting (generous for development, stricter for production)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 200 : 1000, // 200 for prod, 1000 for dev
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV === 'test'
});

// Rate limiting for chat endpoints (balanced to prevent abuse while allowing active use)
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 500, // 100 for prod (~7/min), 500 for dev
  message: {
    error: 'Too many chat requests',
    message: 'Please wait before sending more messages',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV === 'test'
});

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/chat', chatLimiter);

// Request logging middleware with Winston
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, `${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

const DOCUMENTS_DIR = path.join(__dirname, 'public', 'documents');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
let documentChunks = [];

// Ensure directories exist
[DOCUMENTS_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.md', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// 1. Initialize RAG using Ollama for Embeddings
const embeddings = new OllamaEmbeddings({
  model: EMBEDDING_MODEL,
  baseUrl: OLLAMA_BASE_URL,
});

// Dynamic import for pdf-parse (CJS module in ESM project)
async function parsePdf(dataBuffer) {
  try {
    const instance = new pdfParse(new Uint8Array(dataBuffer));
    const result = await instance.getText();
    // This modern package (pdf-parse 2.4.5) requires calling .getText()
    return { text: result.text || '' };
  } catch (err) {
    throw new Error(`PDF Parsing failed: ${err.message}`);
  }
}

// Custom lightweight text splitter 
function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.substring(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

// Native Cosine Similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  let div = (Math.sqrt(normA) * Math.sqrt(normB));
  return div === 0 ? 0 : (dotProduct / div);
}

async function callGemini(messages, systemPrompt, overrideApiKey = null) {
  const apiKey = overrideApiKey || GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key missing.');
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  // Transform messages for Gemini format (v1 compatible)
  const contents = [];
  
  // Prepend system prompt to the first user message for maximum compatibility
  let firstUserMessageIndex = messages.findIndex(m => m.role === 'user');
  
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role === 'system') continue;
    
    let text = m.content;
    if (i === firstUserMessageIndex) {
      text = `SYSTEM_INSTRUCTION: ${systemPrompt}\n\nUSER_QUERY: ${text}`;
    }

    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text }]
    });
  }

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return {
    message: { role: 'assistant', content },
    model: `Gemini (${GEMINI_MODEL})`
  };
}

async function callDeepSeek(messages, systemPrompt, overrideApiKey = null) {
  const apiKey = overrideApiKey || DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DeepSeek API Key missing.');
  }

  const payload = {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ],
    temperature: 0.7,
    max_tokens: 2048
  };

  const response = await fetch(DEEPSEEK_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  return {
    message: { role: 'assistant', content },
    model: `DeepSeek (${DEEPSEEK_MODEL})`
  };
}

async function callGrok(messages, systemPrompt, overrideApiKey = null) {
  const apiKey = overrideApiKey || GROK_API_KEY;
  if (!apiKey) {
    throw new Error('Grok API Key missing.');
  }

  const payload = {
    model: GROK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ],
    temperature: 0.7,
    max_tokens: 2048
  };

  const response = await fetch(GROK_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  return {
    message: { role: 'assistant', content },
    model: `Grok (${GROK_MODEL})`
  };
}

async function loadAndIndexDocuments() {
  try {
    const allFiles = fs.readdirSync(DOCUMENTS_DIR);
    const pdfFiles = allFiles.filter(f => f.endsWith('.pdf'));
    const txtFiles = allFiles.filter(f => f.endsWith('.txt'));
    const mdFiles = allFiles.filter(f => f.endsWith('.md'));

    if (pdfFiles.length === 0 && txtFiles.length === 0 && mdFiles.length === 0) {
      console.log('No documents found in public/documents/. RAG memory is empty.');
      return;
    }

    console.log(`Found ${pdfFiles.length} PDFs, ${txtFiles.length} TXT files, ${mdFiles.length} MD files. Extracting text...`);
    
    // Track text per source file for proper source attribution
    const sourceTexts = [];

    // Load PDFs
    for (const file of pdfFiles) {
      try {
        const dataBuffer = fs.readFileSync(path.join(DOCUMENTS_DIR, file));
        const pdfData = await parsePdf(dataBuffer);
        sourceTexts.push({ source: file, text: pdfData.text });
        console.log(`  ✓ Loaded PDF: ${file} (${pdfData.text.length} chars)`);
      } catch (pdfErr) {
        console.warn(`  ✗ Failed to parse PDF: ${file} — ${pdfErr.message}`);
      }
    }

    // Load TXT files
    for (const file of txtFiles) {
      try {
        const text = fs.readFileSync(path.join(DOCUMENTS_DIR, file), 'utf-8');
        sourceTexts.push({ source: file, text });
        console.log(`  ✓ Loaded TXT: ${file} (${text.length} chars)`);
      } catch (txtErr) {
        console.warn(`  ✗ Failed to read TXT: ${file} — ${txtErr.message}`);
      }
    }

    // Load MD files
    for (const file of mdFiles) {
      try {
        const text = fs.readFileSync(path.join(DOCUMENTS_DIR, file), 'utf-8');
        sourceTexts.push({ source: file, text });
        console.log(`  ✓ Loaded MD: ${file} (${text.length} chars)`);
      } catch (mdErr) {
        console.warn(`  ✗ Failed to read MD: ${file} — ${mdErr.message}`);
      }
    }

    // Chunk and embed each source separately for proper attribution
    let totalChunks = 0;
    for (const { source, text } of sourceTexts) {
      const rawChunks = splitTextIntoChunks(text, 1000, 200);
      totalChunks += rawChunks.length;
      
      for (let j = 0; j < rawChunks.length; j++) {
        const chunk = rawChunks[j];
        const vector = await embeddings.embedQuery(chunk);
        documentChunks.push({
          content: chunk,
          vector: vector,
          source: source
        });
      }
      console.log(`  📦 Embedded ${rawChunks.length} chunks from ${source}`);
    }
    
    console.log(`✅ RAG Vector Database Loaded! Total chunks indexed: ${totalChunks}`);
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}

// ============ API ROUTES ============

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    rag: {
      loaded: documentChunks.length > 0,
      chunks: documentChunks.length
    },
    ollama: {
      baseUrl: OLLAMA_BASE_URL,
      embeddingModel: EMBEDDING_MODEL,
      chatModel: CHAT_MODEL
    }
  });
});

// Get RAG statistics
app.get('/api/stats', (req, res) => {
  const sources = [...new Set(documentChunks.map(c => c.source))];
  res.json({
    totalChunks: documentChunks.length,
    totalSources: sources.length,
    sources: sources,
    memoryUsage: process.memoryUsage()
  });
});

// Voice Configuration Endpoint (tells client which STT methods are available)
app.get('/api/voice/config', (req, res) => {
  // Check if Bhashini credentials are properly configured (not empty or placeholder values)
  const isPlaceholder = (value) => {
    if (!value || typeof value !== 'string') return true;
    const trimmed = value.trim().toLowerCase();
    return (
      trimmed === '' ||
      trimmed === 'your_bhashini_api_key_here' ||
      trimmed === 'your_bhashini_user_id_here' ||
      trimmed.startsWith('your_') ||
      trimmed === 'placeholder'
    );
  };

  const bhashiniConfigured = !isPlaceholder(BHASHINI_API_KEY) && !isPlaceholder(BHASHINI_USER_ID);
  
  // Only return pipelineId when Bhashini is actually configured (avoid info leak)
  const bhashiniResponse = { available: bhashiniConfigured };
  if (bhashiniConfigured) {
    bhashiniResponse.pipelineId = BHASHINI_PIPELINE_ID;
  }
  
  res.json({
    bhashini: bhashiniResponse
    // Web Speech API availability is checked client-side
  });
});

// Bhashini Voice Processing Endpoint (STT & TTS Proxy)
app.post('/api/voice/process', async (req, res) => {
  try {
    const { task, audioContent, text, sourceLanguage, targetLanguage } = req.body;
    
    // Check if Bhashini credentials are provided, otherwise enter Mock Mode
    if (!BHASHINI_API_KEY || !BHASHINI_USER_ID) {
      console.log('⚠️ Bhashini Credentials missing. Running in MOCK MODE.');
      
      if (task === 'asr') {
        // Mock transcription
        return res.json({ 
          status: 'mock',
          output: [{ source: 'JusticeAI Mock ASR', transcription: 'This is a simulated transcription because Bhashini API keys are not configured.' }] 
        });
      } else if (task === 'tts') {
        // Mock TTS (no audio)
        return res.json({ 
          status: 'mock',
          output: [{ audioContent: '', message: 'Simulated TTS output' }] 
        });
      }
    }

    // Step 1: Fetch Pipeline Configuration
    const configPayload = {
      pipelineTasks: [
        {
          taskType: task === 'translate' ? 'nmt' : task, // 'asr', 'tts', or 'nmt'
          config: {
            language: {
              sourceLanguage: sourceLanguage || 'hi',
              targetLanguage: targetLanguage || (task === 'translate' ? 'en' : undefined)
            }
          }
        }
      ],
      pipelineConfig: {
        pipelineId: BHASHINI_PIPELINE_ID
      }
    };

    const configResponse = await fetch(`${BHASHINI_BASE_URL}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ulcaApiKey': BHASHINI_API_KEY,
        'userID': BHASHINI_USER_ID
      },
      body: JSON.stringify(configPayload)
    });

    if (!configResponse.ok) {
      const errorText = await configResponse.text();
      throw new Error(`Bhashini Config Error: ${configResponse.status} - ${errorText}`);
    }

    const configData = await configResponse.json();

    // Step 2: Compute Inference
    const computePayload = {
      pipelineTasks: [
        {
          taskType: task === 'translate' ? 'nmt' : task,
          config: configData.pipelineResponseConfig[0].config,
          input: task === 'asr' 
            ? [{ audioContent }] 
            : [{ source: text }]
        }
      ],
      pipelineResponseConfig: configData.pipelineResponseConfig
    };

    const computeResponse = await fetch(configData.pipelineInferenceAPIEndPoint.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [configData.pipelineInferenceAPIEndPoint.inferenceApiKey.name]: configData.pipelineInferenceAPIEndPoint.inferenceApiKey.value,
        'Accept': '*/*'
      },
      body: JSON.stringify(computePayload)
    });

    if (!computeResponse.ok) {
      const errorText = await computeResponse.text();
      throw new Error(`Bhashini Compute Error: ${computeResponse.status} - ${errorText}`);
    }

    const computeData = await computeResponse.json();
    
    // Return the specific output based on task
    if (task === 'asr') {
      res.json({
        transcription: computeData.pipelineResponse[0].output[0].source,
        raw: computeData
      });
    } else if (task === 'translate') {
      res.json({
        translatedText: computeData.pipelineResponse[0].output[0].target,
        raw: computeData
      });
    } else {
      res.json({
        audioContent: computeData.pipelineResponse[0].audio[0].audioContent,
        raw: computeData
      });
    }

  } catch (err) {
    console.error('Bhashini Proxy Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload documents endpoint
app.post('/api/upload', upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = [];
    const failedFiles = [];

    for (const file of req.files) {
      try {
        const filePath = file.path;
        const fileName = file.originalname;
        const ext = path.extname(fileName).toLowerCase();
        let text = '';

        if (ext === '.pdf') {
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await parsePdf(dataBuffer);
          text = pdfData.text;
        } else if (ext === '.txt' || ext === '.md') {
          text = fs.readFileSync(filePath, 'utf-8');
        } else {
          failedFiles.push({ name: fileName, error: 'Unsupported file type' });
          continue;
        }

        // Chunk and embed
        const rawChunks = splitTextIntoChunks(text, 1000, 200);
        let chunksEmbedded = 0;

        for (const chunk of rawChunks) {
          const vector = await embeddings.embedQuery(chunk);
          documentChunks.push({
            content: chunk,
            vector: vector,
            source: fileName
          });
          chunksEmbedded++;
        }

        uploadedFiles.push({
          name: fileName,
          size: file.size,
          chunks: chunksEmbedded
        });

        // Clean up uploaded file
        fs.unlinkSync(filePath);

      } catch (err) {
        failedFiles.push({ name: file.originalname, error: err.message });
      }
    }

    res.json({
      message: 'Documents processed',
      uploaded: uploadedFiles,
      failed: failedFiles,
      totalChunks: documentChunks.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete specific document chunks by source
app.delete('/api/documents/:source', (req, res) => {
  const source = decodeURIComponent(req.params.source);
  const beforeCount = documentChunks.length;
  documentChunks = documentChunks.filter(chunk => chunk.source !== source);
  const removed = beforeCount - documentChunks.length;
  
  res.json({
    message: `Removed ${removed} chunks from ${source}`,
    remainingChunks: documentChunks.length
  });
});

// Clear all documents
app.delete('/api/documents', (req, res) => {
  const count = documentChunks.length;
  documentChunks = [];
  res.json({
    message: `Cleared ${count} chunks`,
    remainingChunks: 0
  });
});

// Endpoint to chat using RAG (with optional streaming)
app.post('/api/chat', async (req, res) => {
  console.log(`[ROUTE] Incoming POST /api/chat - Body Keys: ${Object.keys(req.body || {}).join(', ')}`);
  try {
    const { 
      messages, 
      personality, 
      mode, 
      jurisdiction, 
      basePrompt, 
      stream = false,
      provider = 'auto', 
      apiKeys = {},
      language = 'en'
    } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1].content;
    let processingMessage = latestUserMessage;

    // Translation Bridge: Step 1 (Input)
    if (language !== 'en') {
      console.log(`🌐 System bridging ${language.toUpperCase()} to English for processing...`);
      processingMessage = await translateText(latestUserMessage, language, 'en');
      console.log(`📡 Bridged: "${processingMessage}"`);
    }
    
    let contextStr = '';
    let retrievedSources = [];
    
    if (documentChunks.length > 0) {
      try {
        const userVector = await embeddings.embedQuery(processingMessage);
        
        // Calculate scores for all chunks, prioritizing ones that match the jurisdiction if specified
        const scoredChunks = documentChunks.map(chunk => {
          let score = cosineSimilarity(userVector, chunk.vector);
          
          // Boost chunks from the correct jurisdiction (filename-based tagging)
          if (jurisdiction && jurisdiction !== 'National' && chunk.source?.toLowerCase().includes(jurisdiction.toLowerCase())) {
            score += 0.2;
          }
          
          return {
            content: chunk.content,
            score: score,
            source: chunk.source
          };
        });
        
        // Sort descending by score
        scoredChunks.sort((a, b) => b.score - a.score);
        
        // Take top 5 chunks for richer context
        const topChunks = scoredChunks.slice(0, 5).filter(c => c.score > 0.1); // Filter low-relevance chunks
        
        retrievedSources = [...new Set(topChunks.map(c => c.source))];
        
        contextStr = "\n\nCRITICAL LEGAL PRECEDENTS (From Knowledge Base):\n" + 
                     topChunks.map(c => `[Source: ${c.source}] [Relevance: ${(c.score * 100).toFixed(1)}%]\n${c.content}`).join("\n\n---\n\n");
        
        console.log(`  🔍 RAG retrieved top chunks from: ${retrievedSources.join(', ')}`);
      } catch (embedError) {
        console.warn('Embedding failed, proceeding without RAG context:', embedError.message);
      }
    }

    // Format the prompt
    let systemPrompt = basePrompt || `You are JusticeAI, a powerful legal co-pilot specializing in Indian law.`;
    
    systemPrompt += `\n\nCURRENT CONTEXT: You are providing assistance under the jurisdiction of ${jurisdiction || 'India (National)'}.`;

    if (mode === 'simulator') {
      systemPrompt += `\n\nROLE PLAY: You are opposing counsel. Be adversarial and challenge the user's arguments aggressively. Exploit weaknesses in their position. This is a simulation for moot practice only.`;
    }
    if (personality) {
      systemPrompt += `\n\nYour judicial/opponent personality is: ${personality}.`;
    }
    
    if (mode === 'analyzer') {
      systemPrompt += `\n\nCRITICAL RULE: You must return your response strictly as a structured JSON object.`;
    } else {
      systemPrompt += `\n\nCRITICAL CONVERSATIONAL RULE: Keep your conversational responses clear, articulate, and well-formatted. Do not output raw JSON objects in this mode. Use elegant bullet points and line breaks.`;
    }

    systemPrompt += `\n\nCRITICAL LANGUAGE RULE: You are a Polyglot Legal Master. You MUST respond in the EXACT SAME LANGUAGE that the user is using.
    - Support for all 22 scheduled languages of India is MANDATORY (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Sanskrit, Konkani, Kashmiri, Sindhi, Manipuri, Nepali, Dogri, Bodo, Maithili, Santali).
    - If the user asks in a regional language (e.g., Bengali), you MUST respond in Bengali.
    - If the user uses a mix of languages (Hinglish, Tamlish, Benglish), respond in that same conversational mix but maintain legal precision.
    - DO NOT default to English unless the user's query is in English. This is critical for rural and multi-lingual accessibility in the Indian legal system.`;

    systemPrompt += contextStr;

    // Build the request for Ollama
    const requestData = {
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      ],
      stream: stream
    };

    console.log(`Routing query to Ollama: "${latestUserMessage.substring(0, 50)}..."`);
    
    try {
      if (stream) {
        // Streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
          signal: AbortSignal.timeout(10000) // 10s timeout for local Ollama
        });

        if (!response.ok) {
          throw new Error(`Ollama Error: ${response.statusText}`);
        }

        // Pipe the streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          res.write(`data: ${chunk}\n\n`);
        }

        res.end();
      } else {
        // Non-streaming response
        const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
          signal: AbortSignal.timeout(15000) // 15s timeout
        });

        if (!ollamaResponse.ok) {
          throw new Error(`Ollama Error: ${await ollamaResponse.text()}`);
        }

        const data = await ollamaResponse.json();
        let content = data.message.content;

        // Translation Bridge: Step 2 (Output)
        if (language !== 'en' && content) {
          console.log(`🌐 System bridging local response back to ${language.toUpperCase()}...`);
          content = await translateText(content, 'en', language);
        }

        res.json({ 
          message: { 
            role: 'assistant', 
            content: content 
          },
          metadata: {
            sources: retrievedSources,
            model: CHAT_MODEL,
            provider: 'Ollama (Local)',
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (ollamaErr) {
      console.warn(`⚠️ Ollama failure detected: ${ollamaErr.message}. Shifting to Gemini fallback...`);
      
      let finalResult = null;
      let usedProvider = null;
      let errorChain = [`Ollama: ${ollamaErr.message}`];

      if (provider !== 'auto') {
        console.log(`User-forced provider: ${provider}`);
        if (provider === 'gemini') {
          finalResult = await callGemini(messages, systemPrompt, apiKeys.gemini);
          usedProvider = 'Gemini (User Controlled)';
        } else if (provider === 'deepseek') {
          finalResult = await callDeepSeek(messages, systemPrompt, apiKeys.deepseek);
          usedProvider = 'DeepSeek (User Controlled)';
        } else if (provider === 'grok') {
          finalResult = await callGrok(messages, systemPrompt, apiKeys.grok);
          usedProvider = 'Grok (User Controlled)';
        } else {
          // Fall back to Ollama if forced provider is ollama or invalid
          throw ollamaErr; 
        }
      } else {
        // Waterfall Tier 2: Grok
        if (apiKeys.grok || GROK_API_KEY) {
          try {
            finalResult = await callGrok(messages, systemPrompt, apiKeys.grok);
            usedProvider = 'Grok (Cloud Default)';
          } catch (grokErr) {
            console.warn(`⚠️ Grok primary fallback failed: ${grokErr.message}. Shifting to Gemini...`);
            errorChain.push(`Grok: ${grokErr.message}`);
          }
        }

        // Waterfall Tier 3: Gemini
        if (!finalResult && (apiKeys.gemini || GEMINI_API_KEY)) {
          try {
            finalResult = await callGemini(messages, systemPrompt, apiKeys.gemini);
            usedProvider = 'Gemini (Cloud Fallback)';
          } catch (geminiErr) {
            console.warn(`⚠️ Gemini fallback failed: ${geminiErr.message}. Shifting to DeepSeek...`);
            errorChain.push(`Gemini: ${geminiErr.message}`);
          }
        }

        // Waterfall Tier 4: DeepSeek
        if (!finalResult && (apiKeys.deepseek || DEEPSEEK_API_KEY)) {
          try {
            finalResult = await callDeepSeek(messages, systemPrompt, apiKeys.deepseek);
            usedProvider = 'DeepSeek (Cloud Fallback)';
          } catch (deepseekErr) {
            console.error(`❌ DeepSeek fallback failed: ${deepseekErr.message}`);
            errorChain.push(`DeepSeek: ${deepseekErr.message}`);
          }
        }
      }

      if (finalResult) {
        // Translation Bridge: Step 2 (Output)
        if (language !== 'en' && finalResult.message?.content) {
          console.log(`🌐 System bridging response back to ${language.toUpperCase()}...`);
          finalResult.message.content = await translateText(finalResult.message.content, 'en', language);
        }

        res.json({
          ...finalResult,
          metadata: {
            sources: retrievedSources,
            provider: usedProvider,
            timestamp: new Date().toISOString(),
            errorChain: errorChain
          }
        });
      } else {
        throw new Error(`Multi-tier failover exhausted. Chain: ${errorChain.join(' -> ')}`);
      }
    }
    
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Embedding endpoint (for testing/debugging)
app.post('/api/embed', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const vector = await embeddings.embedQuery(text);
    res.json({
      vector: vector.slice(0, 10), // Return first 10 dimensions for brevity
      dimensions: vector.length,
      model: EMBEDDING_MODEL
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Start the server
// Relocating document indexing to keep the server alive correctly
(async () => {
  await loadAndIndexDocuments();
})();

// Keep process alive if event loop becomes empty (Express should handle this, but adding a fail-safe)
setInterval(() => {}, 1000 * 60 * 60); // 1 hour tick

app.listen(PORT, () => {
  console.log(`\n⚖️  JusticeAI RAG Server running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\nMake sure Ollama is running:`);
  console.log(`  ollama serve`);
  console.log(`\nRequired models:`);
  console.log(`  ollama pull ${EMBEDDING_MODEL}`);
  console.log(`  ollama pull ${CHAT_MODEL}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});