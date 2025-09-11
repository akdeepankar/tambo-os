
export interface Definition {
  word: string;
  phonetic?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{ definition: string; example?: string }>;
  }>;
}

const Dictionary: React.FC<{ definition: Definition | null }> = ({ definition }) => {
  if (!definition || !definition.meanings || !Array.isArray(definition.meanings)) return null;
  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-gradient-to-br from-white via-blue-50/60 to-gray-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
      <div className="mb-4 p-4 rounded-xl bg-white dark:bg-gray-900 shadow border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
        <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{definition.word}</span>
        {definition.phonetic && <span className="text-lg text-gray-500">/{definition.phonetic}/</span>}
      </div>
      {definition.meanings.map((meaning, i) => (
        <div key={i} className="mt-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 via-white to-gray-100 dark:from-blue-900/10 dark:via-gray-900 dark:to-gray-800 shadow border border-gray-100 dark:border-gray-800">
          <div className="font-semibold text-blue-700 dark:text-blue-300 mb-2 text-lg">{meaning.partOfSpeech}</div>
          {Array.isArray(meaning.definitions) && meaning.definitions.map((def, j) => (
            <div key={j} className="mb-3 last:mb-0 px-4 py-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-800 transition-all duration-200">
              <div className="text-base">{def.definition}</div>
              {def.example && <div className="text-gray-500 mt-1 text-sm">Example: {def.example}</div>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
export default Dictionary;
