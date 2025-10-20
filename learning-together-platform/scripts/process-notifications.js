#!/usr/bin/env node

/**
 * Notification processing script
 * This script should be run every minute via cron job to process notifications
 * 
 * Example crontab entry:
 * * * * * * /usr/bin/node /path/to/project/scripts/process-notifications.js
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require('http')

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

if (!INTERNAL_API_KEY) {
  console.error('INTERNAL_API_KEY environment variable is required')
  process.exit(1)
}

async function processNotifications() {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/notifications/process', API_URL)
    const isHttps = url.protocol === 'https:'
    const client = isHttps ? https : http

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERNAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    const req = client.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Notifications processed successfully:', data)
          resolve(data)
        } else {
          console.error('Failed to process notifications:', res.statusCode, data)
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      console.error('Request error:', error)
      reject(error)
    })

    req.end()
  })
}

// Run the script
processNotifications()
  .then(() => {
    console.log('Notification processing completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Notification processing failed:', error)
    process.exit(1)
  })