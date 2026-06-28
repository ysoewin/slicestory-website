(function () {
  const pageName = location.pathname.split("/").pop() || "index.html";
  const textSelectors = [
    ".hero h1",
    ".hero .lead",
    ".feature-card h3",
    ".feature-card p",
    ".section h2",
    ".section-head p",
    ".card h3",
    ".card p",
    ".price",
    ".copy p",
    ".standout-line",
    ".footer span"
  ];
  const textStorageKey = `slice-story-edits-v6:${pageName}`;
  const imageStorageKey = `slice-story-image-edits-v2:${pageName}`;
  const editableItems = Array.from(document.querySelectorAll(textSelectors.join(",")));
  const savedText = JSON.parse(localStorage.getItem(textStorageKey) || "{}");
  const savedImages = JSON.parse(localStorage.getItem(imageStorageKey) || "{}");

  editableItems.forEach((item, index) => {
    item.dataset.editableText = String(index);
    if (savedText[index] !== undefined) item.textContent = savedText[index];
  });

  const imageItems = Array.from(document.querySelectorAll("img, .hero, .photo-panel, .ingredient-story"));
  imageItems.forEach((item, index) => {
    item.dataset.editableImage = String(index);
    if (savedImages[index]) applyImage(item, savedImages[index]);
  });

  const toolbar = document.createElement("div");
  toolbar.className = "edit-toolbar";
  toolbar.innerHTML = `
    <p class="edit-note">Preview editor. Saves in this browser only.</p>
    <button class="primary" type="button" data-action="toggle-text">Edit text</button>
    <button type="button" data-action="save-text">Save text</button>
    <button class="primary" type="button" data-action="toggle-images">Edit images</button>
    <button type="button" data-action="save-images">Save images</button>
    <button type="button" data-action="reset">Reset page</button>
  `;
  document.body.appendChild(toolbar);

  const panel = document.createElement("div");
  panel.className = "image-panel";
  panel.innerHTML = `
    <label for="image-url-input">Replace selected image</label>
    <input id="image-url-input" type="text" placeholder="Paste image URL or relative path, like images/pizza.jpg">
    <div class="image-panel-actions">
      <button class="primary" type="button" data-image-action="apply-url">Apply URL/path</button>
      <label class="file-button" for="image-file-input">Choose file</label>
      <input id="image-file-input" type="file" accept="image/*" hidden>
      <button type="button" data-image-action="close">Close</button>
    </div>
    <small>For a real website folder, put images in an images folder and use paths like images/my-photo.jpg. Choosing a file stores a preview copy in this browser.</small>
  `;
  document.body.appendChild(panel);

  const textToggleButton = toolbar.querySelector('[data-action="toggle-text"]');
  const imageToggleButton = toolbar.querySelector('[data-action="toggle-images"]');
  const imageInput = panel.querySelector("#image-url-input");
  const fileInput = panel.querySelector("#image-file-input");
  let textEditing = false;
  let imageEditing = false;
  let selectedImage = null;

  function cssUrl(value) {
    return `url("${value.replace(/"/g, "%22")}")`;
  }

  function getImageValue(item) {
    if (item.tagName === "IMG") return item.getAttribute("src") || "";
    return item.dataset.currentImage || "";
  }

  function applyImage(item, value) {
    if (!value) return;
    if (item.tagName === "IMG") {
      item.setAttribute("src", value);
      return;
    }
    if (item.classList.contains("hero")) {
      item.style.setProperty("--hero-image", cssUrl(value));
      item.dataset.currentImage = value;
      return;
    }
    if (item.classList.contains("photo-panel")) {
      item.style.setProperty("--panel-image", cssUrl(value));
      item.dataset.currentImage = value;
      return;
    }
    item.style.backgroundImage = `linear-gradient(90deg, rgba(20,18,16,.96), rgba(20,18,16,.82), rgba(20,18,16,.48)), ${cssUrl(value)}`;
    item.dataset.currentImage = value;
  }

  function setTextEditing(next) {
    textEditing = next;
    document.body.classList.toggle("editable-active", textEditing);
    editableItems.forEach((item) => {
      item.contentEditable = textEditing ? "true" : "false";
      item.spellcheck = textEditing;
    });
    textToggleButton.textContent = textEditing ? "Exit text" : "Edit text";
  }

  function setImageEditing(next) {
    imageEditing = next;
    document.body.classList.toggle("image-edit-active", imageEditing);
    imageToggleButton.textContent = imageEditing ? "Exit images" : "Edit images";
    if (!imageEditing) {
      panel.classList.remove("open");
      selectedImage = null;
    }
  }

  function saveText() {
    const data = {};
    editableItems.forEach((item) => {
      data[item.dataset.editableText] = item.textContent.trim();
    });
    localStorage.setItem(textStorageKey, JSON.stringify(data));
    setTextEditing(false);
  }

  function saveImages() {
    const data = {};
    imageItems.forEach((item) => {
      const value = getImageValue(item);
      if (value) data[item.dataset.editableImage] = value;
    });
    localStorage.setItem(imageStorageKey, JSON.stringify(data));
    setImageEditing(false);
  }

  imageItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      if (!imageEditing) return;
      event.preventDefault();
      event.stopPropagation();
      selectedImage = item;
      imageInput.value = getImageValue(item);
      panel.classList.add("open");
      imageInput.focus();
    });
  });

  toolbar.addEventListener("click", (event) => {
    const action = event.target && event.target.dataset ? event.target.dataset.action : "";
    if (action === "toggle-text") setTextEditing(!textEditing);
    if (action === "save-text") saveText();
    if (action === "toggle-images") setImageEditing(!imageEditing);
    if (action === "save-images") saveImages();
    if (action === "reset") {
      localStorage.removeItem(textStorageKey);
      localStorage.removeItem(imageStorageKey);
      location.reload();
    }
  });

  panel.addEventListener("click", (event) => {
    const action = event.target && event.target.dataset ? event.target.dataset.imageAction : "";
    if (action === "apply-url" && selectedImage) {
      applyImage(selectedImage, imageInput.value.trim());
      panel.classList.remove("open");
    }
    if (action === "close") panel.classList.remove("open");
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file || !selectedImage) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      applyImage(selectedImage, String(reader.result));
      panel.classList.remove("open");
      fileInput.value = "";
    });
    reader.readAsDataURL(file);
  });
})();
