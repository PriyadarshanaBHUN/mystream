// ===== Component loader =====
function loadComponent(id, path, callback) {
  fetch(path)
    .then(res => res.text())
    .then(data => {
      document.getElementById(id).innerHTML = data;
      if (callback) callback();

      // Special handling for navbar
      if (id === "navbar") {
        adjustForFixedNavbar();
        // Keep visual "scrolled"
        setupNavbarScrollEffect();
      }
    })
    .catch(err => console.error(`Error loading ${path}:`, err));
}

let navPath = "navbar.html";
let footerPath = "footer.html";

const inPages = window.location.pathname.includes("/pages/");
if (inPages) {
  navPath = "../navbar.html";
  footerPath = "../footer.html";
}

loadComponent("navbar", navPath, () => {

  document.querySelectorAll(".nav-links a").forEach(link => {
    let href = link.getAttribute("href");
    if (inPages && !href.startsWith("../")) {
      link.setAttribute("href", "../" + href);
    }
  });
});
loadComponent("footer", footerPath, () => {

  document.querySelectorAll(".footer-links a").forEach(link => {
    let href = link.getAttribute("href");
    if (inPages && !href.startsWith("../")) {
      link.setAttribute("href", "../" + href);
    }
  });
});


// ===== Adjust body padding for fixed navbar =====
function adjustForFixedNavbar() {
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  const setPad = () => {
    document.body.style.paddingTop = nav.offsetHeight + "px";
  };
  setPad();
  // Recalc on resize and after fonts load
  window.addEventListener("resize", setPad, { passive: true });
  window.addEventListener("load", setPad);
}

// ===== Optional visual only: add/remove .scrolled (navbar never hides) =====
function setupNavbarScrollEffect() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;
  const onScroll = () => {
    if (window.scrollY > 0) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // Run once
}

// ===== OMDb API Key =====
const API_KEY = "d5b4f94";

// ===== Search Function =====
async function searchOMDb(inputId, resultsId, type) {
  const query = document.getElementById(inputId).value.trim();
  const resultsDiv = document.getElementById(resultsId);
  if (!query) return;
  resultsDiv.innerHTML = '<p class="loading">Loading...</p>';

  try {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=${type}`);
    const data = await res.json();
    resultsDiv.innerHTML = "";

    if (data.Search) {
      for (const item of data.Search) {
        const detailsRes = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${item.imdbID}&plot=full`);
        const details = await detailsRes.json();

        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
          <div class="poster">
            <img src="${details.Poster !== 'N/A' ? details.Poster : 'https://via.placeholder.com/300x450'}" alt="${details.Title}">
          </div>
          <div class="info">
            <h3>${details.Title}</h3>
            <p><strong>Year:</strong> ${details.Year}</p>
            <p><strong>Genre:</strong> ${details.Genre}</p>
            <p><strong>Rating:</strong> ${details.imdbRating}</p>
            <p class="truncate">${details.Plot}</p>
            <div class="btn-row">
              <button class="download-btn" onclick="downloadInfo('${escapeAttr(details.Title)}', '${escapeAttr(details.Year)}', '${escapeAttr(details.Genre)}', '${escapeAttr(details.imdbRating)}', '${escapeAttr(details.Plot)}')">Download Info</button>
              <button class="download-btn" onclick="downloadPoster('${details.Poster !== 'N/A' ? details.Poster : 'https://via.placeholder.com/300x450'}', '${escapeAttr(details.Title)}')">Download Poster</button>
              <button class="download-btn" onclick="downloadMovie()">Download Movie</button>
              <button class="show-summary-btn" onclick="displaySummary('${details.Plot}')">Show Summary</button>
            </div>
          </div>
        `;
        resultsDiv.appendChild(card);
      }
    } else {
      resultsDiv.innerHTML = "<p>No results found.</p>";
    }
  } catch (err) {
    resultsDiv.innerHTML = "<p>Error fetching data.</p>";
    console.error("Error fetching OMDb data:", err);
  }
}

// Display Summary
function displaySummary(summary) {
  alert(summary); // You can replace this with your custom modal or display logic
}

// Small helper to avoid quotes issues in inline handlers
function escapeAttr(s){ return String(s ?? '').replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

// Download Info
function downloadInfo(title, year, genre, rating, plot) {
  const blob = new Blob([`Title: ${title}\nYear: ${year}\nGenre: ${genre}\nRating: ${rating}\nPlot: ${plot}`], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title}.txt`;
  a.click();
}

// Download Poster
function downloadPoster(poster, title) {
  const a = document.createElement("a");
  a.href = poster;
  a.download = `${title}-poster.jpg`;
  a.click();
}

// Download Movie Link
function downloadMovie() {
  window.open("https://archive.org/details/@udara_nuwan/collections", "_blank");
}

// ===== Featured Section =====
async function loadFeatured(list, containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  for (const title of list) {
    await searchOMDbFeatured(title, container, type);
  }
}

async function searchOMDbFeatured(title, container, type) {
  try {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(title)}&type=${type}&plot=full`);
    const data = await res.json();
    if (data.Title) {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <div class="poster">
          <img src="${data.Poster !== 'N/A' ? data.Poster : 'https://via.placeholder.com/300x450'}" alt="${data.Title}">
        </div>
        <div class="info">
          <h3>${data.Title}</h3>
          <p><strong>Year:</strong> ${data.Year}</p>
          <p><strong>Genre:</strong> ${data.Genre}</p>
          <p><strong>Rating:</strong> ${data.imdbRating}</p>
          <div class="btn-row">
            <button class="download-btn" onclick="downloadMovie()">Download Movie</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    }
  } catch (err) {
    console.error("Error fetching featured data:", err);
  }
}
