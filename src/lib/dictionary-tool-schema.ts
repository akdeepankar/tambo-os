// Dictionary tool schema for tambo
export const dictionaryToolSchema = {
  type: "object",
  properties: {
    word: { type: "string", description: "Word to look up in the dictionary." }
  },
  required: ["word"]
};
