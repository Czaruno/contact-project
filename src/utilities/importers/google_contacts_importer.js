/**
 * Google Contacts Importer
 * 
 * Utility for importing and processing Google Contacts CSV export files.
 * This utility parses the exported CSV and transforms it into the knowledge
 * graph entity format for further processing.
 */

const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

/**
 * Parse a Google Contacts CSV export file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} - Parsed contact data
 */
async function parseGoogleContactsExport(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        
        createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

/**
 * Transform Google Contacts data into knowledge graph entities
 * @param {Array} contactsData - Parsed contact data from CSV
 * @returns {Array} - Contact entities in knowledge graph format
 */
function transformToEntities(contactsData) {
    return contactsData.map((contact, index) => {
        // Create a unique ID for this contact
        const id = index + 1;
        
        // Extract email addresses (Google exports can have multiple)
        const emails = [];
        for (let i = 1; i <= 3; i++) {
            const emailField = `E-mail ${i} - Value`;
            if (contact[emailField] && contact[emailField].trim()) {
                emails.push(contact[emailField].trim());
            }
        }
        
        // Extract phone numbers
        const phones = [];
        for (let i = 1; i <= 3; i++) {
            const phoneField = `Phone ${i} - Value`;
            if (contact[phoneField] && contact[phoneField].trim()) {
                phones.push(contact[phoneField].trim());
            }
        }
        
        // Extract organization data
        let organization = null;
        if (contact['Organization 1 - Name'] && contact['Organization 1 - Name'].trim()) {
            organization = {
                name: contact['Organization 1 - Name'].trim(),
                title: contact['Organization 1 - Title'] || ''
            };
        }
        
        // Create the entity object
        return {
            id: `contact_${id}`,
            name: `${contact['Given Name'] || ''} ${contact['Family Name'] || ''}`.trim(),
            entityType: 'Contact',
            observations: [
                {
                    type: 'contact_details',
                    emails: emails,
                    phones: phones,
                    organization: organization,
                    address: contact['Address 1 - Formatted'] || ''
                },
                {
                    type: 'relationship_info',
                    notes: contact['Notes'] || ''
                },
                {
                    type: 'communication_metrics',
                    lastContacted: null,
                    emailCount: 0,
                    responseRate: 0,
                    meetingCount: 0
                },
                {
                    type: 'importance_metrics',
                    manualPriority: 0,  // 0-10 scale, to be set manually
                    calculatedScore: 0  // To be calculated by ranking algorithm
                }
            ]
        };
    });
}

/**
 * Process Google Contacts export and save as knowledge graph entities
 * @param {string} inputFilePath - Path to the Google Contacts CSV
 * @param {string} outputFilePath - Path to save the knowledge graph entities
 * @returns {Promise<void>}
 */
async function processGoogleContacts(inputFilePath, outputFilePath) {
    try {
        // Parse CSV file
        const contactsData = await parseGoogleContactsExport(inputFilePath);
        console.log(`Parsed ${contactsData.length} contacts from CSV.`);
        
        // Transform data to entities
        const entities = transformToEntities(contactsData);
        console.log(`Transformed ${entities.length} entities.`);
        
        // Ensure the output directory exists
        const outputDir = path.dirname(outputFilePath);
        await fs.mkdir(outputDir, { recursive: true });
        
        // Write to JSON file
        await fs.writeFile(outputFilePath, JSON.stringify(entities, null, 2));
        console.log(`Entities saved to ${outputFilePath}`);
        
        return entities;
    } catch (error) {
        console.error('Error processing Google Contacts:', error);
        throw error;
    }
}

/**
 * Helper function to extract just the email and name mapping for easier lookup
 * @param {Array} entities - Entities array
 * @returns {Object} - Mapping from email to entity ID
 */
function extractEmailMapping(entities) {
    const mapping = {};
    
    entities.forEach(entity => {
        const emails = entity.observations
            .find(obs => obs.type === 'contact_details')?.emails || [];
        
        emails.forEach(email => {
            mapping[email.toLowerCase()] = entity.id;
        });
    });
    
    return mapping;
}

module.exports = {
    parseGoogleContactsExport,
    transformToEntities,
    processGoogleContacts,
    extractEmailMapping
};
