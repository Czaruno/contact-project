# Signature Encoding System

## Overview

The signature encoding system embeds unique identifiers into email signatures using visually similar Unicode characters as separators. This allows for:

1. Identifying which contact has responded to an email
2. Tracking response rates and times
3. Maintaining a consistent tracking mechanism across email threads
4. Doing so in a way that appears natural and doesn't affect the user experience

## Encoding Technique

### Separator Characters

The system uses visually similar vertical bar characters as separators in the signature:

| Index | Character | Unicode | Description |
|-------|-----------|---------|-------------|
| 0 | \| | U+007C | Vertical Line |
| 1 | ¦ | U+00A6 | Broken Bar |
| 2 | ǀ | U+01C0 | Latin Letter Dental Click |
| 3 | ｜ | U+FF5C | Fullwidth Vertical Line |
| 4 | ┃ | U+2503 | Box Drawings Heavy Vertical |
| 5 | ║ | U+2551 | Box Drawings Double Vertical |

These characters appear very similar in most email clients but have distinct Unicode values that can be detected in responses.

### Base-6 Encoding

The system uses a base-6 numbering system (since there are 6 separator characters) to encode contact IDs:

1. Each contact has a unique numeric ID
2. This ID is converted to base-6 (using digits 0-5)
3. Each digit in the base-6 representation maps to one of the separator characters
4. The separators are placed between parts of the signature

For example, a signature might look like:
```
Larry Velez | kogi.ai ¦ 212-380-1014 ║ 
```

In this example, the separators "|", "¦", and "║" encode the digits [0, 1, 5], which represents the number 77 in base-6 (0×6² + 1×6¹ + 5×6⁰ = 0 + 6 + 5 = 11).

## Implementation Details

### 1. Encoding Process

When generating an email, the system:

1. Loads the signature template:
   ```
   Larry Velez | kogi.ai | 212-380-1014 | 
   ```

2. Splits the signature into chunks:
   ```
   ["Larry Velez ", " kogi.ai ", " 212-380-1014 ", " "]
   ```

3. Converts the contact's ID to base-6:
   ```
   Contact ID: 42
   Base-6: [1, 1, 0] (1×6² + 1×6¹ + 0×6⁰ = 36 + 6 + 0 = 42)
   ```

4. Maps each base-6 digit to a separator:
   ```
   [1, 1, 0] → ["¦", "¦", "|"]
   ```

5. Combines chunks and separators:
   ```
   "Larry Velez ¦ kogi.ai ¦ 212-380-1014 | "
   ```

### 2. Decoding Process

When checking for responses, the system:

1. Extracts the quoted signature from a response
2. Identifies the separator characters
3. Converts separators to base-6 digits
4. Calculates the original contact ID
5. Looks up the contact in the knowledge graph

### 3. Robust Decoding

Since email clients may modify formatting, the system implements multiple decoding strategies:

1. Try different spacing patterns around separators
2. Handle cases where some separators may be lost
3. Use secondary confirmation with email address matching
4. Fall back to thread context if signature decoding fails

## Capacity and Limitations

With 6 different separators and a standard signature with 3 separator positions:
- 6³ = 216 unique identifiers possible
- For larger contact databases, more separator positions can be added
- Maximum theoretical capacity with 4 separators: 6⁴ = 1,296 identifiers

## Signature Format Variations

Different signature formats can be used depending on preferences:

### Standard Format
```
Larry Velez | kogi.ai | 212-380-1014 |
```

### Extended Format
```
Larry Velez | kogi.ai | 212-380-1014 | New York, NY |
```

### Minimal Format
```
Larry | kogi.ai | 212-380-1014
```

The system works with any format as long as the signature chunks are consistent and separators are properly encoded.