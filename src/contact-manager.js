/**
 * Contact Manager
 * 
 * This is the main controller for the contact management system.
 * It provides a high-level interface for all operations and processes
 * natural language commands from users.
 */

const path = require('path');
const Integrator = require('./integrator');

class ContactManager {
    constructor() {
        this.integrator = new Integrator();
        this.initialized = false;
        this.dataDirectory = path.join(process.cwd(), 'data');
        this.entitiesFilePath = path.join(this.dataDirectory, 'knowledge_graph', 'entities.json');
        this.relationshipsFilePath = path.join(this.dataDirectory, 'knowledge_graph', 'relationships.json');
        this.templateDirectory = path.join(process.cwd(), 'templates');
        this.reportDirectory = path.join(process.cwd(), 'reports');
    }

    /**
     * Initialize the contact manager
     * @returns {Promise<Object>} - Initialization results
     */
    async initialize() {
        try {
            const result = await this.integrator.initialize(
                this.entitiesFilePath,
                this.relationshipsFilePath
            );
            
            this.initialized = true;
            
            return {
                status: 'success',
                message: 'Contact manager initialized successfully',
                details: result
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Failed to initialize contact manager: ${error.message}`,
                error
            };
        }
    }

    /**
     * Process a natural language command
     * @param {string} command - The command to process
     * @param {Object} options - Additional options for the command
     * @returns {Promise<Object>} - Command execution results
     */
    async processCommand(command, options = {}) {
        // Initialize if not already initialized
        if (!this.initialized) {
            await this.initialize();
        }

        // Convert command to lowercase for easier matching
        const cmd = command.toLowerCase();
        
        try {
            // Match command patterns
            if (cmd.includes('analyze email') || cmd.includes('analyze gmail')) {
                if (options.email) {
                    return await this.analyzeContact(options.email, options.maxEmails);
                } else {
                    return {
                        status: 'error',
                        message: 'Please specify an email address to analyze.'
                    };
                }
            }
            
            else if (cmd.includes('analyze contact')) {
                if (options.email) {
                    return await this.analyzeContact(options.email, options.maxEmails);
                } else {
                    return {
                        status: 'error',
                        message: 'Please specify an email address to analyze.'
                    };
                }
            }
            
            else if (cmd.includes('import contacts') || cmd.includes('sync contacts')) {
                return await this.importContacts();
            }
            
            else if (cmd.includes('generate email') || cmd.includes('send email')) {
                if (options.contactIds && options.contactIds.length > 0) {
                    return await this.generateEmailsForContacts(
                        options.contactIds,
                        options.templateType || 'general',
                        options.userData || {}
                    );
                } else {
                    return {
                        status: 'error',
                        message: 'Please specify contact IDs for email generation.'
                    };
                }
            }
            
            else if (cmd.includes('top contacts')) {
                return this.getTopContacts(
                    options.count || 50,
                    options.category
                );
            }
            
            else if (cmd.includes('generate report')) {
                return await this.generateReport(
                    options.reportType || 'top_contacts',
                    options
                );
            }
            
            else if (cmd.includes('track response') || cmd.includes('check response')) {
                return await this.trackOutreachResponses(options.days || 30);
            }
            
            else {
                return {
                    status: 'error',
                    message: 'Unknown command. Please try a different command.',
                    supportedCommands: [
                        'analyze email for [email]',
                        'analyze contact [email]',
                        'import contacts',
                        'sync contacts',
                        'generate email for [contacts]',
                        'get top contacts',
                        'generate report',
                        'track responses'
                    ]
                };
            }
        } catch (error) {
            return {
                status: 'error',
                message: `Error processing command: ${error.message}`,
                error
            };
        }
    }

    /**
     * Analyze a contact's email communications
     * @param {string} email - Email address of the contact
     * @param {number} maxEmails - Maximum number of emails to analyze
     * @returns {Promise<Object>} - Analysis results
     */
    async analyzeContact(email, maxEmails = 100) {
        try {
            const result = await this.integrator.analyzeContact(email, maxEmails);
            
            return {
                status: 'success',
                message: `Successfully analyzed communications for ${email}`,
                details: result
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Failed to analyze contact: ${error.message}`,
                error
            };
        }
    }

    /**
     * Import contacts from Google Contacts
     * @returns {Promise<Object>} - Import results
     */
    async importContacts() {
        try {
            const result = await this.integrator.importGoogleContacts();
            
            return {
                status: 'success',
                message: 'Successfully imported contacts from Google Contacts',
                details: result
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Failed to import contacts: ${error.message}`,
                error
            };
        }
    }

    /**
     * Generate personalized emails for contacts
     * @param {Array} contactIds - Array of contact IDs
     * @param {string} templateType - Type of template to use (general, investor, family, colleague)
     * @param {Object} userData - User data for templating
     * @returns {Promise<Object>} - Email generation results
     */
    async generateEmailsForContacts(contactIds, templateType = 'general', userData = {}) {
        try {
            const templatePath = path.join(this.templateDirectory, `${templateType}.md`);
            
            const emails = await this.integrator.generateEmailsForContacts(
                contactIds,
                templatePath,
                userData
            );
            
            return {
                status: 'success',
                message: `Successfully generated ${emails.length} emails`,
                emails
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Failed to generate emails: ${error.message}`,
                error
            };
        }
    }

    /**
     * Get top contacts by importance score
     * @param {number} count - Number of contacts to retrieve
     * @param {string} category - Optional category filter
     * @returns {Object} - Top contacts results
     */
    getTopContacts(count = 50, category = null) {
        try {
            const topContacts = this.integrator.getTopContacts(count, category);
            
            return {
                status: 'success',
                message: `Retrieved top ${topContacts.length} contacts${category ? ` in category ${category}` : ''}`,
                contacts: topContacts
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Failed to get top contacts: ${error.message}`,
                error
            };
        }
    }

    /**
     * Generate a report
     * @param {string} reportType - Type of report to generate
     * @param {Object} options - Report options
     * @returns {Promise<Object>} - Report generation results
     */
    async generateReport(reportType = 'top_contacts', options = {}) {
        try {
            const report = await this.integrator.generateReport(reportType, options);
            
            return {
                status: 'success',
                message: `Successfully generated ${reportType} report`,
                report
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Failed to generate report: ${error.message}`,
                error
            };
        }
    }

    /**
     * Track outreach responses
     * @param {number} days - Number of days to look back
     * @returns {Promise<Object>} - Tracking results
     */
    async trackOutreachResponses(days = 30) {
        try {
            const results = await this.integrator.trackOutreachResponses(days);
            
            return {
                status: 'success',
                message: `Successfully tracked outreach responses for the past ${days} days`,
                details: results
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Failed to track outreach responses: ${error.message}`,
                error
            };
        }
    }
    
    /**
     * A convenience method for Claude to analyze a specific email using Gmail
     * @param {string} email - Email address to analyze
     * @returns {Promise<Object>} - Analysis results in a user-friendly format
     */
    async analyzeEmailWithClaude(email) {
        try {
            const result = await this.analyzeContact(email, 100);
            
            if (result.status === 'error') {
                return result;
            }
            
            // Format the results for better readability
            const analysisDetails = result.details.analysisResults;
            const contactDetails = analysisDetails.contactDetails || {};
            const communicationMetrics = analysisDetails.communicationMetrics || {};
            
            return {
                status: 'success',
                message: `Analysis complete for ${email}`,
                summary: {
                    name: contactDetails.name || email.split('@')[0],
                    organization: contactDetails.organization || 'Unknown',
                    emailCount: communicationMetrics.emailCount || 0,
                    lastContacted: communicationMetrics.lastContacted || 'Never',
                    responseRate: `${Math.round((communicationMetrics.responseRate || 0) * 100)}%`,
                    importanceScore: communicationMetrics.importanceScore || 0
                },
                details: analysisDetails
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Error analyzing email with Claude: ${error.message}`,
                error
            };
        }
    }
    
    /**
     * A convenience method for Claude to get the top contacts in a human-readable format
     * @param {number} count - Number of contacts to retrieve
     * @returns {Object} - Top contacts in a user-friendly format
     */
    getTopContactsForClaude(count = 10) {
        try {
            const result = this.getTopContacts(count);
            
            if (result.status === 'error') {
                return result;
            }
            
            // Format for better human readability
            const formattedContacts = result.contacts.map(contact => {
                const contactDetails = contact.observations.find(obs => obs.type === 'contact_details') || {};
                const importanceMetrics = contact.observations.find(obs => obs.type === 'importance_metrics') || {};
                const communicationMetrics = contact.observations.find(obs => obs.type === 'communication_metrics') || {};
                const categories = contact.observations.find(obs => obs.type === 'categories') || { categories: [] };
                
                return {
                    name: contact.name,
                    email: contactDetails.emails ? contactDetails.emails[0] : 'No email',
                    organization: contactDetails.organization || 'Unknown',
                    importance: importanceMetrics.calculatedScore || 0,
                    lastContacted: communicationMetrics.lastContacted || 'Never',
                    categories: categories.categories.join(', ') || 'None'
                };
            });
            
            return {
                status: 'success',
                message: `Retrieved top ${formattedContacts.length} contacts`,
                contacts: formattedContacts
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Error getting top contacts for Claude: ${error.message}`,
                error
            };
        }
    }
}

module.exports = ContactManager;
