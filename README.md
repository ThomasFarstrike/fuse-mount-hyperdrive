This is a quick-and-dirty proof-of-concept of mounting a hyperdrive to a local folder.
It uses the awesome https://github.com/fuse-friends/fuse-native

Supports:
- creating files
- reading files
- writing files
- removing files
- creating directories (including empty ones)
- listing directories

TODO:
- add symlink support

Author: Thomas Farstrike <thomasverstreken@protonmail.com>
Copyleft 2024

== Usage ==

Usage: node cacheDir mountDir [driveKeyHex]

Example: node cache1 mnt1 // to create a new writable hyperdrive, cached in cache1/ and mounted at mnt1/

Example: node cache2 mnt2 4b3278fc44e9716c0342715f42e314050a3c825a51056ac53ee8170986a8bb86 // to mount an existing hyperdrive in read-only mode at mnt2/

NOTE: storageDir and mountDir will be created if they don't exist.

