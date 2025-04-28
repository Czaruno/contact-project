/**
 * Outreach Tracking System
 * 
 * This utility tracks the status of outreach efforts and monitors responses.
 * It integrates with the signature encoding system for stealth tracking.
 */

const fs = require('fs').promises;
const path = require('path');
const { decodeStealthSignature } = require('./signature_encoder');

// Base directory for all files
const BASE_DIR = path.resolve(__dirname, '..');

// File paths
const TRACKING_DIR = path.join(BASE_DIR, 'tracking');
const OUTREACH_STATUS_PATH = path.join(TRACKING_DIR, 'outreach_status.json');
const RESPONSE_METRICS_PATH = path.join(TRACKING_DIR, 'response_metrics.json');
const TRACKING_CODES_PATH = path.join(BASE_DIR, 'knowledge_graph', 'tracking_codes.json');

/**
 * Initialize the tracking system
 * @returns {Promise<Object>} - Tracking system data
 */
async function initializeTrackingSystem() {
    try {
        // Create tracking directory if it doesn't exist
        await fs.mkdir(TRACKING_DIR, { recursive: true });
        
        // Initialize tracking data structures
        const trackingData = {
            outreachStatus: {},
            responseMetrics: {
                totalSent: 0,
                totalResponses: 0,
                responseRate: 0,
                responseTimes: {},
                categoryMetrics: {},
                weeklyStats: []
            },
            trackingCodes: {}
        };
        
        // Try to load existing data
        try {
            const [outreachStatusData, responseMetricsData, trackingCodesData] = await Promise.all([
                fs.readFile(OUTREACH_STATUS_PATH, 'utf8').catch(() => null),
                fs.readFile(RESPONSE_METRICS_PATH, 'utf8').catch(() => null),
                fs.readFile(TRACKING_CODES_PATH, 'utf8').catch(() => null)
            ]);
            
            if (outreachStatusData) {
                trackingData.outreachStatus = JSON.parse(outreachStatusData);
            }
            
            if (responseMetricsData) {
                trackingData.responseMetrics = JSON.parse(responseMetricsData);
            }
            
            if (trackingCodesData) {
                trackingData.trackingCodes = JSON.parse(trackingCodesData);
            }
        } catch (error) {
            console.log('No existing tracking data found, creating new tracking system.');
        }
        
        return trackingData;
    } catch (error) {
        console.error('Error initializing tracking system:', error);
        throw error;
    }
}

/**
 * Save tracking data to files
 * @param {Object} trackingData - Tracking system data
 * @returns {Promise<void>}
 */
async function saveTrackingData(trackingData) {
    try {
        await Promise.all([
            fs.writeFile(OUTREACH_STATUS_PATH, JSON.stringify(trackingData.outreachStatus, null, 2)),
            fs.writeFile(RESPONSE_METRICS_PATH, JSON.stringify(trackingData.responseMetrics, null, 2)),
            fs.writeFile(TRACKING_CODES_PATH, JSON.stringify(trackingData.trackingCodes, null, 2))
        ]);
        
        console.log('Tracking data saved.');
    } catch (error) {
        console.error('Error saving tracking data:', error);
        throw error;
    }
}

/**
 * Record a new outreach attempt
 * @param {Object} email - Generated email object
 * @param {Object} trackingData - Tracking system data
 * @returns {Object} - Updated tracking data
 */
function recordOutreach(email, trackingData) {
    const contactId = email.contactId;
    const now = new Date().toISOString();
    
    // Record in outreach status
    trackingData.outreachStatus[contactId] = {
        ...(trackingData.outreachStatus[contactId] || {}),
        lastOutreachDate: now,
        outreachCount: (trackingData.outreachStatus[contactId]?.outreachCount || 0) + 1,
        lastEmailSubject: email.subject,
        lastEmailTo: email.to,
        responded: false,
        responseDate: null
    };
    
    // Record tracking code mapping
    trackingData.trackingCodes[contactId] = {
        contactId,
        email: email.to,
        outreachDate: now,
        signatureChunks: [" Larry Velez ", " kogi.ai ", " 212-380-1014 ", " "]
    };
    
    // Update response metrics
    trackingData.responseMetrics.totalSent++;
    
    // Update category metrics if available
    if (email.category) {
        const category = email.category;
        if (!trackingData.responseMetrics.categoryMetrics[category]) {
            trackingData.responseMetrics.categoryMetrics[category] = {
                sent: 0,
                responses: 0,
                responseRate: 0
            };
        }
        
        trackingData.responseMetrics.categoryMetrics[category].sent++;
    }
    
    // Update weekly stats
    const currentWeek = getWeekNumber(new Date());
    const weeklyEntry = trackingData.responseMetrics.weeklyStats.find(entry => 
        entry.year === currentWeek.year && entry.week === currentWeek.week);
    
    if (weeklyEntry) {
        weeklyEntry.sent++;
    } else {
        trackingData.responseMetrics.weeklyStats.push({
            year: currentWeek.year,
            week: currentWeek.week,
            sent: 1,
            responses: 0,
            responseRate: 0
        });
    }
    
    return trackingData;
}

/**
 * Record a response to an outreach
 * @param {string} signature - Email signature containing tracking code
 * @param {Date} responseDate - Date of the response
 * @param {Object} trackingData - Tracking system data
 * @returns {Object} - Updated tracking data and decoded contact ID
 */
function recordResponse(signature, responseDate, trackingData) {
    // Try to extract contactId from signature
    let contactId = null;
    
    // Iterate through tracking codes to find a match
    for (const [id, codeData] of Object.entries(trackingData.trackingCodes)) {
        try {
            const decodedId = decodeStealthSignature(signature, codeData.signatureChunks);
            const expectedId = parseInt(id.replace('contact_', ''), 10);
            
            if (decodedId === expectedId) {
                contactId = `contact_${decodedId}`;
                break;
            }
        } catch (error) {
            // Continue to the next tracking code if decoding fails
            continue;
        }
    }
    
    if (!contactId) {
        throw new Error('Could not decode contact ID from signature');
    }
    
    // Get outreach data
    const outreachData = trackingData.outreachStatus[contactId];
    if (!outreachData) {
        throw new Error(`No outreach record found for contact ID ${contactId}`);
    }
    
    // Calculate response time
    const outreachDate = new Date(outreachData.lastOutreachDate);
    const responseTime = (responseDate - outreachDate) / (1000 * 60 * 60 * 24); // Days
    
    // Update outreach status
    outreachData.responded = true;
    outreachData.responseDate = responseDate.toISOString();
    outreachData.responseTime = responseTime;
    
    // Update response metrics
    trackingData.responseMetrics.totalResponses++;
    trackingData.responseMetrics.responseRate = 
        trackingData.responseMetrics.totalResponses / trackingData.responseMetrics.totalSent;
    
    // Record response time
    trackingData.responseMetrics.responseTimes[contactId] = responseTime;
    
    // Update category metrics if available
    const email = trackingData.trackingCodes[contactId];
    if (email && email.category) {
        const category = email.category;
        if (trackingData.responseMetrics.categoryMetrics[category]) {
            trackingData.responseMetrics.categoryMetrics[category].responses++;
            trackingData.responseMetrics.categoryMetrics[category].responseRate = 
                trackingData.responseMetrics.categoryMetrics[category].responses / 
                trackingData.responseMetrics.categoryMetrics[category].sent;
        }
    }
    
    // Update weekly stats
    const responseWeek = getWeekNumber(responseDate);
    const weeklyEntry = trackingData.responseMetrics.weeklyStats.find(entry => 
        entry.year === responseWeek.year && entry.week === responseWeek.week);
    
    if (weeklyEntry) {
        weeklyEntry.responses++;
        weeklyEntry.responseRate = weeklyEntry.responses / weeklyEntry.sent;
    }
    
    return { trackingData, contactId };
}

/**
 * Get the ISO week number for a date
 * @param {Date} date - The date
 * @returns {Object} - Year and week number
 */
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return {
        year: d.getUTCFullYear(),
        week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    };
}

/**
 * Update knowledge graph with response data
 * @param {string} contactId - Contact ID
 * @param {Object} graph - Knowledge graph instance
 * @returns {Promise<void>}
 */
async function updateKnowledgeGraphWithResponse(contactId, graph) {
    // Get the contact entity
    const contact = graph.entities[contactId];
    if (!contact) {
        throw new Error(`Contact ${contactId} not found in knowledge graph`);
    }
    
    // Update communication metrics
    const metricsObs = contact.observations.find(obs => obs.type === 'communication_metrics');
    if (metricsObs) {
        // Increment response count
        metricsObs.responseCount = (metricsObs.responseCount || 0) + 1;
        
        // Update response rate
        if (metricsObs.emailCount) {
            metricsObs.responseRate = metricsObs.responseCount / metricsObs.emailCount;
        }
        
        // Update last contacted date
        metricsObs.lastContacted = new Date().toISOString();
    }
    
    // Save knowledge graph
    await graph.saveToFiles();
}

/**
 * Generate a report on outreach effectiveness
 * @param {Object} trackingData - Tracking system data
 * @param {Object} graph - Knowledge graph instance
 * @returns {string} - Markdown formatted report
 */
function generateEffectivenessReport(trackingData, graph) {
    const { responseMetrics } = trackingData;
    
    // Calculate average response time
    const responseTimes = Object.values(responseMetrics.responseTimes);
    const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;
    
    // Generate category statistics
    let categoryStats = '';
    for (const [category, metrics] of Object.entries(responseMetrics.categoryMetrics)) {
        categoryStats += `
### ${category}
- Emails Sent: ${metrics.sent}
- Responses Received: ${metrics.responses}
- Response Rate: ${(metrics.responseRate * 100).toFixed(1)}%
`;
    }
    
    // Generate weekly trend data
    const weeklyStats = responseMetrics.weeklyStats
        .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.week - b.week;
        })
        .map(entry => `| ${entry.year}-W${entry.week} | ${entry.sent} | ${entry.responses} | ${(entry.responseRate * 100).toFixed(1)}% |`)
        .join('\n');
    
    // Get top responding contacts
    const topResponders = Object.entries(trackingData.outreachStatus)
        .filter(([_, data]) => data.responded)
        .sort((a, b) => {
            const timeA = a[1].responseTime || Infinity;
            const timeB = b[1].responseTime || Infinity;
            return timeA - timeB;
        })
        .slice(0, 5)
        .map(([contactId, data]) => {
            const contact = graph.entities[contactId];
            const name = contact ? contact.name : 'Unknown';
            return `- ${name}: ${data.responseTime.toFixed(1)} days`;
        })
        .join('\n');
    
    // Build the report
    return `# Outreach Effectiveness Report
Generated: ${new Date().toISOString()}

## Overall Metrics
- Total Emails Sent: ${responseMetrics.totalSent}
- Total Responses Received: ${responseMetrics.totalResponses}
- Overall Response Rate: ${(responseMetrics.responseRate * 100).toFixed(1)}%
- Average Response Time: ${avgResponseTime.toFixed(1)} days

## Top Quickest Responders
${topResponders}

## Category Performance
${categoryStats}

## Weekly Trends
| Week | Sent | Responses | Rate |
|------|------|-----------|------|
${weeklyStats}
`;
}

module.exports = {
    initializeTrackingSystem,
    saveTrackingData,
    recordOutreach,
    recordResponse,
    updateKnowledgeGraphWithResponse,
    generateEffectivenessReport
};
