/**
 * Simple rule based chatbot responders.
 * Input: message text and user object
 * Output: response string
 */

const getBotReply = (text) => {
  if (!text) return "Sorry, I didn't catch that. Can you rephrase?";
  const t = text.toLowerCase();

  if (t.includes('hello') || t.includes('hi')) {
    return "Hello! I'm your assistant bot. Ask me about commands, help, or say 'features'.";
  }
  if (t.includes('help')) {
    return "You can ask me: 'how to register', 'how to send message', 'features', or 'who made you'.";
  }
  if (t.includes('register')) {
    return "To register: click Register, fill name/email/password and submit. After that, login.";
  }
  if (t.includes('features')) {
    return "This app supports realtime chat (Socket.IO), JWT auth, persistent messages (MongoDB), and a built-in bot.";
  }
  if (t.includes('who') && t.includes('made')) {
    return "This app was created by the developer. You can customize me or integrate Dialogflow / OpenAI for advanced responses.";
  }
  // fallback
  return "I don't have a confident reply to that yet — try 'help' or 'features'.";
};

module.exports = { getBotReply };
