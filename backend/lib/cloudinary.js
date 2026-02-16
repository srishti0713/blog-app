import { v2 as cloudinary } from "cloudinary";
import { APP_NAME } from "./config.js";
import fs from "fs";
export const uploadOnCloudinary = async (
	localFilePath,
	dir = APP_NAME.toLowerCase(),
) => {
	try {
		if (!localFilePath) return null;

		const response = await cloudinary.uploader.upload(localFilePath, {
			resource_type: "auto",
			folder: dir,
		});
		//console.log("DEBUG:file uploaded successfully: ", response.url);
		return response;
	} catch (error) {
		console.log("Cloudinary upload error", error.message);
		return null;
	} finally {
		fs.unlinkSync(localFilePath);
	}
};
export const deleteFromCloudinary = async (file) => {
	try {
		if (!file) return false;
		const publicId = file.public_id;
		const result = await cloudinary.uploader.destroy(publicId);
		return result.result === "ok";
	} catch (error) {
		console.log("Failed to delete image from Cloudinary: ", error);
		return false;
	}
};
