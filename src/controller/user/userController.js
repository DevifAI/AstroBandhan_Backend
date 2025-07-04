export const registerUser = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      gender,
      password,
      photo,
    } = req.body;

    // Check for required fields (all except photo)
    if (
      !name ||
      !email ||
      !phone ||
      !dateOfBirth ||
      !timeOfBirth ||
      !placeOfBirth ||
      !gender ||
      !password
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, "All fields except photo are required.")
        );
    }

    if (!validatePhoneNumber(phone)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid phone number format."));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(201)
        .json(new ApiResponse(400, null, "User already registered"));
    }
    const existingAstrologer = await Astrologer.findOne({ phone });
    if (existingAstrologer) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            201,
            null,
            "This number is already used by an astrologer"
          )
        );
    }
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Upload new avatar to Cloudinary
    let avatarUrl = photo;

    // Create new user
    const newUser = await User.create({
      name,
      email,
      phone,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      gender,
      photo: req.body.photo ? avatarUrl : "", // Save photo URL directly
      password: hashedPassword,
    });

    // Generate tokens
    const accessToken = newUser.generateAccessToken();
    const refreshToken = newUser.generateRefreshToken();

    // Save refresh token
    newUser.refreshToken = refreshToken;
    await newUser.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
          user: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            dateOfBirth: newUser.dateOfBirth,
            timeOfBirth: newUser.timeOfBirth,
            placeOfBirth: newUser.placeOfBirth,
            gender: newUser.gender,
            phone: newUser.phone,
            walletBalance: newUser.walletBalance,
            Free_Chat_Available: newUser.Free_Chat_Available,
            followed_astrologers: newUser.followed_astrologers,
            consultations: newUser.consultations,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
            __v: newUser.__v,
            photo: newUser.photo,
          },
        },
        "User registered successfully."
      )
    );
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "Something went wrong. Please try again.")
      );
  }
});


export const updateUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    // Ensure phone number is not updated
    if (updates.phone) {
      return res
        .status(400)
        .json({ message: "Phone number cannot be updated." });
    }

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the updates follow the schema's validation rules
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User updated successfully."));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(new ApiResponse(500, {}, "Server error. Please try again later."));
  }
};



export const deleteUserById = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "User not found."));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "User deleted successfully."));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "Server error. Please try again later.")
      );
  }
}); // this will modify in future