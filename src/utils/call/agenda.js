// utils/agenda.js
import Agenda from 'agenda';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

// Initialize Agenda
const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: 'agendaJobs',
    options: { 
      useUnifiedTopology: true 
    }
  },
  processEvery: '30 seconds'
});

// Connect Agenda to MongoDB
async function initializeAgenda() {
  await new Promise(resolve => {
    agenda.on('ready', () => {
      console.log('Agenda initialized');
      agenda.start(); // Start the agenda
      resolve();
    });
  });

  // Error handling
  agenda.on('error', err => {
    console.error('Agenda error:', err);
  });
}

// Define your job types here
agenda.define('charge_call', async (job) => {
  const { callId, userId, astrologerId } = job.attrs.data;
  // Your billing logic here (from previous example)
});

// Graceful shutdown
async function gracefulShutdown() {
  await agenda.stop();
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { agenda, initializeAgenda };
