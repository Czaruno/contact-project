# Contact Project Architecture

## High-Level Architecture

The Contact Project uses a modular architecture that integrates with Claude Desktop's Gmail capabilities. The system consists of these primary components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Gmail API     │◄────┤  Gmail Analyzer │◄────┤  Knowledge      │
│   (Claude)      │     │                 │     │  Graph          │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        ▲
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Email         │◄────┤  Signature      │◄────┤  Reporting      │
│   Generator     │     │  Encoder        │     │  System         │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Component Details

### 1. Gmail Analyzer

**Purpose**: Analyze email communication patterns to identify important contacts and their communication metrics

**Key Features**:
- Searches Gmail for email conversations with contacts
- Analyzes thread depth, response rates, and communication frequency
- Calculates recency of communication
- Extracts engagement patterns

**Integration Points**:
- Uses Claude's Gmail search and thread reading tools
- Updates the Knowledge Graph with communication metrics
- Called by the main integrator component

### 2. Knowledge Graph

**Purpose**: Store and manage multi-dimensional data about contacts and their relationships

**Key Features**:
- Maintains entities (contacts, organizations, categories)
- Tracks relationships between entities
- Stores communication metrics and importance scores
- Supports adding observations to entities

**Data Structure**:
- Entities: Objects with id, name, entityType, and observations
- Relationships: Objects with from, relationType, and to properties
- Observations: Typed key-value pairs attached to entities

**Core Functions**:
- Calculate importance scores using weighted algorithms
- Query entities by type or property
- Update entity observations
- Save and load state data

### 3. Signature Encoder

**Purpose**: Implement stealth tracking system for email signatures

**Key Features**:
- Encodes contact IDs into visually similar Unicode separators
- Provides robust decoding of signatures from email replies
- Handles email client formatting changes

**Technical Approach**:
- Uses 6 visually similar vertical bar characters as separators
- Implements base-6 encoding for contact IDs
- Provides multiple decoding strategies for robustness

### 4. Email Generator

**Purpose**: Create personalized outreach emails based on templates and contact data

**Key Features**:
- Loads and applies email templates
- Personalizes content based on contact importance
- Embeds encoded tracking signatures
- Supports category-based template selection

**Template System**:
- Templates stored as markdown with variable placeholders
- Different templates for different contact categories
- Personalization sections based on importance tiers

### 5. Reporting System

**Purpose**: Generate reports on contact importance and outreach effectiveness

**Key Features**:
- Creates top contacts reports
- Generates outreach effectiveness reports
- Tracks progress toward top 150 contacts goal
- Provides category-based performance analysis

**Report Types**:
- Top Contacts Report: Lists highest-ranked contacts with metrics
- Effectiveness Report: Analyzes response rates and timings
- Progress Report: Tracks movement toward goals

## Integration Model

The system operates through Claude Desktop conversations rather than as a standalone application:

1. User issues natural language commands to Claude
2. Claude interprets commands and invokes appropriate components
3. Gmail data is accessed through Claude's built-in tools
4. Reports are generated as conversation responses
5. State is preserved through data exports between sessions

This architecture provides a powerful yet simple interface by leveraging Claude's natural language understanding and Gmail integration capabilities.
