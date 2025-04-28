/**
 * Top Contacts Generator
 * 
 * This utility identifies and outputs the top N contacts 
 * based on calculated importance scores.
 */

const fs = require('fs').promises;
const path = require('path');
const KnowledgeGraph = require('./knowledge_graph');

// Base directory for all files
const BASE_DIR = path.resolve(__dirname, '..');

// File paths
const ENTITIES_PATH = path.join(BASE_DIR, 'knowledge_graph', 'entities.json');
const RELATIONSHIPS_PATH = path.join(BASE_DIR, 'knowledge_graph', 'relationships.json');
const TOP_CONTACTS_DIR = path.join(BASE_DIR, 'output', 'top_contacts');

/**
 * Generate a report of the top N contacts
 * @param {number} count Number of top contacts to include
 * @returns {Promise<string>} Path to the generated report
 */
async function generateTopContactsReport(count = 150) {
    try {
        // Initialize knowledge graph
        const graph = new KnowledgeGraph();
        await graph.initialize(ENTITIES_PATH, RELATIONSHIPS_PATH);
        
        // Get top contacts
        const topContacts = graph.getTopContacts(count);
        
        // Check if we have enough contacts
        if (topContacts.length === 0) {
            throw new Error('No contacts found in knowledge graph');
        }
        
        if (topContacts.length < count) {
            console.warn(`Warning: Only ${topContacts.length} contacts available (requested ${count})`);
        }
        
        // Create report directory if it doesn't exist
        await fs.mkdir(TOP_CONTACTS_DIR, { recursive: true });
        
        // Create report content
        let reportContent = `# Top ${topContacts.length} Contacts\n\n`;
        reportContent += `Generated: ${new Date().toISOString()}\n\n`;
        
        // Add table header
        reportContent += `| Rank | Name | Score | Email | Organization | Category |\n`;
        reportContent += `|------|------|-------|-------|--------------|----------|\n`;
        
        // Add table rows
        for (let i = 0; i < topContacts.length; i++) {
            const contact = topContacts[i];
            
            // Get contact details
            const contactDetails = contact.observations.find(obs => obs.type === 'contact_details');
            const importanceMetrics = contact.observations.find(obs => obs.type === 'importance_metrics');
            
            // Get email
            const email = contactDetails?.emails?.[0] || '';
            
            // Get organization
            const organization = contactDetails?.organization?.name || '';
            
            // Get category from relationships
            let category = 'Uncategorized';
            const categoryRelations = graph.findOutgoingRelationships(contact.id, 'is_categorized_as');
            if (categoryRelations.length > 0) {
                const categoryId = categoryRelations[0].to;
                const categoryEntity = graph.entities[categoryId];
                if (categoryEntity) {
                    category = categoryEntity.name;
                }
            }
            
            // Get score
            const score = importanceMetrics?.calculatedScore || 0;
            
            // Add row
            reportContent += `| ${i + 1} | ${contact.name} | ${score} | ${email} | ${organization} | ${category} |\n`;
        }
        
        // Create tiered lists
        reportContent += `\n## Contact Tiers\n\n`;
        
        // Tier 1: Top 50
        reportContent += `### Tier 1: Top 50\n\n`;
        for (let i = 0; i < Math.min(50, topContacts.length); i++) {
            const contact = topContacts[i];
            const score = contact.observations.find(obs => obs.type === 'importance_metrics')?.calculatedScore || 0;
            reportContent += `${i + 1}. ${contact.name} (${score})\n`;
        }
        
        // Tier 2: 51-100
        if (topContacts.length > 50) {
            reportContent += `\n### Tier 2: Contacts 51-100\n\n`;
            for (let i = 50; i < Math.min(100, topContacts.length); i++) {
                const contact = topContacts[i];
                const score = contact.observations.find(obs => obs.type === 'importance_metrics')?.calculatedScore || 0;
                reportContent += `${i + 1}. ${contact.name} (${score})\n`;
            }
        }
        
        // Tier 3: 101-150
        if (topContacts.length > 100) {
            reportContent += `\n### Tier 3: Contacts 101-150\n\n`;
            for (let i = 100; i < Math.min(150, topContacts.length); i++) {
                const contact = topContacts[i];
                const score = contact.observations.find(obs => obs.type === 'importance_metrics')?.calculatedScore || 0;
                reportContent += `${i + 1}. ${contact.name} (${score})\n`;
            }
        }
        
        // Category breakdown
        reportContent += `\n## Category Breakdown\n\n`;
        
        // Group contacts by category
        const categoryCounts = {};
        for (const contact of topContacts) {
            const categoryRelations = graph.findOutgoingRelationships(contact.id, 'is_categorized_as');
            if (categoryRelations.length > 0) {
                const categoryId = categoryRelations[0].to;
                const categoryEntity = graph.entities[categoryId];
                if (categoryEntity) {
                    const categoryName = categoryEntity.name;
                    categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
                } else {
                    categoryCounts['Uncategorized'] = (categoryCounts['Uncategorized'] || 0) + 1;
                }
            } else {
                categoryCounts['Uncategorized'] = (categoryCounts['Uncategorized'] || 0) + 1;
            }
        }
        
        // Add category counts
        for (const [category, count] of Object.entries(categoryCounts)) {
            const percentage = ((count / topContacts.length) * 100).toFixed(1);
            reportContent += `- ${category}: ${count} contacts (${percentage}%)\n`;
        }
        
        // Save report
        const reportPath = path.join(TOP_CONTACTS_DIR, `top_${topContacts.length}_contacts.md`);
        await fs.writeFile(reportPath, reportContent);
        
        console.log(`Top contacts report generated: ${reportPath}`);
        return reportPath;
    } catch (error) {
        console.error('Error generating top contacts report:', error);
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        const count = args[0] ? parseInt(args[0], 10) : 150;
        
        if (isNaN(count) || count <= 0) {
            console.error('Error: Invalid count argument. Please provide a positive number.');
            console.log('Usage: node generate_top_contacts.js [count]');
            process.exit(1);
        }
        
        // Generate report
        await generateTopContactsReport(count);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script if executed directly
if (require.main === module) {
    main();
}

module.exports = {
    generateTopContactsReport
};
