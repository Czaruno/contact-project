# Contact Project Usage Guide

This guide provides specific examples of how to use the Contact Project system with Claude Desktop. The system allows you to analyze your Gmail communication patterns, identify your most important contacts, and manage personalized outreach.

## Getting Started

### Initial Setup

1. First, point Claude to your repository:
```
Please read and work with my Contact Project repository at https://github.com/Czaruno/contact-project
```

2. Make sure Claude knows about your email addresses:
```
Please analyze my email communication using the following addresses:
- larry@kogi.ai
- larryvelez@gmail.com
- larry@sinu.com
```

## Common Tasks

### 1. Analyzing Email Communication

To analyze your Gmail communication and build contact importance metrics:

```
Please analyze my email communication with my contacts. 
Use a normal analysis mode and process up to 50 contacts.
```

For a more comprehensive analysis:

```
Please perform a deep analysis of my email communication with all my contacts.
Focus on identifying my most important professional relationships.
```

For a quick update:

```
Please do a quick analysis of my recent email communication (last 30 days)
with my existing high-importance contacts.
```

### 2. Generating Reports

To get a report of your most important contacts:

```
Please generate a report of my top 150 contacts by importance.
```

To get a progress report toward your goal:

```
Please generate a progress report on my journey toward maintaining
strong relationships with 150 key contacts.
```

To analyze the effectiveness of your outreach:

```
Please generate an effectiveness report for my outreach efforts.
Include response rates and timing metrics.
```

### 3. Email Creation and Sending

To generate personalized emails for your contacts:

```
Please generate personalized emails for my top 20 contacts with the following details:
- Email: larry@newdomain.com  
- Phone: 212-555-9876
- Address: 123 Tech Plaza, New York, NY 10001
```

To create emails for contacts in a specific category:

```
Please generate personalized emails for my "Investor" category contacts
with my new contact information.
```

To see a draft before sending:

```
Please show me a draft email for my contact John Smith before sending.
```

### 4. Response Tracking

To check for responses to your outreach:

```
Please check if any contacts have responded to my recent outreach emails
and update my tracking metrics.
```

To get a detailed breakdown of responses:

```
Please analyze the response patterns from my outreach campaign
and identify which templates performed best.
```

## Advanced Usage

### Manual Priority Adjustments

To manually adjust the importance of a contact:

```
Please set the manual priority for contact "Jane Doe" to 8 (on a scale of 1-10).
```

### Contact Categorization

To categorize contacts:

```
Please categorize the following contacts as "Investor":
- John Smith
- Sarah Johnson
- Acme Capital Partners
```

### Template Customization

To customize an email template:

```
Please update the "Investor" email template with the following text in the Business Update section:

## Business Update
I'm excited to share that we've recently closed our Series B funding round, allowing us to accelerate our AI platform development. Key highlights include:
- Secured $12M in funding led by Sequoia Capital
- Expanding our team with 15 new hires in engineering
- Launching our enterprise solution in Q3
```

### Bulk Operations

To process multiple operations at once:

```
Please perform the following sequence of tasks:
1. Analyze my email communication with a focus on investor contacts
2. Generate personalized emails for my top 10 investor contacts
3. Create a report showing my communication effectiveness with investors
```

## Workflow Examples

### New Contact Information Update

A complete workflow for updating your contacts with new information:

```
I've moved to a new office and need to update my contacts. Please:
1. Analyze my email communication to identify my top 50 contacts
2. Generate personalized emails with my new contact details:
   - Email: larry@newcompany.com
   - Phone: 212-555-4321
   - Address: 555 Innovation Drive, Suite 300, New York, NY 10012
3. Send these emails and track responses
4. In one week, generate a report on response rates
```

### Re-engaging Dormant Relationships

A workflow for reconnecting with contacts you haven't communicated with recently:

```
Please help me re-engage with important contacts I haven't communicated with recently:
1. Identify contacts with high importance scores but no communication in the last 6 months
2. Generate personalized outreach emails that reference our past interactions
3. Create a follow-up schedule for contacts who don't respond within 2 weeks
```

### Strategic Relationship Building

A workflow for deepening relationships with key strategic contacts:

```
I want to strengthen relationships with my top 20 industry influencers:
1. Analyze my communication history with industry thought leaders and identify the top 20
2. Generate personalized emails sharing exclusive industry insights
3. Include an offer to schedule a 1:1 call in the next month
4. Track responses and prepare briefing notes for each scheduled call
```

## Tips for Effective Use

1. **Start with a focused analysis**: Begin by analyzing a smaller subset of contacts (50-100) to get quick insights before running a comprehensive analysis.

2. **Use the right analysis mode**:
   - Quick: For fast updates on already-analyzed contacts
   - Normal: For balanced analysis of moderate contact numbers
   - Deep: For comprehensive analysis of all contacts

3. **Maintain context between sessions**: When starting a new session with Claude, briefly mention what you were working on previously.

4. **Save important data**: When Claude generates reports or analysis, save them to refer back to in future sessions.

5. **Iterate on templates**: Start with the default templates, then refine them based on response rates and feedback.

6. **Be specific with requests**: The more specific your instructions, the better Claude can tailor its responses.

7. **Batch similar tasks**: Combine related tasks to maintain context and improve efficiency.

## Troubleshooting

### Common Issues and Solutions

**Issue**: Claude can't find a specific contact
**Solution**: Verify the email address and try providing alternative contact information

**Issue**: Analysis is taking a long time
**Solution**: Reduce batch size or use quick analysis mode instead of deep analysis

**Issue**: Template personalization isn't specific enough
**Solution**: Provide more context about your relationship with the contact categories

**Issue**: Low response rates to outreach
**Solution**: Try different templates or personalization strategies based on effectiveness reports

**Issue**: Session context limit reached
**Solution**: Summarize the current state and continue in a new session, referring to your saved reports

## Conclusion

The Contact Project system provides a powerful yet natural way to manage your professional relationships through Claude Desktop. By leveraging email analysis, personalized outreach, and response tracking, you can systematically maintain and strengthen connections with your most important contacts.

For technical details about how the system works, refer to the [architecture documentation](architecture.md) and [implementation guide](implementation.md).
