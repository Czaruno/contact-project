/**
 * Gmail API Authentication Setup
 * 
 * This script helps set up authentication for the Gmail API
 * by walking through the OAuth2 authorization flow.
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

// Scopes required for Gmail analysis
// readonly access is sufficient for our analysis needs
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// File paths
const BASE_DIR = path.resolve(__dirname, '..');
const TOKEN_PATH = path.join(BASE_DIR, 'credentials', 'token.json');
const CREDENTIALS_PATH = path.join(BASE_DIR, 'credentials', 'credentials.json');

/**
 * Create an OAuth2 client with the given credentials
 * @param {Object} credentials - OAuth2 credentials
 */
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

  try {
    // Check if we have previously stored a token
    const token = await fs.readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log('Using existing authentication token.');
    return oAuth2Client;
  } catch (err) {
    return getNewToken(oAuth2Client);
  }
}

/**
 * Get and store new token after prompting for user authorization
 * @param {OAuth2Client} oAuth2Client - OAuth2 client
 */
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this URL:');
  console.log(authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', async (code) => {
      rl.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        
        // Store the token to disk for later program executions
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
        console.log('Token stored to', TOKEN_PATH);
        resolve(oAuth2Client);
      } catch (err) {
        console.error('Error retrieving access token:', err);
        reject(err);
      }
    });
  });
}

/**
 * Test Gmail API access
 * @param {OAuth2Client} auth - Authenticated OAuth2 client
 */
async function testGmailAccess(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  try {
    // Test with a simple profile request
    const response = await gmail.users.getProfile({ userId: 'me' });
    console.log('Gmail API authentication successful!');
    console.log(`Email: ${response.data.emailAddress}`);
    console.log(`Messages: ${response.data.messagesTotal}`);
    console.log(`Threads: ${response.data.threadsTotal}`);
    return true;
  } catch (error) {
    console.error('Error testing Gmail API access:', error);
    return false;
  }
}

/**
 * Main function to set up Gmail API authentication
 */
async function setupGmailAuth() {
  try {
    // Check if credentials directory exists
    await fs.mkdir(path.dirname(CREDENTIALS_PATH), { recursive: true });
    
    // Check if credentials file exists
    try {
      await fs.access(CREDENTIALS_PATH);
    } catch (err) {
      console.error('Error: credentials.json file not found.');
      console.log('\nTo set up Gmail API authentication:');
      console.log('1. Go to https://console.cloud.google.com/');
      console.log('2. Create a new project');
      console.log('3. Enable the Gmail API for your project');
      console.log('4. Create an OAuth client ID (Desktop application)');
      console.log('5. Download the credentials JSON');
      console.log('6. Save it as credentials.json in the credentials directory');
      console.log('\nThen run this script again.');
      return;
    }
    
    // Load client secrets
    const content = await fs.readFile(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    
    // Authorize with the credentials
    const auth = await authorize(credentials);
    
    // Test the API access
    const success = await testGmailAccess(auth);
    
    if (success) {
      console.log('\nSetup complete! You can now run the email analyzer.');
    } else {
      console.log('\nSetup failed. Please check the error messages above.');
    }
  } catch (error) {
    console.error('Error setting up Gmail authentication:', error);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupGmailAuth();
}

module.exports = {
  authorize,
  setupGmailAuth
};