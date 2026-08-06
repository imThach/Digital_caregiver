import { v2 as cloudinary } from 'cloudinary';

const hasCloudinaryConfig =
    Boolean(process.env.CLOUDINARY_URL) ||
    (Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
        Boolean(process.env.CLOUDINARY_API_KEY) &&
        Boolean(process.env.CLOUDINARY_API_SECRET));

if (hasCloudinaryConfig && !process.env.CLOUDINARY_URL) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export const uploadImageBuffer = (buffer, folder) => {
    if (!hasCloudinaryConfig) {
        throw new Error('Cloudinary is not configured.');
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [{ width: 800, height: 800, crop: 'limit' }],
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            },
        );

        stream.end(buffer);
    });
};

export default cloudinary;
