const shortenBtn = document.getElementById("shortenBtn");

const urlInput = document.getElementById("urlInput");

const shortCodeInput =
  document.getElementById("shortCodeInput");

const result = document.getElementById("result");

const urlList = document.getElementById("urlList");

// Handle clicks via event delegation: Edit toggle and Save
urlList.addEventListener("click", async (e) => {
  const item = e.target.closest(".url-item");
  if (!item) return;

  // Toggle editor
  if (e.target.classList.contains("edit-btn")) {
    const editor = item.querySelector(".edit");
    if (editor) editor.classList.toggle("hidden");
    return;
  }

  // Save edits
  if (e.target.classList.contains("save-btn")) {
    const id = item?.dataset?.id;
    if (!id) return;
    const editUrl = item.querySelector(".edit-url")?.value || "";
    const editCode = item.querySelector(".edit-code")?.value || "";

    const payload = {};
    if (editUrl.trim() !== "") payload.url = editUrl.trim();
    if (editCode.trim() !== "") payload.shortCode = editCode.trim();

    const statusEl = item.querySelector(".save-status");

    if (Object.keys(payload).length === 0) {
      statusEl.textContent = "Nothing to update";
      return;
    }

    statusEl.textContent = "Saving...";

    try {
      const resp = await fetch(`/api/urls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();

      if (!resp.ok) {
        statusEl.textContent = data?.error || "Update failed";
        return;
      }

      statusEl.textContent = "Saved";
      await loadUrls();
    } catch (err) {
      statusEl.textContent = "Network error";
    }
  }
});

// CREATE SHORT URL
shortenBtn.addEventListener("click", async () => {

  const url = urlInput.value;

  const shortCode = shortCodeInput.value;

  const response = await fetch("/shorten", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      url,
      shortCode
    })
  });

  const data = await response.json();

  if (data.error) {

    result.innerHTML = `
      <p>${data.error}</p>
    `;

    return;
  }

  result.innerHTML = `
    <a href="${data.shortUrl}" target="_blank">
      ${data.shortUrl}
    </a>
  `;

  loadUrls();
});

// LOAD ALL URLS
async function loadUrls() {

  const response = await fetch("/api/urls");

  const urls = await response.json();

  urlList.innerHTML = "";

  urls.forEach(url => {

    urlList.innerHTML += `
      <div class="url-item" data-id="${url.id}">
        <p>
          <strong>Short:</strong>
          <a href="/${url.short_code}" target="_blank">
            ${url.short_code}
          </a>
        </p>

        <p>
          <strong>Original:</strong>
          ${url.original_url}
        </p>

        <p>
          <strong>Clicks:</strong>
          ${url.clicks}
        </p>

        <button class="edit-btn">Edit</button>

        <div class="edit hidden">
          <input type="text" class="edit-url" placeholder="New URL" value="${url.original_url}">
          <input type="text" class="edit-code" placeholder="New short code" value="${url.short_code}">
          <button class="save-btn">Save</button>
          <span class="save-status"></span>
        </div>
      </div>
    `;
  });
}

loadUrls();
