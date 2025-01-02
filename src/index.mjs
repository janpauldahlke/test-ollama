import ollama from 'ollama';
//import { ensureModelAvailable, getLocalModels} from "./modelManager.js";

const ROLE = 'user'
const MODEL = 'llama3.1'

const prevQuestions = []
let lastQuestion = ''
let isProcessing = false; 

const main = async () => {

  //getLocalModels();
  //registerModelSelectionEvent();
  registerTextAreaEvent();
};

const registerTextAreaEvent = () => {
  const textarea = document.querySelector("textarea");
  if (!textarea) {
    console.error("No textarea element found");
    return;
  }

  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
  
      const question = getTextBoxContent();
      const model = getSelectedModel();
  
      if (!question || question === lastQuestion) return;
  
      lastQuestion = question;
      prevQuestions.push(question);
      renderPrevQuestionsIntoSideBox();
      handleAskChat(question, model);
    }
  });
}

const getTextBoxContent = () => { 
  const box = document.querySelector("textarea")
  if (!box) return null
  return box.value.trim()
}

const renderPrevQuestionsIntoSideBox = () => {
  const list = document.querySelector("ul");
  if (!list) return;

  const lastQuestion = prevQuestions[prevQuestions.length - 1];
  if (!lastQuestion) return;


  const newItem = document.createElement("li");
  const model = getSelectedModel(); 
  newItem.textContent = `${model}:: ${lastQuestion}`;


  newItem.addEventListener("click", () => {
    const textarea = document.querySelector("textarea");
    if (textarea) {
      
      const [oldQuestionModel, ...oldQuestionParts] = newItem.textContent.split("::");
      const question = oldQuestionParts.join("::").trim();

      
      textarea.value = question;
      selectModel(oldQuestionModel.trim())
      //trigger new /old question
      handleAskChat(question, oldQuestionModel.trim());
    }
  });

  list.appendChild(newItem);
};


const renderFormattedResponse = (responseContent) => {
  const renderTarget = document.querySelector(".answer span");
  if (!renderTarget) {
    return;
  }
  const paragraphs = responseContent.split("\n\n");
  const formattedContent = paragraphs.map((para) => {
    if (para.trim().startsWith("1.")) {
  
      const listItems = para.split("\n").map((line) => {
        const itemText = line.replace(/^\d+\.\s*/, "");
        return `<li>${itemText}</li>`;
      });
      return `<ol>${listItems.join("")}</ol>`;
    }
    return `<p>${para}</p>`; 
  });

  renderTarget.innerHTML = formattedContent.join("");
};

const getSelectedModel = () => {
  const selectedRadio = document.querySelector("input[name='model']:checked");
  return selectedRadio ? selectedRadio.id : MODEL;
};

const toggleModelSelection = (disabled) => {
  const radios = document.querySelectorAll("input[name='model']");
  radios.forEach((radio) => (radio.disabled = disabled));
};

const selectModel = (modelId) => {
  const allRadios = document.querySelectorAll("input[name='model']");
  allRadios.forEach((radio) => {
    radio.checked = radio.id === modelId;
  });
};

const askChat = async (question, model) => { 
  
  console.log('askChat with', model, question)

  try {
    return await ollama.chat({
      model,
      messages: [{
        role: ROLE,
        content: question
      }],
    });
  } catch (e) { 
    console.error('Error in askChat:', error);
    throw error;
  }
}

const showError = (message) => {
  let errorSpan = document.querySelector("#error-message");

  if (!errorSpan) {
    errorSpan = document.createElement("span");
    errorSpan.id = "error-message";
    errorSpan.style.color = "red";
    errorSpan.style.display = "block";
    errorSpan.style.margin = "10px 0";
    document.body.prepend(errorSpan);
  }

  errorSpan.textContent = message;
  setTimeout(() => {
    errorSpan.textContent = "";
  }, 3000);
};


const handleAskChat = async (question, model) => {
  if (isProcessing) return; 
  try {
    isProcessing = true;
    const textarea = document.querySelector("textarea");
    if (textarea) textarea.disabled = true;
    toggleModelSelection(true)

    const response = await askChat(question, model);
    if (!response) {
      console.log("No response received.");
      return;
    }

    renderFormattedResponse(response.message.content);
  } catch (e) {
    console.error("Error during chat:", e);
    showError(e)
    
  } finally {
    isProcessing = false;
    const textarea = document.querySelector("textarea");
    if (textarea) textarea.disabled = false;
    toggleModelSelection(false)
  }
}

//we can not in the client!!
//need to move to express or other server tech here
const registerModelSelectionEvent = () => {
  const modelRadios = document.querySelectorAll("input[name='model']");

  modelRadios.forEach((radio) => {
    radio.addEventListener("change", async (event) => {
      const selectedModel = event.target.id;
      console.log(`Model "${selectedModel}" selected.`);
      
      const isAvailable = await ensureModelAvailable(selectedModel);
      if (!isAvailable) {
        console.log(`Model "${selectedModel}" is not available.`);
      }
    });
  });
};

main();