const {Storage} = require('@google-cloud/storage');

let storage, bucket;

exports.setup = function( PROJECT_ID, KEY_FILE, BUCKET_NAME ) {
    storage = new Storage({
        projectId: PROJECT_ID,
        keyFilename: KEY_FILE
    });
    bucket = storage.bucket( BUCKET_NAME );
}

exports.upload = async function( sourcePath, targetPath ) {
    return bucket.upload( sourcePath, { destination: targetPath } ).then( ( file ) => {
        console.log('Upload complete:', targetPath);
        console.log({result: 'Uploaded', file: targetPath, generation: file[0].metadata.generation});
    }).catch( ( err ) => {
        console.error( err );
    });
}

exports.remove = async function( targetPath ) {
    const file = bucket.file( targetPath );
    return file.exists().then( ( exists ) => {
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
}

exports.inventory = function() {
    return bucket.getFiles();
}