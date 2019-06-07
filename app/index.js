const {Storage} = require('@google-cloud/storage');
const {default: PQueue} = require('p-queue');
const chalky = require('chokidar');

const queue = new PQueue({concurrency: 1});
queue.on('active', () => {
    console.log(`Working on queue.  Size: ${queue.size}  Pending: ${queue.pending}`);
});

const PROJECT_ID = process.env.PROJECT_ID;
const KEY_FILE = process.env.GCP_KEY_FILE_FULL_PATH;
const BUCKET_NAME = process.env.GCP_BUCKET_NAME;

const storage = new Storage({
    projectId: PROJECT_ID,
    keyFilename: KEY_FILE
});
const bucket = storage.bucket( BUCKET_NAME );

const BASE_DIR = process.env.MOUNT_SYNC_DIRECTORY;
const watchContext = ((BASE_DIR.endsWith('/') || BASE_DIR.endsWith('\\')) ? BASE_DIR : BASE_DIR + '/') + (process.env.INCLUDE_FILE_PATTERN || '');

// *.swx, *.swp
// /(^|\.\w*.)|\w*~(?!\S)/
// ignored will only match during watch init
const watcher = chalky.watch(watchContext, { 
    ignored: process.env.EXCLUDE_FILE_PATTERN,
    persistent: true,
    depth: 99,
    usePolling: true,
    interval: 1000,
    awaitWriteFinish: true
 });

 const logger = console.log.bind(console);

 watcher
 .on('error', err => logger('error:', err))
 .on('ready', path => {
     logger('Watcher ready:',watchContext);
     logger(watcher.getWatched());
     watcher.on('all', (evt, sourcePath) => {
        const targetPath = sourcePath.replace(BASE_DIR, '');
        console.log('Watch Event: ', evt, sourcePath);
         if (evt === 'addDir') {
            
         } else
         if (evt === 'unlinkDir') {
            
         } else
         if (evt === 'add' || evt === 'change') {
            (async () => {
                await queue.add(async () => {
                    await bucket.upload( sourcePath, { destination: targetPath } ).then( ( file ) => {
                        console.log('Upload complete:', targetPath);
                        console.log({result: 'Uploaded', file: targetPath, generation: file[0].metadata.generation});
                    }).catch( ( err ) => {
                        console.error( err );
                    });
                });
            })();
            
         } else
         if (evt === 'unlink') {
            (async () => {
                await queue.add(async () => {
                    
                    const file = bucket.file( targetPath );
                    file.exists().then( ( exists ) => {
                        if ( exists[0] ) {
                            file.delete((err, resp) => {
                                if (err) {
                                    console.error( err );
                                } else {
                                    console.log({result: 'Deleted', file: targetPath});
                                }
                            });
                        } else {
                            console.log(null, {result: 'Did not exist to remove', file: targetPath});
                        }
                    });

                });
            })();
         }
     });
 });