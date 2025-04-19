import Review from "../../models/review.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { Astrologer } from "../../models/astrologer.model.js";

export const addReview = async (req, res) => {
  try {
    const { astrologerId, userId, comment, rating } = req.body;
    console.log({ astrologerId, userId, comment, rating });
    // Validation for required fields
    if (!astrologerId || !userId || !comment || rating == null) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "All fields (astrologerId, userId, comment, rating) are required."
          )
        );
    }

    // Check if the astrologer exists
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Astrologer not found."));
    }

    // Create and save the new review
    const review = new Review({ astrologerId, userId, comment, rating });
    await review.save();
    // Update astrologer's average rating and total ratings count
    const updatedAstrologer = await Astrologer.updateAverageRating(
      astrologerId,
      rating
    );

    if (!updatedAstrologer) {
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Error updating astrologer rating."));
    }

    return res
      .status(201)
      .json(new ApiResponse(201, review, "Review added successfully."));
  } catch (error) {
    console.error("Error adding review:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, {}, "An error occurred while adding the review.")
      );
  }
};
