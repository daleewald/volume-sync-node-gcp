const {default: PQueue} = require('p-queue');
const chalky = require('chokidar');
const inventory = require('./inventory');
const gcp = require('./gcp');

const queue = new PQueue({concurrency: 3});
queue.on('active', () => {
    console.log(`Working on queue.  Size: ${queue.size}  Pending: ${queue.pending}`);
});

const PROJECT_ID = process.env.PROJECT_ID;
const KEY_FILE = process.env.GCP_KEY_FILE_FULL_PATH;
const BUCKET_NAME = process.env.GCP_BUCKET_NAME;

gcp.setup(PROJECT_ID, KEY_FILE, BUCKET_NAME);

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
    awaitWriteFinish: true
 });

 const logger = console.log.bind(console);

 watcher
 .on('error', err => logger('error:', err))
 .on('ready', path => {
    logger('Watcher ready:',watchContext);
    const collection = watcher.getWatched();
     
    const inv = inventory.getInventory(collection, BASE_DIR);
    logger('Number of items in Local inventory:', inv.length);
    (async () => {
        const [bucket_inv] = await gcp.inventory();

        logger('Number of items in Bucket inventory:', bucket_inv.length);

        // Test local inventory for new or modified vs. bucket version.
        inv.forEach( ( localfile ) => {
            if (localfile.path !== undefined) {
                const localtime = new Date(localfile.mtime).getTime();
                const remotefile = bucket_inv.find( ( bucketfile ) => {
                    return bucketfile.name === localfile.path;
                });
                if (remotefile === undefined) {
                    (async () => {
                        console.log('Queue new file:',localfile.path);
                        await queue.add(async () => await gcp.upload(localfile.fullpath, localfile.path));
                    })();
                } else {
                    const remotetime = new Date(remotefile.metadata.updated).getTime();
                    const timediff = localtime - remotetime;
                    if (timediff > 0) {
                        (async () => {
                            console.log('Queue modified file:',localfile.path);
                            await queue.add(async () => await gcp.upload(localfile.fullpath, remotefile.name));
                        })();
                    }
                }
            }
        });
    })();
    
     watcher.on('all', (evt, sourcePath) => {
        const targetPath = sourcePath.replace(BASE_DIR, '');
        console.log('Watch Event: ', evt, sourcePath);
         if (evt === 'addDir') {
            
         } else
         if (evt === 'unlinkDir') {
            
         } else
         if (evt === 'add' || evt === 'change') {
            (async () => {
                await queue.add(async () => await gcp.upload(sourcePath, targetPath));
            })();
            
         } else
         if (evt === 'unlink') {
            (async () => {
                await queue.add(async () => gcp.remove( targetPath ));
            })();
         }
     });
 });