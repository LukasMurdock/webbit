const text = document.getElementById("text");
const ws = new WebSocket("ws://localhost:8080/ws");
// if websocket is closed, add error message to the dom
ws.onclose = () => {
  const pre = document.createElement("pre");
  pre.textContent = "WebSocket disconnected";
  document.body.append(pre);
  createFieldset();
  const buttonDiv = document.getElementById("offline-buttons");
  createGetLatestButton(text, buttonDiv);
  createSaveButton(text, buttonDiv);
};
ws.onmessage = (event) => {
  text.value = event.data;
};

text.onchange = () => {
  ws.send(text.value);
};

ws.onerror = (error) => {
  const pre = document.createElement("pre");
  pre.textContent = "WebSocket error: " + JSON.stringify(error);
  document.body.append(pre);
};

function createFieldset() {
  const buttonFieldsetId = "offline-fieldset";
  const fieldset = document.getElementById(buttonFieldsetId);
  if (fieldset) {
    return fieldset;
  }
  const newFieldset = document.createElement("fieldset");
  newFieldset.id = buttonFieldsetId;
  newFieldset.style.maxWidth = "400px";

  const header = document.createElement("h2");
  header.textContent = "Offline";
  newFieldset.append(header);

  const newDiv = document.createElement("div");
  newDiv.style.display = "flex";
  newDiv.style.justifyContent = "space-between";

  newDiv.id = "offline-buttons";
  newFieldset.append(newDiv);

  document.body.append(newFieldset);
  return newFieldset;
}

function createSaveButton(text, appendTo = document.body) {
  const saveButton = document.createElement("button");
  saveButton.id = "save";
  saveButton.textContent = "Save";

  appendTo.append(saveButton);

  saveButton.onclick = () => {
    fetch("/", {
      signal: AbortSignal.timeout(5000),
      method: "POST",
      body: text.value,
    }).then(() => {
      alert("Saved!");
    }).catch((error) => {
      alert(error.message);
    });
  };
}

function createGetLatestButton(text, appendTo = document.body) {
  const getLatestButton = document.createElement("button");
  getLatestButton.id = "get-latest";
  getLatestButton.textContent = "Get latest";
  console.log("appendTo", appendTo);
  appendTo.append(getLatestButton);
  getLatestButton.onclick = async () => {
    try {
      const response = await fetch("/", {
        signal: AbortSignal.timeout(5000),
        method: "GET",
        headers: {
          "Accept": "application/octet-stream",
        },
      });
      const responseText = await response.text();
      console.log(responseText);
      text.value = responseText;
    } catch (error) {
      alert(error.message);
    }
  };
}
