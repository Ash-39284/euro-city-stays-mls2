// google maps API key
// AIzaSyAJoOGB75_bpzjqUae_aj1kBl_JIZJdu4I

let map;
let poiMarkers = [];

/* ===============================
   BOOT (runs on ALL pages safely)
================================ */
window.addEventListener("load", async () => {
  // Home/search submit setup
  setupSearchRedirect();

  // Guests dropdown setup (home page)
  setupGuestsDropdown();

  // Destinations map setup
  if (window.google?.maps && document.getElementById("map")) {
    await initMap();
  }
});

/* ===============================
   SEARCH REDIRECT (index.html)
================================ */
function setupSearchRedirect() {
  const form = document.getElementById("searchForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const city = document.getElementById("destination")?.value?.trim().toLowerCase();
    const adults = parseInt(document.getElementById("adultsCount")?.value || "1", 10);

    if (!city) return alert("Please select a city");
    if (adults < 1) return alert("At least 1 adult is required");

    window.location.href = `destinations.html?city=${encodeURIComponent(city)}`;
  });
}

/* ===============================
   INIT MAP (destinations.html only)
================================ */
async function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  await google.maps.importLibrary("maps");
  await google.maps.importLibrary("places");

  map = new google.maps.Map(mapEl, {
    center: { lat: 50.8503, lng: 4.3517 },
    zoom: 5,
  });

  attachCardClickHandlers();
  await hydrateCityImages();
  autoOpenCityFromSearch();
}

/* ===============================
   CARD CLICK HANDLING
================================ */
function attachCardClickHandlers() {
  document.querySelectorAll(".place-card").forEach((card) => {
    card.addEventListener("click", () => openCard(card, "tourist_attraction"));
  });

  // Prevent card-click when pressing buttons inside the card
  document.querySelectorAll(".place-card button").forEach((btn) => {
    btn.addEventListener("click", (e) => e.stopPropagation());
  });
}

/* ===============================
   AUTO-OPEN CITY FROM URL
   destinations.html?city=paris
================================ */
function autoOpenCityFromSearch() {
  const params = new URLSearchParams(window.location.search);
  const city = params.get("city");
  if (!city) return;

  const card = document.querySelector(`.place-card[data-city="${city.toLowerCase()}"]`);
  if (!card) return;

  card.scrollIntoView({ behavior: "smooth", block: "center" });
  openCard(card, "tourist_attraction");
}

/* ===============================
   OPEN CARD (collapse + zoom + load)
================================ */
async function openCard(card, type) {
  collapseAllCards(card);

  const lat = parseFloat(card.dataset.lat);
  const lng = parseFloat(card.dataset.lng);

  map.panTo({ lat, lng });
  map.setZoom(12);

  await fetchPOIs(card, type);
}

/* ===============================
   COLLAPSE OTHER CARDS
================================ */
function collapseAllCards(activeCard) {
  document.querySelectorAll(".place-card").forEach((card) => {
    const list = card.querySelector(".poi-results");
    if (!list) return;

    if (card === activeCard) {
      list.classList.add("show");
    } else {
      list.classList.remove("show");
      list.innerHTML = "";
    }
  });
}

/* ===============================
   FETCH POIs + MARKERS
================================ */
async function fetchPOIs(card, type) {
  const lat = parseFloat(card.dataset.lat);
  const lng = parseFloat(card.dataset.lng);
  const list = card.querySelector(".poi-results");
  if (!list) return;

  clearPoiMarkers();
  list.classList.add("show");
  list.innerHTML = `<li class="text-muted">Loading...</li>`;

  try {
    const { places } = await google.maps.places.Place.searchNearby({
      locationRestriction: { center: { lat, lng }, radius: 3000 },
      includedTypes: [type],
      maxResultCount: 6,
      fields: ["displayName", "rating", "photos", "location"],
    });

    list.innerHTML = "";

    if (!places?.length) {
      list.innerHTML = `<li class="text-muted">No places found</li>`;
      return;
    }

    const info = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();

    places.forEach((place, index) => {
      const photoUrl = place.photos?.length
        ? place.photos[0].getURI({ maxWidth: 220, maxHeight: 160 })
        : null;

      // --- LIST UI ---
      const li = document.createElement("li");
      li.className = "mb-2";
      li.innerHTML = `
        <div class="poi-card">
          ${photoUrl ? `<img src="${photoUrl}" class="poi-photo" alt="${place.displayName}">` : ""}
          <div class="w-100">
            <div class="poi-header">
              <span class="poi-name">${index + 1}. ${place.displayName}</span>
              ${place.rating ? `<span class="poi-rating">⭐ ${place.rating}</span>` : ""}
            </div>
            <div class="poi-type">${formatType(type)}</div>
          </div>
        </div>
      `;

      li.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!place.location) return;
        map.panTo(place.location);
        map.setZoom(15);
      });

      list.appendChild(li);

      // --- MARKER ---
      if (place.location) {
        bounds.extend(place.location);

        const marker = new google.maps.Marker({
          map,
          position: place.location,
          title: place.displayName,
          label: `${index + 1}`,
        });

        marker.addListener("click", () => {
          info.setContent(`
            <div style="min-width:180px">
              <strong>${place.displayName}</strong><br/>
              ${place.rating ? `⭐ ${place.rating}` : "No rating"}<br/>
              <small>${formatType(type)}</small>
            </div>
          `);
          info.open({ map, anchor: marker });
        });

        poiMarkers.push(marker);
      }
    });

    // Fit markers
    if (poiMarkers.length >= 2) {
      map.fitBounds(bounds);
    } else {
      map.setZoom(13);
    }
  } catch (err) {
    console.error("Places error:", err);
    list.innerHTML = `<li class="text-danger">Error loading places</li>`;
  }
}

function clearPoiMarkers() {
  poiMarkers.forEach((m) => m.setMap(null));
  poiMarkers = [];
}

/* ===============================
   CITY CARD IMAGES (Places Photos)
================================ */
async function hydrateCityImages() {
  const cards = document.querySelectorAll(".place-card");

  for (const card of cards) {
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);

    const img = card.querySelector("img.place-photo");
    if (!img || !lat || !lng) continue;

    if (img.getAttribute("src")) continue; // keep existing images

    try {
      const { places } = await google.maps.places.Place.searchNearby({
        locationRestriction: { center: { lat, lng }, radius: 5000 },
        includedTypes: ["tourist_attraction"],
        maxResultCount: 1,
        fields: ["photos"],
      });

      const photo = places?.[0]?.photos?.[0];
      if (!photo) continue;

      img.src = photo.getURI({ maxWidth: 600, maxHeight: 400 });
    } catch (err) {
      console.warn("City image failed:", card.dataset.city, err);
    }
  }
}

/* ===============================
   BUTTONS (destinations cards)
================================ */
window.showAttractions = (btn) => openCard(btn.closest(".place-card"), "tourist_attraction");
window.showRestaurants = (btn) => openCard(btn.closest(".place-card"), "restaurant");
window.showHotels = (btn) => openCard(btn.closest(".place-card"), "lodging");

/* ===============================
   LABELS
================================ */
function formatType(type) {
  if (type === "restaurant") return "🍽 Restaurant";
  if (type === "lodging") return "🏨 Hotel";
  return "📍 Attraction";
}

/* ===============================
   GUESTS DROPDOWN LOGIC (index.html)
================================ */
function setupGuestsDropdown() {
  const dropdownBtn = document.getElementById("guestsDropdownBtn");
  const menu = document.querySelector(".guests-menu");
  if (!dropdownBtn || !menu || !window.bootstrap) return;

  const dd = bootstrap.Dropdown.getOrCreateInstance(dropdownBtn, {
    autoClose: "outside",
  });

  menu.addEventListener("click", (e) => e.stopPropagation());

  const state = { adults: 1, children: 0, toddlers: 0, babies: 0 };

  const els = {
    adultsDisplay: document.getElementById("adultsDisplay"),
    childrenDisplay: document.getElementById("childrenDisplay"),
    toddlersDisplay: document.getElementById("toddlersDisplay"),
    babiesDisplay: document.getElementById("babiesDisplay"),
    adultsCount: document.getElementById("adultsCount"),
    childrenCount: document.getElementById("childrenCount"),
    toddlersCount: document.getElementById("toddlersCount"),
    babiesCount: document.getElementById("babiesCount"),
    guestSummary: document.getElementById("guestSummary"),
    adultWarning: document.getElementById("adultWarning"),
  };

  function updateUI() {
    if (els.adultsDisplay) els.adultsDisplay.textContent = state.adults;
    if (els.childrenDisplay) els.childrenDisplay.textContent = state.children;
    if (els.toddlersDisplay) els.toddlersDisplay.textContent = state.toddlers;
    if (els.babiesDisplay) els.babiesDisplay.textContent = state.babies;

    if (els.adultsCount) els.adultsCount.value = state.adults;
    if (els.childrenCount) els.childrenCount.value = state.children;
    if (els.toddlersCount) els.toddlersCount.value = state.toddlers;
    if (els.babiesCount) els.babiesCount.value = state.babies;

    const total = state.adults + state.children + state.toddlers + state.babies;
    dropdownBtn.textContent = `Guests: ${total}`;

    if (els.guestSummary) {
      els.guestSummary.textContent =
        `Guests: ${state.adults} adult · ${state.children} children · ${state.toddlers} toddlers · ${state.babies} babies`;
    }

    const disableKids = state.adults === 0;
    menu
      .querySelectorAll('[data-type="children"], [data-type="toddlers"], [data-type="babies"]')
      .forEach((stepper) => {
        stepper.querySelectorAll("button").forEach((b) => (b.disabled = disableKids));
        stepper.style.opacity = disableKids ? "0.5" : "1";
      });

    if (disableKids) {
      state.children = 0;
      state.toddlers = 0;
      state.babies = 0;
      if (els.childrenCount) els.childrenCount.value = 0;
      if (els.toddlersCount) els.toddlersCount.value = 0;
      if (els.babiesCount) els.babiesCount.value = 0;
    }

    if (els.adultWarning) els.adultWarning.classList.toggle("d-none", state.adults >= 1);
  }

  menu.querySelectorAll(".step-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const stepper = btn.closest(".guest-stepper");
      const type = stepper?.dataset.type;
      const action = btn.dataset.action;
      if (!type) return;

      if (type === "adults") {
        if (action === "minus") state.adults = Math.max(1, state.adults - 1);
        if (action === "plus") state.adults = Math.min(10, state.adults + 1);
      } else {
        if (action === "minus") state[type] = Math.max(0, state[type] - 1);
        if (action === "plus") state[type] = Math.min(10, state[type] + 1);
      }

      updateUI();
      dd.show();
    });
  });

  updateUI();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const city = document.getElementById("destination")?.value?.trim().toLowerCase();
    const date = document.getElementById("dates")?.value; // your single date input

    const adults   = parseInt(document.getElementById("adultsCount")?.value || "1", 10);
    const children = parseInt(document.getElementById("childrenCount")?.value || "0", 10);
    const toddlers = parseInt(document.getElementById("toddlersCount")?.value || "0", 10);
    const babies   = parseInt(document.getElementById("babiesCount")?.value || "0", 10);

    if (!city) return alert("Please select a city.");
    if (adults < 1) return alert("At least 1 adult is required.");

    const params = new URLSearchParams({
      city,
      date: date || "",
      adults: String(adults),
      children: String(children),
      toddlers: String(toddlers),
      babies: String(babies),
    });

    window.location.href = `book.html?${params.toString()}`;
  });
});

