// Ensure fetch is available in Node.js
import fetch from 'node-fetch';
export interface GeminiImageEditInput {
  imageBase64: string;
  prompt: string;
  apiKey: string;
}

export async function geminiImageEdit({
  imageBase64,
  prompt,
  apiKey,
}: GeminiImageEditInput): Promise<{ data: string; mimeType: string }> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent";
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
        ],
      },
    ],
  };

  // Debug: log all request details
  console.log("Gemini API Request URL:", url);
  console.log("Gemini API Request Headers:", {
    "x-goog-api-key": apiKey,
    "Content-Type": "application/json",
  });
  console.log("Gemini API Request Body:", body);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // Debug: log response status and headers
  console.log("Gemini API Response Status:", response.status, response.statusText);
  console.log("Gemini API Response Headers:", response.headers);

  const responseText = await response.text();
  console.log("Gemini API Raw Response:", responseText);

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} | Body: ${responseText}`);
  }

  type GeminiApiResponse = {
    candidates?: Array<{
      content?: {
        parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>
      }
    }>
  };
  let result: GeminiApiResponse = {};
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse Gemini response JSON:", e);
    throw new Error("Invalid JSON response from Gemini API");
  }

  console.log("Gemini API Parsed Response:", result);
  const parts = result?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data);

  if (!imagePart) {
    throw new Error("No image data found in Gemini response | Full response: " + JSON.stringify(result));
  }

  return {
    data: imagePart.inlineData?.data ?? "",
    mimeType: imagePart.inlineData?.mimeType ?? "image/jpeg"
  };
}
