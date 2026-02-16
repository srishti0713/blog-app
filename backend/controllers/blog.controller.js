import { uploadOnCloudinary, deleteFromCloudinary } from "../lib/cloudinary.js";
import Blog from "../models/blog.model.js";
import { APP_NAME, MAX_TITLE_LEN, MAX_CONTENT_LEN } from "../lib/config.js";
export const createBlog = async (req, res) => {
	try {
		const { title, content } = req.body;
		const imageLocalPath = req.file?.path;
		if (!title) {
			return res.status(400).json({ message: "Title is required" });
		}
		if (!content) {
			return res.status(400).json({ message: "Content is required" });
		}
		if (title.length > MAX_TITLE_LEN) {
			return res
				.status(400)
				.json({
					message: `Title must be less than ${MAX_TITLE_LEN} characters`,
				});
		}
		if (content.length > MAX_CONTENT_LEN) {
			return res
				.status(400)
				.json({
					message: `Content must be less than ${MAX_CONTENT_LEN} characters`,
				});
		}

		let image = {
			public_id: null,
			url: null,
		};
		if (imageLocalPath) {
			const uploadedImage = await uploadOnCloudinary(
				imageLocalPath,
				`${APP_NAME.toLowerCase()}/avatars`,
			);
			if (!uploadedImage?.secure_url) {
				return res.status(500).json({ message: "Image upload failed" });
			}
			image = {
				public_id: uploadedImage.public_id,
				url: uploadedImage.url,
			};
		}

		const blog = await Blog.create({
			user: req.user._id,
			title,
			content,
			image,
		});
		return res.status(201).json(blog);
	} catch (error) {
		console.log("ERROR :: CONTROLLER :: createBlog :: ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const getAllBlogs = async (req, res) => {
	try {
		const blogs = await Blog.find()
			.populate("user", "email avatar")
			.sort({ createdAt: -1 }); //all blogs in desc order
		// 1-> ascending
		//-1->descending

		// if (blogs.length === 0) {
		// 	return res
		// 		.status(404)
		// 		.json({ message: "Blogs not found", blogs: [] });
		// }

		return res.status(200).json(blogs);
	} catch (error) {
		console.log("ERROR :: CONTROLLER :: getAllBlogs :: ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const getSingleBlog = async (req, res) => {
	try {
		const blog = await Blog.findById(req.params.id).populate(
			"user",
			"email avatar",
		);
		if (!blog) {
			return res.status(404).json({ message: "Blog not found" });
		}
		return res.status(200).json(blog);
	} catch (error) {
		console.log("ERROR :: CONTROLLER :: getSingleBlogs :: ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const deleteBlog = async (req, res) => {
	try {
		const blog = await Blog.findById(req.params.id);
		console.log(blog);
		if (!blog) {
			return res.status(404).json({ message: "Blog not found" });
		}
		if (blog.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Not Authorised" });
		}
		if (blog.image?.public_id) {
			await deleteFromCloudinary(blog.image);
		}
		await blog.deleteOne();
		return res.status(200).json({ message: "Deleted Successfully" });
	} catch (error) {
		console.log("ERROR :: CONTROLLER :: deleteBlog :: ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};
