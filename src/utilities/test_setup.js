/**
 * Test Setup Script
 * 
 * This script demonstrates the functionality of the contact project
 * by creating a sample knowledge graph, generating emails, and 
 * showing the tracking mechanism.
 */

const fs = require('fs').promises;
const path = require('path');
const KnowledgeGraph = require('./knowledge_graph');
const { generateBulkEmails, saveEmailsToFiles } = require('./email_generator');

// Base directory for all files
const BASE_DIR = path.resolve(__dirname, '..');

// File paths
const ENTITIES_PATH = path.join(BASE_DIR, 'knowledge_graph', 'entities.json');
const RELATIONSHIPS_PATH = path.join(BASE_DIR, 'knowledge_graph', 'relationships.json');
const GENERAL_TEMPLATE_PATH = path.join(BASE_DIR, 'templates', 'general_template.md');
const EMAILS_OUTPUT_DIR = path.join(BASE_DIR, 'output', 'emails');

/**
 * Create sample contact entities
 * @returns {Array} - Sample contact entities
 */
function createSampleContacts() {
    return [
        {
            id: 'contact_1',
            name: 'Sarah Johnson',
            entityType: 'Contact',
            observations: [
                {
                    type: 'contact_details',
                    emails: ['sarah.johnson@example.com'],
                    phones: ['555-123-4567'],
                    organization: {
                        name: 'Acme Corp',
                        title: 'Chief Technology Officer'
                    },
                    address: '123 Tech Lane, San Francisco, CA'
                },
                {
                    type: 'relationship_info',
                    notes: 'Met at AI conference in 2023. Interested in NLP projects.'
                },
                {
                    type: 'communication_metrics',
                    lastContacted: '2025-02-15T00:00:00.000Z',
                    emailCount: 45,
                    responseRate: 0.85,
                    meetingCount: 12
                },
                {
                    type: 'importance_metrics',
                    manualPriority: 9,
                    calculatedScore: 0
                }
            ]
        },
        {
            id: 'contact_2',
            name: 'Michael Chen',
            entityType: 'Contact',
            observations: [
                {
                    type: 'contact_details',
                    emails: ['michael.chen@example.com'],
                    phones: ['555-987-6543'],
                    organization: {
                        name: 'Venture Capital Partners',
                        title: 'Managing Partner'
                    },
                    address: '456 Investment Ave, New York, NY'
                },
                {
                    type: 'relationship_info',
                    notes: 'Potential investor. Introduced by Sarah Johnson.'
                },
                {
                    type: 'communication_metrics',
                    lastContacted: '2024-12-20T00:00:00.000Z',
                    emailCount: 15,
                    responseRate: 0.6,
                    meetingCount: 3
                },
                {
                    type: 'importance_metrics',
                    manualPriority: 8,
                    calculatedScore: 0
                }
            ]
        },
        {
            id: 'contact_3',
            name: 'Emily Rodriguez',
            entityType: 'Contact',
            observations: [
                {
                    type: 'contact_details',
                    emails: ['emily.rodriguez@example.com'],
                    phones: ['555-789-0123'],
                    organization: {
                        name: 'Digital Solutions Inc',
                        title: 'Marketing Director'
                    },
                    address: '789 Media Blvd, Los Angeles, CA'
                },
                {
                    type: 'relationship_info',
                    notes: 'Former colleague. Expert in digital marketing.'
                },
                {
                    type: 'communication_metrics',
                    lastContacted: '2024-07-05T00:00:00.000Z',
                    emailCount: 28,
                    responseRate: 0.75,
                    meetingCount: 5
                },
                {
                    type: 'importance_metrics',
                    manualPriority: 6,
                    calculatedScore: 0
                }
            ]
        },
        {
            id: 'contact_4',
            name: 'Robert Taylor',
            entityType: 'Contact',
            observations: [
                {
                    type: 'contact_details',
                    emails: ['robert.taylor@example.com'],
                    phones: ['555-234-5678'],
                    organization: {
                        name: 'Family',
                        title: 'Cousin'
                    },
                    address: '123 Family St, Chicago, IL'
                },
                {
                    type: 'relationship_info',
                    notes: 'Family member. Interested in technology.'
                },
                {
                    type: 'communication_metrics',
                    lastContacted: '2025-03-12T00:00:00.000Z',
                    emailCount: 52,
                    responseRate: 0.9,
                    meetingCount: 15
                },
                {
                    type: 'importance_metrics',
                    manualPriority: 7,
                    calculatedScore: 0
                }
            ]
        },
        {
            id: 'contact_5',
            name: 'Jessica Williams',
            entityType: 'Contact',
            observations: [
                {
                    type: 'contact_details',
                    emails: ['jessica.williams@example.com'],
                    phones: ['555-345-6789'],
                    organization: {
                        name: 'Tech Innovators LLC',
                        title: 'CEO'
                    },
                    address: '567 Innovation Dr, Seattle, WA'
                },
                {
                    type: 'relationship_info',
                    notes: 'Industry leader. Met at startup conference.'
                },
                {
                    type: 'communication_metrics',
                    lastContacted: '2024-09-30T00:00:00.000Z',
                    emailCount: 8,
                    responseRate: 0.5,
                    meetingCount: 2
                },
                {
                    type: 'importance_metrics',
                    manualPriority: 9,
                    calculatedScore: 0
                }
            ]
        }
    ];
}

/**
 * Create sample organization entities
 * @returns {Array} - Sample organization entities
 */
function createSampleOrganizations() {
    return [
        {
            id: 'org_1',
            name: 'Acme Corp',
            entityType: 'Organization',
            observations: [
                {
                    type: 'organization_details',
                    industry: 'Technology',
                    website: 'https://acme-corp.example.com',
                    size: 'Enterprise'
                }
            ]
        },
        {
            id: 'org_2',
            name: 'Venture Capital Partners',
            entityType: 'Organization',
            observations: [
                {
                    type: 'organization_details',
                    industry: 'Finance',
                    website: 'https://vcp.example.com',
                    size: 'Medium'
                }
            ]
        },
        {
            id: 'org_3',
            name: 'Digital Solutions Inc',
            entityType: 'Organization',
            observations: [
                {
                    type: 'organization_details',
                    industry: 'Marketing',
                    website: 'https://digital-solutions.example.com',
                    size: 'Medium'
                }
            ]
        },
        {
            id: 'org_4',
            name: 'Tech Innovators LLC',
            entityType: 'Organization',
            observations: [
                {
                    type: 'organization_details',
                    industry: 'Technology',
                    website: 'https://tech-innovators.example.com',
                    size: 'Startup'
                }
            ]
        }
    ];
}

/**
 * Create sample category entities
 * @returns {Array} - Sample category entities
 */
function createSampleCategories() {
    return [
        {
            id: 'category_1',
            name: 'Investor',
            entityType: 'Category',
            observations: [
                {
                    type: 'category_details',
                    description: 'Potential or current investors',
                    priority: 'High'
                }
            ]
        },
        {
            id: 'category_2',
            name: 'Family',
            entityType: 'Category',
            observations: [
                {
                    type: 'category_details',
                    description: 'Family members',
                    priority: 'Medium'
                }
            ]
        },
        {
            id: 'category_3',
            name: 'Colleague',
            entityType: 'Category',
            observations: [
                {
                    type: 'category_details',
                    description: 'Current or former colleagues',
                    priority: 'Medium'
                }
            ]
        },
        {
            id: 'category_4',
            name: 'Industry Leader',
            entityType: 'Category',
            observations: [
                {
                    type: 'category_details',
                    description: 'Key industry influencers',
                    priority: 'High'
                }
            ]
        }
    ];
}

/**
 * Create sample relationships between entities
 * @returns {Array} - Sample relationships
 */
function createSampleRelationships() {
    return [
        // Contact to Organization relationships
        {
            from: 'contact_1',
            relationType: 'works_at',
            to: 'org_1'
        },
        {
            from: 'contact_2',
            relationType: 'works_at',
            to: 'org_2'
        },
        {
            from: 'contact_3',
            relationType: 'works_at',
            to: 'org_3'
        },
        {
            from: 'contact_5',
            relationType: 'founded',
            to: 'org_4'
        },
        
        // Contact to Category relationships
        {
            from: 'contact_1',
            relationType: 'is_categorized_as',
            to: 'category_3'
        },
        {
            from: 'contact_2',
            relationType: 'is_categorized_as',
            to: 'category_1'
        },
        {
            from: 'contact_3',
            relationType: 'is_categorized_as',
            to: 'category_3'
        },
        {
            from: 'contact_4',
            relationType: 'is_categorized_as',
            to: 'category_2'
        },
        {
            from: 'contact_5',
            relationType: 'is_categorized_as',
            to: 'category_4'
        },
        
        // Contact to Contact relationships
        {
            from: 'contact_1',
            relationType: 'introduced',
            to: 'contact_2'
        },
        {
            from: 'contact_3',
            relationType: 'collaborated_with',
            to: 'contact_1'
        }
    ];
}

/**
 * Main function to run the test setup
 */
async function runTestSetup() {
    try {
        console.log('Starting test setup...');
        
        // Create directories if they don't exist
        await fs.mkdir(path.dirname(ENTITIES_PATH), { recursive: true });
        await fs.mkdir(path.dirname(RELATIONSHIPS_PATH), { recursive: true });
        await fs.mkdir(EMAILS_OUTPUT_DIR, { recursive: true });
        
        // Initialize knowledge graph
        const graph = new KnowledgeGraph();
        await graph.initialize(ENTITIES_PATH, RELATIONSHIPS_PATH);
        
        // Create sample data
        const contacts = createSampleContacts();
        const organizations = createSampleOrganizations();
        const categories = createSampleCategories();
        const relationships = createSampleRelationships();
        
        // Add entities to knowledge graph
        [...contacts, ...organizations, ...categories].forEach(entity => {
            graph.addEntity(entity);
        });
        
        // Add relationships to knowledge graph
        relationships.forEach(relation => {
            graph.addRelationship(relation.from, relation.relationType, relation.to);
        });
        
        // Calculate importance scores
        graph.calculateImportanceScores();
        
        // Save knowledge graph
        await graph.saveToFiles();
        console.log('Knowledge graph created and saved.');
        
        // Generate sample emails for top 3 contacts
        const topContacts = graph.getTopContacts(3);
        console.log(`Top 3 contacts by importance score:`);
        topContacts.forEach(contact => {
            const score = contact.observations.find(obs => obs.type === 'importance_metrics')?.calculatedScore || 0;
            console.log(`${contact.name}: Score ${score}`);
        });
        
        // User data for email templates
        const userData = {
            email: 'larry.velez@kogi.ai',
            phone: '212-380-1014',
            address: '123 AI Plaza, New York, NY 10001'
        };
        
        // Generate emails
        const emails = await generateBulkEmails(topContacts, GENERAL_TEMPLATE_PATH, userData);
        
        // Save emails
        await saveEmailsToFiles(emails, EMAILS_OUTPUT_DIR);
        
        console.log('Test setup completed successfully!');
    } catch (error) {
        console.error('Error in test setup:', error);
    }
}

// Run the test setup if this file is executed directly
if (require.main === module) {
    runTestSetup();
}

module.exports = {
    runTestSetup,
    createSampleContacts,
    createSampleOrganizations,
    createSampleCategories,
    createSampleRelationships
};
