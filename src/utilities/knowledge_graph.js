/**
 * Knowledge Graph Implementation
 * 
 * This utility provides functions for creating, managing, and querying
 * the knowledge graph of contacts and their relationships.
 */

const fs = require('fs').promises;
const path = require('path');

class KnowledgeGraph {
    constructor() {
        this.entities = {};
        this.relationships = [];
        this.entitiesFilePath = '';
        this.relationshipsFilePath = '';
    }
    
    /**
     * Initialize the knowledge graph with file paths
     * @param {string} entitiesFilePath - Path to entities JSON file
     * @param {string} relationshipsFilePath - Path to relationships JSON file
     */
    async initialize(entitiesFilePath, relationshipsFilePath) {
        this.entitiesFilePath = entitiesFilePath;
        this.relationshipsFilePath = relationshipsFilePath;
        
        try {
            // Try to load existing data
            await this.loadFromFiles();
            console.log('Knowledge graph loaded from existing files.');
        } catch (error) {
            // If files don't exist, create empty knowledge graph
            console.log('Initializing new knowledge graph.');
            this.entities = {};
            this.relationships = [];
            
            // Create directories if they don't exist
            await fs.mkdir(path.dirname(entitiesFilePath), { recursive: true });
            await fs.mkdir(path.dirname(relationshipsFilePath), { recursive: true });
            
            // Save empty knowledge graph
            await this.saveToFiles();
        }
    }
    
    /**
     * Load knowledge graph from files
     */
    async loadFromFiles() {
        const [entitiesData, relationshipsData] = await Promise.all([
            fs.readFile(this.entitiesFilePath, 'utf8'),
            fs.readFile(this.relationshipsFilePath, 'utf8')
        ]);
        
        // Parse JSON data
        const entitiesArray = JSON.parse(entitiesData);
        this.relationships = JSON.parse(relationshipsData);
        
        // Convert entities array to map for faster lookup
        this.entities = {};
        entitiesArray.forEach(entity => {
            this.entities[entity.id] = entity;
        });
    }
    
    /**
     * Save knowledge graph to files
     */
    async saveToFiles() {
        // Convert entities map back to array for storage
        const entitiesArray = Object.values(this.entities);
        
        await Promise.all([
            fs.writeFile(this.entitiesFilePath, JSON.stringify(entitiesArray, null, 2)),
            fs.writeFile(this.relationshipsFilePath, JSON.stringify(this.relationships, null, 2))
        ]);
        
        console.log('Knowledge graph saved to files.');
    }
    
    /**
     * Add a new entity to the knowledge graph
     * @param {Object} entity - Entity object with id, name, entityType, and observations
     */
    addEntity(entity) {
        if (!entity.id) {
            throw new Error('Entity must have an id property.');
        }
        
        this.entities[entity.id] = entity;
    }
    
    /**
     * Add multiple entities to the knowledge graph
     * @param {Array} entities - Array of entity objects
     */
    addEntities(entities) {
        entities.forEach(entity => {
            this.addEntity(entity);
        });
    }
    
    /**
     * Add a new relationship between entities
     * @param {string} fromEntityId - ID of the source entity
     * @param {string} relationshipType - Type of relationship
     * @param {string} toEntityId - ID of the target entity
     */
    addRelationship(fromEntityId, relationshipType, toEntityId) {
        // Verify that both entities exist
        if (!this.entities[fromEntityId]) {
            throw new Error(`Source entity ${fromEntityId} does not exist.`);
        }
        
        if (!this.entities[toEntityId]) {
            throw new Error(`Target entity ${toEntityId} does not exist.`);
        }
        
        // Add the relationship
        this.relationships.push({
            from: fromEntityId,
            relationType: relationshipType,
            to: toEntityId
        });
    }
    
    /**
     * Find entities by type
     * @param {string} entityType - Type of entity to find
     * @returns {Array} - Matching entities
     */
    findEntitiesByType(entityType) {
        return Object.values(this.entities)
            .filter(entity => entity.entityType === entityType);
    }
    
    /**
     * Find entities by property value
     * @param {string} propertyPath - Path to the property (e.g., "observations.0.emails")
     * @param {*} value - Value to match
     * @returns {Array} - Matching entities
     */
    findEntitiesByProperty(propertyPath, value) {
        const pathParts = propertyPath.split('.');
        
        return Object.values(this.entities).filter(entity => {
            let current = entity;
            
            // Traverse the property path
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                
                if (current === undefined || current === null) {
                    return false;
                }
                
                if (Array.isArray(current) && !isNaN(part)) {
                    // If current is an array and part is a number, get the array element
                    current = current[parseInt(part)];
                } else {
                    current = current[part];
                }
            }
            
            // Check if value matches
            if (Array.isArray(current)) {
                return current.includes(value);
            } else {
                return current === value;
            }
        });
    }
    
    /**
     * Find relationships of a specific type from a source entity
     * @param {string} fromEntityId - ID of the source entity
     * @param {string} relationshipType - Type of relationship to find
     * @returns {Array} - Matching relationships
     */
    findOutgoingRelationships(fromEntityId, relationshipType = null) {
        return this.relationships.filter(rel => {
            if (rel.from !== fromEntityId) {
                return false;
            }
            
            if (relationshipType && rel.relationType !== relationshipType) {
                return false;
            }
            
            return true;
        });
    }
    
    /**
     * Find relationships of a specific type to a target entity
     * @param {string} toEntityId - ID of the target entity
     * @param {string} relationshipType - Type of relationship to find
     * @returns {Array} - Matching relationships
     */
    findIncomingRelationships(toEntityId, relationshipType = null) {
        return this.relationships.filter(rel => {
            if (rel.to !== toEntityId) {
                return false;
            }
            
            if (relationshipType && rel.relationType !== relationshipType) {
                return false;
            }
            
            return true;
        });
    }
    
    /**
     * Update an entity's observation
     * @param {string} entityId - ID of the entity to update
     * @param {string} observationType - Type of observation to update
     * @param {Object} newData - New data to merge into the observation
     */
    updateEntityObservation(entityId, observationType, newData) {
        const entity = this.entities[entityId];
        if (!entity) {
            throw new Error(`Entity ${entityId} does not exist.`);
        }
        
        // Find the observation
        const observation = entity.observations.find(obs => obs.type === observationType);
        
        if (observation) {
            // Merge new data with existing observation
            Object.assign(observation, newData);
        } else {
            // Add new observation
            entity.observations.push({
                type: observationType,
                ...newData
            });
        }
    }
    
    /**
     * Calculate importance scores for all contact entities
     * @param {Object} weights - Weights for different factors
     */
    calculateImportanceScores(weights = {
        frequency: 0.25,
        recency: 0.30,
        responseRate: 0.20,
        meetingFrequency: 0.15,
        manualPriority: 0.10
    }) {
        const contacts = this.findEntitiesByType('Contact');
        
        contacts.forEach(contact => {
            // Get communication metrics observation
            const metricsObs = contact.observations.find(obs => obs.type === 'communication_metrics');
            const importanceObs = contact.observations.find(obs => obs.type === 'importance_metrics');
            
            if (metricsObs && importanceObs) {
                // Calculate scores for each factor
                const scores = {
                    frequency: this._normalizeFrequency(metricsObs.emailCount || 0),
                    recency: this._normalizeRecency(metricsObs.lastContacted),
                    responseRate: metricsObs.responseRate || 0,
                    meetingFrequency: this._normalizeMeetingFrequency(metricsObs.meetingCount || 0),
                    manualPriority: (importanceObs.manualPriority || 0) / 10 // Convert 0-10 to 0-1
                };
                
                // Calculate weighted score
                let totalScore = 0;
                for (const [factor, weight] of Object.entries(weights)) {
                    totalScore += scores[factor] * weight;
                }
                
                // Update importance metrics
                importanceObs.calculatedScore = Math.round(totalScore * 100);
            }
        });
    }
    
    /**
     * Normalize email frequency to a 0-1 score
     * @param {number} emailCount - Number of emails exchanged
     * @returns {number} - Normalized score
     */
    _normalizeFrequency(emailCount) {
        // Example normalization: logarithmic scale capped at 100 emails
        const maxEmails = 100;
        if (emailCount <= 0) return 0;
        if (emailCount >= maxEmails) return 1;
        
        // Log scale: ln(count) / ln(max)
        return Math.log(emailCount) / Math.log(maxEmails);
    }
    
    /**
     * Normalize communication recency to a 0-1 score
     * @param {string} lastContactedDate - Date of last contact
     * @returns {number} - Normalized score
     */
    _normalizeRecency(lastContactedDate) {
        if (!lastContactedDate) return 0;
        
        const now = new Date();
        const lastDate = new Date(lastContactedDate);
        const daysDiff = Math.max(0, (now - lastDate) / (1000 * 60 * 60 * 24));
        
        // Recency score decreases with time
        // 0 days = 1.0, 30 days = 0.5, 365 days = 0.0
        const maxDays = 365; // One year
        return Math.max(0, 1 - (daysDiff / maxDays));
    }
    
    /**
     * Normalize meeting frequency to a 0-1 score
     * @param {number} meetingCount - Number of meetings
     * @returns {number} - Normalized score
     */
    _normalizeMeetingFrequency(meetingCount) {
        // Meetings are more significant than emails, so use a different scale
        const maxMeetings = 20;
        if (meetingCount <= 0) return 0;
        if (meetingCount >= maxMeetings) return 1;
        
        return meetingCount / maxMeetings;
    }
    
    /**
     * Get the top N contacts by importance score
     * @param {number} n - Number of contacts to return
     * @returns {Array} - Top contacts ordered by importance
     */
    getTopContacts(n) {
        const contacts = this.findEntitiesByType('Contact');
        
        // Sort by calculated score (descending)
        const sortedContacts = contacts.sort((a, b) => {
            const scoreA = a.observations.find(obs => obs.type === 'importance_metrics')?.calculatedScore || 0;
            const scoreB = b.observations.find(obs => obs.type === 'importance_metrics')?.calculatedScore || 0;
            return scoreB - scoreA;
        });
        
        // Return top N
        return sortedContacts.slice(0, n);
    }
}

module.exports = KnowledgeGraph;
