// this will not work and is an attempt to access and interact with fs and ollama
// but is restricted as client call, 
// we need to refactor to server / client respobsiblities to overcome this , also as CORS

export const runCommand = async (command) => {
  console.warn("runCommand is not supported in the browser.");
  return Promise.reject("Child process commands are unavailable in the browser.");
};

export const getLocalModels = async () => {
  try {
    const output = await runCommand("ollama list");
    const listOfModels = output.split("\n").filter((line) => line.trim() !== "");
    console.log('list of models', listOfModels)
    return listOfModels
  } catch (error) {
    console.error("Error fetching local models:", error);
    return [];
  }
};

export const downloadModel = async (modelName) => {
  try {
    const output = await runCommand(`ollama pull ${modelName}`);
    console.log(`"${modelName}" downloaded successfully.`);
    return output;
  } catch (error) {
    console.error(`err downloading model "${modelName}":`, error);
    throw error;
  }
};

export const ensureModelAvailable = async (modelName) => {
  const localModels = await getLocalModels();
  if (localModels.includes(modelName)) {
    console.log(`"${modelName}" is available locally`);
    return true;
  }

  //attempt new confirm()
  const userConfirmed = confirm(`Model "${modelName}" is not available locally. Downloading it??`);
  if (userConfirmed) {
    try {
      await downloadModel(modelName);
      alert(`"${modelName}" downloaded successfully.`);
      return true;
    } catch (error) {
      alert(`fail to download model "${modelName}".`);
    }
  }

  return false;
};
