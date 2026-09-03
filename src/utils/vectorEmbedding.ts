import "dotenv/config";
import axios from "axios";
import { ApiError } from "./ApiError.js";

const getVectorEmbedding = async (searchQuery: string) => {
  try {
    const response = await axios.post(process.env.AI_API_URL as string, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: `${searchQuery}`,
      }),
    });

    if (response.status !== 200) {
      console.error("Error in AI service:", response.status, response.data);
      throw new ApiError(
        response.status,
        "AI_SERVICE_ERROR",
        "Unknown error occured in AI service"
      );
    }
    return response.data;
  } catch (error) {
    console.error("Error in AI service:", error);
    throw error;
  }
};

export default getVectorEmbedding;
