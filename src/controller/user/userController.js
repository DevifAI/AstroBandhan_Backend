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