// Import the main script file so we can test its functions
const ecs = require("./script.js");
 
// Pull out each function we want to test into its own variable
// The __set and __get functions are special helpers that let us
// read and change internal variables like 'map' and 'poiMarkers' during tests
const {
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
  __setMap,
  __getMap,
  __setPoiMarkers,
  __getPoiMarkers,
} = ecs;
 
// Some functions in our code use async/await (they do things like fetch data).
// This helper makes sure any pending async work finishes before we check our results.
function flushPromises() {
  return Promise.resolve();
}
 
// Creates a fake version of the Google Maps API for testing.
// We can't use the real Google Maps in tests because it needs a live internet
// connection and an API key. This fake version behaves the same way but does nothing real.
// It returns a fake map object so tests can check if panTo, setZoom etc. were called.
function mockGoogleBase() {
  const mapInstance = {
    panTo: jest.fn(),    // jest.fn() creates a fake function that records when it's called
    setZoom: jest.fn(),
    fitBounds: jest.fn(),
  };
 
  const Map = jest.fn(() => mapInstance);
  const importLibrary = jest.fn().mockResolvedValue({});
 
  global.google = {
    maps: {
      importLibrary,
      Map,
      places: {
        Place: {
          searchNearby: jest.fn().mockResolvedValue({ places: [] }),
          searchByText: jest.fn().mockResolvedValue({ places: [] }),
        },
      },
      InfoWindow: jest.fn(() => ({
        setContent: jest.fn(),
        open: jest.fn(),
      })),
      LatLngBounds: jest.fn(() => ({
        extend: jest.fn(),
      })),
      Marker: jest.fn(function Marker(opts) {
        this.opts = opts;
        this.addListener = jest.fn();
        this.setMap = jest.fn();
      }),
    },
  };
 
  return { mapInstance };
}
 
// This runs before every single test to give each one a clean slate.
// Without this, changes made in one test could accidentally affect the next one.
beforeEach(() => {
  document.body.innerHTML = "";        // Clear any HTML left over from the previous test
  jest.restoreAllMocks();              // Reset any fake functions back to their originals
  window.sessionStorage.clear();       // Clear saved search data
  window.history.pushState({}, "", "http://localhost/"); // Reset the URL
  __setMap(undefined);                 // Clear the stored map object
  __setPoiMarkers([]);                 // Clear any stored map pins
  delete global.google;                // Remove the fake Google Maps object
  delete window.google;
  delete window.bootstrap;            // Remove the fake Bootstrap object
});
 
// -------------------------------------------------------
// Tests for the home page
// -------------------------------------------------------
 
describe("home page setup", () => {
  // Check that the form shows an alert if the user tries to
  // submit without choosing a destination city
  test("setupHomePage validates missing city", () => {
    document.body.innerHTML = `
      <form id="searchForm">
        <input id="destination" value="" />
        <input name="dates" value="2026-06-01" />
        <input id="adultsCount" value="1" />
        <input id="childrenCount" value="0" />
        <input id="toddlersCount" value="0" />
        <input id="babiesCount" value="0" />
      </form>
    `;
 
    // Replace window.alert with a fake so we can check if it was called
    window.alert = jest.fn();
    setupHomePage();
    document.getElementById("searchForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
 
    expect(window.alert).toHaveBeenCalledWith("Please select a city.");
  });
 
  // Check that clicking the + button on the adults stepper increases the count,
  // updates the hidden input value, and keeps the dropdown open
  test("setupGuestsDropdown updates counts", () => {
    document.body.innerHTML = `
      <button id="guestsDropdownBtn">Guests: 1</button>
      <div class="guests-menu">
        <div class="guest-stepper" data-type="adults">
          <button class="step-btn" data-action="minus">-</button>
          <button class="step-btn" data-action="plus">+</button>
        </div>
      </div>
      <span id="adultsDisplay"></span>
      <span id="childrenDisplay"></span>
      <span id="toddlersDisplay"></span>
      <span id="babiesDisplay"></span>
      <input id="adultsCount" />
      <input id="childrenCount" />
      <input id="toddlersCount" />
      <input id="babiesCount" />
      <div id="guestSummary"></div>
      <div id="adultWarning" class="d-none"></div>
    `;
 
    // Create a fake Bootstrap dropdown with a fake show() method
    const show = jest.fn();
    window.bootstrap = {
      Dropdown: {
        getOrCreateInstance: jest.fn(() => ({ show })),
      },
    };
 
    setupGuestsDropdown();
    document.querySelector('[data-action="plus"]').click(); // Click the + button
 
    expect(document.getElementById("adultsCount").value).toBe("2");
    expect(document.getElementById("guestsDropdownBtn").textContent).toBe("Guests: 2");
    expect(show).toHaveBeenCalled(); // Dropdown should stay open
  });
});
 
// -------------------------------------------------------
// Tests for the destinations page and map
// -------------------------------------------------------
 
describe("destinations and map setup", () => {
  // If the #map element doesn't exist on the page, the function should
  // exit quietly without throwing any errors
  test("setupDestinationsPage safely exits when map element is missing", () => {
    expect(() => setupDestinationsPage()).not.toThrow();
  });
 
  // If Google Maps never loads, after 8 seconds the map container should
  // show a friendly error message instead of staying blank
  test("initMapWhenReady sets fallback map message when google maps does not load", () => {
    document.body.innerHTML = `<div id="map"></div>`;
    jest.useFakeTimers(); // Take control of timers so we don't have to wait 8 real seconds
 
    initMapWhenReady();
    jest.advanceTimersByTime(8200); // Fast-forward time by 8.2 seconds
 
    expect(document.getElementById("map").textContent).toBe(
      "Map is unavailable right now. Please try again shortly."
    );
    jest.useRealTimers(); // Hand timer control back to the real clock
  });
 
  // Check that initMap loads the right Google Maps libraries and creates the map
  test("initMap builds map when google is available", async () => {
    document.body.innerHTML = `<div id="map"></div>`;
    const { mapInstance } = mockGoogleBase();
    window.google = global.google;
 
    await initMap();
 
    // Both libraries should have been loaded
    expect(global.google.maps.importLibrary).toHaveBeenCalledWith("maps");
    expect(global.google.maps.importLibrary).toHaveBeenCalledWith("places");
    // The Map constructor should have been called to create the map
    expect(global.google.maps.Map).toHaveBeenCalled();
    // The created map should now be stored in our module variable
    expect(__getMap()).toBe(mapInstance);
  });
 
  // Check that buttons inside a card don't accidentally open the card,
  // but clicking the card itself does open it
  test("attachCardClickHandlers wires card click and button propagation", () => {
    document.body.innerHTML = `
      <div class="place-card" data-lat="51.5" data-lng="-0.12">
        <button>Open</button>
        <ul class="poi-results"></ul>
      </div>
    `;
 
    attachCardClickHandlers();
 
    // Clicking the button inside the card should NOT open the results list
    document.querySelector(".place-card button").click();
    expect(document.querySelector(".poi-results").classList.contains("show")).toBe(false);
 
    // Clicking the card itself SHOULD open the results list
    document.querySelector(".place-card").click();
    expect(document.querySelector(".poi-results").classList.contains("show")).toBe(true);
  });
 
  // If the URL has ?city=rome, the Rome card should be scrolled into view and opened
  test("autoOpenCityFromSearch opens matching card", () => {
    document.body.innerHTML = `
      <div class="place-card" data-city="rome" data-lat="41.9" data-lng="12.5">
        <ul class="poi-results"></ul>
      </div>
    `;
    window.history.pushState({}, "", "http://localhost/destinations.html?city=rome");
 
    const card = document.querySelector(".place-card");
    card.scrollIntoView = jest.fn(); // Replace the real scrollIntoView with a fake
 
    autoOpenCityFromSearch();
 
    expect(card.scrollIntoView).toHaveBeenCalled(); // Should have scrolled to the card
    expect(card.querySelector(".poi-results").classList.contains("show")).toBe(true); // Should be open
  });
 
  // Opening a card should pan the map to that city's coordinates,
  // set the zoom level, show that card's results, and hide all others
  test("openCard pans map and shows active list", async () => {
    document.body.innerHTML = `
      <div class="place-card" id="a" data-lat="41.9" data-lng="12.5"><ul class="poi-results"></ul></div>
      <div class="place-card" id="b" data-lat="48.8" data-lng="2.3"><ul class="poi-results"></ul></div>
    `;
 
    // Set up a fake map with recordable methods
    const map = { panTo: jest.fn(), setZoom: jest.fn(), fitBounds: jest.fn() };
    __setMap(map);
 
    const card = document.getElementById("a");
    await openCard(card, "tourist_attraction");
 
    expect(map.panTo).toHaveBeenCalledWith({ lat: 41.9, lng: 12.5 }); // Map moved to card A's location
    expect(map.setZoom).toHaveBeenCalledWith(12);                      // Zoomed in to level 12
    expect(card.querySelector(".poi-results").classList.contains("show")).toBe(true);  // Card A is open
    expect(document.querySelector("#b .poi-results").classList.contains("show")).toBe(false); // Card B is closed
  });
 
  // When a card is opened, all other cards should be closed and their content cleared
  test("collapseAllCards only leaves active card expanded", () => {
    document.body.innerHTML = `
      <div class="place-card" id="a"><ul class="poi-results show">x</ul></div>
      <div class="place-card" id="b"><ul class="poi-results show">y</ul></div>
    `;
 
    const active = document.getElementById("a");
    collapseAllCards(active);
 
    expect(document.querySelector("#a .poi-results").classList.contains("show")).toBe(true);  // A stays open
    expect(document.querySelector("#b .poi-results").classList.contains("show")).toBe(false); // B is closed
    expect(document.querySelector("#b .poi-results").innerHTML).toBe(""); // B's content is cleared
  });
 
  // Check that fetchPOIs creates a list item and a map pin for each place returned
  test("fetchPOIs renders nearby places and creates markers", async () => {
    const map = { panTo: jest.fn(), setZoom: jest.fn(), fitBounds: jest.fn() };
    __setMap(map);
 
    document.body.innerHTML = `
      <div class="place-card" data-lat="41.9" data-lng="12.5">
        <ul class="poi-results"></ul>
      </div>
    `;
    const card = document.querySelector(".place-card");
 
    mockGoogleBase();
    window.google = global.google;
 
    // Two fake places to be returned by the mock API
    const placeA = {
      displayName: "A",
      rating: 4.6,
      location: { lat: 41.91, lng: 12.51 },
      photos: [{ getURI: jest.fn(() => "https://img/a.jpg") }],
    };
    const placeB = {
      displayName: "B",
      rating: 4.2,
      location: { lat: 41.92, lng: 12.52 },
      photos: [{ getURI: jest.fn(() => "https://img/b.jpg") }],
    };
 
    // Tell the fake searchNearby to return our two places
    global.google.maps.places.Place.searchNearby.mockResolvedValue({ places: [placeA, placeB] });
 
    await fetchPOIs(card, "restaurant");
 
    expect(card.querySelectorAll("li").length).toBe(2);   // Two list items created
    expect(__getPoiMarkers().length).toBe(2);              // Two map pins added
    expect(map.fitBounds).toHaveBeenCalled();              // Map zoomed to fit both pins
  });
 
  // clearPoiMarkers should remove each pin from the map and empty the pins array
  test("clearPoiMarkers removes marker references", () => {
    const markerA = { setMap: jest.fn() };
    const markerB = { setMap: jest.fn() };
    __setPoiMarkers([markerA, markerB]); // Pretend these pins are already on the map
 
    clearPoiMarkers();
 
    // setMap(null) is how you remove a pin from a Google Map
    expect(markerA.setMap).toHaveBeenCalledWith(null);
    expect(markerB.setMap).toHaveBeenCalledWith(null);
    expect(__getPoiMarkers()).toEqual([]); // The array should now be empty
  });
 
  // When a card has a placeholder image, it should be swapped out for a real photo
  test("hydrateCityImages updates placeholder image from places api", async () => {
    document.body.innerHTML = `
      <div class="place-card" data-city="rome" data-lat="41.9" data-lng="12.5">
        <img class="place-photo" src="data:image/gif;base64,R0lGODlhAQAB" />
      </div>
    `;
 
    mockGoogleBase();
    window.google = global.google;
 
    // Tell the fake API to return a photo with a real-looking URL
    global.google.maps.places.Place.searchNearby.mockResolvedValue({
      places: [{ photos: [{ getURI: jest.fn(() => "https://img/city.jpg") }] }],
    });
 
    await hydrateCityImages();
 
    // The placeholder src should now have been replaced with the photo URL
    expect(document.querySelector(".place-photo").src).toContain("https://img/city.jpg");
  });
});
 
// -------------------------------------------------------
// Tests for the booking page and helper functions
// -------------------------------------------------------
 
describe("booking page and helpers", () => {
  // formatType should return the right emoji label for each place type
  test("formatType returns correct labels", () => {
    expect(formatType("restaurant")).toBe("🍽 Restaurant");
    expect(formatType("lodging")).toBe("🏨 Hotel");
    expect(formatType("tourist_attraction")).toBe("📍 Attraction");
  });
 
  // When the booking page loads, it should read the city from the URL
  // and fill in the heading, city name in the summary, and guest count
  test("setupBookPage initializes summary from query params", async () => {
    jest.useFakeTimers();
    document.body.innerHTML = `
      <section class="package-hero"><h1></h1><div class="package-image"></div></section>
      <form id="bookingForm">
        <input id="checkIn" type="date" />
        <input id="checkOut" type="date" />
        <select id="adults"><option value="1">1</option><option value="2">2</option></select>
        <select id="children"><option value="0">0</option><option value="1">1</option></select>
        <select id="toddlers"><option value="0">0</option><option value="1">1</option></select>
        <select id="babies"><option value="0">0</option><option value="1">1</option></select>
        <strong id="summaryDates"></strong>
        <strong id="summaryGuests"></strong>
        <strong id="summaryTier"></strong>
        <strong id="summaryPrice"></strong>
        <strong id="summaryCity"></strong>
        <input type="radio" name="tier" value="basic" checked />
        <input type="radio" name="tier" value="plus" />
        <input type="radio" name="tier" value="premium" />
      </form>
    `;
 
    mockGoogleBase();
    window.google = global.google;
 
    // Set the URL to look like it came from the search form with city=rome and 2 adults
    window.history.pushState(
      {},
      "",
      "http://localhost/book.html?city=rome&date=2026-06-01&adults=2&children=1&toddlers=0&babies=0"
    );
 
    setupBookPage();
    jest.advanceTimersByTime(150); // Move time forward so the photo polling fires
    await flushPromises();
 
    expect(document.querySelector(".package-hero h1").textContent).toBe("Rome City Package");
    expect(document.getElementById("summaryCity").textContent).toBe("Rome");
    expect(document.getElementById("summaryGuests").textContent).toContain("2 adults");
 
    jest.useRealTimers();
  });
 
  // getBookingParams should read values from sessionStorage and make sure
  // they're sensible - adults should always be at least 1, other counts at least 0
  test("getBookingParams reads URL and storage safely", () => {
    // Store some bad values to check they get corrected
    window.sessionStorage.setItem(
      "ECS_SEARCH",
      JSON.stringify({ city: "berlin", date: "2026-07-10", adults: 0, children: -1, toddlers: -3, babies: 2 })
    );
 
    expect(getBookingParams()).toEqual({
      city: "berlin",
      date: "2026-07-10",
      adults: 1,    // Was 0, corrected to minimum of 1
      children: 0,  // Was -1, corrected to minimum of 0
      toddlers: 0,  // Was -3, corrected to minimum of 0
      babies: 2,    // Was already valid, left unchanged
    });
  });
 
  // If Google Places never loads, setHeroPhotoWhenReady should stop trying
  // after a while and not throw any errors
  test("setHeroPhotoWhenReady stops when API is unavailable", () => {
    jest.useFakeTimers();
    expect(() => setHeroPhotoWhenReady("rome city")).not.toThrow();
    jest.advanceTimersByTime(8200); // Fast forward past the timeout
    jest.useRealTimers();
  });
 
  // When Google Places is available, the hero image function should request
  // a photo and set it as the background of the banner element
  test("setHeroPhotoFromPlaces applies background image", async () => {
    document.body.innerHTML = `<div class="package-image"></div>`;
 
    mockGoogleBase();
    window.google = global.google;
    const getURI = jest.fn(() => "https://img/hero.jpg");
 
    // Tell the fake searchByText to return a place with a photo
    global.google.maps.places.Place.searchByText.mockResolvedValue({
      places: [{ photos: [{ getURI }] }],
    });
 
    await setHeroPhotoFromPlaces("rome city");
 
    expect(global.google.maps.places.Place.searchByText).toHaveBeenCalled();
    expect(getURI).toHaveBeenCalledWith({ maxWidth: 1400, maxHeight: 800 }); // Right size was requested
    expect(document.querySelector(".package-image").style.backgroundSize).toBe("cover");
    expect(document.querySelector(".package-image").style.backgroundPosition).toBe("center");
  });
 
  // The thank-you page should read the booking details from the URL
  // and display them in plain English
  test("setupThankYouPage populates booking summary", () => {
    document.body.innerHTML = `
      <div id="bookingDestination"></div>
      <div id="bookingGuests"></div>
      <div id="bookingPackage"></div>
    `;
 
    // Set a URL that looks like it came from a completed booking
    window.history.pushState(
      {},
      "",
      "http://localhost/thank-you.html?city=paris&adults=2&children=1&toddlers=1&babies=0&tier=premium"
    );
 
    setupThankYouPage();
 
    expect(document.getElementById("bookingDestination").textContent).toBe("Paris");
    expect(document.getElementById("bookingGuests").textContent).toContain("2 adults");
    expect(document.getElementById("bookingPackage").textContent).toBe("Premium");
  });
 
  // titleCaseCity should turn a hyphenated slug into a readable city name
  test("titleCaseCity converts slug format", () => {
    expect(titleCaseCity("new-york")).toBe("New York");
    expect(titleCaseCity("")).toBe(""); // Empty string should return empty string
  });
});
 