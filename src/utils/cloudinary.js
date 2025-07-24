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

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  // Example URL: http://res.cloudinary.com/cloud-name/image/upload/v1629869897/folder/public_id.jpg
  // We need to extract "folder/public_id"
  const urlSegments = url.split("/");
  const uploadIndex = urlSegments.indexOf("upload");
  if (uploadIndex === -1) return null;

  // Get the part after 'v<version_number>'
  const publicIdWithFormat = urlSegments.slice(uploadIndex + 2).join("/");

  // Remove the file extension
  const publicId = publicIdWithFormat.substring(
    0,
    publicIdWithFormat.lastIndexOf(".")
  );
  return publicId;
};

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

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) {
      console.error("Cloudinary deletion failed: No public ID provided.");
      return null;
    }
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log("Asset deleted successfully from Cloudinary:", result);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return null;
  }
};

export { uplaodOnCloudinary, deleteFromCloudinary, getPublicIdFromUrl };
