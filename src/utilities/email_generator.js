/**
 * Email Generator
 * 
 * This utility generates personalized emails based on templates
 * and includes stealth tracking through encoded signatures.
 */

const fs = require('fs').promises;
const path = require('path');
const { generateStealthSignature } = require('./signature_encoder');

/**
 * Load a template file
 * @param {string} templatePath - Path to the template file
 * @returns {Promise<string>} - The template content
 */
async function loadTemplate(templatePath) {
    try {
        return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
        console.error(`Error loading template: ${error.message}`);
        throw error;
    }
}

/**
 * Generate a personalized email from a template and contact data
 * @param {string} templatePath - Path to the template file
 * @param {Object} contactData - Data for the contact
 * @param {Object} userData - User data for templating
 * @returns {Promise<Object>} - The generated email object
 */
async function generateEmail(templatePath, contactData, userData) {
    // Load the template
    const template = await loadTemplate(templatePath);
    
    // Extract contact details
    const contactDetails = contactData.observations.find(obs => obs.type === 'contact_details');
    const importanceMetrics = contactData.observations.find(obs => obs.type === 'importance_metrics');
    
    // Generate personalization based on contact data
    const personalizationContent = generatePersonalization(contactData, importanceMetrics?.calculatedScore || 0);
    
    // Replace template variables
    let emailContent = template
        .replace('[CONTACT_NAME]', contactData.name)
        .replace('[NEW_EMAIL]', userData.email || 'your-new-email@example.com')
        .replace('[NEW_PHONE]', userData.phone || 'your-new-phone')
        .replace('[NEW_ADDRESS]', userData.address || 'your-new-address')
        .replace('[PERSONALIZATION_SECTION]', personalizationContent);
    
    // Extract the signature line to encode
    const signatureLineRegex = /(.+\| .+\| .+\|)/;
    const match = emailContent.match(signatureLineRegex);
    
    if (match) {
        const signatureLine = match[1];
        
        // Split the signature into chunks for encoding
        const parts = signatureLine.split('|');
        const signatureChunks = parts.map(part => part + ' ');
        
        // Get contact ID (numeric part after "contact_")
        const idStr = contactData.id.replace('contact_', '');
        const contactId = parseInt(idStr, 10);
        
        // Generate encoded signature
        const encodedSignature = generateStealthSignature(contactId, signatureChunks);
        
        // Replace the original signature with the encoded one
        emailContent = emailContent.replace(signatureLine, encodedSignature);
    }
    
    // Create email object
    const email = {
        to: contactDetails.emails[0] || 'unknown@example.com',
        subject: `My New Contact Information`,
        content: emailContent,
        contactId: contactData.id,
        generatedOn: new Date().toISOString()
    };
    
    return email;
}

/**
 * Generate personalized content based on contact data
 * @param {Object} contactData - Data for the contact
 * @param {number} importanceScore - Calculated importance score
 * @returns {string} - Personalized content
 */
function generatePersonalization(contactData, importanceScore) {
    // Different personalization based on importance tiers
    if (importanceScore >= 80) {
        // Tier 1: Very important contact
        return `It's been a while since we last connected, and I've been thinking about how much I value our relationship. Your insights on [specific topic] have been particularly valuable to me.

I'm currently working on some exciting new projects that I'd love to share with you when we next speak. Perhaps we could schedule a call or meet for coffee in the coming weeks?`;
    } else if (importanceScore >= 60) {
        // Tier 2: Important contact
        return `I've been reflecting on our past conversations and wanted to reconnect. I hope your work on [mention their recent project if known] has been going well.

I'd love to catch up and hear what you've been working on recently. Would you be open to grabbing coffee or scheduling a call in the near future?`;
    } else if (importanceScore >= 40) {
        // Tier 3: Moderate importance
        return `I hope all has been well with you since we last connected. I've been doing some reorganizing and wanted to make sure you have my current information.

I'd be happy to hear how things are going on your end when you have a moment.`;
    } else {
        // Tier 4: Lower importance
        return `I'm in the process of updating my contact information and wanted to make sure you have my current details. I hope all is well with you.`;
    }
}

/**
 * Generate emails for multiple contacts
 * @param {Array} contacts - Array of contact entities
 * @param {string} templatePath - Path to the template file
 * @param {Object} userData - User data for templating
 * @returns {Promise<Array>} - Array of generated email objects
 */
async function generateBulkEmails(contacts, templatePath, userData) {
    const emails = [];
    
    for (const contact of contacts) {
        try {
            const email = await generateEmail(templatePath, contact, userData);
            emails.push(email);
        } catch (error) {
            console.error(`Error generating email for ${contact.name}: ${error.message}`);
        }
    }
    
    return emails;
}

/**
 * Save generated emails to files
 * @param {Array} emails - Array of email objects
 * @param {string} outputDir - Directory to save emails
 * @returns {Promise<void>}
 */
async function saveEmailsToFiles(emails, outputDir) {
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save each email to a file
    for (const email of emails) {
        const fileName = `${email.contactId.replace('contact_', '')}_${email.to.replace('@', '_at_')}.md`;
        const filePath = path.join(outputDir, fileName);
        
        const fileContent = `# Email to ${email.to}
## Subject: ${email.subject}
## Generated: ${email.generatedOn}

${email.content}`;
        
        await fs.writeFile(filePath, fileContent);
    }
    
    console.log(`Saved ${emails.length} emails to ${outputDir}`);
}

module.exports = {
    generateEmail,
    generateBulkEmails,
    saveEmailsToFiles
};
