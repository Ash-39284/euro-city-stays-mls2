let map;
let poiMarkers = [];

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    setupHomePage();
    setupDestinationsPage();
    setupBookPage();
    setupThankYouPage();
  });
}

function setupHomePage() {
  const form = document.getElementById("searchForm");
  if (!form) return;

  setupGuestsDropdown();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const city = document.getElementById("destination")?.value?.trim().toLowerCase();
    const date = document.querySelector('input[name="dates"]')?.value || "";

    const adults = parseInt(document.getElementById("adultsCount")?.value || "1", 10);
    const children = parseInt(document.getElementById("childrenCount")?.value || "0", 10);
    const toddlers = parseInt(document.getElementById("toddlersCount")?.value || "0", 10);
    const babies = parseInt(document.getElementById("babiesCount")?.value || "0", 10);

    if (!city) {
      alert("Please select a city.");
      return;
    }

    if (adults < 1) {
      alert("At least 1 adult is required.");
      return;
    }

    sessionStorage.setItem(
      "ECS_SEARCH",
      JSON.stringify({ city, date, adults, children, toddlers, babies })
    );

    window.location.href = `destinations.html?city=${encodeURIComponent(city)}`;
  });
}

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
        `Guests: ${state.adults} adult${state.adults > 1 ? "s" : ""} · ` +
        `${state.children} children · ${state.toddlers} toddlers · ${state.babies} babies`;
    }

    if (els.adultWarning) {
      els.adultWarning.classList.toggle("d-none", state.adults >= 1);
    }
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

function setupDestinationsPage() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  initMapWhenReady();
}

function initMapWhenReady() {
  let tries = 0;
  const timer = setInterval(async () => {
    tries += 1;

    if (window.google?.maps?.importLibrary) {
      clearInterval(timer);
      try {
        await initMap();
      } catch (err) {
        console.error("Map init failed:", err);
      }
      return;
    }

    if (tries > 80) {
      clearInterval(timer);
      console.error("Google Maps did not load.");
    }
  }, 100);
}

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

function attachCardClickHandlers() {
  document.querySelectorAll(".place-card").forEach((card) => {
    card.addEventListener("click", () => openCard(card, "tourist_attraction"));
  });

  document.querySelectorAll(".place-card button").forEach((btn) => {
    btn.addEventListener("click", (e) => e.stopPropagation());
  });
}

function autoOpenCityFromSearch() {
  const params = new URLSearchParams(window.location.search);
  const city = params.get("city");
  if (!city) return;

  const card = document.querySelector(`.place-card[data-city="${city.toLowerCase()}"]`);
  if (!card) return;

  card.scrollIntoView({ behavior: "smooth", block: "center" });
  openCard(card, "tourist_attraction");
}

async function openCard(card, type) {
  collapseAllCards(card);

  if (map) {
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);
    map.panTo({ lat, lng });
    map.setZoom(12);
  }

  await fetchPOIs(card, type);
}

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

async function fetchPOIs(card, type) {
  if (!window.google?.maps?.places || !map) return;

  const lat = parseFloat(card.dataset.lat);
  const lng = parseFloat(card.dataset.lng);
  const list = card.querySelector(".poi-results");
  if (!list) return;

  clearPoiMarkers();
  list.classList.add("show");
  list.innerHTML = '<li class="text-muted">Loading...</li>';

  try {
    const { places } = await google.maps.places.Place.searchNearby({
      locationRestriction: { center: { lat, lng }, radius: 3000 },
      includedTypes: [type],
      maxResultCount: 6,
      fields: ["displayName", "rating", "photos", "location"],
    });

    list.innerHTML = "";

    if (!places?.length) {
      list.innerHTML = '<li class="text-muted">No places found</li>';
      return;
    }

    const info = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();

    places.forEach((place, index) => {
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

    if (poiMarkers.length >= 2) {
      map.fitBounds(bounds);
    } else {
      map.setZoom(13);
    }
  } catch (err) {
    console.error("Places error:", err);
    list.innerHTML = '<li class="text-danger">Error loading places</li>';
  }
}

function clearPoiMarkers() {
  poiMarkers.forEach((m) => m.setMap(null));
  poiMarkers = [];
}

async function hydrateCityImages() {
  if (!window.google?.maps?.places) return;

  const cards = document.querySelectorAll(".place-card");
  const placeholderPrefix = "data:image/gif;base64,R0lGODlhAQAB";

  for (const card of cards) {
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);

    const img = card.querySelector("img.place-photo");
    if (!img || Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const currentSrc = img.getAttribute("src") || "";
    const isPlaceholder = currentSrc.startsWith(placeholderPrefix);
    if (currentSrc && !isPlaceholder) continue;

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

if (typeof window !== "undefined") {
  window.showAttractions = (btn) => openCard(btn.closest(".place-card"), "tourist_attraction");
  window.showRestaurants = (btn) => openCard(btn.closest(".place-card"), "restaurant");
  window.showHotels = (btn) => openCard(btn.closest(".place-card"), "lodging");

  window.bookCity = (btn) => {
    const card = btn.closest(".place-card");
    if (!card) return;

    const city = (card.dataset.city || "").toLowerCase();
    if (!city) return;

    const saved = JSON.parse(sessionStorage.getItem("ECS_SEARCH") || "{}");

    const params = new URLSearchParams({
      city,
      date: saved.date || "",
      adults: String(saved.adults ?? 1),
      children: String(saved.children ?? 0),
      toddlers: String(saved.toddlers ?? 0),
      babies: String(saved.babies ?? 0),
    });

    window.location.href = `book.html?${params.toString()}`;
  };
}

function formatType(type) {
  if (type === "restaurant") return "🍽 Restaurant";
  if (type === "lodging") return "🏨 Hotel";
  return "📍 Attraction";
}

function setupBookPage() {
  const checkIn = document.getElementById("checkIn");
  const checkOut = document.getElementById("checkOut");
  if (!checkIn || !checkOut) return;
  const bookingForm = document.getElementById("bookingForm");

  const adultsSel = document.getElementById("adults");
  const childrenSel = document.getElementById("children");
  const toddlersSel = document.getElementById("toddlers");
  const babiesSel = document.getElementById("babies");

  const summaryDates = document.getElementById("summaryDates");
  const summaryGuests = document.getElementById("summaryGuests");
  const summaryTier = document.getElementById("summaryTier");
  const summaryPrice = document.getElementById("summaryPrice");
  const summaryCity = document.getElementById("summaryCity");

  const prices = { basic: 149, plus: 199, premium: 249 };
  const p = getBookingParams();

  const cityName = titleCaseCity(p.city);
  const heading = document.querySelector(".package-hero h1");
  if (heading) heading.textContent = `${cityName} City Package`;
  if (summaryCity) summaryCity.textContent = cityName;

  if (checkIn && p.date) checkIn.value = p.date;

  if (adultsSel) adultsSel.value = String(p.adults);
  if (childrenSel) childrenSel.value = String(p.children);
  if (toddlersSel) toddlersSel.value = String(p.toddlers);
  if (babiesSel) babiesSel.value = String(p.babies);

  function updateDates() {
    if (!summaryDates) return;

    if (checkIn.value && checkOut.value) {
      summaryDates.textContent = `${checkIn.value} → ${checkOut.value}`;
    } else {
      summaryDates.textContent = "Select dates";
    }

    if (checkIn.value) {
      checkOut.min = checkIn.value;
    }
  }

  function updateGuests() {
    if (!summaryGuests) return;

    let a = parseInt(adultsSel?.value || "1", 10);
    const c = parseInt(childrenSel?.value || "0", 10);
    const t = parseInt(toddlersSel?.value || "0", 10);
    const b = parseInt(babiesSel?.value || "0", 10);

    if (a < 1) {
      a = 1;
      if (adultsSel) adultsSel.value = "1";
    }

    let text = `${a} adult${a > 1 ? "s" : ""}`;
    if (c > 0) text += ` · ${c} ${c === 1 ? "child" : "children"}`;
    if (t > 0) text += ` · ${t} toddler${t > 1 ? "s" : ""}`;
    if (b > 0) text += ` · ${b} bab${b === 1 ? "y" : "ies"}`;

    summaryGuests.textContent = text;
  }

  function updateTier() {
    if (!summaryTier || !summaryPrice) return;

    const selected = document.querySelector('input[name="tier"]:checked')?.value || "basic";
    summaryTier.textContent = selected.charAt(0).toUpperCase() + selected.slice(1);
    summaryPrice.textContent = `£${prices[selected]}`;
  }

  function buildThankYouUrl() {
    const selectedTier = document.querySelector('input[name="tier"]:checked')?.value || "basic";

    const params = new URLSearchParams({
      city: p.city,
      adults: adultsSel?.value || "1",
      children: childrenSel?.value || "0",
      toddlers: toddlersSel?.value || "0",
      babies: babiesSel?.value || "0",
      tier: selectedTier,
      checkin: checkIn.value || "",
      checkout: checkOut.value || "",
    });

    return `thank-you.html?${params.toString()}`;
  }

  [checkIn, checkOut].forEach((el) => el.addEventListener("change", () => {
    updateDates();
  }));

  [adultsSel, childrenSel, toddlersSel, babiesSel].forEach((el) => {
    if (!el) return;
    el.addEventListener("change", () => {
      updateGuests();
    });
  });

  document.querySelectorAll('input[name="tier"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      updateTier();
    });
  });

  if (bookingForm) {
    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        return;
      }

      window.location.href = buildThankYouUrl();
    });
  }

  updateDates();
  updateGuests();
  updateTier();

  const query = `${cityName} city`;
  setHeroPhotoWhenReady(query);
}

function getBookingParams() {
  const params = new URLSearchParams(window.location.search);
  const saved = JSON.parse(sessionStorage.getItem("ECS_SEARCH") || "{}");

  const city = (params.get("city") || saved.city || "paris").toLowerCase();
  const date = params.get("date") || saved.date || "";

  return {
    city,
    date,
    adults: Math.max(1, parseInt(params.get("adults") || saved.adults || "1", 10)),
    children: Math.max(0, parseInt(params.get("children") || saved.children || "0", 10)),
    toddlers: Math.max(0, parseInt(params.get("toddlers") || saved.toddlers || "0", 10)),
    babies: Math.max(0, parseInt(params.get("babies") || saved.babies || "0", 10)),
  };
}

function setHeroPhotoWhenReady(textQuery) {
  let tries = 0;
  const timer = setInterval(async () => {
    tries += 1;

    if (window.google?.maps?.places) {
      clearInterval(timer);
      try {
        await setHeroPhotoFromPlaces(textQuery);
      } catch (err) {
        console.warn("Hero image error:", err);
      }
      return;
    }

    if (tries > 80) {
      clearInterval(timer);
    }
  }, 100);
}

async function setHeroPhotoFromPlaces(textQuery) {
  const hero = document.querySelector(".package-image");
  if (!hero || !window.google?.maps?.places) return;

  await google.maps.importLibrary("places");

  const { places } = await google.maps.places.Place.searchByText({
    textQuery,
    maxResultCount: 1,
    fields: ["photos"],
  });

  const photo = places?.[0]?.photos?.[0];
  if (!photo) return;

  const url = photo.getURI({ maxWidth: 1400, maxHeight: 800 });

  hero.style.backgroundImage =
    `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.18)), url("${url}")`;
  hero.style.backgroundSize = "cover";
  hero.style.backgroundPosition = "center";
}

function setupThankYouPage() {
  const destinationEl = document.getElementById("bookingDestination");
  const guestsEl = document.getElementById("bookingGuests");
  const packageEl = document.getElementById("bookingPackage");
  if (!destinationEl || !guestsEl || !packageEl) return;

  const params = new URLSearchParams(window.location.search);

  const city = params.get("city");
  const adults = parseInt(params.get("adults") || "1", 10);
  const children = parseInt(params.get("children") || "0", 10);
  const toddlers = parseInt(params.get("toddlers") || "0", 10);
  const babies = parseInt(params.get("babies") || "0", 10);
  const tier = params.get("tier");

  if (city) {
    destinationEl.textContent = titleCaseCity(city);
  }

  let guestsText = `${adults} adult${adults > 1 ? "s" : ""}`;
  if (children > 0) guestsText += ` · ${children} ${children === 1 ? "child" : "children"}`;
  if (toddlers > 0) guestsText += ` · ${toddlers} toddler${toddlers > 1 ? "s" : ""}`;
  if (babies > 0) guestsText += ` · ${babies} bab${babies === 1 ? "y" : "ies"}`;
  guestsEl.textContent = guestsText;

  if (tier) {
    packageEl.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
  }
}

function titleCaseCity(slug) {
  if (!slug) return "";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    setupHomePage,
    setupGuestsDropdown,
    setupDestinationsPage,
    initMapWhenReady,
    initMap,
    attachCardClickHandlers,
    autoOpenCityFromSearch,
    openCard,
    collapseAllCards,
    fetchPOIs,
    clearPoiMarkers,
    hydrateCityImages,
    formatType,
    setupBookPage,
    getBookingParams,
    setHeroPhotoWhenReady,
    setHeroPhotoFromPlaces,
    setupThankYouPage,
    titleCaseCity,
    __setMap: (value) => {
      map = value;
    },
    __getMap: () => map,
    __setPoiMarkers: (value) => {
      poiMarkers = value;
    },
    __getPoiMarkers: () => poiMarkers,
  };
}
