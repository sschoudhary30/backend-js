import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
// fs(file system) is nodejs library
// fs in read, write, remove
// unlink is use to delete

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uplaodOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload file on cloudnary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded succesfull
    //console.log("file is uploaded on cloudinary", response.url);
    //console.log("file is uploaded on cloudinary full data", response);
    fs.unlinkSync(localFilePath); // use sync bcz abhi k abhi kar
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file

    return null;
  }
};

export { uplaodOnCloudinary };
