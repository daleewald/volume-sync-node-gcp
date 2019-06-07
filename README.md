# volume-sync-node-gcp

## Description
Places a watch on a directory structure, watching for additions and changes. These events will create jobs in a queue and perform uploads to, or removals from, GCP Cloud Storage.

## Requirements
Google Cloud:
1. Create a project
2. Create a Service Account with Editor access to the project and Storage Object Admin access to Cloud Storage
3. Create a Key and download the .json file for the Service Account
4. Create a Cloud Storage Bucket

Workstation:
1. Install node.js
2. Specify environment variables
  - Windows: be sure not to use quotes surrounding values.

- `GCP_PROJECT_ID` = the target Google Cloud project
- `GCP_BUCKET_NAME` = the target GCP Cloud Storage bucket, without the gs:// prefix.
- `GCP_KEY_FILE_FULL_PATH` = the full path to the .json key file for the service account.
  - If Windows enter paths with forwardslash instead of backslash. `SET GCP_KEY_FILE_FULL_PATH=c:/path/to/key.json`
- `MOUNT_SYNC_DIRECTORY` = the root directory to be watched.
  - If Windows enter paths with forwardslash instead of backslash. `SET MOUNT_SYNC_DIRECTORY=d:/mount/root`
- `INCLUDE_FILE_PATTERN` = the [anymatch](https://github.com/micromatch/anymatch) pattern relative to the `MOUNT_SYNC_DIRECTORY` that specifies the watching context of the watcher. i.e. `**/*.txt` or `DesiredSubFolder/**/*` etc.
- `EXCLUDE_FILE_PATTERN` = regex pattern or [anymatch](https://github.com/micromatch/anymatch) to be configured on the watcher to exclude files within the watching context. 
  - Example regex for MacOS Docker host; to ignore .dotfiles and files that end with `~`: `/(^|[\\/\\])\..|(\w*~(?!\S))/`
  - Simple (anymatch) example; to ignore .txt files `**/*.txt`

## Run
In the project directory, after setting environment variables:

`npm start`
