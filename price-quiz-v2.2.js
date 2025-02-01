const isStaging = window.location.hostname.includes("webflow.io");

let APPROVED_INSURANCES;
let eligibleStates;

document.addEventListener("DOMContentLoaded", () => {
  initializeSwiper();
  addPriceFormListeners();
  trackSurveyStartToSimplifi();
  initializeBraze();
  handleNoneCheckbox();
  initializeGrowSurf();

  if (window.location.href.includes("#plan")) {
    displayPaymentForm();
    const prediction = localStorage.getItem("quiz_prediction");
    if (prediction) {
      document.querySelector('[data-id="prediction"]').textContent = prediction;
    } else {
      document.getElementById("quizPredictionHeading").style.display = "none";
    }

    try {
      const quizAnswers = JSON.parse(
        localStorage.getItem("quizAnswers") || "{}"
      );
      if (quizAnswers.Insurance == "Government") {
        toggleGovtPriceAvailability();
      }
    } catch (error) {
      console.error("Error parsing quiz answers from localStorage:", error);
    }
  }

  // try pre-populate email and phone
  try {
    const { email, phone } = localStorage;

    const emailInput = document.getElementById("email");
    if (email && emailInput) {
      emailInput.value = email;
    }

    const phoneInput = document.getElementById("phone");
    if (phone && phoneInput) {
      phoneInput.value = phone;
    }
  } catch (error) {
    console.error("Error accessing localStorage:", error);
  }
});

const nextButton = document.querySelector("#quiz-next-button");
const submitButton = document.querySelector(`[data-id="submit-button"]`);

function initializeSwiper() {
  new Swiper(".swiper", {
    effect: "fade",
    fadeEffect: { crossFade: true },
    navigation: {
      nextEl: "#quiz-next-button",
      prevEl: "#quiz-back-button",
    },
    pagination: {
      el: ".quiz-progress-fill",
      type: "progressbar",
    },
    allowTouchMove: false,
    allowSlideNext: false,
    /*   speed: 150, */
    autoHeight: true,
    hashNavigation: {
      watchState: true,
    },
    on: {
      afterInit: swiperInstanceInitialized,
      slideChange: swiperSlideChanged,
      navigationNext: swiperNavigationNextClicked,
      reachEnd: swiperReachEnd,
    },
    noSwipingSelector: `select, input`,
  });
}

const swiperInstanceInitialized = (swiper) => {
  const loadingDiv = document.querySelector(".loading-div");
  loadingDiv.style.opacity = "0";
  setTimeout(() => {
    loadingDiv.style.display = "none";
  }, 250);

  trackSlideChange(swiper.slides[swiper.activeIndex]);
  togglePrevButton(swiper);
  attachInputChangeListeners(swiper);
  handleMotivationSelection(swiper);
};

const swiperSlideChanged = (swiper) => {
  console.log("Swiper slide Changed", swiper.activeIndex);
  trackSlideChange(swiper.slides[swiper.activeIndex]);
  toggleNextButtonAndSubmitDisplay(swiper);
  togglePrevButton(swiper);
  setTimeout(() => {
    swiper.allowSlideNext = validateSlide(swiper);
  }, 1);
};

const togglePrevButton = (swiper) => {
  const prevButton = document.getElementById("quiz-back-button");
  const nextButton = document.getElementById("quiz-next-button");

  if (swiper.isBeginning) {
    prevButton.style.display = "none";
    if (window.innerWidth >= 1024) {
      nextButton.style.width = "100%";
    }
  } else {
    prevButton.style.display = "flex";
    if (window.innerWidth >= 1024) {
      nextButton.style.width = "50%";
    }
  }
};

const swiperNavigationNextClicked = (swiper) => {
  console.log("Next Clicked");
  console.log("Allow Slide Next", swiper.allowSlideNext);
  if (!swiper.allowSlideNext) {
    validateSlide(swiper, true);
  }
};

const swiperReachEnd = (swiper) => {
  stripePaymentElementsInitialized = true;
};

const trackSlideChange = (slide) => {
  const slideEventValue =
    slide.getAttribute("data-slide-event") || "No data-slide-event found";

  window.dataLayer.push({
    event: "quiz_slide_change",
    event_category: "Quiz",
    event_label: slideEventValue,
  });
};

const toggleNextButtonAndSubmitDisplay = (swiper) => {
  if (swiper.isEnd) {
    nextButton.classList.add("hidden");
    submitButton.classList.remove("hidden");
  } else {
    nextButton.classList.remove("hidden");
    submitButton.classList.add("hidden");
  }
};

const validateSlide = (swiper, report = false) => {
  const currentSlide = swiper.slides[swiper.activeIndex];
  const inputs = Array.from(
    currentSlide.querySelectorAll(
      "input[required], select[required], textarea[required]"
    )
  );
  const allValid = inputs.every((input) => {
    const isValid = input.checkValidity();
    if (!isValid && report) {
      console.log("Reporting validity");
      input.reportValidity();
    }
    return isValid;
  });
  swiper.allowSlideNext = allValid;
  return allValid;
};

let alreadyAdvancedHeightSlide = false;

const attachInputChangeListeners = (swiper) => {
  swiper.el.addEventListener("input", (e) => {
    const targetElement = e.target;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(targetElement.tagName)) {
      validateSlide(swiper);

      if (targetElement.id === "weight") {
        if (targetElement.value !== "") {
          targetElement.value = Math.max(0, Math.min(999, targetElement.value));
        }
      }

      if (targetElement.id === "height" && targetElement.value !== "") {
        const range = healthyWeightRange(targetElement.value);

        if (range) {
          const minWeightRequirement = document.querySelector(
            '[data-id="minimum-weight-range"]'
          );
          const minRecommendedWeight = document.querySelector(
            '[data-id="minimum-recommended-weight"]'
          );

          if (minWeightRequirement && minRecommendedWeight) {
            minWeightRequirement.textContent = range.lower;
            minRecommendedWeight.textContent = range.upper;
          } else {
            console.error("Elements for displaying weight range not found");
          }
        }
      }

      // Check if the input is a radio button and it's checked
      if (targetElement.type === "radio" && targetElement.checked) {
        // Don't auto-advance if it's a motivation radio button
        if (targetElement.name !== "Motivation") {
          setTimeout(() => {
            swiper.slideNext();
          }, 500);
        }
      }

      // Check if the input id is "weight" and the input length is more than 2
      const weightProgressNote = document.querySelector(
        '[data-id="weight-progress-note"]'
      );

      if (targetElement.id === "weight" && targetElement.value.length > 1) {
        $(weightProgressNote).fadeIn("fast").css("display", "flex");
      } else if (targetElement.id === "weight") {
        $(weightProgressNote).fadeOut("fast");
      }

      // Check if the input id is "ideal-weight" and the input length is more than 2 then fade in note

      const idealWeightNote = document.querySelector(
        '[data-id="ideal-weight-note"]'
      );

      if (
        targetElement.id === "ideal-weight" &&
        targetElement.value.length > 1
      ) {
        $(idealWeightNote).fadeIn("fast").css("display", "flex");
      } else if (targetElement.id === "ideal-weight") {
        $(idealWeightNote).fadeOut("fast");
      }

      // update expert text, if radio value is expert
      if (
        targetElement.getAttribute("name") === "Familiarity" &&
        targetElement.value === "Expert"
      ) {
        const infoText = document.getElementById("info-text");
        const additionalText =
          "OK, we know you're an expert, but just to recap:";

        if (!infoText.innerHTML.includes(additionalText)) {
          infoText.innerHTML = `${additionalText} ${infoText.innerHTML}`;
        }
      }

      if (targetElement.getAttribute("name") === "Insurance") {
        window.dataLayer.push({
          event: "quiz_answer_insurance",
          event_label: targetElement.value,
        });
      }
    }
  });
};

/* ----------------------- QUIZ FORM SUBMISSION BELOW ----------------------- */

const quizForm = document.querySelector('[data-id="quiz-form"]');
const WEIGHT_INPUT = document.getElementById("weight");
const HEIGHT_INPUT = document.getElementById("height");
const PREDICTION_DISPLAY = document.querySelector('[data-id="prediction"]');

function getFormData(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function displayBlockById(id) {
  if (document.getElementById(id)) {
    document.getElementById(id).style.display = "block";
  }
}

function checkBMIEligibility(bmi) {
  if (parseInt(bmi) < 25.0) {
    showNotEligibleBlock("bmiNotEligible");
    return false;
  } else {
    return true;
  }
}

function checkInsuranceEligibility() {
  const insurance = getFormData("Insurance");

  if (insurance === "Government") {
    displayBlockById("insuranceCheckoutNote");
    toggleGovtPriceAvailability();
  } else if (["Uninsured", "Kaiser"].includes(insurance)) {
    displayBlockById("insuranceCheckoutNote");
  }
  // soft block
  return true;
}

function checkAgeEligibility() {
  const ageRange = getFormData("Age-Range");

  if (["<18", "65+"].includes(ageRange)) {
    showNotEligibleBlock("ageNotEligible");
    return false;
  }
  return true;
}

/**
 * Toggles the government pricing options and hides specific price option.
 */
function toggleGovtPriceAvailability() {
  const priceOptions = document.querySelector('[data-id="price-options"]');
  if (priceOptions) {
    priceOptions.classList.add("is-govt");
  }

  const specificPriceOption = document.querySelector('[data-price="9"]');
  if (specificPriceOption) {
    specificPriceOption.remove();
  }
  setTimeout(function () {
    document.querySelector('[data-price="19"]')?.click();
  }, 50);
}

const animatePredictionValue = (prediction) => {
  const options = {
    duration: 6,
    easingFn(t, b, c, d) {
      let ts = (t /= d) * t;
      let tc = ts * t;
      return b + c * (tc + -3 * ts + 3 * t);
    },
  };

  const predictionDisplays = document.querySelectorAll(
    '[data-id="prediction"]'
  );
  predictionDisplays.forEach((display) => {
    const numAnim = new countUp.CountUp(display, prediction, options);
    numAnim.start();
    display.textContent = prediction;
  });
};

function displayPaymentForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const promo = urlParams.get("promo");

  setTimeout(() => {
    $("#quiz-form-wrapper").fadeOut("fast", () => {
      $(`[data-id="payment-embed"]`).fadeIn("fast");
      if (Webflow) {
        Webflow.resize.up();
      }
    });

    if (promo !== "share") {
      window.dataLayer.push({
        event: "price_plans_shown",
      });
    }
  }, 250);

  try {
    if (promo === "share") {
      const toggleDisplay = (selector, displayStyle) => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.display = displayStyle;
        }
      };

      // Hide the 'choose price' wrapper
      toggleDisplay('[data-id="choose-price-wrapper"]', "none");

      // Show the 'direct checkout' wrapper
      toggleDisplay('[data-id="direct-checkout-wrapper"]', "block");

      // Update the href for the 'direct checkout' button
      const checkoutButton = document.querySelector(
        '[data-id="direct-checkout-button"]'
      );
      if (checkoutButton) {
        checkoutButton.href = `/checkout?promo=${promo}`;
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

function fireConfetti() {
  var defaults = {
    scalar: 2,
    spread: 270,
    particleCount: 50,
    origin: { y: 0.4 },
    startVelocity: 35,
  };

  confetti({
    ...defaults,
    shapes: ["image"],
    shapeOptions: {
      image: {
        src: "https://particles.js.org/images/pumpkin.svg",
        replaceColor: true,
        width: 32,
        height: 40,
      },
    },
    colors: ["#ff9a00", "#ff7400", "#ff4d00"],
  });
}

function showNotEligibleBlock(reason) {
  try {
    const notEligibleBlock = document.querySelector("#notEligible");
    const reasonBlock = document.querySelector(`#${reason}`);
    const purchaseBlock = document.querySelector("#purchaseBlock");

    setTimeout(function () {
      $(quizForm).fadeOut("fast", () => {
        $(notEligibleBlock).fadeIn("fast");
        $(reasonBlock).fadeIn("fast");
        $(purchaseBlock).fadeOut();
      });
    }, 250);

    window.dataLayer.push({
      event: "not_eligible",
      event_label: reason,
    });
  } catch (error) {
    console.error("Error in showNotEligibleBlock:", error);
  }
}

// Assuming this is within your existing code where you define the optInCheckbox and phoneInput
const optInCheckbox = document.querySelector('input[type="checkbox"][name="Opt-In"]');
const phoneInput = document.getElementById("phone");

// Add an event listener to the opt-in checkbox
if (optInCheckbox) {
  optInCheckbox.addEventListener("change", () => {
    // Check if the checkbox is checked and the phone input is empty
    if (optInCheckbox.checked && (!phoneInput || phoneInput.value.trim() === "")) {
      alert("Please fill in your phone number to opt-in for SMS marketing."); // Show a popup
      phoneInput.focus(); // Optionally, focus on the phone input for user convenience
    }
  });
}

quizForm.addEventListener("submit", (e) => {
  const weight = WEIGHT_INPUT.value;
  const height = HEIGHT_INPUT.value;

  const email = document.getElementById("email").value;
  // initializePlaceholder(email);
  localStorage.setItem("email", email);

  const bmi = calculateBMI(height, weight);
  const prediction = getWeight(height, weight);
  localStorage.setItem("quiz_prediction", prediction);

  try {
    if (!checkBMIEligibility(bmi.bmi)) return;
    if (!checkAgeEligibility()) return;
    if (!checkInsuranceEligibility()) return; // soft block
  } catch (e) {
    console.log(e);
  }

  animatePredictionValue(prediction);

  displayPaymentForm();
  window.location.hash = "plans";

  const formDataInstance = new FormData(
    document.getElementById("prediction-form")
  );

  const optInCheckbox = document.querySelector(
    'input[type="checkbox"][name="Opt-In"]'
  );

  const phoneInput = document.getElementById("phone");

  if (optInCheckbox) {
    const sms_mktg_opt_in =
      optInCheckbox.checked && phoneInput && phoneInput.value.trim() !== "";
    formDataInstance.set("sms_mktg_opt_in", sms_mktg_opt_in);
    formDataInstance.delete("Opt-In");
  }

  // transform on & off to true & false
  const formData = Array.from(formDataInstance.entries()).reduce(
    (obj, [key, value]) => {
      obj[key] = value === "true" ? true : value === "false" ? false : value;
      return obj;
    },
    {}
  );

  // add more keys
  Object.assign(formData, {
    bmi: bmi.bmi,
    bmi_class: bmi.classification,
    prediction: prediction,
    source: "quiz_checkout",
  });

  try {
    localStorage.setItem("quizAnswers", JSON.stringify(formData));
  } catch (error) {
    console.log(error);
  }

  try {
    trackToGTM(formData);
    createBrazeUser(formData);
    trackToShareASale();
    trackSurveyCompleteToSimplifi();
    trackToGrowSurf(email);
  } catch (error) {
    console.error("Error in checkout tracking:", error);
  }

  
});

function formDataToObject(formData) {
  const formObject = {};
  for (let [key, value] of formData.entries()) {
    if (key in formObject) {
      if (!Array.isArray(formObject[key])) {
        formObject[key] = [formObject[key]];
      }
      formObject[key].push(value);
    } else {
      formObject[key] = value;
    }
  }
  return formObject;
}

function initializeBraze() {
  if (!braze) {
    console.error("Braze unavailable for initialization");
    return;
  }

  const config = {
    apiKey: isStaging
      ? "eb6e2c94-2401-40ea-b4ee-bc75de73d716"
      : "3e61333b-f1e0-444b-870c-6d0314d8b892",
    sdkEndpoint: "sdk.iad-02.braze.com",
  };
  braze.initialize(config.apiKey, {
    baseUrl: config.sdkEndpoint,
    enableLogging: true,
  });
}

function createBrazeUser(data) {
  if (!braze) {
    console.error("Braze unavailable for user");
    return;
  }

  const normalizedData = {
    ...data,
    email: data.Email || data.email,
    phone: data.Phone || data.phone
  };

  const { phone, email, sms_mktg_opt_in: smsOptIn = false, ...rest } = normalizedData;

  const user = braze.getUser();
  if (!user) return;

  const subscriptions = isStaging
    ? {
        emailMktg: "dc158ade-c631-4b8f-a0c9-e5a4d20584bd",
        smsTxn: "4a0c8815-454f-447e-9985-4f96644b2c81",
        smsMktg: "6f899036-f31f-489e-a616-024bd8ee8f7f",
      }
    : {
        emailMktg: "dd1169fb-6838-452f-a6de-79e350927e81",
        smsTxn: "0e2326af-5ab4-4fea-a916-e7a37e09b069",
        smsMktg: "033501a5-3110-4d95-90c8-b453c3123308",
      };

  if (email) {
    const sanitizedEmail = email.trim().toLowerCase();
    user.setEmail(sanitizedEmail);
    user.addAlias(sanitizedEmail, "email");
    user.addToSubscriptionGroup(subscriptions.emailMktg);
  }

  if (phone) {
    user.setPhoneNumber(phone);

    // Add the user to the transactional SMS group by default
    user.addToSubscriptionGroup(subscriptions.smsTxn);

    // Add the user to the marketing SMS group if they opted in
    if (smsOptIn) {
      user.addToSubscriptionGroup(subscriptions.smsMktg);
    }
  }

  Object.entries(rest).forEach(([key, value]) =>
    user.setCustomUserAttribute(key, value)
  );
  
  braze.logCustomEvent("Quiz_Flow_Complete", {
    ...data,
    questionnaire_id: "regular",
  });
}

// New separate function for GrowSurf tracking
function trackToGrowSurf(email) {
  const sanitizedEmail = email.trim().toLowerCase();
  try {
    // Wait for GrowSurf initialization
    const waitForGrowSurf = new Promise((resolve, reject) => {
      initializeGrowSurf();
      
      // Check every 100ms for up to 5 seconds
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkGrowSurf = setInterval(() => {
        attempts++;
        if (window.growsurf && window.growsurf.getReferrerId()) {
          clearInterval(checkGrowSurf);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkGrowSurf);
          reject(new Error('GrowSurf initialization timeout'));
        }
      }, 100);
    });

    // Add participant after successful initialization
    waitForGrowSurf
      .then(() => {
        growsurf.addParticipant(sanitizedEmail);
        console.log('Successfully added participant to GrowSurf');
      })
      .catch((error) => {
        console.error('Failed to initialize GrowSurf:', error);
      });
      
  } catch (error) {
    console.error('Error in trackToGrowSurf:', error);
  }
}

// Fetch discount and update prices

async function updatePrice(promo) {
  try {
    console.log("updating price");
    const { originalPrice, priceOff, finalPrice } = await fetchPriceWithPromo(
      promo
    );

    console.log(`Original Price: ${originalPrice}`);
    console.log(`Price Off: ${priceOff}`);

    const PRICE = finalPrice;

    const buttonPriceElement = document.getElementById("button-price");
    const checkoutPriceElement = document.getElementById("checkout-price");

    // new element for 2 week trial
    const checkoutPrices = document.querySelectorAll(
      '[data-id="checkout-price"]'
    );
    checkoutPrices.forEach((priceElement) => {
      priceElement.textContent = PRICE;
    });

    const checkoutDiscountElement =
      document.getElementById("checkout-discount");

    if (buttonPriceElement && checkoutPriceElement) {
      buttonPriceElement.textContent = PRICE;
      checkoutPriceElement.textContent = PRICE;
    }

    if (checkoutDiscountElement) {
      checkoutDiscountElement.textContent = priceOff;
    }
    console.log("price updated");
  } catch (error) {
    console.error(error);
  }
}

/* ------------------------- PREDICTION & MIN WEIGHT ------------------------ */

// Minimum weight
const weightMap = {
  "4' 7\"": [79, 86],
  "4' 8\"": [82, 89],
  "4' 9\"": [85, 92],
  "4' 10\"": [88, 95],
  "4' 11\"": [91, 99],
  "5' 0\"": [94, 102],
  "5' 1\"": [97, 105],
  "5' 2\"": [101, 109],
  "5' 3\"": [104, 112],
  "5' 4\"": [107, 116],
  "5' 5\"": [111, 120],
  "5' 6\"": [114, 123],
  "5' 7\"": [118, 127],
  "5' 8\"": [121, 131],
  "5' 9\"": [125, 135],
  "5' 10\"": [128, 139],
  "5' 11\"": [132, 143],
  "6' 0\"": [136, 147],
  "6' 1\"": [140, 151],
  "6' 2\"": [144, 155],
  "6' 3\"": [148, 160],
  "6' 4\"": [152, 164],
  "6' 5\"": [156, 168],
  "6' 6\"": [160, 173],
  "6' 7\"": [164, 177],
  "6' 8\"": [168, 182],
  "6' 9\"": [172, 186],
  "6' 10\"": [176, 191],
  "6' 11\"": [181, 195],
  "7' 0\"": [185, 200],
  "7' 1\"": [190, 205],
  "7' 2\"": [194, 210],
};

function getWeightRange(height) {
  if (weightMap.hasOwnProperty(height)) {
    return {
      minRequiredWeight: weightMap[height][0],
      minRecommendedWeight: weightMap[height][1],
    };
  } else {
    return null;
  }
}

function getWeight(height, weight) {
  const minValues = {
    "4' 7\"": 85,
    "4' 8\"": 92,
    "4' 9\"": 94,
    "4' 10\"": 96,
    "4' 11\"": 99,
    "5' 0\"": 102,
    "5' 1\"": 105,
    "5' 2\"": 109,
    "5' 3\"": 112,
    "5' 4\"": 115,
    "5' 5\"": 119,
    "5' 6\"": 123,
    "5' 7\"": 126,
    "5' 8\"": 130,
    "5' 9\"": 133,
    "5' 10\"": 138,
    "5' 11\"": 143,
    "6' 0\"": 155,
    "6' 1\"": 159,
    "6' 2\"": 163,
    "6' 3\"": 167,
    "6' 4\"": 171,
    "6' 5\"": 175,
    "6' 6\"": 182,
    "6' 7\"": 186,
    "6' 8\"": 192,
    "6' 9\"": 196,
    "6' 10\"": 200,
    "6' 11\"": 204,
    "7' 0\"": 208,
    "7' 1\"": 212,
    "7' 2\"": 216,
  };

  const result = Math.floor(0.85 * weight);
  const finalValue = Math.max(
    0,
    weight - (result < minValues[height] ? minValues[height] : result)
  );
  return Math.min(finalValue, weight);
}

function calculateBMI(height, weight) {
  const heightArray = height.split("'");
  const heightFeet = parseInt(heightArray[0]);
  const heightInches = parseInt(heightArray[1].replace(" ", ""));
  const heightInMeters = (heightFeet * 12 + heightInches) * 0.0254;
  const weightInKg = weight * 0.453592;
  const bmi = weightInKg / (heightInMeters * heightInMeters);
  const bmiValue = bmi.toFixed(1);

  if (bmiValue < 18.5) {
    return { bmi: bmiValue, classification: "Underweight" };
  } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
    return { bmi: bmiValue, classification: "Healthy" };
  } else if (bmiValue >= 25 && bmiValue <= 29.9) {
    return { bmi: bmiValue, classification: "Overweight" };
  } else {
    return { bmi: bmiValue, classification: "Obese" };
  }
}

function healthyWeightRange(heightString) {
  // Parse the height string to extract feet and inches
  const matches = heightString.match(/(\d+)'\s*(\d+)/);
  if (!matches) {
    throw new Error("Invalid height format");
  }

  const heightFeet = parseInt(matches[1], 10);
  const heightInches = parseInt(matches[2], 10);

  // Convert height to meters
  const heightInMeters = heightFeet * 0.3048 + heightInches * 0.0254;

  // Compute the weight range in kilograms using healthy BMI values
  const lowerWeightKg = 18.5 * heightInMeters * heightInMeters;
  const upperWeightKg = 24.9 * heightInMeters * heightInMeters;

  // Convert weight range to pounds
  const lowerWeightPounds = lowerWeightKg / 0.453592;
  const upperWeightPounds = upperWeightKg / 0.453592;

  return {
    lower: Math.round(lowerWeightPounds), // Rounded to the nearest pound for simplicity
    upper: Math.round(upperWeightPounds),
  };
}

/* ---------------------------- PHONE VALIDATION ---------------------------- */

let interactedWithPhone = false;

document.addEventListener("DOMContentLoaded", init);

function formatAsYouType(event) {
  const phoneInput = event.target;
  interactedWithPhone = true;

  // Check if the user is attempting to clear the input or used backspace/delete on a short string
  if (
    (phoneInput.value.length <= 5 &&
      ["deleteContentBackward", "deleteContentForward"].includes(
        event.inputType
      )) ||
    phoneInput.value.length === 0
  ) {
    phoneInput.value = "";
    phoneInput.classList.remove("valid");
    phoneInput.classList.remove("invalid");
    phoneInput.setCustomValidity(""); // Reset custom validity
    return;
  }

  const formatter = new libphonenumber.AsYouType("US");
  phoneInput.value = formatter.input(phoneInput.value);

  if (libphonenumber.isValidPhoneNumber(phoneInput.value, "US")) {
    phoneInput.classList.add("valid");
    phoneInput.setCustomValidity(""); // Reset custom validity
  } else {
    phoneInput.classList.remove("valid");
    phoneInput.setCustomValidity("Please enter a valid phone number.");
  }
}

function handleInvalid(event) {
  const phoneInput = event.target;
  if (phoneInput.id === "phone" && interactedWithPhone) {
    phoneInput.classList.add("invalid");
    console.log("Invalid class added due to handleInvalid function.");
  }
}

function handleSubmit(event) {
  interactedWithPhone = true;
  const phoneInput = document.getElementById("phone");
  setValidityClasses(phoneInput);

  // Check if phone input is empty or contains only spaces
  if (phoneInput.value.trim() === "") {
    phoneInput.setCustomValidity("Phone number cannot be empty.");
  }

  if (!phoneInput.checkValidity()) {
    event.preventDefault();
    console.log("Form submission prevented.");
  }
}

function setValidityClasses(phoneInput) {
  if (phoneInput.checkValidity()) {
    phoneInput.classList.remove("invalid");
    phoneInput.classList.add("valid");
    console.log("Phone is valid. Classes updated.");
  } else {
    console.log("Phone is invalid in setValidityClasses.");
  }
}

function init() {
  const phoneInput = document.getElementById("phone");
  phoneInput.addEventListener("input", formatAsYouType);
  phoneInput.addEventListener("invalid", handleInvalid, true); // Capturing phase

  const form = document.getElementById("prediction-form");
  form.addEventListener("submit", handleSubmit);
}

/* --------------------------- TRACKING FUNCTIONS --------------------------- */

function trackToGTM(formData) {
  if (formData.height) {
    formData.Height = formData.height.replace(/(\d+)\s(\d+)/, "$1' $2\"");
  }
  if (formData.Phone) {
    formData.sms = formData.Phone;
  }

  if (formData.email) {
    formData.quizEmail = formData.email;
  }

  dataLayer.push({
    event: "quiz_complete",
    ...formData,
  });

  /*   gtag("event", "begin_checkout", {
    currency: "USD",
    value: 9,
    items: [
      {
        item_name: "Weight Loss Subscription",
        currency: "USD",
        price: 9,
        quantity: 1
      }
    ]
  }); */
}

function trackToShareASale() {
  const leadId = Math.floor(Math.random() * 1000000);
  const img = document.createElement("img");
  img.src = `https://www.shareasale.com/sale.cfm?tracking=${leadId}&amount=0.00&merchantID=141035&transtype=lead`;
  img.width = 1;
  img.height = 1;
  document.body.appendChild(img);

  setTimeout(function () {
    const script = document.createElement("script");
    script.src = "https://www.dwin1.com/51499.js";
    script.type = "text/javascript";
    script.defer = "defer";
    img.insertAdjacentElement("afterend", script);
  }, 500);
}

function addPriceFormListeners() {
  var form = document.querySelector("#wf-form-Price-Options-Form");

  document.querySelector('[data-price="9"]').click();

  // Check if the form exists to prevent errors
  if (form) {
    // Get all radio buttons within the form with the name 'Price'
    let radios = form.querySelectorAll('input[name="Price"]');

    // Define the event listener function
    let radioChangeListener = function (event) {
      // Log 'changed' with the value of the changed radio button

      promo = event.target.parentNode.dataset.price;

      let continueToCheckout = document.getElementById("continueToCheckout");
      continueToCheckout.href = `/checkout?promo=${promo}`;
      continueToCheckout.rel = "prefetch";

      console.log("radio changed to", promo);

      window.dataLayer.push({
        event: "price_change",
        event_label: promo,
      });
    };

    // Add the event listener to each radio button
    radios.forEach(function (radio) {
      radio.addEventListener("change", radioChangeListener);
    });
  }
}

const loadIframe = (url) => {
  try {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  } catch (error) {
    console.error("Error loading iframe:", error);
  }
};

const trackSurveyStartToSimplifi = () => {
  loadIframe("https://bttrack.com/Pixel/Conversion/16197/surveystart");
};

const trackSurveyCompleteToSimplifi = () => {
  loadIframe("https://bttrack.com/Pixel/Conversion/16197/surveycomplete");
};

let removedSlides = {};

function handleMotivationSelection(swiper) {
  const motivationInputs = document.querySelectorAll('input[name="Motivation"]');
  
  motivationInputs.forEach(input => {
    input.addEventListener('change', async (e) => {
      const selectedMotivation = e.target.value.toLowerCase();
      console.log('Selected motivation:', selectedMotivation);
      
      // Remove all motivation content slides first
      swiper.slides.forEach((slide) => {
        const slideEvent = slide.getAttribute('data-slide-event');
        if (slideEvent && slideEvent.startsWith('motivation_')) {
          toggleSlide(swiper, true, slideEvent);
        }
      });
      
      // Map the selected value to the correct slide event
      const motivationMap = {
        'health': 'motivation_health',
        'appearance': 'motivation_appearance',
        'mental': 'motivation_mental',
        'longer': 'motivation_longer'
      };
      
      const relevantSlideEvent = motivationMap[selectedMotivation];
      console.log('Relevant slide event:', relevantSlideEvent);
      
      if (relevantSlideEvent) {
        // Add the relevant slide back
        toggleSlide(swiper, false, relevantSlideEvent);
        
        // Update swiper
        swiper.update();
        
        // Allow slide next only if a motivation is selected
        swiper.allowSlideNext = true;
        
        // Let the radio button animation complete first
        setTimeout(() => {
          // Then go to the motivation content slide
          swiper.slideNext();
        }, 500);
      }
    });
  });
}

function toggleSlide(swiper, shouldRemove, slideEventValue) {
  if (shouldRemove) {
    // Remove the slide if not already removed
    if (!removedSlides.hasOwnProperty(slideEventValue)) {
      swiper.slides.forEach((slide, index) => {
        if (slide.getAttribute("data-slide-event") === slideEventValue) {
          let slideToRemove = slide.cloneNode(true);
          swiper.removeSlide(index);
          removedSlides[slideEventValue] = {
            slide: slideToRemove,
            index: index,
          }; // Store the removed slide and its original index
          console.log(
            `Slide with data-slide-event '${slideEventValue}' removed.`
          );
          return; // Exit the loop once the slide is found and removed
        }
      });
    } else {
      console.log(
        `Slide with data-slide-event '${slideEventValue}' already removed.`
      );
    }
  } else {
    // Re-add the slide only if it was previously removed
    if (removedSlides.hasOwnProperty(slideEventValue)) {
      let slideData = removedSlides[slideEventValue];
      swiper.addSlide(slideData.index, slideData.slide); // Re-add at the stored index
      console.log(`Slide with data-slide-event '${slideEventValue}' re-added.`);
      delete removedSlides[slideEventValue]; // Remove the entry from the object after re-adding
    } else {
      console.log(
        `Slide with data-slide-event '${slideEventValue}' was not previously removed.`
      );
    }
  }
}

function handleNoneCheckbox() {
  // Only select checkboxes within the specific slide
  const slideContainer = document.querySelector('[data-slide-event="apply_to_you"]');
  if (!slideContainer) return;
  
  const checkboxes = slideContainer.querySelectorAll('input[type="checkbox"]');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const isNoneOption = e.target.getAttribute('data-id') === 'none';
      const isChecked = e.target.checked;
      
      if (isNoneOption && isChecked) {
        // If "none" is selected, uncheck all other checkboxes
        checkboxes.forEach(cb => {
          if (cb !== e.target && cb.getAttribute('data-id') === 'multiple' && cb.checked) {
            cb.click(); // Trigger click instead of setting checked
            console.log('none selected');
          }
        });
      } else if (!isNoneOption && isChecked) {
        // If any other option is selected, uncheck the "none" option
        checkboxes.forEach(cb => {
          if (cb.getAttribute('data-id') === 'none' && cb.checked) {
            cb.click(); // Trigger click instead of setting checked
            console.log('other selected');
          }
        });
      }
    });
  });
}


// New function to handle GrowSurf initialization
function initializeGrowSurf() {
  const cameFromAffiliate = localStorage.getItem('cameFromAffiliate');
  
  if (cameFromAffiliate === 'true') {
    try {
      if (window.growsurf) {
        growsurf.init({ campaignId: AFFILIATEGS });
        console.log('GrowSurf initialized with affiliate campaign');
      }
    } catch (error) {
      console.error('Error initializing GrowSurf for affiliate:', error);
    }
  } else {
    if (window.growsurf) {
      growsurf.init({ campaignId: PRODUCTIONGS });
      console.log('GrowSurf initialized with production campaign');
    }
  }
}
