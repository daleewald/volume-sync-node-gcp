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
        const result = ['Uploaded',targetPath,' => generation',file[0].metadata.generation].join(' ');
        console.log(result);
    }).catch( ( err ) => {
        console.error( err );
    });
}

exports.remove = async function( targetPath ) {
    const file = bucket.file( targetPath );
    return file.exists().then( ( exists ) => {
        let result;
        if ( exists[0] ) {
            file.delete((err, resp) => {
                if (err) {
                    throw err; //console.error( err );
                } else {
                    result = ['Deleted',targetPath].join(' ');
                }
            });
        } else {
            result = ['Did not exist to remove', targetPath].join(' ');
        }
        console.log(result);
    });
}

exports.inventory = function() {
    return bucket.getFiles();
}