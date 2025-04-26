# Contact Management and Outreach Project

## Project Overview
This project aims to identify and rank the top 150 most important contacts from a larger database of 2000+ contacts, and to facilitate targeted outreach with new contact information. The system uses a knowledge graph approach to track multi-dimensional attributes about each contact and monitor communication effectiveness.

## Goals
- Create a knowledge graph of all contacts with multi-dimensional attributes
- Analyze and rank contacts by importance
- Identify the top 150 most important contacts
- Generate personalized outreach messages with stealth tracking
- Monitor communication effectiveness and response rates

## Architecture
This project uses Claude Desktop's Gmail integration to manage contacts, generate and send emails, and track responses. The knowledge graph approach stores multi-dimensional data about contacts and their relationships, enabling sophisticated ranking and personalization.

## Key Concepts

### Knowledge Graph
- Entities: Contacts, Organizations, Categories
- Relationships: works_at, is_categorized_as, introduced
- Multi-dimensional tracking of importance factors

### Contact Ranking
- Communication frequency and recency
- Response rate analysis
- Meeting frequency
- Manual priority flags

### Stealth Tracking
- Signature encoding using visually similar Unicode separators
- Capacity for 216+ unique identifiers
- Non-obvious tracking that persists through email threads

### Reporting System
- Progress toward top 150 goal
- Category-based effectiveness analysis
- Response rate monitoring
- Weekly trend analysis

## Project Structure
```
/
├── docs/                  # Documentation files
│   ├── workflow.md        # User workflow guide
│   ├── implementation.md  # Implementation details
│   └── architecture.md    # System architecture
├── src/                   # Source code
│   ├── gmail-analyzer.js  # Gmail analysis functions
│   ├── knowledge-graph.js # Knowledge graph implementation
│   ├── signature-encoder.js # Signature encoding utilities
│   ├── email-generator.js # Email generation functions
│   └── integrator.js      # Integration of all components
├── templates/             # Email templates
│   ├── general.md         # General contact template
│   ├── investor.md        # Investor contact template
│   ├── family.md          # Family contact template
│   └── colleague.md       # Colleague contact template
└── README.md              # This file
```

## Usage

This system is designed to be used with Claude Desktop. Instead of running code directly, you interact with Claude using natural language commands:

1. **Analyze Emails**: "Please analyze my email communication with my contacts."
2. **Generate Report**: "Please generate a report of my top 150 contacts."
3. **Send Emails**: "Please generate personalized emails for my top 20 contacts."
4. **Check Responses**: "Please check for responses to my outreach emails."
5. **View Effectiveness**: "Please generate an effectiveness report for my outreach."

See the [workflow guide](docs/workflow.md) for detailed instructions on using the system.

## Benefits of Claude Desktop Implementation

1. **No Setup Required**: No need for API keys, OAuth credentials, or server infrastructure
2. **Direct Gmail Integration**: Seamless access to your Gmail data
3. **Natural Language Interface**: Simple commands instead of complex APIs
4. **Security**: Your data never leaves your conversation with Claude
5. **Immediate Use**: Start using right away without installation