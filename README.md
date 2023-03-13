# ChatMC

### Initialization
```js
const ChatMC = require("chatmc");

let options = {
  client: "badlion", // sets the client to stream the log file from; accepts "vanilla", "badlion", or "lunar" - default is "vanilla"
  dir: "HOME\\AppData\\Roaming\\.minecraft\\logs\\blclient\\minecraft\\latest.log", // sets the directory to stream the log file from; overrides the client parameter - default is the directory of the vanilla log files
  fromBeginning: false, // determines whether or not to print logs written to the log file before initialization - default is "false"
  updateInterval: 50 // determines how often to check for changes in the log file in ms - default is 50ms
};

// Other notes for options.dir: "HOME" will be replaced by the user's home directory; if a client is set, there is no need to set a directory as well (this will be done automatically based on the client being used); it is included here solely as an example

ChatMC.init(options);

// Note that "options" is optional; if excluded, the default parameters will be used
```

### Event Listeners & Methods
```js
// Using ChatMC.on, you can listen for 10 different events, showcased below.
// There are also quite a few methods, shown off in the "ready" event listener.

const ChatMC = require("./index.js");

ChatMC.init({ client: "badlion" });

ChatMC.on("ready", function() {

  console.log(`[R] isReady: ${ChatMC.isReady()}`);                                    // true
  console.log(`[R] isOpen: ${ChatMC.isOpen()}`);                                      // true

  console.log(`[S] getClient: ${ChatMC.getClient()}`);                                // "badlion"
  console.log(`[S] getDir: ${ChatMC.getDir()}`);                                      // "C:\Users\..."
  console.log(`[S] getUpdateInterval: ${ChatMC.getUpdateInterval()}`);                // 50

  console.log(`[C] getLatestChat: ${JSON.stringify(ChatMC.getLatestChat())}`);        // { message: "Example Message", timestamp: 1678743010046 }
  console.log(`[C] getLatestChatRaw: ${JSON.stringify(ChatMC.getLatestChatRaw())}`);  // { message: "[17:29:50] [Client thread/INFO]: [CHAT] Example Message", timestamp: 1678743010046 }
  console.log(`[C] getLatestLog: ${JSON.stringify(ChatMC.getLatestLog())}`);          // { message: "[17:29:55] [Client thread/INFO]: -- End Memory Debug --Interval: ...", timestamp: 1678743010046 }

  console.log(`[U] getCurrentServer: ${ChatMC.getCurrentServer()}`);                  // mc.hypixel.net
  console.log(`[U] getCurrentPort: ${ChatMC.getCurrentPort()}`);                      // 25565
  console.log(`[U] getCurrentUser: ${ChatMC.getCurrentUser()}`);                      // SuperCoolUser456

});

ChatMC.on("chat", (d) => { console.log(`chat: ${d}`); });                             // Runs when a chat message is sent; "d" contains the chat message
ChatMC.on("chatRaw", (d) => { console.log(`chatRaw: ${d}`); });                       // Runs when a chat message is sent; "d" contains the chat message and some extra information
ChatMC.on("user", (d) => { console.log(`user: ${d}`); });                             // Runs when the user is changed; "d" contains the username of the new user
ChatMC.on("log", (d) => { console.log(`log: ${d}`); });                               // Runs when the log file is updated, ignoring errors; "d" contains the log
ChatMC.on("err", (d) => { console.log(`err: ${d}`); });                               // Runs when the game logs an error; "d" contains the error
ChatMC.on("raw", (d) => { console.log(`raw: ${d}`); });                               // Runs when the log file is updated; "d" contains the log
ChatMC.on("connect", (d) => { console.log(`connect: ${d}`); });                       // Runs when the current user connects to a server; "d" contains the full server IP, including the port number (eg. "mc.hypixel.net:25565")
ChatMC.on("disconnect", (d) => { console.log(`disconnect: ${d}`); });                 // Runs when the current user disconnects from a server; "d" contains the full server IP, including the port number (eg. "mc.hypixel.net:25565")
ChatMC.on("close", () => { console.log("closed", ChatMC.isOpen()); });                // Runs when ChatMC has finished closing (after calling "ChatMC.close()")

// There are also 3 other methods that can be used to change the client [setClient("client")], directory [setDir("directory\\path")], and update interval [setUpdateInterval(t)] manually. When possible, using the init method instead is preferred.

// When done listening for events, use the close method:
setTimeout(() => {

  ChatMC.close();

}, 10 * 1000);
```
