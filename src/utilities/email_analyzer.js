/**
 * Email Analyzer Module
 * 
 * Analyzes Gmail communication patterns to enhance contact 
 * relationship weights in the knowledge graph.
 */

const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const KnowledgeGraph = require('./knowledge_graph');

// Configuration
const USER_CONFIG = {
  // User email aliases to check in communications (all in single Gmail account)
  userEmails: [
    'Larry@sinu.com',
    'Larry@kogi.ai',
    'LarryVelez@gmail.com'
  ],
  // Time periods for analysis (in days)
  timePeriods: {
    recent: 30,
    medium: 90,
    long: 365
  },
  // Weights for different metrics in scoring
  weights: {
    emailCount: 0.25,
    recency: 0.30,
    responseRate: 0.20,
    threadDepth: 0.15,
    manualPriority: 0.10
  }
};

// File paths
const BASE_DIR = path.resolve(__dirname, '..');
const ENTITIES_PATH = path.join(BASE_DIR, 'knowledge_graph', 'entities.json');
const RELATIONSHIPS_PATH = path.join(BASE_DIR, 'knowledge_graph', 'relationships.json');

/**
 * Initialize Gmail API client
 * @returns {Object} Gmail API client
 */
async function initializeGmailClient() {
  // This requires setting up a Google Cloud project with Gmail API enabled
  // and obtaining OAuth2 credentials
  try {
    const { OAuth2Client } = require('google-auth-library');
    const TOKEN_PATH = path.join(BASE_DIR, 'credentials', 'token.json');
    const CREDENTIALS_PATH = path.join(BASE_DIR, 'credentials', 'credentials.json');
    
    // Load client secrets from a local file
    const content = await fs.readFile(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
    
    // Check if we have previously stored a token
    try {
      const token = await fs.readFile(TOKEN_PATH);
      oAuth2Client.setCredentials(JSON.parse(token));
    } catch (err) {
      console.error('No token found, please authenticate first');
      return null;
    }
    
    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    return gmail;
  } catch (error) {
    console.error('Error initializing Gmail client:', error);
    return null;
  }
}

/**
 * Get email address mapping from the knowledge graph
 * Maps known email addresses to contact IDs
 * @returns {Object} Email to contact ID mapping
 */
async function getEmailMapping() {
  try {
    const graph = new KnowledgeGraph();
    await graph.initialize(ENTITIES_PATH, RELATIONSHIPS_PATH);
    
    const contacts = graph.findEntitiesByType('Contact');
    const mapping = {};
    
    contacts.forEach(contact => {
      const emails = contact.observations
        .find(obs => obs.type === 'contact_details')?.emails || [];
      
      emails.forEach(email => {
        if (email) {
          mapping[email.toLowerCase()] = contact.id;
        }
      });
    });
    
    return mapping;
  } catch (error) {
    console.error('Error creating email mapping:', error);
    return {};
  }
}

/**
 * Analyze all contacts' email interactions
 */
async function analyzeAllContacts() {
  try {
    console.log('Starting email analysis for all contacts...');
    
    // Initialize Gmail client
    const gmail = await initializeGmailClient();
    if (!gmail) {
      console.error('Failed to initialize Gmail client');
      return;
    }
    
    // Get email mapping
    const emailMapping = await getEmailMapping();
    console.log(`Found ${Object.keys(emailMapping).length} mapped email addresses`);
    
    // Initialize knowledge graph
    const graph = new KnowledgeGraph();
    await graph.initialize(ENTITIES_PATH, RELATIONSHIPS_PATH);
    
    // Create a map to track processed contacts
    const processedContacts = new Map();
    let totalEmails = 0;
    
    // Process all contacts in batches
    const contactEmails = Object.keys(emailMapping);
    const batchSize = 10;
    
    for (let i = 0; i < contactEmails.length; i += batchSize) {
      const batch = contactEmails.slice(i, i + batchSize);
      console.log(`Processing batch ${i/batchSize + 1}/${Math.ceil(contactEmails.length/batchSize)}`);
      
      const batchPromises = batch.map(async (contactEmail) => {
        const contactId = emailMapping[contactEmail];
        
        // Skip if we've already processed this contact
        if (processedContacts.has(contactId)) {
          return;
        }
        
        processedContacts.set(contactId, true);
        
        // Get email interactions
        const interactions = await analyzeContactEmails(gmail, contactEmail);
        totalEmails += interactions.totalEmails;
        
        // Update contact with email metrics
        if (interactions.totalEmails > 0) {
          updateContactWithEmailMetrics(graph, contactId, interactions);
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    // Save updated knowledge graph
    await graph.saveToFiles();
    
    console.log(`Email analysis complete:`);
    console.log(`- Analyzed ${processedContacts.size} contacts`);
    console.log(`- Processed ${totalEmails} total emails`);
    console.log(`- Updated importance scores for all contacts`);
    
  } catch (error) {
    console.error('Error analyzing contacts:', error);
  }
}

/**
 * Analyze Gmail for interactions with a specific contact
 * @param {Object} gmail - Gmail API client
 * @param {string} contactEmail - Contact's email address
 * @returns {Object} Interaction metrics
 */
async function analyzeContactEmails(gmail, contactEmail) {
  try {
    const metrics = {
      totalEmails: 0,
      emailsSent: 0,
      emailsReceived: 0,
      lastContactDate: null,
      firstContactDate: null,
      threadDepths: [],
      responseTimes: {
        fromContact: [],
        fromUser: []
      },
      byTimePeriod: {
        recent: { sent: 0, received: 0 },
        medium: { sent: 0, received: 0 },
        long: { sent: 0, received: 0 }
      }
    };
    
    // Create search queries for this contact
    const userEmailsQuery = USER_CONFIG.userEmails.map(email => `from:${email}`).join(' OR ');
    
    // Search for emails FROM the contact to any of your addresses
    const receivedQuery = `from:${contactEmail}`;
    const receivedThreads = await searchEmails(gmail, receivedQuery);
    
    // Search for emails FROM you TO the contact
    const sentQuery = `(${userEmailsQuery}) to:${contactEmail}`;
    const sentThreads = await searchEmails(gmail, sentQuery);
    
    // Get unique thread IDs
    const threadIds = new Set([
      ...receivedThreads.map(thread => thread.id),
      ...sentThreads.map(thread => thread.id)
    ]);
    
    // Process each thread
    for (const threadId of threadIds) {
      const thread = await getThread(gmail, threadId);
      if (!thread || !thread.messages) continue;
      
      // Analyze this thread
      const threadMetrics = analyzeThread(thread, contactEmail);
      
      // Update metrics
      metrics.totalEmails += threadMetrics.messageCount;
      metrics.emailsSent += threadMetrics.fromUser;
      metrics.emailsReceived += threadMetrics.fromContact;
      
      // Update dates
      if (!metrics.firstContactDate || threadMetrics.firstDate < metrics.firstContactDate) {
        metrics.firstContactDate = threadMetrics.firstDate;
      }
      
      if (!metrics.lastContactDate || threadMetrics.lastDate > metrics.lastContactDate) {
        metrics.lastContactDate = threadMetrics.lastDate;
      }
      
      // Thread depth
      metrics.threadDepths.push(thread.messages.length);
      
      // Response times
      metrics.responseTimes.fromContact.push(...threadMetrics.contactResponseTimes);
      metrics.responseTimes.fromUser.push(...threadMetrics.userResponseTimes);
      
      // Time periods
      const now = new Date();
      const threadDate = new Date(threadMetrics.lastDate);
      const daysDifference = Math.floor((now - threadDate) / (1000 * 60 * 60 * 24));
      
      if (daysDifference <= USER_CONFIG.timePeriods.recent) {
        metrics.byTimePeriod.recent.sent += threadMetrics.fromUser;
        metrics.byTimePeriod.recent.received += threadMetrics.fromContact;
      }
      
      if (daysDifference <= USER_CONFIG.timePeriods.medium) {
        metrics.byTimePeriod.medium.sent += threadMetrics.fromUser;
        metrics.byTimePeriod.medium.received += threadMetrics.fromContact;
      }
      
      if (daysDifference <= USER_CONFIG.timePeriods.long) {
        metrics.byTimePeriod.long.sent += threadMetrics.fromUser;
        metrics.byTimePeriod.long.received += threadMetrics.fromContact;
      }
    }
    
    return metrics;
  } catch (error) {
    console.error(`Error analyzing emails for ${contactEmail}:`, error);
    return {
      totalEmails: 0,
      emailsSent: 0,
      emailsReceived: 0,
      lastContactDate: null,
      firstContactDate: null,
      threadDepths: [],
      responseTimes: {
        fromContact: [],
        fromUser: []
      },
      byTimePeriod: {
        recent: { sent: 0, received: 0 },
        medium: { sent: 0, received: 0 },
        long: { sent: 0, received: 0 }
      }
    };
  }
}

/**
 * Search for emails matching a query
 * @param {Object} gmail - Gmail API client
 * @param {string} query - Search query
 * @returns {Array} List of message threads
 */
async function searchEmails(gmail, query) {
  try {
    const response = await gmail.users.threads.list({
      userId: 'me',
      q: query,
      maxResults: 500
    });
    
    return response.data.threads || [];
  } catch (error) {
    console.error('Error searching emails:', error);
    return [];
  }
}

/**
 * Get a full thread with all messages
 * @param {Object} gmail - Gmail API client
 * @param {string} threadId - Thread ID
 * @returns {Object} Thread with messages
 */
async function getThread(gmail, threadId) {
  try {
    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching thread ${threadId}:`, error);
    return null;
  }
}

/**
 * Analyze an email thread for communication patterns
 * @param {Object} thread - Thread object with messages
 * @param {string} contactEmail - Contact's email address
 * @returns {Object} Thread metrics
 */
function analyzeThread(thread, contactEmail) {
  const metrics = {
    messageCount: thread.messages.length,
    fromUser: 0,
    fromContact: 0,
    firstDate: null,
    lastDate: null,
    contactResponseTimes: [],
    userResponseTimes: []
  };
  
  // Sort messages by date
  const messages = thread.messages.sort((a, b) => {
    const dateA = new Date(parseInt(a.internalDate));
    const dateB = new Date(parseInt(b.internalDate));
    return dateA - dateB;
  });
  
  // Set first and last dates
  if (messages.length > 0) {
    metrics.firstDate = new Date(parseInt(messages[0].internalDate)).toISOString();
    metrics.lastDate = new Date(parseInt(messages[messages.length - 1].internalDate)).toISOString();
  }
  
  // Analyze each message
  messages.forEach((message, index) => {
    const headers = message.payload.headers;
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
    const from = fromHeader ? fromHeader.value.toLowerCase() : '';
    
    // Check if message is from the contact
    const isFromContact = from.includes(contactEmail.toLowerCase());
    
    // Check if message is from the user
    const isFromUser = USER_CONFIG.userEmails.some(email => 
      from.includes(email.toLowerCase())
    );
    
    // Count messages
    if (isFromContact) {
      metrics.fromContact++;
    }
    
    if (isFromUser) {
      metrics.fromUser++;
    }
    
    // Calculate response times
    if (index > 0) {
      const prevMessage = messages[index - 1];
      const prevHeaders = prevMessage.payload.headers;
      const prevFromHeader = prevHeaders.find(h => h.name.toLowerCase() === 'from');
      const prevFrom = prevFromHeader ? prevFromHeader.value.toLowerCase() : '';
      
      const prevIsFromContact = prevFrom.includes(contactEmail.toLowerCase());
      const prevIsFromUser = USER_CONFIG.userEmails.some(email => 
        prevFrom.includes(email.toLowerCase())
      );
      
      // Calculate time difference in hours
      const prevDate = new Date(parseInt(prevMessage.internalDate));
      const currDate = new Date(parseInt(message.internalDate));
      const hoursDiff = (currDate - prevDate) / (1000 * 60 * 60);
      
      // If previous message was from user and current is from contact
      if (prevIsFromUser && isFromContact) {
        metrics.contactResponseTimes.push(hoursDiff);
      }
      
      // If previous message was from contact and current is from user
      if (prevIsFromContact && isFromUser) {
        metrics.userResponseTimes.push(hoursDiff);
      }
    }
  });
  
  return metrics;
}

/**
 * Update a contact with email metrics
 * @param {Object} graph - Knowledge graph instance
 * @param {string} contactId - Contact ID
 * @param {Object} metrics - Email metrics
 */
function updateContactWithEmailMetrics(graph, contactId, metrics) {
  try {
    // Update communication metrics
    graph.updateEntityObservation(contactId, 'communication_metrics', {
      lastContacted: metrics.lastContactDate,
      emailCount: metrics.totalEmails,
      responseRate: calculateResponseRate(metrics),
      meetingCount: 0 // This would need to be updated separately
    });
    
    // Add detailed communication patterns
    graph.updateEntityObservation(contactId, 'communication_patterns', {
      firstContactDate: metrics.firstContactDate,
      emailsSent: metrics.emailsSent,
      emailsReceived: metrics.emailsReceived,
      averageThreadDepth: calculateAverageThreadDepth(metrics),
      averageResponseTime: calculateAverageResponseTime(metrics),
      communicationTrend: calculateCommunicationTrend(metrics),
      recentActivity: {
        last30Days: metrics.byTimePeriod.recent.sent + metrics.byTimePeriod.recent.received,
        last90Days: metrics.byTimePeriod.medium.sent + metrics.byTimePeriod.medium.received,
        last365Days: metrics.byTimePeriod.long.sent + metrics.byTimePeriod.long.received
      }
    });
  } catch (error) {
    console.error(`Error updating contact ${contactId} with email metrics:`, error);
  }
}

/**
 * Calculate response rate from metrics
 * @param {Object} metrics - Email metrics
 * @returns {number} Response rate (0-1)
 */
function calculateResponseRate(metrics) {
  if (metrics.emailsSent === 0) return 0;
  
  const contactResponses = metrics.responseTimes.fromContact.length;
  return contactResponses / metrics.emailsSent;
}

/**
 * Calculate average thread depth
 * @param {Object} metrics - Email metrics
 * @returns {number} Average thread depth
 */
function calculateAverageThreadDepth(metrics) {
  if (metrics.threadDepths.length === 0) return 0;
  
  const sum = metrics.threadDepths.reduce((acc, depth) => acc + depth, 0);
  return sum / metrics.threadDepths.length;
}

/**
 * Calculate average response time
 * @param {Object} metrics - Email metrics
 * @returns {number} Average response time in hours
 */
function calculateAverageResponseTime(metrics) {
  const responseTimes = metrics.responseTimes.fromContact;
  if (responseTimes.length === 0) return 0;
  
  const sum = responseTimes.reduce((acc, time) => acc + time, 0);
  return sum / responseTimes.length;
}

/**
 * Calculate communication trend
 * @param {Object} metrics - Email metrics
 * @returns {string} Trend (increasing, stable, decreasing)
 */
function calculateCommunicationTrend(metrics) {
  const recent = metrics.byTimePeriod.recent.sent + metrics.byTimePeriod.recent.received;
  const medium = metrics.byTimePeriod.medium.sent + metrics.byTimePeriod.medium.received;
  
  // Normalize to per-month rate
  const recentRate = recent; // Already 30 days
  const mediumRate = medium / 3; // 90 days to 30 days
  
  if (recentRate > mediumRate * 1.5) {
    return 'increasing';
  } else if (recentRate < mediumRate * 0.5) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

/**
 * Run the email analysis
 */
async function run() {
  try {
    await analyzeAllContacts();
    
    // Recalculate importance scores
    const graph = new KnowledgeGraph();
    await graph.initialize(ENTITIES_PATH, RELATIONSHIPS_PATH);
    graph.calculateImportanceScores();
    await graph.saveToFiles();
    
    console.log('Email analysis and importance score calculation complete.');
  } catch (error) {
    console.error('Error running email analysis:', error);
  }
}

// Run the script if executed directly
if (require.main === module) {
  run();
}

module.exports = {
  analyzeAllContacts,
  analyzeContactEmails,
  calculateResponseRate,
  calculateAverageThreadDepth,
  calculateAverageResponseTime,
  calculateCommunicationTrend,
  run
};