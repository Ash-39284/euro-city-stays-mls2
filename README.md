# Euro City Stays

![Home Page Screenshot](./assets/images/home-page-screenshot.png)


# Introduction

I built this project as a travel-booking concept site focused on quick discovery and a simple booking flow.
The main idea was to let users search a destination, explore attractions/food/hotels with map support, and then complete a booking form with a live summary.
I kept the UI straightforward on purpose so the journey feels clear from home page to confirmation page.

# Table of Contents

1. [UX](#ux)
    - [Project Goals](#project-goals)
    - [User Goals](#user-goals)
    - [User Stories](#user-stories)
    - [Developer Goals](#developer-goals)
    - [Design Choices](#design-choices)
        - [Figma Designs](#figma-designs)
2. [Features](#features)
    - [Existing Features](#existing-features)
    - [Features To Implement](#features-to-implement)
3. [Technologies Used](#technologies-used)
4. [Testing](#testing)
    - [Code Validation](#code-validation)
    - [Bugs discovered](#bugs-discovered)
    - [Manual Testing](#manual-testing)
    - [Automated Testing](#automated-testing)
    - [JavaScript Unit Testing (Jest)](#javascript-unit-testing-jest)
5. [Deployment](#deployment)
    - [How To Run The Project Locally](#how-to-run-the-project-locally)
6. [Credits](#credits)
    - [Content](#content)
    - [Code](#code)
    - [Images](#images)
    - [API's](#apis)
    - [Acknowledgements](#acknowledgements)

# UX

## Project Goals

The project goal was to create a clean, beginner-friendly web app for planning a short European city break.
I wanted users to do three things without confusion:
1. search for a city,
2. explore points of interest,
3. complete a booking form with clear feedback.

## User Goals

As a potential user I want:

- To quickly find destinations offered by the site.
- To search and compare cities without leaving the website.
- To complete a booking with a clear summary before final confirmation.


## User Stories

As a potential user I want:

- To browse different destination cards.
- To view attractions, restaurants and hotels near each destination.
- To make a booking and review key details before submitting.


## Developer Goals

- Build a complete multi-page front-end project using HTML, CSS, and JavaScript.
- Practice working with third-party APIs (Google Maps / Places).
- Add realistic testing and validation evidence in the README.

## Design Choices

![Colour Hunt Colour Pallete](./assets/images/colour-pallete.png)

### Figma Designs

![Figma Desgin Home Page](./assets/images/figma-des-home-page.png)

![Figma Design Destination Page](./assets/images/figma-des-dest-page.png)

![Figma Design Booking Page](./assets/images/figma-des-book-page.png)

# Features

## Existing Features

### Images

Destination cards and homepage visuals are image-led to make browsing feel more engaging and less text-heavy.

### Interactive Places Map

The map is the core interactive feature. Users can open a city card and view nearby places by type (attractions, food, hotels), which makes the page feel useful rather than static.

### Booking Form

The booking form is a front-end flow only (no payment integration), but it supports real user interaction:
date selection, guest counts, package tier selection, and a confirmation summary page.

## Features To Implement

### Link Booking page to payment secure sequence

The next major step would be adding a secure checkout flow.
At the moment, the booking journey is intentionally a demo flow that ends at confirmation.

### Map and selected card view on one page view 

At the moment, users may still need to scroll to switch between card content and map context.
I would like to improve this with a tighter side-by-side layout on larger screens.

### Be able to track/ book live flights from home search bar

A future enhancement would be adding live flight data (search and pricing) to make the product feel more complete.

# Technologies Used

- HTML

Used for semantic page structure across all views (`index`, `destinations`, `book`, `thank-you`).

- CSS

Used for project-specific styling, layout refinements, and responsive behaviour in `assets/css/style.css`.

- JavaScript

JavaScript is organised in external files inside `assets/js/` and loaded near the end of each HTML page.
The main interactive logic is in `assets/js/script.js` and is responsible for form handling, map behaviour, booking summary updates, and thank-you page rendering.

- Bootstrap

Bootstrap v5.3 is used for base components (navbar, layout grid, spacing utilities) and responsive structure.

- Markdown

Used to document planning, testing, deployment, and credits in this README.

- Jest

Jest is used for JavaScript unit testing in this project. Tests are stored in `assets/js/script.test.js` and run against functions in `assets/js/script.js`.

# Testing

## Testing Approach

This project uses both **automated** and **manual** testing:

- Automated testing is used for repeatable logic checks (form handling, query parsing, map helper behaviour, and utility functions). It is best used during active development and before every commit/deploy.

- Manual testing is used for layout, usability, real user flows, and responsive behaviour across viewport sizes. It is best used after UI updates and as a final pre-deployment check.

Both approaches are required because automated tests are fast and consistent, while manual testing validates real user experience and visual correctness.

## JavaScript Unit Testing (Jest)

To run JavaScript tests:

1. Install Node.js (LTS) if it is not already installed.
2. Run `npm install`
3. Run `npm test`

Included test file:

- `assets/js/script.test.js`

This test suite covers every exported function in `assets/js/script.js`:

- `setupHomePage()`
- `setupGuestsDropdown()`
- `setupDestinationsPage()`
- `initMapWhenReady()`
- `initMap()`
- `attachCardClickHandlers()`
- `autoOpenCityFromSearch()`
- `openCard()`
- `collapseAllCards()`
- `fetchPOIs()`
- `clearPoiMarkers()`
- `hydrateCityImages()`
- `formatType()`
- `setupBookPage()`
- `getBookingParams()`
- `setHeroPhotoWhenReady()`
- `setHeroPhotoFromPlaces()`
- `setupThankYouPage()`
- `titleCaseCity()`

Current test status:

- `19` tests passing in `1` test suite (`npm test`)

![Jest testing](./assets/images/jest-test.png)

## Code Validation 

- ![index.html validation](./assets/images/index.html-validator.png)

- ![destinations.html validation](./assets/images/destinations.html-validator.png)

- ![book.hmtl validation](./assets/images/book.html-validator.png)

- ![thank-you.html validation](./assets/images/thank-you.html-validator.png)

- ![stlye.css validation](./assets/images/css-validator.png)

## Linting (JS, HTML, CSS)

Lint checks are run with:

- `npm run lint:js`
- `npm run lint:css`
- `npm run lint:html`
- `npm run lint`

Latest lint run (`npm run lint`):

- JavaScript: pass (`3` files)
- CSS: pass (`1` file)
- HTML: pass (`4` files)


## Site Screenshots

![Home Page Screenshots](./assets/images/home-dsktp.png)

![Destinations Page Screenshots](./assets/images/destinations-dsktp.png)

![Booking Page Screenshots](./assets/images/booking-dsktp.png)

## Site Loading Times

I checked performance with Lighthouse in Chrome DevTools during development, mainly because the project uses multiple images and external scripts.
The latest report screenshot is below.

![LighHouse Report](./assets/images/lighthouse-report.png)


## Navigation
During development I repeatedly tested all links/buttons to confirm routing worked as expected.
The table below records the final check.

| Button | Destination | Working |
|--------|-------------|---------|
|Logo    |Top home page|   Yes   |
|Home    |Top home page| Yes     |
|Destinations    |destinations.html|   Yes   |
|BOOK NOW!   |book.html|   Yes   |
|Search Button| destinations.html| yes|
|Attractions|Drop down menu| Yes |
|Food|Drop down menu| Yes |
|Hotels|Drop down menu| Yes |
|Book Now|book.html| Yes |

## Responsiveness

Bootstrap handles most responsive behaviour in this project.
I also added custom media queries in `style.css` for areas that needed tighter control (image spacing, card layout, and page-level spacing on small screens).

## Mobile View

![Home Page Mobile View](./assets/images/home-mob-view.png)

![Destinations Page Mobile View](./assets/images/dest-mob-view.png)

![Booking Page Mobile View](./assets/images/book-mob-view.png)


## Tablet View 

![Home Page Tablet View](./assets/images/home-tblt-view.png)

![Destinations Page Tablet View](./assets/images/dest-tblt-view.png)

![Booking Page Tablet View](./assets/images/book-tblt-view.png)

# Bugs discovered

The first bug I hit was image overlap on the home page at tablet widths.

![Overlapping images](./assets/images/overlap-issue.png)

Code used with the issues:

` <div class="col-md-4">
        <img  src="./assets/images/aero-view.jpg" class="image-fluid rounded-4" alt="view of a country landscape from an aeroplane">
      </div>`

This was my original code. I was trying to keep the layout responsive with Bootstrap classes.

The code to fix it:

` <div class="row g-4 text-center p-5">
      <div class="col-md-4">
        <img  src="./assets/images/aero-view.jpg" class="img-fluid rounded-4" alt="view of a country landscape from an aeroplane">
      </div>`

The second bug happened after wiring destination cards to the Google Maps API: the Copenhagen card did not interact with the map.

![Copenhagen card issue](./assets/images/card-issue.png)

The issue was a typo in the dataset attribute:

`data-lang="'12.5683"`

This is the code that fixed the error:

`data-lng="12.5683"`

# Manual Testing

Manual testing was completed across desktop, tablet, and mobile viewport sizes using browser developer tools and real user flows from search to booking confirmation.

| Area Tested | Test Action | Expected Result | Result |
|---|---|---|---|
| Navigation links | Click `Home`, `Destinations`, `BOOK NOW`, and logo links | Each route opens the correct page with no broken links | Pass |
| Home page validation | Submit search form with no destination selected | User sees alert: `Please select a city.` and form is not submitted | Pass |
| Guest dropdown controls | Increase/decrease adults, children, toddlers, babies from guest selector | Counts update correctly, adults do not go below 1, summary updates | Pass |
| Search flow | Submit valid city from home page search | User is routed to `destinations.html?city=<city>` | Pass |
| Destination card interaction | Click a destination card and then a different card | Active card expands, previous card collapses, POI list updates | Pass |
| POI filters | Click Attractions / Food / Hotels filters on a destination card | Related nearby places are rendered for the selected category | Pass |
| Map behaviour | Open a destination card with map loaded | Map pans/zooms to selected city and shows place markers | Pass |
| Booking page prefill | Open `book.html` with query params from search | City, date and guest values are prefilled in booking summary | Pass |
| Booking tier updates | Switch between package tiers | Price/tier summary updates immediately | Pass |
| Thank-you page summary | Complete booking form submission | `thank-you.html` shows destination, guests, and package tier | Pass |
| Responsive layout | Test mobile, tablet, desktop widths | Layout remains readable, images and cards scale correctly | Pass |

Notes from manual testing:
- A previously identified card/map bug (`data-lang` typo) was fixed to `data-lng`, restoring Copenhagen card map behaviour.
- A tablet image overlap issue was fixed by using `img-fluid` in Bootstrap.



# Automated Testing

Automated testing is implemented with **Jest** and focuses on JavaScript logic in `assets/js/script.js`.

## Test Scope

The suite in `assets/js/script.test.js` covers:
- Home page setup and validation
- Guest dropdown state updates
- Destination page map initialisation and fallback handling
- Destination card open/collapse behaviour
- Nearby places fetch and marker cleanup
- City image hydration via Google Places API mocks
- Booking page query/sessionStorage parsing
- Hero image loading helpers
- Thank-you page summary rendering
- Utility helpers such as city title formatting

## How To Run

1. Install dependencies:
   `npm install`
2. Run test suite:
   `npm test`

## Current Status

Latest run result:
- `1` test suite passed
- `19` tests passed
- `0` tests failed

Command used:
- `npm test -- --runInBand --watchAll=false`

## Development vs Deployment Verification

To confirm the deployed version matches development:

1. Run local checks:
   - `npm run lint`
   - `npm test -- --runInBand --watchAll=false`
2. Open the deployed site and repeat the manual journey:
   - home search
   - destination interactions
   - booking form submission
   - thank-you summary checks
3. Compare expected outcomes with the manual test table in this README.

Current status:

- Development checks: pass (`lint` and `test`)
- Manual flow checks: pass (see Manual Testing table)
- No internal JavaScript errors are intentionally emitted to console in normal fallback paths; failures are handled with UI fallbacks.


# Deployment 

I developed this project in VS Code, used Git for version control, and pushed to GitHub.
Deployment is via GitHub Pages from the repository:
[Ash-39284/euro-city-stays-mls2](https://github.com/Ash-39284/euro-city-stays-mls2)

Deployment steps used:
1. Open the repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. Under `Build and deployment`, set source to `Deploy from a branch`.
4. Select the branch used for deployment (for this project: `master`) and save.
5. Wait for GitHub Pages to publish and refresh the page to get the live site URL.


## How To Run The Project Locally

1. Open the repository: [GitHub Repository](https://github.com/Ash-39284/portfolio-project)
2. Copy the HTTPS clone URL from the green `Code` button.
3. In your terminal, move to the directory where you want the project.
4. Run `git clone <repo-url>`.
5. Open the project in your IDE.

# Credits

- The code for the navigation bar was taken from [Bootstrap](https://getbootstrap.com/docs/5.3/components/navbar/#supported-content)

- The API key was sourced from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials?hl=en&project=project-45b0c08b-fd0a-4d9f-988)

- The colour hex numbers were taken from [Colour Hunt](https://colorhunt.co/palette/8ce4fffeee91ffa239ff5656)

## External vs Project Code

Project-authored interactive code:

- `assets/js/script.js`
- `assets/js/script.test.js`
- `assets/css/style.css`
- HTML pages in the project root

External source code/libraries:

- Bootstrap CSS/JS loaded via CDN in HTML pages
- jQuery loaded via CDN (`index.html`, `destinations.html`)
- Google Maps/Places API loaded via CDN script tags
- Font Awesome kit loaded via CDN (`destinations.html`)

External code is only included via script/link imports and is kept separate from project-authored source files.

## Content

All text within the project is sourced by me (Ashley Roberts).

The colour palette was sourced from [Colour Hunt](https://colorhunt.co/palette/8ce4fffeee91ffa239ff5656)

## Code 

- The code for the navigation bar was taken from [Bootstrap](https://getbootstrap.com/docs/5.3/components/navbar/)

- The colour hex numbers were taken from [Colour Hunt](https://colorhunt.co/palette/8ce4fffeee91ffa239ff5656)

- The API key was created in Google Cloud Console: [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/api-list?project=project-45b0c08b-fd0a-4d9f-988)

## Images

- The images for the destination cards on destination.html and the header on the book.html page are sourced from the Google Places API New [Places API New](https://console.cloud.google.com/marketplace/product/google/places.googleapis.com?q=search&referrer=search&hl=en&project=project-45b0c08b-fd0a-4d9f-988)

- The images used on the home page underneath the search bar were sourced from Unsplash:
    - Plane view image: Image taken by Alex Muzenhardt[Plane View Image](https://unsplash.com/photos/airplane-wing-against-a-clear-blue-sky-over-land-HbufZgpP_xM) 

    ![Plane View reference image](./assets/images/plane-view-home-page.png)

    - Colleseum image: Image taken by David Kohler [Colleseum Image](https://unsplash.com/photos/colosseum-arena-photography-VFRTXGw1VjU)

    ![Colleseum reference image](./assets/images/colleseum-home-page.png)

    - Eiffiel Tower image: Image taken by Anthony Delanoix [Eiffiel Tower Image](https://unsplash.com/photos/eiffel-tower-at-paris-france-QAwciFIS1g4)

    ![Eiffiel Tower reference image](./assets/images/eiffel-tower-home-page.png)

## API's

The API key is integrated with Google Maps and Google Places APIs.
[Google API Key Console](https://console.cloud.google.com/google/maps-apis/credentials?project=project-45b0c08b-fd0a-4d9f-988)

## Acknowledgements

This project was coded and completed by Ashley Roberts (2026)
