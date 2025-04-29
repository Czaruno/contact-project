# Knowledge Graph MCP Implementation

## Overview
This document explains how we're implementing the knowledge graph using Claude's Memory MCP (Model-Controlled Persistence) tools. This approach allows us to maintain a persistent knowledge graph across conversations with Claude.

## Memory MCP Tools

Claude provides several built-in tools for managing a knowledge graph:

### Entity Management
- `create_entities`: Add new entities (contacts, organizations, etc.)
- `add_observations`: Update existing entities with new information
- `delete_entities`: Remove entities when needed

### Relationship Management
- `create_relations`: Connect entities with typed relationships
- `delete_relations`: Remove relationships when they no longer apply

### Query Capabilities
- `read_graph`: View the entire knowledge graph
- `search_nodes`: Find entities by attributes
- `open_nodes`: Open specific entities by name

## Data Structure

### Entities
Entities represent discrete objects like contacts or organizations:

```javascript
{
  "name": "Lucas Introne",        // Entity name (unique identifier)
  "entityType": "Contact",        // Entity type
  "observations": [              // Array of observations
    "Partner at Entronic",
    "Long-term professional relationship since 2005"
  ]
}
```

### Relationships
Relationships connect entities with typed connections:

```javascript
{
  "from": "Lucas Introne",       // Source entity
  "relationType": "works_at",    // Relationship type
  "to": "Entronic"               // Target entity
}
```

### Observations
Observations can be strings or structured data:

```javascript
// Simple string observation
"Partner at Entronic"

// Structured data as a JSON string
"Analysis Status: {\"first_analyzed\": \"2025-04-28\", \"emails_analyzed\": 3}"
```

## Implementation Examples

### Creating a Contact Entity

```javascript
create_entities({
  entities: [{
    name: "Lucas Introne",
    entityType: "Contact",
    observations: [
      "Partner at Entronic",
      "Long-term professional relationship since 2005",
      "Considering job offer from Tyler Technologies as of July 2022",
      "Interested in incubator models and rapid prototyping"
    ]
  }]
})
```

### Adding Organizations

```javascript
create_entities({
  entities: [
    {
      name: "Entronic",
      entityType: "Organization",
      observations: [
        "Technology company",
        "Lucas Introne is a partner"
      ]
    },
    {
      name: "Tyler Technologies",
      entityType: "Organization",
      observations: [
        "Made job offer to Lucas in July 2022"
      ]
    }
  ]
})
```

### Creating Relationships

```javascript
create_relations({
  relations: [
    {
      from: "Lucas Introne",
      relationType: "works_at",
      to: "Entronic"
    },
    {
      from: "Lucas Introne",
      relationType: "considering_offer_from",
      to: "Tyler Technologies"
    }
  ]
})
```

### Updating a Contact with New Information

```javascript
add_observations({
  observations: [{
    entityName: "Lucas Introne",
    contents: [
      "Responds quickly to emails (within 30 minutes)",
      "Communicates in a casual, direct style"
    ]
  }]
})
```

### Adding Analysis Metadata

```javascript
add_observations({
  observations: [{
    entityName: "Lucas Introne",
    contents: [
      "Analysis Status: {\"first_analyzed\": \"2025-04-28T16:45:00Z\", \"last_analyzed\": \"2025-04-28T16:45:00Z\", \"analysis_count\": 1, \"emails_analyzed\": 3}"
    ]
  }]
})
```

## Contact Tracking System

We implement tracking through two special entities:

### Analysis Metadata
For each contact, we add a structured observation containing:
- First analysis date
- Last analysis date
- Analysis count
- Last email date analyzed
- Number of emails analyzed
- Google Contact ID

### Contact Sync Index
A system entity that tracks:
- Last synchronization date
- Number of contacts processed
- List of processed Google Contact IDs
- Next scheduled sync date

## Backing Up the Knowledge Graph

Since MCP data is stored on Anthropic's servers, we recommend:

1. Regularly exporting the knowledge graph using `read_graph`
2. Saving the exported JSON to your GitHub repository
3. Maintaining dated versions for rollback capability

Example backup process:
```javascript
// Get current knowledge graph
const graph = await readGraph();

// Format with timestamp
const backup = {
  timestamp: new Date().toISOString(),
  graph: graph
};

// Save to GitHub repository
await saveToGitHub('data/backups/knowledge_graph_' + 
  new Date().toISOString().split('T')[0] + '.json', 
  JSON.stringify(backup, null, 2));
```

## Best Practices

1. **Use consistent entity naming**: Entity names are unique identifiers
2. **Structure important data**: Use JSON strings for structured observations
3. **Keep observations focused**: One observation per distinct piece of information
4. **Use meaningful relationship types**: Create a standardized set of relationship types
5. **Regular backups**: Export the knowledge graph regularly for safekeeping

## Limitations

1. Claude's Memory MCP is tied to your Claude account
2. Direct access to raw data files is not available
3. Complex queries require custom implementation
4. Large knowledge graphs may need optimization strategies

## Conclusion

The Memory MCP approach provides a powerful, persistent storage solution for our knowledge graph without requiring external databases or complex setups. By following the implementation patterns described here, we can build a robust contact management system that persists across conversations.
