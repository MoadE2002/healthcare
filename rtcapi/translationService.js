const translate = require("@google-cloud/translate").v2;
const translator = new translate.Translate();

const translateText = async (text, targetLang) => {
  const [translation] = await translator.translate(text, targetLang);
  return translation;
};

module.exports = { translateText };
