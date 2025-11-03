"use client";

// Central configuration file for Tambo components and tools
// Read more about Tambo at https://tambo.co/docs

import { TamboComponent, TamboTool } from "@tambo-ai/react";

import { searchMusicSchema } from "@/lib/types";
import { searchMusic } from "@/services/music-search";
import { geminiImageEdit } from "@/services/gemini-image-edit";
import { imageSearch } from "@/services/image-search";
import { SongDisplay, songDisplaySchema } from "@/components/ui/SongDisplay";
import Dictionary from "@/components/ui/Dictionary";
import { PhotoEditorChat } from "@/components/ui/PhotoEditorChat";
import { photoEditorChatSchema } from "@/components/ui/photoEditorChatSchema";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { searchPlaceClient } from "@/services/search-place";
import { directionsTool } from "@/services/directions";
import { calendarControlTool } from "@/services/calendar-control";
import { dictionarySearchTool } from "@/services/dictionary-search";
import { dictionaryToolSchema } from "@/lib/dictionary-tool-schema";


export const tools: TamboTool[] = [
  {
    name: "dictionarySearchTool",
    description: "Search for word definitions using the dictionary API.",
    tool: dictionarySearchTool,
    toolSchema: dictionaryToolSchema
  },
  {
    name: "geminiImageEdit",
    description: "Edit an image using Gemini AI based on a text prompt. Requires image as base64 and a prompt.",
    tool: geminiImageEdit,
    toolSchema: {
      type: "object",
      properties: {
        imageBase64: { type: "string", description: "Base64-encoded image data (JPEG)" },
        prompt: { type: "string", description: "Text prompt for Gemini image editing" },
        apiKey: { type: "string", description: "Gemini API Key" }
      },
      required: ["imageBase64", "prompt", "apiKey"]
    },
  },
  {
    name: "searchMusic",
    description:
      "Searches for music by song title, artist name, or any music-related query.",
    tool: searchMusic,
    toolSchema: searchMusicSchema,
  },
  {
    name: "searchPlaceClient",
    description: "Searches for a place using Google Maps JS API and returns its latitude, longitude, and address.",
    tool: searchPlaceClient,
    toolSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Location or place to search for." }
      },
      required: ["query"]
    }
  },
  {
    name: "directionsTool",
    description: "Get directions between two places using Google Maps Directions API. Returns route, polyline, and legs.",
    tool: directionsTool,
    toolSchema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "Origin place name or address." },
        destination: { type: "string", description: "Destination place name or address." },
        travelMode: { type: "string", enum: ["DRIVING", "WALKING", "BICYCLING", "TRANSIT"], description: "Travel mode." }
      },
      required: ["origin", "destination"]
    }
  },
  {
    name: "calendarControlTool",
    description: "Control the calendar UI: set month/year, highlight dates, and add events.",
    tool: calendarControlTool,
    toolSchema: {
      type: "object",
      properties: {
        year: { type: "number", description: "Year to display." },
        month: { type: "number", description: "Month to display (0=Jan, 11=Dec)." },
        highlightDates: { type: "array", items: { type: "string" }, description: "Array of YYYY-MM-DD dates to highlight." },
        addEvent: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date to add event to (YYYY-MM-DD)." },
            event: { type: "string", description: "Event description." }
          },
          required: ["date", "event"],
          description: "Add an event to a particular date."
        },
        removeEvent: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date to remove event from (YYYY-MM-DD)." },
            event: { type: "string", description: "Event description to remove." }
          },
          required: ["date", "event"],
          description: "Remove an event from a particular date."
        }
      }
    }
  },
  {
    name: "imageSearch",
    description: "Search for images using Unsplash (returns up to 6 results).",
    tool: imageSearch,
    toolSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for images." },
        apiKey: { type: "string", description: "Optional Unsplash API key override." },
      },
      required: ["query"],
    },
  },
// ...existing code...
];


export const components: TamboComponent[] = [
  {
    name: "Dictionary",
    description: "Display word definitions with phonetics, parts of speech, and examples.",
    component: Dictionary,
    propsSchema: {
      type: "object",
      properties: {
        definition: { type: "object" }
      }
    }
  },
  {
    name: "SongDisplay",
    description: "Display an array of songs without playing them. Shows title, artist, album, duration, cover art for each song. Optional title header. Size options: small/medium/large. Can hide duration or external link.",
    component: SongDisplay,
    propsSchema: songDisplaySchema
  },
  {
    name: "PhotoEditorChat",
    description: "Edit a photo with brightness, contrast, saturation, blur, hue, grayscale, sepia, and invert controls. Shows edit history and allows sending the edited image to chat. Change the canvas background color.",
    component: PhotoEditorChat,
    propsSchema: photoEditorChatSchema
  },
  {
    name: "ImageGallery",
    description: "Display a 3x2 gallery of images for a search query (uses Unsplash).",
    component: ImageGallery,
    propsSchema: {
      type: "object",
      properties: {
        query: { type: "string" }
      },
      required: ["query"]
    }
  },

];
