/**
 * Gmail Analysis Module for Claude Desktop
 * 
 * Implements the Gmail integration for the Contact Management Project
 * using Claude's built-in Gmail tools instead of Node.js.
 */

// Configuration for email analysis
const USER_CONFIG = {
  // User email aliases to check in communications
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

/**
 * Search Gmail using Claude's built-in Gmail search tool
 * @param {string} query - Gmail search query
 * @returns {Promise<Object>} - Search results
 */
async function searchGmail(query) {
  try {
    console.log(`Searching Gmail for: ${query}`);
    
    // Use the Claude Desktop Gmail search function
    const result = await search_gmail_messages({ q: query });
    return result;
  } catch (error) {
    console.error(`Error searching Gmail: ${error}`);
    return { messages: [] };
  }
}

/**
 * Get a thread from Gmail using Claude's built-in Gmail thread tool
 * @param {string} threadId - Thread ID
 * @returns {Promise<Object>} - Thread with messages
 */
async function getThread(threadId) {
  try {
    console.log(`Fetching thread: ${threadId}`);
    
    // Use the Claude Desktop Gmail thread function
    const thread = await read_gmail_thread({ 
      thread_id: threadId,
      include_full_messages: true
    });
    
    return thread;
  } catch (error) {
    console.error(`Error fetching thread ${threadId}: ${error}`);
    return null;
  }
}

/**
 * Analysis a contact's email communication patterns using Gmail search
 * @param {string} contactEmail - Contact's email address
 * @returns {Promise<Object>} - Analysis metrics
 */
async function analyzeContactEmails(contactEmail) {
  try {
    console.log(`Analyzing emails for ${contactEmail}...`);
    
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
    const receivedThreadsResult = await searchGmail(receivedQuery);
    const receivedThreads = receivedThreadsResult.messages || [];
    
    // Search for emails FROM you TO the contact
    const sentQuery = `(${userEmailsQuery}) to:${contactEmail}`;
    const sentThreadsResult = await searchGmail(sentQuery);
    const sentThreads = sentThreadsResult.messages || [];
    
    // Get unique thread IDs
    const threadIds = new Set([
      ...receivedThreads.map(msg => msg.threadId),
      ...sentThreads.map(msg => msg.threadId)
    ]);
    
    console.log(`Found ${threadIds.size} unique threads`);
    
    // Process each thread
    let threadCounter = 0;
    for (const threadId of threadIds) {
      threadCounter++;
      if (threadCounter % 10 === 0) {
        console.log(`Processed ${threadCounter}/${threadIds.size} threads`);
      }
      
      const thread = await getThread(threadId);
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
    
    console.log(`Analysis complete for ${contactEmail}`);
    console.log(`- Total emails: ${metrics.totalEmails}`);
    console.log(`- Sent: ${metrics.emailsSent}, Received: ${metrics.emailsReceived}`);
    
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
 * Analyze an email thread for communication patterns
 * @param {Object} thread - Thread object with messages
 * @param {string} contactEmail - Contact's email address
 * @returns {Object} - Thread metrics
 */
function analyzeThread(thread, contactEmail) {
  const metrics = {
    messageCount: thread.messages?.length || 0,
    fromUser: 0,
    fromContact: 0,
    firstDate: null,
    lastDate: null,
    contactResponseTimes: [],
    userResponseTimes: []
  };
  
  // If no messages in thread, return empty metrics
  if (!thread.messages || thread.messages.length === 0) {
    return metrics;
  }
  
  // Sort messages by date
  const messages = [...thread.messages].sort((a, b) => {
    // Handle different date formats in Gmail API response
    const getDateValue = (msg) => {
      if (msg.internalDate) return parseInt(msg.internalDate);
      if (msg.date) return new Date(msg.date).getTime();
      // Extract date from headers if needed
      const dateHeader = msg.payload?.headers?.find(h => 
        h.name.toLowerCase() === 'date'
      );
      return dateHeader ? new Date(dateHeader.value).getTime() : 0;
    };
    
    return getDateValue(a) - getDateValue(b);
  });
  
  // Set first and last dates
  if (messages.length > 0) {
    const getMessageDate = (msg) => {
      if (msg.internalDate) return new Date(parseInt(msg.internalDate));
      if (msg.date) return new Date(msg.date);
      // Extract date from headers
      const dateHeader = msg.payload?.headers?.find(h => 
        h.name.toLowerCase() === 'date'
      );
      return dateHeader ? new Date(dateHeader.value) : new Date();
    };
    
    metrics.firstDate = getMessageDate(messages[0]).toISOString();
    metrics.lastDate = getMessageDate(messages[messages.length - 1]).toISOString();
  }
  
  // Analyze each message
  messages.forEach((message, index) => {
    // Extract the from field from headers
    const getFromAddress = (msg) => {
      if (msg.from) return msg.from.toLowerCase();
      
      // Extract from from headers
      const fromHeader = msg.payload?.headers?.find(h => 
        h.name.toLowerCase() === 'from'
      );
      
      return fromHeader ? fromHeader.value.toLowerCase() : '';
    };
    
    const from = getFromAddress(message);
    
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
      const prevFrom = getFromAddress(prevMessage);
      
      const prevIsFromContact = prevFrom.includes(contactEmail.toLowerCase());
      const prevIsFromUser = USER_CONFIG.userEmails.some(email => 
        prevFrom.includes(email.toLowerCase())
      );
      
      // Get date values consistently
      const getMessageTime = (msg) => {
        if (msg.internalDate) return parseInt(msg.internalDate);
        if (msg.date) return new Date(msg.date).getTime();
        // Extract date from headers
        const dateHeader = msg.payload?.headers?.find(h => 
          h.name.toLowerCase() === 'date'
        );
        return dateHeader ? new Date(dateHeader.value).getTime() : 0;
      };
      
      // Calculate time difference in hours
      const prevDate = getMessageTime(prevMessage);
      const currDate = getMessageTime(message);
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
 * Calculate response rate from metrics
 * @param {Object} metrics - Email metrics
 * @returns {number} - Response rate (0-1)
 */
function calculateResponseRate(metrics) {
  if (metrics.emailsSent === 0) return 0;
  
  const contactResponses = metrics.responseTimes.fromContact.length;
  return contactResponses / metrics.emailsSent;
}

/**
 * Calculate average thread depth
 * @param {Object} metrics - Email metrics
 * @returns {number} - Average thread depth
 */
function calculateAverageThreadDepth(metrics) {
  if (metrics.threadDepths.length === 0) return 0;
  
  const sum = metrics.threadDepths.reduce((acc, depth) => acc + depth, 0);
  return sum / metrics.threadDepths.length;
}

/**
 * Calculate average response time
 * @param {Object} metrics - Email metrics
 * @returns {number} - Average response time in hours
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
 * @returns {string} - Trend (increasing, stable, decreasing)
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
 * Main function to analyze contact emails and update their importance
 * @param {Object} knowledgeGraph - Knowledge graph instance
 * @param {Array} contactEmails - List of contact email addresses to analyze
 * @returns {Promise<Object>} - Analysis metrics
 */
async function analyzeAndUpdateContactImportance(knowledgeGraph, contactEmails) {
  console.log(`Starting analysis for ${contactEmails.length} contacts...`);
  
  const results = {
    analyzed: 0,
    skipped: 0,
    updated: 0,
    totalEmails: 0
  };
  
  for (const email of contactEmails) {
    console.log(`Analyzing ${email}...`);
    
    try {
      // Get email metrics
      const metrics = await analyzeContactEmails(email);
      results.totalEmails += metrics.totalEmails;
      
      if (metrics.totalEmails === 0) {
        console.log(`No emails found for ${email}, skipping.`);
        results.skipped++;
        continue;
      }
      
      // Find contact in knowledge graph
      const contactEntity = findContactByEmail(knowledgeGraph, email);
      if (!contactEntity) {
        console.log(`Contact not found for email ${email}, skipping.`);
        results.skipped++;
        continue;
      }
      
      // Update contact metrics
      updateContactWithEmailMetrics(knowledgeGraph, contactEntity.id, metrics);
      
      results.analyzed++;
      results.updated++;
      
      console.log(`Updated metrics for ${email} (${contactEntity.name})`);
    } catch (error) {
      console.error(`Error analyzing ${email}: ${error.message}`);
      results.skipped++;
    }
  }
  
  console.log(`Analysis complete: ${results.analyzed} contacts analyzed, ${results.updated} updated`);
  return results;
}

/**
 * Find a contact entity by email address
 * @param {Object} knowledgeGraph - Knowledge graph instance
 * @param {string} email - Email address to find
 * @returns {Object|null} - Contact entity or null if not found
 */
function findContactByEmail(knowledgeGraph, email) {
  const normalizedEmail = email.toLowerCase();
  
  for (const [id, entity] of Object.entries(knowledgeGraph.entities)) {
    if (entity.entityType !== 'Contact') continue;
    
    const contactDetails = entity.observations.find(obs => obs.type === 'contact_details');
    if (!contactDetails || !contactDetails.emails) continue;
    
    const matchingEmail = contactDetails.emails.find(e => 
      e && e.toLowerCase() === normalizedEmail
    );
    
    if (matchingEmail) {
      return { id, ...entity };
    }
  }
  
  return null;
}

/**
 * Update a contact with email metrics
 * @param {Object} knowledgeGraph - Knowledge graph instance
 * @param {string} contactId - Contact ID
 * @param {Object} metrics - Email metrics
 */
function updateContactWithEmailMetrics(knowledgeGraph, contactId, metrics) {
  try {
    // Update communication metrics
    knowledgeGraph.updateEntityObservation(contactId, 'communication_metrics', {
      lastContacted: metrics.lastContactDate,
      emailCount: metrics.totalEmails,
      responseRate: calculateResponseRate(metrics),
      meetingCount: 0 // This would need to be updated separately
    });
    
    // Add detailed communication patterns
    knowledgeGraph.updateEntityObservation(contactId, 'communication_patterns', {
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

module.exports = {
  analyzeContactEmails,
  analyzeAndUpdateContactImportance,
  calculateResponseRate,
  calculateAverageThreadDepth,
  calculateAverageResponseTime,
  calculateCommunicationTrend,
  findContactByEmail,
  updateContactWithEmailMetrics
};