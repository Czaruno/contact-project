/**
 * Category-Based Email Generator
 * 
 * This utility extends the basic email generator to select templates
 * based on a contact's category, creating more personalized emails.
 */

const fs = require('fs').promises;
const path = require('path');
const { generateEmail, generateBulkEmails, saveEmailsToFiles } = require('./email_generator');

// Base directory for all files
const BASE_DIR = path.resolve(__dirname, '..');

// Template mappings
const TEMPLATE_MAPPINGS = {
    'Investor': path.join(BASE_DIR, 'templates', 'investor_template.md'),
    'Family': path.join(BASE_DIR, 'templates', 'family_template.md'),
    'Colleague': path.join(BASE_DIR, 'templates', 'colleague_template.md'),
    'Industry Leader': path.join(BASE_DIR, 'templates', 'investor_template.md') // Use investor template as fallback
};

// Default template for unmapped categories
const DEFAULT_TEMPLATE = path.join(BASE_DIR, 'templates', 'general_template.md');

/**
 * Find the category for a contact from relationships
 * @param {Object} contact - Contact entity
 * @param {Array} relationships - Knowledge graph relationships
 * @param {Object} categoryEntities - Map of category entities by ID
 * @returns {string|null} - Category name or null if not found
 */
function findContactCategory(contact, relationships, categoryEntities) {
    // Find is_categorized_as relationships for this contact
    const categoryRelationships = relationships.filter(rel => 
        rel.from === contact.id && rel.relationType === 'is_categorized_as');
    
    if (categoryRelationships.length === 0) {
        return null;
    }
    
    // Get the category entity ID
    const categoryId = categoryRelationships[0].to;
    const category = categoryEntities[categoryId];
    
    return category ? category.name : null;
}

/**
 * Generate emails with templates based on contact categories
 * @param {Array} contacts - Array of contact entities
 * @param {Array} relationships - Knowledge graph relationships
 * @param {Object} categoryEntities - Map of category entities by ID
 * @param {Object} userData - User data for templating
 * @returns {Promise<Array>} - Array of generated email objects
 */
async function generateCategoryBasedEmails(contacts, relationships, categoryEntities, userData) {
    const emails = [];
    
    for (const contact of contacts) {
        try {
            // Find the category for this contact
            const category = findContactCategory(contact, relationships, categoryEntities);
            
            // Determine which template to use
            let templatePath = DEFAULT_TEMPLATE;
            if (category && TEMPLATE_MAPPINGS[category]) {
                templatePath = TEMPLATE_MAPPINGS[category];
            }
            
            // Generate the email
            const email = await generateEmail(templatePath, contact, userData);
            
            // Add category information
            email.category = category || 'Uncategorized';
            
            emails.push(email);
        } catch (error) {
            console.error(`Error generating email for ${contact.name}: ${error.message}`);
        }
    }
    
    return emails;
}

/**
 * Enriched version of saveEmailsToFiles that organizes by category
 * @param {Array} emails - Array of email objects
 * @param {string} outputDir - Directory to save emails
 * @returns {Promise<void>}
 */
async function saveEmailsByCategoryToFiles(emails, outputDir) {
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Group emails by category
    const emailsByCategory = {};
    emails.forEach(email => {
        const category = email.category || 'Uncategorized';
        if (!emailsByCategory[category]) {
            emailsByCategory[category] = [];
        }
        emailsByCategory[category].push(email);
    });
    
    // Save emails organized by category
    for (const [category, categoryEmails] of Object.entries(emailsByCategory)) {
        // Create category directory
        const categoryDir = path.join(outputDir, category.replace(/\s+/g, '_'));
        await fs.mkdir(categoryDir, { recursive: true });
        
        // Save each email
        for (const email of categoryEmails) {
            const fileName = `${email.contactId.replace('contact_', '')}_${email.to.replace('@', '_at_')}.md`;
            const filePath = path.join(categoryDir, fileName);
            
            const fileContent = `# Email to ${email.to} (${category})
## Subject: ${email.subject}
## Generated: ${email.generatedOn}

${email.content}`;
            
            await fs.writeFile(filePath, fileContent);
        }
    }
    
    console.log(`Saved ${emails.length} emails organized by category to ${outputDir}`);
}

module.exports = {
    findContactCategory,
    generateCategoryBasedEmails,
    saveEmailsByCategoryToFiles
};
