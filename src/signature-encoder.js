/**
 * Signature Encoder for Claude Desktop
 * 
 * Implements the stealth tracking system for email signatures
 * by encoding contact IDs into visually similar separator characters.
 */

// Define the mapping between digits and separator characters
const SEPARATORS = [
  '|',  // 0
  '¦',  // 1
  'ǀ',  // 2
  '｜', // 3
  '┃',  // 4
  '║'   // 5
];

/**
 * Convert an integer ID to a base-N array of specified length
 * @param {number} number - The ID to convert
 * @param {number} base - The number base to use
 * @param {number} length - The desired length of the result array
 * @returns {Array} Array of digits in the specified base
 */
function intToBaseNArray(number, base, length) {
    const digits = [];
    let tempNumber = number;
    
    // Convert number to base-N
    while (tempNumber > 0) {
        const remainder = tempNumber % base;
        digits.unshift(remainder); // Add to front of array
        tempNumber = Math.floor(tempNumber / base);
    }
    
    // Pad with zeros if needed
    while (digits.length < length) {
        digits.unshift(0);
    }
    
    return digits;
}

/**
 * Generate a stealth signature with encoded ID
 * @param {number} idNumber - The unique ID to encode
 * @param {Array} signatureChunks - Array of signature text chunks
 * @returns {string} The signature with encoded separators
 */
function generateStealthSignature(idNumber, signatureChunks) {
    const base = SEPARATORS.length;  // For example, base-6
    const numSeparators = signatureChunks.length - 1;  // 3 separators for 4 chunks
    const encodingDigits = intToBaseNArray(idNumber, base, numSeparators);
    
    let stealthSignature = "";
    for (let i = 0; i < signatureChunks.length; i++) {
        stealthSignature += signatureChunks[i];
        if (i < numSeparators) {
            stealthSignature += SEPARATORS[encodingDigits[i]];
        }
    }
    
    return stealthSignature;
}

/**
 * Decode a stealth signature to extract the ID
 * @param {string} signature - The signature containing encoded separators
 * @param {Array} expectedChunks - Expected text chunks to help locate separators
 * @returns {number} The decoded ID number
 */
function decodeStealthSignature(signature, expectedChunks) {
    // Find the separators in the signature
    let separatorIndices = [];
    let position = 0;
    
    for (let i = 0; i < expectedChunks.length - 1; i++) {
        position += expectedChunks[i].length;
        // The character at this position should be a separator
        separatorIndices.push(position);
        position += 1; // Move past the separator
    }
    
    // Extract the separators
    const extractedSeparators = separatorIndices.map(idx => signature.charAt(idx));
    
    // Convert separators to digits
    const digits = extractedSeparators.map(sep => SEPARATORS.indexOf(sep));
    
    // Convert base-N array back to integer
    const base = SEPARATORS.length;
    let idNumber = 0;
    for (let i = 0; i < digits.length; i++) {
        idNumber = idNumber * base + digits[i];
    }
    
    return idNumber;
}

/**
 * Try multiple decoding strategies to handle email client formatting changes
 * @param {string} signatureText - The signature text to decode
 * @param {Array} contactData - Data about contacts and their tracking codes
 * @returns {Object|null} - The contact data or null if no match
 */
function robustSignatureDecode(signatureText, contactData) {
    // Try multiple variations of signature chunks to account for email client formatting changes
    const signatureVariations = [
        [" Larry Velez ", " kogi.ai ", " 212-380-1014 ", " "],
        ["Larry Velez ", " kogi.ai ", " 212-380-1014 ", " "],
        [" Larry Velez ", "kogi.ai ", " 212-380-1014 ", " "],
        ["Larry Velez ", "kogi.ai ", " 212-380-1014 ", " "],
        ["Larry Velez ", " kogi.ai ", "212-380-1014 ", " "],
        ["Larry Velez", " kogi.ai", " 212-380-1014", ""]
    ];
    
    // Try each variation
    for (const chunks of signatureVariations) {
        try {
            const decodedId = decodeStealthSignature(signatureText, chunks);
            
            // Look for a matching contact
            for (const [contactId, contact] of Object.entries(contactData)) {
                const idNum = parseInt(contactId.replace('contact_', ''), 10);
                if (idNum === decodedId) {
                    return { contactId, contact };
                }
            }
        } catch (error) {
            // Silently continue to the next variation
            continue;
        }
    }
    
    return null;
}

/**
 * Generate all tracking codes for a set of contacts
 * @param {Array} contacts - Array of contact entities
 * @returns {Object} - Mapping of contact IDs to tracking data
 */
function generateTrackingCodes(contacts) {
    const trackingCodes = {};
    const defaultChunks = [" Larry Velez ", " kogi.ai ", " 212-380-1014 ", " "];
    
    contacts.forEach(contact => {
        const idStr = contact.id.replace('contact_', '');
        const contactId = parseInt(idStr, 10);
        const contactEmail = contact.observations.find(obs => 
            obs.type === 'contact_details'
        )?.emails?.[0] || 'unknown@example.com';
        
        trackingCodes[contact.id] = {
            contactId: contact.id,
            email: contactEmail,
            outreachDate: new Date().toISOString(),
            signatureChunks: defaultChunks,
            encodedSignature: generateStealthSignature(contactId, defaultChunks)
        };
    });
    
    return trackingCodes;
}

// Example usage
function testSignatureEncoding() {
    const signatureChunks = [" Larry Velez ", " kogi.ai ", " 212-380-1014 ", " "];
    const idNumber = 42;
    const stealthSignature = generateStealthSignature(idNumber, signatureChunks);
    console.log('Encoded signature for contact #42:');
    console.log(stealthSignature);
    
    // Test decoding
    const decodedId = decodeStealthSignature(stealthSignature, signatureChunks);
    console.log(`Decoded ID: ${decodedId}`);
    
    return { original: idNumber, encoded: stealthSignature, decoded: decodedId };
}

module.exports = {
    generateStealthSignature,
    decodeStealthSignature,
    robustSignatureDecode,
    generateTrackingCodes,
    SEPARATORS,
    testSignatureEncoding
};