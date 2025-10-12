/**
 * Messaging System using SQLite
 * Free alternative to Firestore for AGROF marketplace
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();

// Use existing store database
const dbPath = path.join(__dirname, 'store.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables (run in sequence)
db.serialize(() => {
  // Create messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      from_uid TEXT NOT NULL,
      to_uid TEXT NOT NULL,
      encrypted_text TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      read INTEGER DEFAULT 0
    )
  `);

  // Create indexes for better performance
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_from_uid ON messages(from_uid)');
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_to_uid ON messages(to_uid)');

  // Create chats table for metadata
  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      participant1_uid TEXT NOT NULL,
      participant2_uid TEXT NOT NULL,
      participant1_name TEXT,
      participant2_name TEXT,
      last_message TEXT,
      last_message_time DATETIME,
      last_message_from TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('📨 Messaging database initialized');
});

// Send a message
router.post('/messages', (req, res) => {
  const { fromUID, toUID, encryptedText, senderName, receiverName } = req.body;
  
  if (!fromUID || !toUID || !encryptedText) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }
  
  // Generate chat ID (sorted UIDs)
  const chatId = [fromUID, toUID].sort().join('_');
  
  console.log('💬 Saving message:', {
    chatId,
    from: senderName,
    to: receiverName,
    length: encryptedText.length
  });
  
  // Insert message
  db.run(
    'INSERT INTO messages (chat_id, from_uid, to_uid, encrypted_text) VALUES (?, ?, ?, ?)',
    [chatId, fromUID, toUID, encryptedText],
    function(err) {
      if (err) {
        console.error('❌ Error saving message:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      // Update or create chat metadata
      db.run(
        `INSERT INTO chats (id, participant1_uid, participant2_uid, participant1_name, participant2_name, last_message, last_message_time, last_message_from, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           last_message = excluded.last_message,
           last_message_time = excluded.last_message_time,
           last_message_from = excluded.last_message_from,
           updated_at = excluded.updated_at`,
        [chatId, fromUID, toUID, senderName, receiverName, encryptedText, fromUID],
        (err) => {
          if (err) {
            console.error('⚠️ Error updating chat metadata:', err);
          }
        }
      );
      
      console.log('✅ Message saved, ID:', this.lastID);
      res.json({ 
        success: true, 
        messageId: this.lastID,
        chatId: chatId
      });
    }
  );
});

// Get messages for a chat
router.get('/messages/:chatId', (req, res) => {
  const { chatId } = req.params;
  const { limit = 100 } = req.query;
  
  console.log('📖 Fetching messages for chat:', chatId);
  
  db.all(
    'SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC LIMIT ?',
    [chatId, parseInt(limit)],
    (err, rows) => {
      if (err) {
        console.error('❌ Error fetching messages:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      console.log('✅ Found', rows.length, 'messages');
      res.json({
        success: true,
        messages: rows.map(row => ({
          id: row.id,
          fromUID: row.from_uid,
          toUID: row.to_uid,
          encryptedText: row.encrypted_text,
          timestamp: row.timestamp,
          read: row.read === 1
        }))
      });
    }
  );
});

// Get all chats for a user
router.get('/chats/:uid', (req, res) => {
  const { uid } = req.params;
  
  console.log('📋 Fetching chats for user:', uid);
  
  db.all(
    `SELECT * FROM chats 
     WHERE participant1_uid = ? OR participant2_uid = ? 
     ORDER BY updated_at DESC`,
    [uid, uid],
    (err, rows) => {
      if (err) {
        console.error('❌ Error fetching chats:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      const chats = rows.map(row => {
        const otherUID = row.participant1_uid === uid ? row.participant2_uid : row.participant1_uid;
        const otherName = row.participant1_uid === uid ? row.participant2_name : row.participant1_name;
        
        return {
          chatId: row.id,
          otherUID,
          otherName,
          lastMessage: row.last_message,
          lastMessageTime: row.last_message_time,
          lastMessageFrom: row.last_message_from,
          createdAt: row.created_at
        };
      });
      
      console.log('✅ Found', chats.length, 'chats');
      res.json({ success: true, chats });
    }
  );
});

// Mark messages as read
router.put('/messages/:chatId/read', (req, res) => {
  const { chatId } = req.params;
  const { uid } = req.body;
  
  console.log('✓ Marking messages as read in chat:', chatId, 'for user:', uid);
  
  db.run(
    'UPDATE messages SET read = 1 WHERE chat_id = ? AND to_uid = ? AND read = 0',
    [chatId, uid],
    function(err) {
      if (err) {
        console.error('❌ Error marking messages as read:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      console.log('✅ Marked', this.changes, 'messages as read');
      res.json({ success: true, markedCount: this.changes });
    }
  );
});

// Get new messages (polling endpoint)
router.get('/messages/:chatId/new', (req, res) => {
  const { chatId } = req.params;
  const { afterId = 0 } = req.query;
  
  db.all(
    'SELECT * FROM messages WHERE chat_id = ? AND id > ? ORDER BY timestamp ASC',
    [chatId, parseInt(afterId)],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({
        success: true,
        messages: rows.map(row => ({
          id: row.id,
          fromUID: row.from_uid,
          toUID: row.to_uid,
          encryptedText: row.encrypted_text,
          timestamp: row.timestamp,
          read: row.read === 1
        }))
      });
    }
  );
});

module.exports = router;

