// google maps API key
// AIzaSyAJoOGB75_bpzjqUae_aj1kBl_JIZJdu4I

// Search feature (only on HTML)

let map;
let poiMarkers = [];

/* ===============================
   BOOT
================================ */
window.addEventListener("load", async () => {
  if (!window.google?.maps) {
    console.error("Google Maps did not load.");
    return;
  }
  await initMap();
});

/* ===============================
   INIT MAP
================================ */
async function initMap() {
  await google.maps.importLibrary("maps");
  await google.maps.importLibrary("places");

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 50.8503, lng: 4.3517 },
    zoom: 5,
    mapId: "DEMO_MAP_ID", // optional; remove if you don't use a Map ID
  });

  attachCardClickHandlers();
  await hydrateCityImages();       // load city card images
  autoOpenCityFromSearch();        // open city card from URL
}

/* ===============================
   CARD CLICK HANDLING
================================ */
function attachCardClickHandlers() {
  document.querySelectorAll(".place-card").forEach(card => {
    card.addEventListener("click", () => openCard(card, "tourist_attraction"));
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
  document.querySelectorAll(".place-card").forEach(card => {
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

    places.forEach(place => {
      const photoUrl = place.photos?.length
        ? place.photos[0].getURI({ maxWidth: 220, maxHeight: 160 })
        : null;

      // List item UI
      const li = document.createElement("li");
      li.className = "mb-2";

      li.innerHTML = `
        <div class="poi-card">
          ${photoUrl ? `<img src="${photoUrl}" class="poi-photo" alt="${place.displayName}">` : ""}
          <div class="w-100">
            <div class="poi-header">
              <span class="poi-name">${place.displayName}</span>
              ${place.rating ? `<span class="poi-rating">⭐ ${place.rating}</span>` : ""}
            </div>
            <div class="poi-type">${formatType(type)}</div>
          </div>
        </div>
      `;

      const info = new google.maps.InfoWindow();
const bounds = new google.maps.LatLngBounds();

places.forEach(place => {
  const photoUrl = place.photos?.length
    ? place.photos[0].getURI({ maxWidth: 220, maxHeight: 160 })
    : null;

  const li = document.createElement("li");
  li.className = "mb-2";

  li.innerHTML = `
    <div class="poi-card">
      ${photoUrl ? `<img src="${photoUrl}" class="poi-photo" alt="${place.displayName}">` : ""}
      <div class="w-100">
        <div class="poi-header">
          <span class="poi-name">${place.displayName}</span>
          ${place.rating ? `<span class="poi-rating">⭐ ${place.rating}</span>` : ""}
        </div>
        <div class="poi-type">${formatType(type)}</div>
      </div>
    </div>
  `;

  li.addEventListener("click", () => {
    if (!place.location) return;
    map.panTo(place.location);
    map.setZoom(15);
  });

  list.appendChild(li);

  if (place.location) {
    bounds.extend(place.location);

    const marker = new google.maps.Marker({
      map,
      position: place.location,
      title: place.displayName,
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

// Fit all POI markers nicely 
if (poiMarkers.length >= 2) {
  map.fitBounds(bounds);
} else {
  map.setZoom(13);
}


      // Click POI -> pan map to it
      li.addEventListener("click", () => {
        if (place.location) {
          map.panTo(place.location);
          map.setZoom(15);
        }
      });

      list.appendChild(li);

      // Map marker for POI
      if (place.location) {
        const marker = new google.maps.Marker({
          map,
          position: place.location,
          title: place.displayName,
        });
        poiMarkers.push(marker);
      }
    });

  } catch (err) {
    console.error("Places error:", err);
    list.innerHTML = `<li class="text-danger">Error loading places</li>`;
  }
}

function clearPoiMarkers() {
  poiMarkers.forEach(m => m.setMap(null));
  poiMarkers = [];
}

/* ===============================
   CITY CARD IMAGES (Places Photos)
   Uses nearby attractions to grab 1 nice photo
================================ */
async function hydrateCityImages() {
  const cards = document.querySelectorAll(".place-card");

  for (const card of cards) {
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);

    // your card image (use .place-photo if present, otherwise first img)
    const img = card.querySelector(".place-photo") || card.querySelector("img");
    if (!img || !lat || !lng) continue;

    // Skip if you already have a local image and you DON'T want to replace it
    // If you DO want to replace, remove this if block
    if (img.getAttribute("src")) continue;

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
   BUTTONS (use the button to find card)
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
   GUESTS DROPDOWN LOGIC
================================ */

const state = {
  adults: 1,
  children: 0,
  toddlers: 0,
  babies: 0
};

const limits = {
  adults: { min: 1, max: 10 },
  children: { min: 0, max: 10 },
  toddlers: { min: 0, max: 10 },
  babies: { min: 0, max: 10 }
};

const summary = document.getElementById("guestSummary");
const warning = document.getElementById("adultWarning");
const dropdownBtn = document.getElementById("guestsDropdownBtn");

/* ===============================
   UPDATE UI
================================ */
function updateUI() {
  // Update displays
  document.getElementById("adultsDisplay").textContent = state.adults;
  document.getElementById("childrenDisplay").textContent = state.children;
  document.getElementById("toddlersDisplay").textContent = state.toddlers;
  document.getElementById("babiesDisplay").textContent = state.babies;

  // Hidden inputs
  document.getElementById("adultsCount").value = state.adults;
  document.getElementById("childrenCount").value = state.children;
  document.getElementById("toddlersCount").value = state.toddlers;
  document.getElementById("babiesCount").value = state.babies;

  // Button label
  const total =
    state.adults + state.children + state.toddlers + state.babies;

  dropdownBtn.textContent = `Guests: ${total}`;

  // Summary text
  summary.textContent =
    `Guests: ${state.adults} adult · ` +
    `${state.children} children · ` +
    `${state.toddlers} toddlers · ` +
    `${state.babies} babies`;

  // Disable kids if no adults
  toggleChildControls(state.adults > 0);

  // Warning
  warning.classList.toggle("d-none", state.adults > 0);
}

/* ===============================
   ENABLE / DISABLE CHILD CONTROLS
================================ */
function toggleChildControls(enabled) {
  document.querySelectorAll(
    '[data-type="children"], [data-type="toddlers"], [data-type="babies"]'
  ).forEach(stepper => {
    stepper.querySelectorAll("button").forEach(btn => {
      btn.disabled = !enabled;
    });
    stepper.style.opacity = enabled ? "1" : "0.5";
  });
}

/* ===============================
   STEPPER HANDLING
================================ */
document.querySelectorAll(".guest-stepper").forEach(stepper => {
  stepper.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const type = stepper.dataset.type;
    const action = btn.dataset.action;
    const { min, max } = limits[type];

    if (action === "plus" && state[type] < max) {
      state[type]++;
    }

    if (action === "minus" && state[type] > min) {
      state[type]--;
    }

    // If adults drop to 0 
    if (state.adults < 1) {
      state.adults = 1;
    }

    // Reset kids if adults = 0 
    if (state.adults === 0) {
      state.children = 0;
      state.toddlers = 0;
      state.babies = 0;
    }

    document.addEventListener("click", (e) => {
  if (e.target.closest(".guests-menu")) {
    e.stopPropagation();
  }
});

    updateUI();
  });
});

/* ===============================
   FORM SUBMIT VALIDATION
================================ */
document.getElementById("searchForm").addEventListener("submit", e => {
  if (state.adults < 1) {
    e.preventDefault();
    warning.classList.remove("d-none");
  }
});

/* INIT */
updateUI();
