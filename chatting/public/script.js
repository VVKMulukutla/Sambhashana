
const socket = io();

document.addEventListener('DOMContentLoaded', () => {
  const messages = document.getElementById('messages');
  const usernameInput = document.getElementById('username');
  const messageInput = document.getElementById('message');
  const sendButton = document.getElementById('send');

  
  const sendMessage = () => {
    const username = usernameInput.value.trim();
    const message = messageInput.value.trim();

    if (username && message) {
      socket.emit('join', username);
      socket.emit('message', message);

      messageInput.value = '';
    }
  };

  messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });

  sendButton.addEventListener('click', () => {
    sendMessage();
  });

  socket.on('message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    messages.appendChild(messageElement);
  });
});
