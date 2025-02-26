let subscription;
const STAGING = window.location.hostname.includes("webflow.io"); // true if prod site, else false

const PRICE_ID_PROD = "price_1N9ZNREC8TusN399Fj2wQIXH";
const PRICE_ID_DEV = "price_1N9ZFWEC8TusN399xNwUHjCh";

const DEFAULT_PROMO_PROD = "GETSTARTED";
const DEFAULT_PROMO_DEV = "GETSTARTED";

const DEFAULT_PRICE_ID = STAGING ? PRICE_ID_DEV : PRICE_ID_PROD;
const DEFAULT_PROMO = STAGING ? DEFAULT_PROMO_DEV : DEFAULT_PROMO_PROD;

const BASE_URLS = {
  staging: "https://api.staging.findsunrise.com/api/signup/",
  prod: "https://api.findsunrise.com/api/signup/",
};

const PRICE_API_URL = {
  staging: "https://temp-sunrise-stripe.vercel.app/api/price_staging",
  prod: "https://temp-sunrise-stripe.vercel.app/api/",
};

const ENDPOINT = STAGING ? BASE_URLS.staging : BASE_URLS.prod;
const PRICE_ENDPOINT = STAGING ? PRICE_API_URL.staging : PRICE_API_URL.prod;

const PKS = {
  staging:
    "pk_test_51LxWRtEC8TusN399y9fjuKKk0AwFwZL46NMB1EKKXtdfbqGDlMX7hVOFrWuIwDuUGfT0lCwJE3MHMgMfdpvCmGCO00pk6MmNRP",
  prod: "pk_live_51LxWRtEC8TusN399QN0SX2ls1AB7MgQjTpOET5ThTuGOilhASEKGHWYZZyKyEBO4eFjFCoiRngCUigdh5E5RLoA000C4Ivf4NV",
};

const PK = STAGING ? PKS.staging : PKS.prod;

const stripe = Stripe(PK);

let elements;
let subscriptionId = "";
let paymentInputValid = false;
let paymentEmail;
let customerId;

const getQueryParam = (paramName) => {
  return new URLSearchParams(window.location.search).get(paramName) || null;
};

const promoCode = getQueryParam("promo");

checkStatus();

document
  .querySelector("#payment-form")
  .addEventListener("submit", handleSubmit);

if (document.getElementById("prediction-form")) {
  document
    .getElementById("prediction-form")
    .addEventListener("submit", handlePredictionFormSubmit);
}

async function initializePlaceholder() {
  const options = {
    mode: "subscription",
    amount: 900,
    currency: "usd",
    appearance: {
      theme: "stripe",

      variables: {
        colorPrimary: "#0057b8",
        colorText: "#191a2c",
        colorDanger: "#df1b41",
        borderRadius: "8px",
        fontSizeSm: "1.15rem",
      },
    },
  };

  // Set up Stripe.js and Elements to use in checkout form
  elements = stripe.elements(options);

  // Create and mount the Payment Element
  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");

  createLinkAuthenticationElement(elements);
}

async function createSubscription() {
  const priceId = getQueryParam("price") ?? DEFAULT_PRICE_ID;
  const linkParam = getQueryParam("lnk");
  const rebateParam = getQueryParam("rebate");
  const blockPrepaidParam = getQueryParam("bpp")
  const trialParam = getQueryParam("trial")
  const oneWeekCadence = getQueryParam("wkly");


  const storedUTMParams = JSON.parse(localStorage.getItem("utmParams") || "{}");


  // Constructing request body directly
  const body = {
    priceId,
    utm: {
      utmCampaign: storedUTMParams.utm_campaign,
      utmSource: storedUTMParams.utm_source,
      utmMedium: storedUTMParams.utm_medium,
      utmTerm: storedUTMParams.utm_term,
      utmContent: storedUTMParams.utm_content,
    },
  };

  const promo = promoCode !== "0" ? promoCode ?? DEFAULT_PROMO : null;

  if (promo) {
    body.promoCode = promo;
  }

  if (blockPrepaidParam === "1") {
    body.blockPrepaid = true;
  }

  if (linkParam === "1") {
    body.cardOnly = true;
  }

  if (rebateParam === "1") {
    body.rebate = true;
  }

  if (trialParam === "14") {
    body.introPeriod = true;
  }

  if (oneWeekCadence) {
  	if (STAGING) {
  		body.weeklyBillingPriceIds =
  			"price_1NzS8nEC8TusN399sbz44Sfi,price_1NzS9zEC8TusN399qHkXdFEv";
  	} else { // prod ids
  		body.weeklyBillingPriceIds =
  			"price_1O066eEC8TusN399nZGYUJ5Z,price_1NzrT0EC8TusN399xjf0DBfZ";
  	}
  }

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  const response = await fetch(`${ENDPOINT}create-subscription`, options);

  if (response.status === 201) {
    return await response.json();
  } else if (response.status === 500) {
    console.log("Promo code is incorrect");
    promo = DEFAULT_PROMO;
  } else {
    throw new Error(`Unexpected response: ${response.status}`);
  }
}

function createElements(clientSecret) {
  const appearance = {
    theme: "stripe",

    variables: {
      colorPrimary: "#0057b8",
      colorText: "#191a2c",
      colorDanger: "#df1b41",
      borderRadius: "8px",
    },
  };
  const loader = "auto";

  return stripe.elements({
    loader,
    appearance,
    clientSecret,
  });
}

function createLinkAuthenticationElement(elements) {
  const linkAuthenticationElement = elements.create("linkAuthentication");
  linkAuthenticationElement.mount("#link-authentication-element");

  linkAuthenticationElement.on("change", (event) => {
    handleLinkAuthenticationChange(event);
    validateEmail(event.value.email);
  });
}

function handleLinkAuthenticationChange(event) {
  paymentEmail = event.value.email;
}

async function sendCustomerInfo(customerId, email, firstName, lastName) {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, firstName, lastName }),
  };

  const response = await fetch(`${ENDPOINT}identify/${customerId}`, options);

  if (response.status === 403) {
    throw new Error(
      "You may already have an account, please contact support@findsunrise.com"
    );
    return;
  }

  if (!response.ok) {
    throw new Error("Failed to send customer info");
  }

  return response;
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const fullName = document.querySelector("#full-name").value;
  
  try {
    const { firstName, lastName } = splitFullName(fullName);
    const { error } = await elements.submit();
    if (error) {
      return showMessage(error?.message ?? "An unexpected error occurred.");
    }

    if (!subscription) {
      subscription = await createSubscription();
    }

    const clientSecret = subscription.data.paymentIntent.client_secret;
    const order_id = subscription.data.paymentIntent.id;
    customerId = subscription.data.customer;
    subscriptionId = subscription.data.subscription;

    // Get existing data from sessionStorage
    const existingData = JSON.parse(sessionStorage.getItem('stripePaymentInfo') || '{}');
    
    // Merge existing data with new data including promo code
    sessionStorage.setItem('stripePaymentInfo', JSON.stringify({
      ...existingData,
      order_id,
      paymentEmail,
      promo_code: promoCode || DEFAULT_PROMO
    }));

    // first send customer info to backend
    const response = await sendCustomerInfo(
      customerId,
      paymentEmail,
      firstName,
      lastName
    );

    if (response.status === 204) {
      console.log("Confirmed, payment is good to go. Attempting payment now.");

      const RETURN_URLS = {
        staging: `https://findsunrise.webflow.io/payment-success?redirect=${encodeURIComponent(
          "https://app.staging.findsunrise.com/api/confirm-signup?subscriptionId="
        )}${subscriptionId}`,
        prod: `https://www.findsunrise.com/payment-success?redirect=${encodeURIComponent(
          "https://app.findsunrise.com/api/confirm-signup?subscriptionId="
        )}${subscriptionId}`,
      };

      let RETURN_URL = STAGING ? RETURN_URLS.staging : RETURN_URLS.prod;

      // if success TRY MAKE payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: RETURN_URL,
          receipt_email: paymentEmail,
        },
        clientSecret,
      });

      // track attempt charge
      if (typeof gtag === "function") {
        gtag("event", "stripe_attempt_charge", {
          event_category: "stripe",
          event_label: "Charge Attempted",
        });
      }

      showMessage(
        error?.message ??
          "An unexpected error occurred. Please contact support@findsunrise.com"
      );
    } else {
      showMessage(
        "You may already have an account, please contact support@findsunrise.com"
      );
    }
  } catch (error) {
    showMessage(error.message);
    setLoading(false);
    return;
  }
}

async function checkStatus() {
  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );

  if (!clientSecret) {
    return;
  }

  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
  handleMessage(paymentIntent.status);
}

function handleMessage(status) {
  const messages = {
    succeeded: "Payment succeeded!",
    processing: "Your payment is processing.",
    requires_payment_method:
      "Your payment was not successful, please try again.",
  };

  const message =
    messages[status] ||
    "Something went wrong. Please contact support@findsunrise.com";
  showMessage(message);
}

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");
  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(() => {
    messageContainer.classList.add("hidden");
    messageText.textContent = "";
  }, 4000);
}

function setLoading(isLoading) {
  const submitButton = document.querySelector("#submit-payment");
  const spinner = document.querySelector("#spinner");
  const buttonText = document.querySelector("#button-text");

  submitButton.disabled = isLoading;
  spinner.classList.toggle("hidden", !isLoading);
  buttonText.classList.toggle("hidden", isLoading);
}

function splitFullName(fullName) {
  // Remove extra spaces and trim
  const cleanName = fullName.trim().replace(/\s+/g, ' ');
  const nameParts = cleanName.split(' ');
  
  // Validate name parts
  if (nameParts.length < 2) {
    throw new Error('Please enter both your first and last name');
  }
  
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  
  // Validate name lengths and check for initials
  if (firstName.length < 2) {
    throw new Error('First name must be at least 2 characters long');
  }
  if (lastName.length < 2) {
    throw new Error('Last name must be at least 2 characters long');
  }
  
  return { firstName, lastName };
}

function handlePredictionFormSubmit() {
  getPaymentElement();

  async function getPaymentElement() {
    if (!elements) {
      setTimeout(getPaymentElement, 1000);
      return;
    }

    const paymentElement = elements.getElement("payment");

    if (!paymentElement) {
      setTimeout(getPaymentElement, 1000);
      return;
    }

    if (document.getElementById("email")) {
      paymentElement.update({
        layout: "tabs",
        defaultValues: {
          billingDetails: {
            email: document.getElementById("email").value,
          },
        },
        paymentMethodOrder: ["card", "apple_pay", "google_pay"],
      });
    }
  }
}

// bring success message outside the form
const successMessage = document.querySelector(".success-message .w-form-done");
if (successMessage) {
  const form = successMessage.closest("form");
  form.parentNode.insertBefore(successMessage, form.nextSibling);
}

// NEW FETCH PRICE

async function fetchPrice() {
  let promo = promoCode || DEFAULT_PROMO;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: getQueryParam("price") ?? DEFAULT_PRICE_ID,
      code: promo,
    }),
  };

  try {
    const response = await fetch(PRICE_ENDPOINT, options);
    if (!response.ok) throw new Error("Failed to fetch price");
    const data = await response.json();
    const { originalPrice, priceOff, finalPrice } = data.invoice;
    const sale_amount = finalPrice;
 // Get existing data from sessionStorage
 const existingData = JSON.parse(sessionStorage.getItem('stripePaymentInfo') || '{}');
    sessionStorage.setItem('stripePaymentInfo', JSON.stringify({
      ...existingData,
      sale_amount,
    }));

    return { originalPrice, priceOff, finalPrice };
  } catch (err) {
    console.error(err);
  }
}

// Add event listener for the full name input
document.querySelector("#full-name").addEventListener("blur", validateFullName);

function validateFullName(e) {
  const fullName = e.target.value;
  const messageContainer = document.querySelector("#payment-message");
  const submitButton = document.querySelector("#submit-payment");
  
  try {
    const { firstName, lastName } = splitFullName(fullName);
    messageContainer.classList.add("hidden");
    submitButton.disabled = false;
  } catch (error) {
    messageContainer.classList.remove("hidden");
    messageContainer.textContent = error.message;
    submitButton.disabled = true;
  }
}

function validateEmail(email) {
  const submitButton = document.querySelector("#submit-payment");
  const messageContainer = document.querySelector("#payment-message");
  
  if (email && email.toLowerCase().endsWith('.con')) {
    messageContainer.classList.remove("hidden");
    messageContainer.textContent = `You might entered the wrong email`;
    submitButton.disabled = true;
    return false;
  } else {
    messageContainer.classList.add("hidden");
    // Only enable the button if there are no other validation errors
    // You might need to check other validation states here
    submitButton.disabled = false;
    return true;
  }
}