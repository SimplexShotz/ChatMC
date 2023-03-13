
// =============== DEPENDENCIES & CONSTANTS ===============

const events = require("events");
const { stat, readFile } = require("fs");
const read = require('util').promisify(readFile);

const emitter = new events.EventEmitter();
const HOME = require("os").homedir();

const clientDir = {
  vanilla: `${HOME}\\AppData\\Roaming\\.minecraft\\logs\\latest.log`,
  badlion: `${HOME}\\AppData\\Roaming\\.minecraft\\logs\\blclient\\minecraft\\latest.log`,
  lunar: `${HOME}\\.lunarclient\\offline\\multiver\\logs\\latest.log`
};

// =============== VARIABLES ===============

let options = {
  client: null,
  dir: null,
  fromBeginning: false,
  updateInterval: 50
};

let cache;
clearCache();

// =============== MODULE FUNCTIONS ===============

const ChatMC = {

  on: function(e, cb) {

    return emitter.on(e, cb);

  },

  setClient: async function(client, skipRefresh) {

    client = client.toLowerCase();
  
    if (!clientDir[client])
      throw new Error("Invalid client. For unsupported clients, use the setDir() function.");
  
    options.client = client;
    options.dir = clientDir[client];

    if (!skipRefresh)
      await refresh();
  
  },

  getClient: function() {

    return options.client;
  
  },

  setDir: async function(dir, skipRefresh) {

    if (!dir)
      throw new Error("Directory cannot be empty.");
  
    options.client = options.client || "custom";
    options.dir = dir.split("HOME").join(HOME);

    if (!skipRefresh)
      await refresh();
  
  },

  getDir: function() {

    return options.dir;
  
  },

  async setUpdateInterval(t) {

    options.updateInterval = t;

    await refresh();

  },

  getUpdateInterval() {

    return options.updateInterval;

  },

  getCurrentUser() {

    return cache.user;

  },
  
  getCurrentServer() {

    return cache.server;

  },

  getCurrentPort() {

    return cache.port;

  },

  getLatestChat() {

    return { message: cache.latestChat.message ? clean(cache.latestChat.message) : null, timestamp: cache.latestChat.timestamp };

  },

  getLatestChatRaw() {

    return cache.latestChat;

  },

  getLatestLog() {

    return cache.latestLog;

  },

  isReady() {

    return cache.ready;

  },

  isOpen() {

    return cache.open;

  },

  close() {

    if (cache.interval)
      clearInterval(cache.interval);

    clearCache();
    
    emitter.emit("close");

  }

};

// =============== MODULE EXPORTS ===============

/*
  init(opt) - initializes ChatMC
    > opt (optional): an object containing options; if excluded, the default parameters will be used
      - {} client: sets the client to stream the log file from - default is "vanilla"
      - {} dir: sets the directory to stream the log file from; overrides the client parameter - default is determined by the directory of the vanilla log files
      - {} fromBeginning: determines whether or not to print logs written to the log file before initialization - default is "false"
      - {} updateInterval: determines how often to check for changes in the log file - default is 50ms
*/
exports.init = async function(opt) {
  
  ChatMC.setClient(opt?.client || "vanilla", true);
  
  if (opt?.dir)
    ChatMC.setDir(opt.dir, true);

  if (opt?.fromBeginning)
    options.fromBeginning = opt.fromBeginning;
  
  if (opt?.updateInterval)
    options.updateInterval = opt.updateInterval;

  await refresh();

}

/*
  on(e, cb) - is an event emitter that will return the latest log line, in real time
    > e: the event type; there are 10 different event types, as follows:
      - "ready": emitted when the initialization process is complete; if the client or directory is changed, this event will also fire
      - "chat": returns only chats, and will clear out any excess color text
      - "chatRaw": returns only chats, but preserves them exactly as how they were recieved by the client
      - "user": returns only changes in user
      - "log": returns only log updates (ignores errors; includes chats)
      - "err": returns only errors
      - "raw": returns all updates to the latest.log file
      - "connect": returns updates when connecting to a server
      - "disconnect": returns updates when disconnecting from a server (this is only fully supported by Badlion; vanilla and Lunar will still fire this event, but only when joining a new server or closing the client)
      - "close": emitted when the closing process is complete
    > cb: the callback function; this will be run whenever a new line is added to the log file, the data for which will be returned as the first and only parameter
*/
exports.on = ChatMC.on;

/*
  setClient(cl) - sets the client to stream the log file from
    > cl: accepts "vanilla", "badlion", or "lunar" as strings. These are not case sensitive. Defaults to vanilla. Support for other clients has not been added, and their path will need to be set manually using the "setDir" function
*/
exports.setClient = function(cl) { return ChatMC.setClient(cl); };

/*
  getClient() - returns the current client
    < returns: the current client, either "vanilla", "badlion", or "lunar", as strings. If the "setDir" function has been used, this function will return "custom"
*/
exports.getClient = ChatMC.getClient;

/*
  setDir(dir) - sets the directory to stream the log file from
    > dir: takes in the exact path to the latest.log file as a string. The keyword "HOME" can be used to refer directly to the user's home directory: this is case sensitive
*/
exports.setDir = function(dir) { return ChatMC.setDir(dir); };

/*
  getDir() - returns the path to the current active latest.log file
    < returns: the path to the current active latest.log file
*/
exports.getDir = ChatMC.getDir;

/*
  setUpdateInterval(v) - changes how often the log file is checked for changes
    > v: how often the log file should be checked for changes, in milliseconds
*/
exports.setUpdateInterval = ChatMC.setUpdateInterval;

/*
  getUpdateInterval() - returns how often the log file is checked for changes
    < returns: how often the log file is checked for changes, in milliseconds
*/
exports.getUpdateInterval = ChatMC.getUpdateInterval;

/*
  getCurrentUser() - returns the current logged in user
    < returns: the current logged in user, or null if no user is currently logged in
*/
exports.getCurrentUser = ChatMC.getCurrentUser;

/*
  getCurrentServer() - returns the server the user is currently playing on
    < returns: the IP of the current server, or null if no server is currently connected to
*/
exports.getCurrentServer = ChatMC.getCurrentServer;

/*
  getCurrentPort() - returns the port of server the user is currently playing
    < returns: the port of the current server, or null if no server is currently connected to
*/
exports.getCurrentPort = ChatMC.getCurrentPort;

/*
  getLatestChat() - returns the most recent chat message
    < returns: the most recent chat message, or an object with null values if none have been sent
*/
exports.getLatestChat = ChatMC.getLatestChat;

/*
  getLatestChatRaw() - returns the most recent chat message, in raw form
    < returns: the most recent chat message, in raw form, or an object with null values if none have been sent
*/
exports.getLatestChatRaw = ChatMC.getLatestChatRaw;

/*
  getLatestLog() - returns the most recent log message
    < returns: the most recent log message, or an object with null values if none have been sent
*/
exports.getLatestLog = ChatMC.getLatestLog;

/*
  isOpen() - returns if the module is open
    < returns: a boolean indicating if the module is open
*/
exports.isOpen = ChatMC.isOpen;

/*
  isReady() - returns if the module is ready
    < returns: a boolean indicating if the module is ready
*/
exports.isReady = ChatMC.isReady;

/*
  close() - closes the ChatMC instance
*/
exports.close = ChatMC.close;

// =============== HELPER FUNCTIONS ===============

async function initPointer() {

  let dir = options.dir;

  const data = await read(dir, "utf8");
  const lines = data.split("\r\n").join("\n").split("\n");
  
  if (dir !== options.dir)
    return;

  while(cache.pointer < lines.length - 1) {

    check(lines[cache.pointer]);
    cache.pointer++;

  }

}

async function refresh() {

  if (cache.interval)
    clearInterval(cache.interval);

  clearCache();

  cache.open = true;

  if (!options.fromBeginning)
    await initPointer();

  cache.interval = setInterval(update, options.updateInterval);

  update();

}

function update() {

  stat(options.dir, function(err, stats) {
    if (cache.lastSize !== stats.size && cache.open) {
      cache.lastSize = stats.size;
      getLine();
    }
  });

}

async function getLine() {

  const data = await read(options.dir, "utf8");
  const lines = data.split("\r\n").join("\n").split("\n");

  if (!cache.open)
    return;

  if (cache.pointer >= lines.length) {
    await refresh();
    return;
  }

  while(cache.pointer < lines.length - 1) {

    check(lines[cache.pointer], true);
    tail(lines[cache.pointer]);
    cache.pointer++;

  }

  if (!cache.ready) {
    cache.ready = true;
    emitter.emit("ready");
  }

}

function check(log, emit) {

  let type = classify(log);

  // Check for user changes:

  if (type === "log" && (((options.client === "vanilla" || options.client === "badlion") && log.indexOf("[Client thread/INFO]: Setting user: ") !== -1) || (options.client === "lunar" && log.indexOf("[Client thread/INFO]: [LC] Setting user: ") !== -1))) {

    cache.user = log.split("Setting user: ")[1];

    if (emit)
      emitter.emit("user", cache.user);

  }

  if (type === "log" && options.client === "badlion" && log.indexOf("[Client thread/INFO]: Switched to account:") !== -1) {

    cache.user = log.split("[Client thread/INFO]: Switched to account: ")[1];

    if (emit)
      emitter.emit("user", cache.user);

  }

  // Check for connections:

  if (type === "log" && log.indexOf("[Client thread/INFO]: Connecting to ") !== -1) {

    if (log.substring(0, 10) !== cache.lastConnectTime) {

      if (cache.server && emit)
        emitter.emit("disconnect", `${cache.server}:${cache.port}`);

      cache.lastConnectTime = log.substring(0, 10);

      cache.server = log.split("[Client thread/INFO]: Connecting to ")[1].split(", ")[0];
      cache.port = log.split("[Client thread/INFO]: Connecting to ")[1].split(", ")[1];

      if (emit)
        emitter.emit("connect", `${cache.server}:${cache.port}`);
    }

  }

  // Check for disconnects:
  
  if (type === "log" && options.client === "badlion" && log.indexOf(`[Client thread/INFO]: Update connection state: '{"state":1}'`) !== -1) {

    cache.lastConnectTime = null;

    if (emit)
      emitter.emit("disconnect", `${cache.server}:${cache.port}`);

    cache.server = null;
    cache.port = null;

  }

  if (cache.server && type === "log" && log.indexOf("[Client thread/INFO]: Stopping!") !== -1) {

    cache.lastConnectTime = null;

    if (emit)
      emitter.emit("disconnect", `${cache.server}:${cache.port}`);

    cache.server = null;
    cache.port = null;

  }

  if (cache.user && type === "log" && log.indexOf("[Client thread/INFO]: Stopping!") !== -1) {

    cache.user = null;
    
    if (emit)
      emitter.emit("user", cache.user);
    
  }

  if (type === "chat")
    cache.latestChat = { message: log, timestamp: getTime() };

  cache.latestLog = { message: log, timestamp: getTime() };

}

function tail(log) {
  
  let type = classify(log);

  switch(type) {

    case "chat":
      emitter.emit("chat", clean(log));
      emitter.emit("chatRaw", log);
      emitter.emit("log", log);
    break;

    case "log":
      emitter.emit("log", log);
    break;
    
    case "error":
      emitter.emit("err", log);
    break;

  }

  emitter.emit("raw", log);

}

function classify(c) {

  if (c.indexOf("/INFO]: [CHAT]") !== -1)
    return cache.lastType = "chat";
    
  if (c.indexOf("/INFO]") !== -1)
    return cache.lastType = "log";

  if (c.indexOf("/ERROR]") !== -1 || c.indexOf("/WARN]") !== -1 || c.indexOf("/FATAL]") !== -1)
    return cache.lastType = "error";
  
  return cache.lastType;

}

function clearCache() {

  cache = {
    open: false,
    ready: false,
    interval: null,
    lastType: "",
    lastSize: 0,
    pointer: 0,
    user: null,
    lastConnectTime: null,
    server: null,
    port: null,
    latestChat: { message: null, timestamp: null },
    latestLog: { message: null, timestamp: null }
  };

}

function clean(c) {

  c = c.split("[CHAT] ");
  c = c.length > 1 ? c.splice(1, c.length - 1).join("[CHAT] ").split("�") : c[0].split("�");
  for (let i = 1; i < c.length; i++) {
    c[i] = c[i].split("").splice(1).join("");
  }
  return c.join("");

}

function getTime() {
  return Date.now();
}
