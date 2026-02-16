import { APP_NAME, MIN_PASSWORD_LENGTH, MAX_EMAIL_LEN } from "../lib/config.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../lib/cloudinary.js";
import bcrypt from "bcrypt";
import { generateTokenAndSetCookie } from "../lib/token.js";
export const register = async (req, res) => {
	try {
		const { email, password } = req.body;
		const avatarLocalPath = req.file?.path;

		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}

		if (!password) {
			return res.status(400).json({ message: "Password is required" });
		}

		if (email.length > MAX_EMAIL_LEN) {
			return res
				.status(400)
				.json({ message: `Email must be less than ${MAX_EMAIL_LEN}` });
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			return res.status(400).json({
				message: `Password must have at least ${MIN_PASSWORD_LENGTH} characters`,
			});
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				message: "User already exists",
			});
		}
		let avatar;
		if (avatarLocalPath) {
			const uploadedAvatar = await uploadOnCloudinary(
				avatarLocalPath,
				`${APP_NAME.toLowerCase()}/avatars`,
			);
			if (!uploadedAvatar?.secure_url) {
				return res
					.status(500)
					.json({ message: "Avatar upload failed" });
			}
			avatar = {
				public_id: uploadedAvatar.public_id,
				url: uploadedAvatar.url,
			};
		} else {
			avatar = {
				public_id: null,
				url: `${process.env.BASE_URL}/default-avatar.png`,
			};
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = await User.create({
			email,
			password: hashedPassword,
			avatar,
		});

		if (!newUser) {
			return res.status(400).json({ message: "Failed to create user" });
		}

		generateTokenAndSetCookie(newUser._id, res);
		return res.status(201).json({
			_id: newUser._id,
			email: newUser.email,
			avatar: newUser.avatar,
		});
	} catch (error) {
		console.log("ERROR :: CONTROLLER :: register :: ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}

		if (!password) {
			return res.status(400).json({ message: "Password is required" });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: "User does not exist" });
		}

		const isMatch = await bcrypt.compare(password, user?.password); //boolean value
		if (!isMatch) {
			return res.status(400).json({ message: "Incorrect Password" });
		}

		generateTokenAndSetCookie(user._id, res);
		return res.status(200).json({
			_id: user._id,
			email: user.email,
			avatar: user.avatar,
		});
	} catch (error) {
		console.log("ERROR :: CONTROLLER :: login :: ", error.message);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const logout = async (req, res) => {
	try {
		res.clearCookie("jwt", { httpOnly: true, sameSite: "none" });
		return res.status(200).json({ message: "Logged out Successfully" });
	} catch (error) {
		console.log("ERROR :: CONTROLLER :: logout :: ", error.message);
		return res.status(500).json({ message: "Internal server error" });
	}
};
export const currentUser = async (req, res) => {
	try {
		return res.status(200).json(req.user);
	} catch (error) {
		console.log("ERROR :: CONTROLLER :: currentUser :: ", error.message);
		return res.status(500).json({ message: "Internal server error" });
	}
};
