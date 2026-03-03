const ecs = require("./script.js");

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

function flushPromises() {
  return Promise.resolve();
}

function mockGoogleBase() {
  const mapInstance = {
    panTo: jest.fn(),
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

beforeEach(() => {
  document.body.innerHTML = "";
  jest.restoreAllMocks();
  window.sessionStorage.clear();
  window.history.pushState({}, "", "http://localhost/");
  __setMap(undefined);
  __setPoiMarkers([]);
  delete global.google;
  delete window.google;
  delete window.bootstrap;
});

describe("home page setup", () => {
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

    window.alert = jest.fn();
    setupHomePage();
    document.getElementById("searchForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(window.alert).toHaveBeenCalledWith("Please select a city.");
  });

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

    const show = jest.fn();
    window.bootstrap = {
      Dropdown: {
        getOrCreateInstance: jest.fn(() => ({ show })),
      },
    };

    setupGuestsDropdown();
    document.querySelector('[data-action="plus"]').click();

    expect(document.getElementById("adultsCount").value).toBe("2");
    expect(document.getElementById("guestsDropdownBtn").textContent).toBe("Guests: 2");
    expect(show).toHaveBeenCalled();
  });
});

describe("destinations and map setup", () => {
  test("setupDestinationsPage safely exits when map element is missing", () => {
    expect(() => setupDestinationsPage()).not.toThrow();
  });

  test("initMapWhenReady logs when google maps does not load", () => {
    jest.useFakeTimers();
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    initMapWhenReady();
    jest.advanceTimersByTime(8200);

    expect(errSpy).toHaveBeenCalledWith("Google Maps did not load.");
    jest.useRealTimers();
  });

  test("initMap builds map when google is available", async () => {
    document.body.innerHTML = `<div id="map"></div>`;
    const { mapInstance } = mockGoogleBase();
    window.google = global.google;

    await initMap();

    expect(global.google.maps.importLibrary).toHaveBeenCalledWith("maps");
    expect(global.google.maps.importLibrary).toHaveBeenCalledWith("places");
    expect(global.google.maps.Map).toHaveBeenCalled();
    expect(__getMap()).toBe(mapInstance);
  });

  test("attachCardClickHandlers wires card click and button propagation", () => {
    document.body.innerHTML = `
      <div class="place-card" data-lat="51.5" data-lng="-0.12">
        <button>Open</button>
        <ul class="poi-results"></ul>
      </div>
    `;

    attachCardClickHandlers();

    document.querySelector(".place-card button").click();
    expect(document.querySelector(".poi-results").classList.contains("show")).toBe(false);

    document.querySelector(".place-card").click();
    expect(document.querySelector(".poi-results").classList.contains("show")).toBe(true);
  });

  test("autoOpenCityFromSearch opens matching card", () => {
    document.body.innerHTML = `
      <div class="place-card" data-city="rome" data-lat="41.9" data-lng="12.5">
        <ul class="poi-results"></ul>
      </div>
    `;
    window.history.pushState({}, "", "http://localhost/destinations.html?city=rome");

    const card = document.querySelector(".place-card");
    card.scrollIntoView = jest.fn();

    autoOpenCityFromSearch();

    expect(card.scrollIntoView).toHaveBeenCalled();
    expect(card.querySelector(".poi-results").classList.contains("show")).toBe(true);
  });

  test("openCard pans map and shows active list", async () => {
    document.body.innerHTML = `
      <div class="place-card" id="a" data-lat="41.9" data-lng="12.5"><ul class="poi-results"></ul></div>
      <div class="place-card" id="b" data-lat="48.8" data-lng="2.3"><ul class="poi-results"></ul></div>
    `;

    const map = { panTo: jest.fn(), setZoom: jest.fn(), fitBounds: jest.fn() };
    __setMap(map);

    const card = document.getElementById("a");
    await openCard(card, "tourist_attraction");

    expect(map.panTo).toHaveBeenCalledWith({ lat: 41.9, lng: 12.5 });
    expect(map.setZoom).toHaveBeenCalledWith(12);
    expect(card.querySelector(".poi-results").classList.contains("show")).toBe(true);
    expect(document.querySelector("#b .poi-results").classList.contains("show")).toBe(false);
  });

  test("collapseAllCards only leaves active card expanded", () => {
    document.body.innerHTML = `
      <div class="place-card" id="a"><ul class="poi-results show">x</ul></div>
      <div class="place-card" id="b"><ul class="poi-results show">y</ul></div>
    `;

    const active = document.getElementById("a");
    collapseAllCards(active);

    expect(document.querySelector("#a .poi-results").classList.contains("show")).toBe(true);
    expect(document.querySelector("#b .poi-results").classList.contains("show")).toBe(false);
    expect(document.querySelector("#b .poi-results").innerHTML).toBe("");
  });

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

    global.google.maps.places.Place.searchNearby.mockResolvedValue({ places: [placeA, placeB] });

    await fetchPOIs(card, "restaurant");

    expect(card.querySelectorAll("li").length).toBe(2);
    expect(__getPoiMarkers().length).toBe(2);
    expect(map.fitBounds).toHaveBeenCalled();
  });

  test("clearPoiMarkers removes marker references", () => {
    const markerA = { setMap: jest.fn() };
    const markerB = { setMap: jest.fn() };
    __setPoiMarkers([markerA, markerB]);

    clearPoiMarkers();

    expect(markerA.setMap).toHaveBeenCalledWith(null);
    expect(markerB.setMap).toHaveBeenCalledWith(null);
    expect(__getPoiMarkers()).toEqual([]);
  });

  test("hydrateCityImages updates placeholder image from places api", async () => {
    document.body.innerHTML = `
      <div class="place-card" data-city="rome" data-lat="41.9" data-lng="12.5">
        <img class="place-photo" src="data:image/gif;base64,R0lGODlhAQAB" />
      </div>
    `;

    mockGoogleBase();
    window.google = global.google;

    global.google.maps.places.Place.searchNearby.mockResolvedValue({
      places: [{ photos: [{ getURI: jest.fn(() => "https://img/city.jpg") }] }],
    });

    await hydrateCityImages();

    expect(document.querySelector(".place-photo").src).toContain("https://img/city.jpg");
  });
});

describe("booking page and helpers", () => {
  test("formatType returns correct labels", () => {
    expect(formatType("restaurant")).toBe("🍽 Restaurant");
    expect(formatType("lodging")).toBe("🏨 Hotel");
    expect(formatType("tourist_attraction")).toBe("📍 Attraction");
  });

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

    window.history.pushState(
      {},
      "",
      "http://localhost/book.html?city=rome&date=2026-06-01&adults=2&children=1&toddlers=0&babies=0"
    );

    setupBookPage();
    jest.advanceTimersByTime(150);
    await flushPromises();

    expect(document.querySelector(".package-hero h1").textContent).toBe("Rome City Package");
    expect(document.getElementById("summaryCity").textContent).toBe("Rome");
    expect(document.getElementById("summaryGuests").textContent).toContain("2 adults");

    jest.useRealTimers();
  });

  test("getBookingParams reads URL and storage safely", () => {
    window.sessionStorage.setItem(
      "ECS_SEARCH",
      JSON.stringify({ city: "berlin", date: "2026-07-10", adults: 0, children: -1, toddlers: -3, babies: 2 })
    );

    expect(getBookingParams()).toEqual({
      city: "berlin",
      date: "2026-07-10",
      adults: 1,
      children: 0,
      toddlers: 0,
      babies: 2,
    });
  });

  test("setHeroPhotoWhenReady stops when API is unavailable", () => {
    jest.useFakeTimers();
    expect(() => setHeroPhotoWhenReady("rome city")).not.toThrow();
    jest.advanceTimersByTime(8200);
    jest.useRealTimers();
  });

  test("setHeroPhotoFromPlaces applies background image", async () => {
    document.body.innerHTML = `<div class="package-image"></div>`;

    mockGoogleBase();
    window.google = global.google;
    const getURI = jest.fn(() => "https://img/hero.jpg");

    global.google.maps.places.Place.searchByText.mockResolvedValue({
      places: [{ photos: [{ getURI }] }],
    });

    await setHeroPhotoFromPlaces("rome city");

    expect(global.google.maps.places.Place.searchByText).toHaveBeenCalled();
    expect(getURI).toHaveBeenCalledWith({ maxWidth: 1400, maxHeight: 800 });
    expect(document.querySelector(".package-image").style.backgroundSize).toBe("cover");
    expect(document.querySelector(".package-image").style.backgroundPosition).toBe("center");
  });

  test("setupThankYouPage populates booking summary", () => {
    document.body.innerHTML = `
      <div id="bookingDestination"></div>
      <div id="bookingGuests"></div>
      <div id="bookingPackage"></div>
    `;

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

  test("titleCaseCity converts slug format", () => {
    expect(titleCaseCity("new-york")).toBe("New York");
    expect(titleCaseCity("")).toBe("");
  });
});
