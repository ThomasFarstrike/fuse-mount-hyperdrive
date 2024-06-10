// Author: Thomas Farstrike <thomasverstreken@protonmail.com>
// Copyleft 2024
// Quick-and-dirty proof-of-concept of mounting a hyperdrive to a local folder
// Uses the awesome https://github.com/fuse-friends/fuse-native

const Fuse = require('fuse-native')
const Hyperdrive = require('hyperdrive')
const Hyperswarm = require('hyperswarm')
const Corestore = require('corestore')
const ram = require('random-access-memory')

const emptyDirFile = ".emptyDirFile_to_be_able_to_create_empty_directories";

var drive;
var mountDir;
var driveKey;
var driveDiscoveryKey;

// Low-level filesystem operation handlers
const ops = {
  readdir: async function (path, cb) {
    console.log('readdir(%s)', path)
    var files = new Array();
    const iterator = await drive.readdir(path)
    for await (const dirent of iterator) {
      console.dir(dirent);
      // hide the emptyDirFile as it's only for internal use
      if (dirent != emptyDirFile) files.push(dirent)
    }
    console.dir(files);
    return process.nextTick(cb, 0, files)
  },
  getattr: async function (path, cb) {
    if (path === '/') {
      console.log("it's the root directory");
        return process.nextTick(cb, 0, {
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
          nlink: 1,
          size: 100,
          mode: 16877,
          uid: process.getuid ? process.getuid() : 0,
          gid: process.getgid ? process.getgid() : 0
        });
    } else if (await drive.exists(path)) {
      const entry = await drive.entry(path)
      console.log("got entry: ");
      console.dir(entry);
      const fileSize = entry.value.blob.byteLength;
      //console.log("length: " + entry.value.blob.byteLength);
      return process.nextTick(cb, 0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: fileSize,
        mode: 33188,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
      });
    }
    // Try to iterate and if there's at least one entry then it's a directory
    const iterator = await drive.readdir(path)
    for await (const dirent of iterator) {
      console.dir(dirent);
      // if there's at least one entry then this is a directory
      return process.nextTick(cb, 0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: 100,
        mode: 16877,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
      });
    }
    // if everything fails then it doesn't exist
    return process.nextTick(cb, Fuse.ENOENT);
  },
  open: function (path, flags, cb) {
    return process.nextTick(cb, 0, 42) // 42 is an fd
  },
  read: async function (path, fd, buf, len, pos, cb) {
    const buffer = await drive.get(path)
    console.log(buffer) // => <Buffer ..> "example"
    buf.write(buffer.slice(pos).toString('utf8'));
    return process.nextTick(cb, buffer.length)
  },
  create: async function(path, mode, cb) {
    if (drive.writable) await drive.put(path, Buffer.alloc(0))
    return process.nextTick(cb, 0)
  },
  write: async function (path, fd, buffer, length, position, cb) {
    if (drive.writable) await drive.put(path, buffer.slice(0, length))
    cb(length) // we handled all the data
  },
  truncate (path, len, cb) { // needed for setattr (4)
    return process.nextTick(cb, 0)
  },
  mkdir: async function(path, mode, cb) {
    if (drive.writable) await drive.put(path + "/" + emptyDirFile, Buffer.alloc(0))
    return process.nextTick(cb, 0)
  },
  unlink: async function(path, cb) {
    if (drive.writable) await drive.del(path);
    return process.nextTick(cb, 0);
  },
  rmdir: async function(path, cb) {
    if (drive.writable) await drive.del(path + "/" + emptyDirFile);
    return process.nextTick(cb, 0);
  }
}

function parse_args() {
  console.error("Usage: node " + process.argv[1] + " mountDir [driveKeyHex]");
  console.error("Example: node " + process.argv[1] + " mnt1 # to create a new writable hyperdrive, mounted at mnt1/");
  console.error("Example: node " + process.argv[1] + " mnt2 4b3278fc44e9716c0342715f42e314050a3c825a51056ac53ee8170986a8bb86 # to mount an existing hyperdrive in read-only mode at mnt2/");
  console.error("NOTE: mountDir will be created if they don't exist.");

  if (process.argv.length < 3) {
    process.exit(1);
  }

  mountDir = process.argv[2];

  if (process.argv[3]) {
    console.log('driveKey is present.');
    driveKey = process.argv[3];
  }
  if (process.argv[4]) {
    console.log('discoveryKey is present.');
    discoveryKey = process.argv[4];
  }
}

async function init() {
  const store = new Corestore(ram)
  if (driveKey) {
    console.log("initializing with driveKey " + driveKey);
    drive = new Hyperdrive(store, driveKey);
  } else {
    drive = new Hyperdrive(store);
  }
  console.log("Awaiting drive readiness...");
  await drive.ready();
  //console.log("drive.id = " + drive.id);
  console.log("Use this public key of the Hypercore backing the drive to mount this hyperdrive somewhere else in read-only mode: " + drive.key.toString('hex'));
  
  //console.log("drive.discoveryKey = " + drive.discoveryKey.toString('hex'));
  const swarm = new Hyperswarm()
  const done = drive.findingPeers()
  console.log("waiting for swarm connection...");
  swarm.on('connection', (socket) => drive.replicate(socket))
  swarm.join(drive.discoveryKey)
  swarm.flush().then(done, done)
  console.log("swarm connection done.");
}

parse_args();
const fuse = new Fuse(mountDir, ops, { debug: true, displayFolder: true, force: true, mkdir: true })
console.log("Mounting drive...");
fuse.mount(async function(err) {
  if (err) throw err
  console.log('filesystem mounted on ' + fuse.mnt)
  console.log("Awaiting initialization...");
  await init();
})

process.once('SIGINT', function () {
  fuse.unmount(err => {
    if (err) {
      console.log('filesystem at ' + fuse.mnt + ' not unmounted', err)
    } else {
      console.log('filesystem at ' + fuse.mnt + ' unmounted')
    }
  })
})

