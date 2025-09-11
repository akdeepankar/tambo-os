// Dictionary search tool for Tambo chat integration
export async function dictionarySearchTool({ word }: { word: string }) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await res.json();
    if (Array.isArray(data) && data[0]) {
      return { success: true, result: data[0] };
    } else {
      return { success: false, error: "No definition found." };
    }
  } catch (e) {
    return { success: false, error: "Error fetching definition." };
  }
}
