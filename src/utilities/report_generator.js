/**
 * Report Generator
 * 
 * This utility generates progress reports on contact management and outreach efforts.
 */

const fs = require('fs').promises;
const path = require('path');

// Base directory for all files
const BASE_DIR = path.resolve(__dirname, '..');

// File paths
const REPORTS_DIR = path.join(BASE_DIR, 'reports');
const GOALS_PROGRESS_PATH = path.join(BASE_DIR, 'tracking', 'goals_progress.json');

/**
 * Initialize the report generator
 * @returns {Promise<Object>} - Goals progress data
 */
async function initializeReportGenerator() {
    try {
        // Create reports directory if it doesn't exist
        await fs.mkdir(REPORTS_DIR, { recursive: true });
        
        // Initialize goals progress data
        let goalsProgress = {
            contactsProcessed: 0,
            contactsOutreached: 0,
            contactsResponded: 0,
            top150Identified: false,
            top150Contacted: 0,
            top150Responded: 0,
            targetCompletionDate: null,
            startDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        // Try to load existing data
        try {
            const goalsProgressData = await fs.readFile(GOALS_PROGRESS_PATH, 'utf8');
            goalsProgress = JSON.parse(goalsProgressData);
            goalsProgress.lastUpdated = new Date().toISOString();
        } catch (error) {
            console.log('No existing goals progress data found, creating new tracking.');
            // Create tracking directory if it doesn't exist
            await fs.mkdir(path.dirname(GOALS_PROGRESS_PATH), { recursive: true });
            // Save initial goals progress
            await fs.writeFile(GOALS_PROGRESS_PATH, JSON.stringify(goalsProgress, null, 2));
        }
        
        return goalsProgress;
    } catch (error) {
        console.error('Error initializing report generator:', error);
        throw error;
    }
}

/**
 * Save goals progress data
 * @param {Object} goalsProgress - Goals progress data
 * @returns {Promise<void>}
 */
async function saveGoalsProgress(goalsProgress) {
    try {
        goalsProgress.lastUpdated = new Date().toISOString();
        await fs.writeFile(GOALS_PROGRESS_PATH, JSON.stringify(goalsProgress, null, 2));
        console.log('Goals progress saved.');
    } catch (error) {
        console.error('Error saving goals progress:', error);
        throw error;
    }
}

/**
 * Update goals progress with new data
 * @param {Object} newData - New data to update
 * @param {Object} goalsProgress - Current goals progress data
 * @returns {Object} - Updated goals progress data
 */
function updateGoalsProgress(newData, goalsProgress) {
    return {
        ...goalsProgress,
        ...newData
    };
}

/**
 * Generate a progress report
 * @param {Object} goalsProgress - Goals progress data
 * @param {Object} graph - Knowledge graph instance
 * @param {Object} trackingData - Tracking system data
 * @returns {string} - Markdown formatted report
 */
function generateProgressReport(goalsProgress, graph, trackingData) {
    // Calculate days since start
    const startDate = new Date(goalsProgress.startDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    
    // Calculate progress percentages
    const contactsProcessedPercent = goalsProgress.contactsProcessed > 0 
        ? (goalsProgress.contactsProcessed / 2000) * 100 
        : 0;
    
    const top150ContactedPercent = goalsProgress.top150Identified 
        ? (goalsProgress.top150Contacted / 150) * 100 
        : 0;
    
    const top150RespondedPercent = goalsProgress.top150Contacted > 0 
        ? (goalsProgress.top150Responded / goalsProgress.top150Contacted) * 100 
        : 0;
    
    // Get contact statistics from knowledge graph
    const totalContacts = Object.values(graph.entities).filter(e => e.entityType === 'Contact').length;
    const categorizedContacts = graph.relationships.filter(r => r.relationType === 'is_categorized_as').length;
    const categorizedPercent = totalContacts > 0 ? (categorizedContacts / totalContacts) * 100 : 0;
    
    // Get contact importance tiers
    const contacts = Object.values(graph.entities).filter(e => e.entityType === 'Contact');
    const scoredContacts = contacts.filter(c => {
        const importanceObs = c.observations.find(obs => obs.type === 'importance_metrics');
        return importanceObs && importanceObs.calculatedScore > 0;
    });
    
    // Sort by score
    const sortedContacts = [...scoredContacts].sort((a, b) => {
        const scoreA = a.observations.find(obs => obs.type === 'importance_metrics')?.calculatedScore || 0;
        const scoreB = b.observations.find(obs => obs.type === 'importance_metrics')?.calculatedScore || 0;
        return scoreB - scoreA;
    });
    
    // Get top 50, 51-100, 101-150
    const top50 = sortedContacts.slice(0, 50);
    const next50 = sortedContacts.slice(50, 100);
    const next50more = sortedContacts.slice(100, 150);
    
    // Get outreach statistics
    const { responseMetrics } = trackingData;
    
    // Build the report
    return `# Contact Management Progress Report
Generated: ${now.toISOString()}

## Overall Progress
- Days since project start: ${daysSinceStart}
- Contacts processed: ${goalsProgress.contactsProcessed} / 2000 (${contactsProcessedPercent.toFixed(1)}%)
- Contacts in knowledge graph: ${totalContacts}
- Categorized contacts: ${categorizedContacts} (${categorizedPercent.toFixed(1)}% of total)
- Top 150 identified: ${goalsProgress.top150Identified ? 'Yes' : 'No'}
- Top 150 contacted: ${goalsProgress.top150Contacted} / 150 (${top150ContactedPercent.toFixed(1)}%)
- Top 150 response rate: ${top150RespondedPercent.toFixed(1)}%

## Current Contact Tiers
- Top 50 contacts identified: ${top50.length}
- Contacts 51-100 identified: ${next50.length}
- Contacts 101-150 identified: ${next50more.length}

## Outreach Progress
- Total emails sent: ${responseMetrics.totalSent}
- Total responses received: ${responseMetrics.totalResponses}
- Overall response rate: ${(responseMetrics.responseRate * 100).toFixed(1)}%

## Category Breakdown
${Object.entries(responseMetrics.categoryMetrics).map(([category, metrics]) => 
    `- ${category}: ${metrics.sent} sent, ${metrics.responses} responses (${(metrics.responseRate * 100).toFixed(1)}%)`
).join('\n')}

## Next Steps
${generateNextSteps(goalsProgress, totalContacts, scoredContacts.length)}

## Timeline
- Project start: ${new Date(goalsProgress.startDate).toLocaleDateString()}
- Last updated: ${new Date(goalsProgress.lastUpdated).toLocaleDateString()}
${goalsProgress.targetCompletionDate ? `- Target completion: ${new Date(goalsProgress.targetCompletionDate).toLocaleDateString()}` : '- Target completion date not set'}
`;
}

/**
 * Generate next steps based on current progress
 * @param {Object} goalsProgress - Goals progress data
 * @param {number} totalContacts - Total contacts in knowledge graph
 * @param {number} scoredContacts - Number of contacts with importance scores
 * @returns {string} - Markdown formatted next steps
 */
function generateNextSteps(goalsProgress, totalContacts, scoredContacts) {
    const steps = [];
    
    if (totalContacts < 100) {
        steps.push('1. Import more contacts into the knowledge graph');
    }
    
    if (scoredContacts < totalContacts) {
        steps.push(`2. Calculate importance scores for ${totalContacts - scoredContacts} remaining contacts`);
    }
    
    if (!goalsProgress.top150Identified) {
        steps.push('3. Identify the top 150 contacts based on importance scores');
    }
    
    if (goalsProgress.top150Contacted < 50) {
        steps.push('4. Begin outreach to the top 50 most important contacts');
    } else if (goalsProgress.top150Contacted < 100) {
        steps.push('4. Continue outreach to contacts 51-100');
    } else if (goalsProgress.top150Contacted < 150) {
        steps.push('4. Complete outreach to contacts 101-150');
    }
    
    if (goalsProgress.top150Contacted > 0 && goalsProgress.top150Responded < goalsProgress.top150Contacted * 0.5) {
        steps.push('5. Analyze response patterns and refine outreach templates to improve response rates');
    }
    
    if (steps.length === 0) {
        steps.push('All primary goals have been completed!');
    }
    
    return steps.join('\n');
}

/**
 * Save a report to file
 * @param {string} report - Markdown formatted report
 * @param {string} reportType - Type of report (progress, effectiveness, etc.)
 * @returns {Promise<string>} - Path to the saved report
 */
async function saveReport(report, reportType) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const fileName = `${reportType}_report_${dateStr}.md`;
    const filePath = path.join(REPORTS_DIR, fileName);
    
    await fs.writeFile(filePath, report);
    console.log(`${reportType} report saved to ${filePath}`);
    
    return filePath;
}

module.exports = {
    initializeReportGenerator,
    saveGoalsProgress,
    updateGoalsProgress,
    generateProgressReport,
    saveReport
};
