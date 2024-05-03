This is a quick-and-dirty proof-of-concept of mounting a Hyperdrive to a local folder.

See https://docs.pears.com/building-blocks/hyperdrive

It uses the awesome https://github.com/fuse-friends/fuse-native

Supported operations:
- creating files
- reading files
- writing files
- removing files
- creating directories (including empty ones)
- listing directories

TODO:
- add symlink support

Create by Thomas Farstrike <thomasverstreken@protonmail.com>

# Usage

Usage: node cacheDir mountDir [driveKeyHex]

Example: node cache1 mnt1 // to create a new writable hyperdrive, cached in cache1/ and mounted at mnt1/

Example: node cache2 mnt2 4b3278fc44e9716c0342715f42e314050a3c825a51056ac53ee8170986a8bb86 // to mount an existing hyperdrive in read-only mode at mnt2/

NOTE: storageDir and mountDir will be created if they don't exist.

# Examples

## Mount and list the Keet Hyperdrive:

Mount it:

`node fuse-mount-hyperdrive.js cache1 mnt1 4b3278fc44e9716c0342715f42e314050a3c825a51056ac53ee8170986a8bb86`

Output:

```
Mounting drive...
FUSE library version: 2.9.9
nullpath_ok: 0
nopath: 0
utime_omit_ok: 0
unique: 1, opcode: INIT (26), nodeid: 0, insize: 56, pid: 0
INIT: 7.27
flags=0x003ffffb
max_readahead=0x00020000
filesystem mounted on /home/user/sources/fuse-mount-hyperdrive/mnt1
Awaiting initialization...
initializing with driveKey 4b3278fc44e9716c0342715f42e314050a3c825a51056ac53ee8170986a8bb86
Awaiting drive readiness...
   INIT: 7.19
   flags=0x00000011
   max_readahead=0x00020000
   max_write=0x00020000
   max_background=0
   congestion_threshold=0
   unique: 1, success, outsize: 40
waiting for swarm connection...
swarm connection done.
```

Now in another terminal, do:

`ls -al mnt1/`

And you'll see:

```
total 0
drwxr-xr-x 1 user user  100 May  3 13:58 assets
-rw-r--r-- 1 user user 1687 May  3 13:58 index.html
drwxr-xr-x 1 user user  100 May  3 13:58 node_modules
-rw-r--r-- 1 user user 1921 May  3 13:58 package.json
-rw-r--r-- 1 user user 1297 May  3 13:58 README.md
drwxr-xr-x 1 user user  100 May  3 13:58 scripts
drwxr-xr-x 1 user user  100 May  3 13:58 src
-rw-r--r-- 1 user user 1409 May  3 13:58 switch.js
```


