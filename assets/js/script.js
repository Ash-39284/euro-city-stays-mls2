// These two variables are shared across the whole file.
// 'map' holds the Google Map once it's created.
// 'poiMarkers' keeps track of the pins currently shown on the map.
let map;
let poiMarkers = [];
 
// Wait until the page has fully loaded before running any of our setup functions.
// This makes sure all the HTML elements exist before we try to find them.
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    setupHomePage();
    setupDestinationsPage();
    setupBookPage();
    setupThankYouPage();
  });
}
 
// Sets up the search form on the home page.
// It checks the user has filled in a city and at least one adult,
// saves their search to sessionStorage, then sends them to the destinations page.
function setupHomePage() {
  const form = document.getElementById("searchForm");
  if (!form) return; // Stop here if there's no search form on this page
 
  setupGuestsDropdown();
 
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Stop the page from refreshing when the form is submitted
 
    const city = document.getElementById("destination")?.value?.trim().toLowerCase();
    const date = document.querySelector('input[name="dates"]')?.value || "";
 
    // Read the guest counts from the hidden inputs the dropdown keeps updated
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
 
    // Save the search details so the destinations and booking pages can read them later
    sessionStorage.setItem(
      "ECS_SEARCH",
      JSON.stringify({ city, date, adults, children, toddlers, babies })
    );
 
    window.location.href = `destinations.html?city=${encodeURIComponent(city)}`;
  });
}
 
// Sets up the dropdown that lets users choose how many guests they're bringing.
// It keeps a running count for adults, children, toddlers, and babies,
// and updates all the labels on screen whenever a + or - button is clicked.
function setupGuestsDropdown() {
  const dropdownBtn = document.getElementById("guestsDropdownBtn");
  const menu = document.querySelector(".guests-menu");
 
  // If any of these don't exist, there's nothing to set up
  if (!dropdownBtn || !menu || !window.bootstrap) return;
 
  // Tell Bootstrap to keep the dropdown open when clicking inside it
  const dd = bootstrap.Dropdown.getOrCreateInstance(dropdownBtn, {
    autoClose: "outside",
  });
 
  // Stop clicks inside the menu from accidentally closing the dropdown
  menu.addEventListener("click", (e) => e.stopPropagation());
 
  // Starting guest counts - you always need at least 1 adult
  const state = { adults: 1, children: 0, toddlers: 0, babies: 0 };
 
  // Collect all the elements we'll need to update in one place
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
 
  // Updates all the visible numbers, hidden inputs, and the dropdown button label
  // to match the current counts stored in 'state'
  function updateUI() {
    // Update the visible number next to each guest type
    if (els.adultsDisplay) els.adultsDisplay.textContent = state.adults;
    if (els.childrenDisplay) els.childrenDisplay.textContent = state.children;
    if (els.toddlersDisplay) els.toddlersDisplay.textContent = state.toddlers;
    if (els.babiesDisplay) els.babiesDisplay.textContent = state.babies;
 
    // Update the hidden inputs so the form submission picks up the right values
    if (els.adultsCount) els.adultsCount.value = state.adults;
    if (els.childrenCount) els.childrenCount.value = state.children;
    if (els.toddlersCount) els.toddlersCount.value = state.toddlers;
    if (els.babiesCount) els.babiesCount.value = state.babies;
 
    // Update the button to show the total number of guests
    const total = state.adults + state.children + state.toddlers + state.babies;
    dropdownBtn.textContent = `Guests: ${total}`;
 
    // Update the text summary below the counters
    if (els.guestSummary) {
      els.guestSummary.textContent =
        `Guests: ${state.adults} adult${state.adults > 1 ? "s" : ""} · ` +
        `${state.children} children · ${state.toddlers} toddlers · ${state.babies} babies`;
    }
 
    // Hide the "you need at least 1 adult" warning when the count is valid
    if (els.adultWarning) {
      els.adultWarning.classList.toggle("d-none", state.adults >= 1);
    }
  }
 
  // Add a click listener to every + and - button in the dropdown
  menu.querySelectorAll(".step-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent the dropdown from closing
 
      const stepper = btn.closest(".guest-stepper");
      const type = stepper?.dataset.type; // e.g. "adults", "children"
      const action = btn.dataset.action;  // either "plus" or "minus"
      if (!type) return;
 
      if (type === "adults") {
        // Adults must stay between 1 and 10
        if (action === "minus") state.adults = Math.max(1, state.adults - 1);
        if (action === "plus") state.adults = Math.min(10, state.adults + 1);
      } else {
        // All other guest types can go down to 0 but no higher than 10
        if (action === "minus") state[type] = Math.max(0, state[type] - 1);
        if (action === "plus") state[type] = Math.min(10, state[type] + 1);
      }
 
      updateUI();
      dd.show(); // Keep the dropdown open after pressing a button
    });
  });
 
  updateUI(); // Set everything to its starting state when the page loads
}
 
// Checks if the destinations page map container exists, and if so starts loading the map.
function setupDestinationsPage() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return; // Not on the destinations page, so do nothing
 
  initMapWhenReady();
}
 
// Shows a text message inside the map container.
// Used to tell the user if the map failed to load.
function setMapStatusMessage(message) {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;
  mapEl.textContent = message;
}
 
// Google Maps loads in the background, so we can't use it straight away.
// This function checks every 100ms whether it's ready yet.
// If it hasn't loaded after 8 seconds, it shows an error message instead.
function initMapWhenReady() {
  let tries = 0;
  const timer = setInterval(async () => {
    tries += 1;
 
    if (window.google?.maps?.importLibrary) {
      // Google Maps is ready - stop checking and build the map
      clearInterval(timer);
      try {
        await initMap();
      } catch (err) {
        setMapStatusMessage("Map is unavailable right now. Please try again shortly.");
      }
      return;
    }
 
    if (tries > 80) {
      // We've waited long enough - give up and show an error
      clearInterval(timer);
      setMapStatusMessage("Map is unavailable right now. Please try again shortly.");
    }
  }, 100);
}
 
// Creates the Google Map on the destinations page and then runs a few
// follow-up tasks: adding click handlers to the city cards, loading
// city photos, and opening the right city if one came from the search form.
async function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;
 
  // Load the two parts of the Google Maps API we need
  await google.maps.importLibrary("maps");
  await google.maps.importLibrary("places");
 
  // Create the map, starting zoomed out over Europe
  map = new google.maps.Map(mapEl, {
    center: { lat: 50.8503, lng: 4.3517 }, // Brussels, roughly the centre of Western Europe
    zoom: 5,
  });
 
  attachCardClickHandlers();
  await hydrateCityImages();
  autoOpenCityFromSearch();
}
 
// Adds a click listener to each city card on the destinations page.
// Clicking a card shows nearby attractions on the map.
// We also stop button clicks from triggering the whole card's click handler.
function attachCardClickHandlers() {
  document.querySelectorAll(".place-card").forEach((card) => {
    card.addEventListener("click", () => openCard(card, "tourist_attraction"));
  });
 
  // Buttons inside the card (like "Restaurants", "Hotels") have their own
  // click handlers, so we stop those clicks from also triggering the card
  document.querySelectorAll(".place-card button").forEach((btn) => {
    btn.addEventListener("click", (e) => e.stopPropagation());
  });
}
 
// Checks if the URL contains a ?city= value from the search form.
// If it does and there's a matching card on the page, scroll to it and open it.
function autoOpenCityFromSearch() {
  const params = new URLSearchParams(window.location.search);
  const city = params.get("city");
  if (!city) return; // No city in the URL, nothing to do
 
  const card = document.querySelector(`.place-card[data-city="${city.toLowerCase()}"]`);
  if (!card) return; // No matching card found on this page
 
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  openCard(card, "tourist_attraction");
}
 
// Opens a city card by:
// 1. Closing all other open cards
// 2. Moving the map to that city's location
// 3. Fetching and displaying nearby places of the given type
async function openCard(card, type) {
  collapseAllCards(card);
 
  // Move the map to this city and zoom in a bit
  if (map) {
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);
    map.panTo({ lat, lng });
    map.setZoom(12);
  }
 
  await fetchPOIs(card, type);
}
 
// Closes the results list on every card except the one that was just clicked.
// Also clears the old results from closed cards so they don't show stale data next time.
function collapseAllCards(activeCard) {
  document.querySelectorAll(".place-card").forEach((card) => {
    const list = card.querySelector(".poi-results");
    if (!list) return;
 
    if (card === activeCard) {
      list.classList.add("show"); // Keep the active card's list visible
    } else {
      list.classList.remove("show");
      list.innerHTML = ""; // Clear old results so they don't flash up next time
    }
  });
}
 
// Asks the Google Places API for places near the selected city,
// then builds a list of results inside the card and drops numbered
// pins on the map for each one.
async function fetchPOIs(card, type) {
  if (!window.google?.maps?.places || !map) return;
 
  const lat = parseFloat(card.dataset.lat);
  const lng = parseFloat(card.dataset.lng);
  const list = card.querySelector(".poi-results");
  if (!list) return;
 
  // Remove any pins from a previous search
  clearPoiMarkers();
  list.classList.add("show");
  list.innerHTML = '<li class="text-muted">Loading...</li>'; // Show a loading message while we wait
 
  try {
    const { places } = await google.maps.places.Place.searchNearby({
      locationRestriction: { center: { lat, lng }, radius: 3000 },
      includedTypes: [type],
      maxResultCount: 6,
      fields: ["displayName", "rating", "photos", "location"],
    });
 
    list.innerHTML = ""; // Clear the loading message
 
    if (!places?.length) {
      list.innerHTML = '<li class="text-muted">No places found</li>';
      return;
    }
 
    const info = new google.maps.InfoWindow(); // A popup that appears when you click a map pin
    const bounds = new google.maps.LatLngBounds(); // Used to fit all pins on screen at once
 
    places.forEach((place, index) => {
      // Use the first photo if there is one, otherwise show no image
      const photoUrl = place.photos?.length
        ? place.photos[0].getURI({ maxWidth: 220, maxHeight: 160 })
        : null;
 
      // Build the HTML for this result and add it to the list
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
 
      // Clicking a result in the list zooms the map into that specific place
      li.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!place.location) return;
        map.panTo(place.location);
        map.setZoom(15);
      });
 
      list.appendChild(li);
 
      if (place.location) {
        bounds.extend(place.location); // Expand the boundary to include this pin
 
        // Drop a numbered pin on the map for this place
        const marker = new google.maps.Marker({
          map,
          position: place.location,
          title: place.displayName,
          label: `${index + 1}`,
        });
 
        // When the pin is clicked, show a small popup with the place details
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
 
        poiMarkers.push(marker); // Remember this pin so we can remove it later
      }
    });
 
    // Zoom the map out to fit all the pins in view, or use a fixed zoom if there's only one
    if (poiMarkers.length >= 2) {
      map.fitBounds(bounds);
    } else {
      map.setZoom(13);
    }
  } catch (err) {
    list.innerHTML = '<li class="text-danger">Error loading places</li>';
  }
}
 
// Removes all the current map pins and clears the list that tracks them.
// Called before loading a new set of results so old pins don't pile up.
function clearPoiMarkers() {
  poiMarkers.forEach((m) => m.setMap(null)); // Passing null removes the pin from the map
  poiMarkers = [];
}
 
// Loops through every city card and tries to load a real photo from Google Places
// to replace the placeholder image. Errors on individual cards are ignored
// so one failure doesn't break the rest.
async function hydrateCityImages() {
  if (!window.google?.maps?.places) return;
 
  const cards = document.querySelectorAll(".place-card");
  const placeholderPrefix = "data:image/gif;base64,R0lGODlhAQAB"; // How our placeholder images start
 
  for (const card of cards) {
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);
 
    const img = card.querySelector("img.place-photo");
    if (!img || Number.isNaN(lat) || Number.isNaN(lng)) continue;
 
    const currentSrc = img.getAttribute("src") || "";
    const isPlaceholder = currentSrc.startsWith(placeholderPrefix);
 
    // Skip this card if it already has a real photo
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
      // If this card's photo lookup fails, just leave the placeholder in place
    }
  }
}
 
// These functions are called from inline onclick attributes in the HTML.
// We attach them to the window object so the browser can find them.
if (typeof window !== "undefined") {
  // Called when the "Attractions" button on a city card is clicked
  window.showAttractions = (btn) => openCard(btn.closest(".place-card"), "tourist_attraction");
 
  // Called when the "Restaurants" button on a city card is clicked
  window.showRestaurants = (btn) => openCard(btn.closest(".place-card"), "restaurant");
 
  // Called when the "Hotels" button on a city card is clicked
  window.showHotels = (btn) => openCard(btn.closest(".place-card"), "lodging");
 
  // Called when the "Book" button on a city card is clicked.
  // Reads the city from the card and sends the user to the booking page,
  // carrying over their guest and date details from the original search.
  window.bookCity = (btn) => {
    const card = btn.closest(".place-card");
    if (!card) return;
 
    const city = (card.dataset.city || "").toLowerCase();
    if (!city) return;
 
    // Pull the saved search details out of sessionStorage
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
 
// Returns a display-friendly label and emoji for each place type.
// Falls back to a generic "Attraction" label for anything not recognised.
function formatType(type) {
  if (type === "restaurant") return "🍽 Restaurant";
  if (type === "lodging") return "🏨 Hotel";
  return "📍 Attraction";
}
 
// Sets up the booking page.
// Reads the city, dates, and guest counts from the URL, fills in the form,
// and keeps the summary panel on the right updated as the user makes changes.
// When the form is submitted it redirects to the thank-you page.
function setupBookPage() {
  const checkIn = document.getElementById("checkIn");
  const checkOut = document.getElementById("checkOut");
  if (!checkIn || !checkOut) return; // Not on the booking page, stop here
 
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
 
  // The price in pounds for each package option
  const prices = { basic: 149, plus: 199, premium: 249 };
  const p = getBookingParams();
 
  // Set the page heading and the city name in the summary panel
  const cityName = titleCaseCity(p.city);
  const heading = document.querySelector(".package-hero h1");
  if (heading) heading.textContent = `${cityName} City Package`;
  if (summaryCity) summaryCity.textContent = cityName;
 
  // Pre-fill the check-in date if the user already chose one on the home page
  if (checkIn && p.date) checkIn.value = p.date;
 
  // Pre-fill the guest dropdowns from the search params
  if (adultsSel) adultsSel.value = String(p.adults);
  if (childrenSel) childrenSel.value = String(p.children);
  if (toddlersSel) toddlersSel.value = String(p.toddlers);
  if (babiesSel) babiesSel.value = String(p.babies);
 
  // Updates the dates row in the summary panel on the right
  function updateDates() {
    if (!summaryDates) return;
 
    if (checkIn.value && checkOut.value) {
      summaryDates.textContent = `${checkIn.value} → ${checkOut.value}`;
    } else {
      summaryDates.textContent = "Select dates";
    }
 
    // Make sure the user can't pick a check-out date before the check-in date
    if (checkIn.value) {
      checkOut.min = checkIn.value;
    }
  }
 
  // Updates the guests row in the summary panel on the right
  function updateGuests() {
    if (!summaryGuests) return;
 
    let a = parseInt(adultsSel?.value || "1", 10);
    const c = parseInt(childrenSel?.value || "0", 10);
    const t = parseInt(toddlersSel?.value || "0", 10);
    const b = parseInt(babiesSel?.value || "0", 10);
 
    // Make sure adults never drops below 1
    if (a < 1) {
      a = 1;
      if (adultsSel) adultsSel.value = "1";
    }
 
    // Build a readable sentence like "2 adults · 1 child · 1 toddler"
    let text = `${a} adult${a > 1 ? "s" : ""}`;
    if (c > 0) text += ` · ${c} ${c === 1 ? "child" : "children"}`;
    if (t > 0) text += ` · ${t} toddler${t > 1 ? "s" : ""}`;
    if (b > 0) text += ` · ${b} bab${b === 1 ? "y" : "ies"}`;
 
    summaryGuests.textContent = text;
  }
 
  // Updates the package tier and price in the summary panel on the right
  function updateTier() {
    if (!summaryTier || !summaryPrice) return;
 
    const selected = document.querySelector('input[name="tier"]:checked')?.value || "basic";
    summaryTier.textContent = selected.charAt(0).toUpperCase() + selected.slice(1);
    summaryPrice.textContent = `£${prices[selected]}`;
  }
 
  // Builds the URL for the thank-you page, packing all the booking details
  // into the query string so that page can read and display them
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
 
  // Re-run the summary updates whenever the user changes their dates, guests, or tier
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
 
  // When the form is submitted, check everything is valid then go to the thank-you page
  if (bookingForm) {
    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();
 
      // checkValidity() uses the browser's built-in form validation (required fields etc.)
      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity(); // Show any validation error messages
        return;
      }
 
      window.location.href = buildThankYouUrl();
    });
  }
 
  // Run these once on page load to show the correct starting values in the summary
  updateDates();
  updateGuests();
  updateTier();
 
  // Try to load a photo of the chosen city for the banner at the top of the page
  const query = `${cityName} city`;
  setHeroPhotoWhenReady(query);
}
 
// Reads the city, date, and guest counts we need for the booking page.
// It first checks the URL query string, then falls back to what was saved
// in sessionStorage during the original search.
function getBookingParams() {
  const params = new URLSearchParams(window.location.search);
  const saved = JSON.parse(sessionStorage.getItem("ECS_SEARCH") || "{}");
 
  const city = (params.get("city") || saved.city || "paris").toLowerCase();
  const date = params.get("date") || saved.date || "";
 
  return {
    city,
    date,
    // Math.max makes sure none of these values can come back as negative numbers
    adults: Math.max(1, parseInt(params.get("adults") || saved.adults || "1", 10)),
    children: Math.max(0, parseInt(params.get("children") || saved.children || "0", 10)),
    toddlers: Math.max(0, parseInt(params.get("toddlers") || saved.toddlers || "0", 10)),
    babies: Math.max(0, parseInt(params.get("babies") || saved.babies || "0", 10)),
  };
}
 
// Google Places loads in the background, so we can't use it straight away.
// This function keeps checking every 100ms until it's ready, then loads the hero photo.
// If it never becomes ready, we give up quietly and just keep the default image.
function setHeroPhotoWhenReady(textQuery) {
  let tries = 0;
  const timer = setInterval(async () => {
    tries += 1;
 
    if (window.google?.maps?.places) {
      clearInterval(timer); // It's ready - stop checking
      try {
        await setHeroPhotoFromPlaces(textQuery);
      } catch (err) {
        // If it fails, just keep whatever default image is already there
      }
      return;
    }
 
    if (tries > 80) {
      clearInterval(timer); // Give up after 8 seconds
    }
  }, 100);
}
 
// Searches Google Places for the given city name and uses the first photo
// it finds as the large background image at the top of the booking page.
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
  if (!photo) return; // No photo found, leave the default image in place
 
  const url = photo.getURI({ maxWidth: 1400, maxHeight: 800 });
 
  // Set the photo as a CSS background image with a slightly dark overlay on top
  // so any text on the banner stays readable
  hero.style.backgroundImage =
    `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.18)), url("${url}")`;
  hero.style.backgroundSize = "cover";
  hero.style.backgroundPosition = "center";
}
 
// Sets up the thank-you page shown after a booking is completed.
// It reads the booking details from the URL and displays them in the confirmation message.
function setupThankYouPage() {
  const destinationEl = document.getElementById("bookingDestination");
  const guestsEl = document.getElementById("bookingGuests");
  const packageEl = document.getElementById("bookingPackage");
  if (!destinationEl || !guestsEl || !packageEl) return; // Not on the thank-you page
 
  // The booking details were packed into the URL by the booking form
  const params = new URLSearchParams(window.location.search);
 
  const city = params.get("city");
  const adults = parseInt(params.get("adults") || "1", 10);
  const children = parseInt(params.get("children") || "0", 10);
  const toddlers = parseInt(params.get("toddlers") || "0", 10);
  const babies = parseInt(params.get("babies") || "0", 10);
  const tier = params.get("tier");
 
  if (city) {
    destinationEl.textContent = titleCaseCity(city); // e.g. "new-york" becomes "New York"
  }
 
  // Build a readable sentence describing the guest breakdown
  let guestsText = `${adults} adult${adults > 1 ? "s" : ""}`;
  if (children > 0) guestsText += ` · ${children} ${children === 1 ? "child" : "children"}`;
  if (toddlers > 0) guestsText += ` · ${toddlers} toddler${toddlers > 1 ? "s" : ""}`;
  if (babies > 0) guestsText += ` · ${babies} bab${babies === 1 ? "y" : "ies"}`;
  guestsEl.textContent = guestsText;
 
  if (tier) {
    // Capitalise the first letter so "premium" becomes "Premium"
    packageEl.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
  }
}
 
// Turns a URL-style city slug into a properly capitalised name.
// For example: "new-york" becomes "New York", "paris" becomes "Paris"
function titleCaseCity(slug) {
  if (!slug) return "";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
 
// This block only runs in Node.js (during testing), not in the browser.
// It exports all the functions so the test file can import and test them individually.
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
    // These helpers let tests read and overwrite the 'map' and 'poiMarkers'
    // variables directly, since they're not normally accessible outside this file
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
 