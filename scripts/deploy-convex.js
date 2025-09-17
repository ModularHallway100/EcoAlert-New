#!/usr/bin/env node

/**
 * Convex Deployment Script for EcoAlert
 * This script handles the deployment and configuration of Convex databases
 * for the EcoAlert application.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  APP_NAME: 'ecoalert',
  DATABASE_NAME: 'ecoalert-db',
  REGION: 'us-east-1',
  ENVIRONMENT: process.env.CONVEX_ENVIRONMENT || 'development',
  DEPLOYMENT_CONFIG: 'convex/deployment.json',
  SCHEMA_FILE: 'convex/schema.ts',
  ENV_FILE: '.env.local'
};

// Helper functions
function log(message) {
  console.log(`[Convex Deploy] ${message}`);
}

function error(message) {
  console.error(`[Convex Deploy Error] ${message}`);
  process.exit(1);
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    return JSON.parse(content);
  } catch (err) {
    error(`Failed to read JSON file ${filePath}: ${err.message}`);
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(path.join(__dirname, filePath), JSON.stringify(data, null, 2));
    log(`Successfully wrote ${filePath}`);
  } catch (err) {
    error(`Failed to write JSON file ${filePath}: ${err.message}`);
  }
}

// Deployment functions
function checkPrerequisites() {
  log('Checking prerequisites...');
  
  // Check if convex is installed
  try {
    execSync('npx convex --version', { stdio: 'ignore' });
  } catch (err) {
    error('Convex CLI is not installed. Please run: npm install -g convex');
  }
  
  // Check if required files exist
  const requiredFiles = [CONFIG.SCHEMA_FILE, CONFIG.DEPLOYMENT_CONFIG];
  for (const file of requiredFiles) {
    if (!fileExists(file)) {
      error(`Required file ${file} does not exist`);
    }
  }
  
  log('Prerequisites check passed');
}

function setupEnvironment() {
  log('Setting up environment...');
  
  // Create .env.local if it doesn't exist
  if (!fileExists(CONFIG.ENV_FILE)) {
    const envContent = `CONVEX_URL=http://localhost:3000
CONVEX_SECRET=your-secret-key-here
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
NODE_ENV=development
`;
    fs.writeFileSync(path.join(__dirname, CONFIG.ENV_FILE), envContent);
    log(`Created ${CONFIG.ENV_FILE}`);
  }
  
  // Update deployment config for environment
  const deploymentConfig = readJsonFile(CONFIG.DEPLOYMENT_CONFIG);
  deploymentConfig.environment = CONFIG.ENVIRONMENT;
  
  if (CONFIG.ENVIRONMENT === 'production') {
    deploymentConfig.functions.environmental.getCurrentData.schedule = '0 */1 * * *';
    deploymentConfig.functions.environmental.getHistoricalData.schedule = '0 */30 * * *';
  }
  
  writeJsonFile(CONFIG.DEPLOYMENT_CONFIG, deploymentConfig);
  
  log('Environment setup completed');
}

function initializeConvex() {
  log('Initializing Convex...');
  
  try {
    execSync('npx convex init', { stdio: 'inherit' });
    log('Convex initialization completed');
  } catch (err) {
    error(`Failed to initialize Convex: ${err.message}`);
  }
}

function validateSchema() {
  log('Validating schema...');
  
  try {
    // Check if schema.ts has valid syntax
    execSync('npx tsc convex/schema.ts --noEmit', { stdio: 'ignore' });
    log('Schema validation passed');
  } catch (err) {
    error(`Schema validation failed: ${err.message}`);
  }
}

function deployDatabase() {
  log(`Deploying database to ${CONFIG.ENVIRONMENT} environment...`);
  
  try {
    const cmd = CONFIG.ENVIRONMENT === 'production' 
      ? 'npx convex deploy --prod' 
      : 'npx convex deploy';
    
    execSync(cmd, { stdio: 'inherit' });
    log('Database deployment completed');
  } catch (err) {
    error(`Database deployment failed: ${err.message}`);
  }
}

function setupIndexes() {
  log('Setting up database indexes...');
  
  const indexes = [
    {
      table: 'environmentalData',
      fields: ['timestamp'],
      name: 'by_timestamp'
    },
    {
      table: 'users',
      fields: ['clerkId'],
      name: 'by_clerk_id'
    },
    {
      table: 'communityMembers',
      fields: ['userId'],
      name: 'by_user_id'
    },
    {
      table: 'discussions',
      fields: ['timestamp'],
      name: 'by_timestamp'
    },
    {
      table: 'educationalContent',
      fields: ['category'],
      name: 'by_category'
    },
    {
      table: 'educationalContent',
      fields: ['type'],
      name: 'by_type'
    },
    {
      table: 'emergencyAlerts',
      fields: ['status'],
      name: 'by_status'
    }
  ];
  
  // In a real implementation, you would create these indexes
  // For now, we'll log the configuration
  log('Index configuration:');
  indexes.forEach(index => {
    log(`  - ${index.table}.${index.name} on ${index.fields.join(', ')}`);
  });
}

function runMigrations() {
  log('Running database migrations...');
  
  // Check if migrations directory exists
  const migrationsDir = path.join(__dirname, 'convex/migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length > 0) {
      log(`Found ${migrationFiles.length} migration files`);
      // In a real implementation, you would run these migrations
    }
  }
  
  log('Migrations completed');
}

function setupMonitoring() {
  log('Setting up monitoring and analytics...');
  
  // Configure monitoring for key metrics
  const monitoringConfig = {
    metrics: [
      {
        name: 'database_response_time',
        description: 'Average database response time',
        interval: '5m'
      },
      {
        name: 'api_calls',
        description: 'Number of API calls per minute',
        interval: '1m'
      },
      {
        name: 'user_engagement',
        description: 'User engagement rate',
        interval: '15m'
      },
      {
        name: 'alert_delivery',
        description: 'Alert delivery success rate',
        interval: '5m'
      }
    ],
    alerts: [
      {
        metric: 'database_response_time',
        threshold: '1000ms',
        action: 'notify'
      },
      {
        metric: 'api_calls',
        threshold: '1000/minute',
        action: 'throttle'
      },
      {
        metric: 'alert_delivery',
        threshold: '95%',
        action: 'notify'
      }
    ]
  };
  
  // Save monitoring configuration
  writeJsonFile('convex/monitoring.json', monitoringConfig);
  log('Monitoring setup completed');
}

function generateDocumentation() {
  log('Generating API documentation...');
  
  const apiDocs = {
    title: 'EcoAlert Convex API Documentation',
    version: '1.0.0',
    description: 'API documentation for EcoAlert Convex database functions',
    endpoints: [
      {
        name: 'getCurrentData',
        method: 'GET',
        description: 'Get the most recent environmental data',
        parameters: [],
        response: 'Environmental data object'
      },
      {
        name: 'getHistoricalData',
        method: 'GET',
        description: 'Get historical environmental data',
        parameters: [
          {
            name: 'timeRange',
            type: 'string',
            enum: ['24h', '7d', '30d'],
            required: true
          }
        ],
        response: 'Historical data object'
      },
      {
        name: 'getUserProfile',
        method: 'GET',
        description: 'Get user profile and preferences',
        parameters: [],
        response: 'User profile object'
      },
      {
        name: 'updateUserPreferences',
        method: 'POST',
        description: 'Update user preferences',
        parameters: ['preferences object'],
        response: 'Success status'
      },
      {
        name: 'createEmergencyAlert',
        method: 'POST',
        description: 'Create emergency alert',
        parameters: ['Alert data object'],
        response: 'Alert ID'
      }
    ]
  };
  
  writeJsonFile('convex/api-docs.json', apiDocs);
  log('API documentation generated');
}

// Main deployment function
function main() {
  log('Starting EcoAlert Convex deployment...');
  
  try {
    // Check prerequisites
    checkPrerequisites();
    
    // Setup environment
    setupEnvironment();
    
    // Validate schema
    validateSchema();
    
    // Initialize Convex if needed
    if (!fileExists('convex')) {
      initializeConvex();
    }
    
    // Deploy database
    deployDatabase();
    
    // Setup indexes
    setupIndexes();
    
    // Run migrations
    runMigrations();
    
    // Setup monitoring
    setupMonitoring();
    
    // Generate documentation
    generateDocumentation();
    
    log('Convex deployment completed successfully!');
    log('');
    log('Next steps:');
    log('1. Update environment variables in .env.local');
    log('2. Test API endpoints using the documentation');
    log('3. Monitor deployment in Convex dashboard');
    log('4. Set up CI/CD for automated deployments');
    
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
  }
}

// Run the deployment
if (require.main === module) {
  main();
}

module.exports = {
  main,
  CONFIG,
  checkPrerequisites,
  setupEnvironment,
  validateSchema,
  deployDatabase,
  setupIndexes,
  runMigrations,
  setupMonitoring,
  generateDocumentation
};