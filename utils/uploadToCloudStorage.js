const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = process.env.GOOGLE_CLOUD_PROJECT_ID; // Use the project ID as the bucket name

async function uploadToCloudStorage(filePath) {
  // Create a unique filename for the uploaded file
  const fileName = path.basename(filePath);
  const destination = `profile-pictures/${fileName}`; // You can customize the path as needed

  // Upload the file to the specified bucket
  await storage.bucket(bucketName).upload(filePath, {
    destination: destination,
    gzip: true,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  // Return the public URL of the uploaded file
  return `https://storage.googleapis.com/${bucketName}/${destination}`;
}

module.exports = uploadToCloudStorage;