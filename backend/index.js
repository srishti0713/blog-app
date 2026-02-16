import "./env/env.js";
import app from "./app.js";
import connectDB from "./lib/db.js";
import { v2 as cloudinary } from "cloudinary";

const PORT = process.env.PORT || 8000;

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectDB()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	})
	.catch((error) => {
		console.log("Failed to start the server", error);
	});
