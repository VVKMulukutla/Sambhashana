const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const app = express();
const port = 3000;

// Initialize Firebase Admin SDK
const serviceAccount = require('./key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use(cors());
app.use(bodyParser.json());

app.post('/createRoom', async (req, res) => {
    try {
        const roomName = req.body.roomName;
        if (roomName) {
            let roomCode;
            do {
                roomCode = generateRoomCode();
            } while (await isCodeUnique(roomCode) === false);

            const timestamp = admin.firestore.FieldValue.serverTimestamp();
            await db.collection('sambhashana').doc(roomCode).set({
                name: roomName,
                code: roomCode,
                createdAt: (new Date()).toString(),
            });

            res.json({ success: true, roomCode: roomCode });
        } else {
            res.json({ success: false, message: 'Room name is required' });
        }
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.delete('/deleteRoom', async (req, res) => {
    try {
        const roomCode = req.body.roomCode;
        if (roomCode) {
            await db.collection('sambhashana').doc(roomCode).delete();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Room code is required' });
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.post('/validateRoom', async (req, res) => {
    try {
        const roomCode = req.body.roomCode;
        const roomRef = db.collection('sambhashana').doc(roomCode);
        const doc = await roomRef.get();
        if (doc.exists) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Room not found' });
        }
    } catch (error) {
        console.error('Error validating room:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.post('/sendMessage', async (req, res) => {
    const { roomCode, sender, message } = req.body;

    if (roomCode && sender && message) {
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        await db.collection('sambhashana').doc(roomCode).collection('messages').add({
            sender,
            message,
            timestamp
        });

        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Incomplete data' });
    }
});
app.get('/getMessages/:roomCode', async (req, res) => {
    const roomCode = req.params.roomCode;
    const messagesRef = db.collection('sambhashana').doc(roomCode).collection('messages');
    const snapshot = await messagesRef.orderBy('timestamp').get();

    const messages = [];
    snapshot.forEach(doc => {
        messages.push(doc.data());
    });

    res.json(messages);
});
app.get('/getChatrooms', async (req, res) => {
    const chatroomsRef = db.collection('sambhashana');
    const snapshot = await chatroomsRef.get();
    const chatrooms = [];
    snapshot.forEach(doc => {
        chatrooms.push({
            id: doc.id,
            ...doc.data()
        });
    });
    res.json(chatrooms);
});


app.delete('/deleteChatroom/:id', async (req, res) => {
    const chatroomId = req.params.id;
    try {
        await db.collection('sambhashana').doc(chatroomId).delete();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting chatroom:', error);
        res.json({ success: false, message: 'Failed to delete chatroom.' });
    }
});
app.post('/checkLogin', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      
      const userDoc = await db.collection('loginSambha').doc(email).get();
  
      if (!userDoc.exists || userDoc.data().password !== hashPassword(password)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
  
      return res.status(200).json({ success: true, message: 'Login successful.' });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
    }
  });
  
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      
      const userDoc = await db.collection('loginSambha').doc(email).get();
      if (userDoc.exists) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
      
      
      const hashedPassword = hashPassword(password);
      await db.collection('loginSambha').doc(email).set({ name, password: hashedPassword });
  
      return res.status(201).json({ success: true, message: 'User registered successfully.' });
    } catch (error) {
      console.error('Error during signup:', error);
      return res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
    }
  });
  
function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function isCodeUnique(code) {
    const roomRef = db.collection('sambhashana').doc(code);
    const doc = await roomRef.get();
    return !doc.exists;
}
function hashPassword(password) {
    const sha256 = crypto.createHash('sha256');
    sha256.update(password, 'utf-8');
    const hashedPassword = sha256.digest('hex');
    return hashedPassword;
  }
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
