let subscription;
const STAGING = window.location.hostname.includes("webflow.io"); // true if prod site, else false

// Add new price IDs for different durations
const PRICE_IDS = {
  prod: {
    '1month': 'price_1QXXcjEC8TusN399ATuzVTTf',
    '2month': 'price_1QXXcYEC8TusN399CYYlFzDC', // Replace with actual 2-month price ID
    '3month': 'price_1QXXbzEC8TusN399LAlepqLs'  // Replace with actual 3-month price ID
  },
  dev: {
    '1month': 'price_1QXSSFEC8TusN399P8CYW35s',
    '2month': 'price_1QXSYPEC8TusN399GMApyC9t', // Replace with actual 2-month price ID
    '3month': 'price_1QXSY2EC8TusN399l7ImYC2N'  // Replace with actual 3-month price ID
  }
};

// Add hard-coded prices
const PRICES = {
  '1month': {
    originalPrice: '149',
    priceOff: '100',
    finalPrice: '49'
  },
  '2month': {
    originalPrice: '158',
    priceOff: '33',
    finalPrice: '125'
  },
  '3month': {
    originalPrice: '307',
    priceOff: '112',
    finalPrice: '195'
  }
};

// Update the DEFAULT_PRICE_ID to use the duration-based pricing
const DEFAULT_PRICE_ID = STAGING 
  ? PRICE_IDS.dev['3month'] 
  : PRICE_IDS.prod['3month'];

const DEFAULT_PROMO_PROD = "NOPROMO";
const DEFAULT_PROMO_DEV = "NOPROMO";

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

  const addressOptions = { 
    mode: 'shipping', 
    allowedCountries: ['US'],
    fields: {
      name: 'always',
      phone: 'always',
    },
    validation: {
      name: 'required',
    },
  };

  // Set up Stripe.js and Elements to use in checkout form
  elements = stripe.elements(options);
  const addressElement = elements.create('address', addressOptions);

  // Create and mount the Payment Element
  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");
  addressElement.mount('#address-element');

  createLinkAuthenticationElement(elements);

  // Add immediate email prefill attempt
  let emailValue = email || localStorage.getItem('email');
  if (emailValue && paymentElement) {
    paymentElement.update({
      defaultValues: {
        billingDetails: {
          email: emailValue,
        }
      }
    });
    console.log('email', emailValue);
  }
}

async function createSubscription(customerDetails = {}) {
  const duration = getQueryParam('time')?.replace('month', '') + 'month' || '3month';
  
  const priceId = STAGING 
    ? PRICE_IDS.dev[duration] 
    : PRICE_IDS.prod[duration];

  const storedUTMParams = JSON.parse(localStorage.getItem("utmParams") || "{}");

  const body = {
    priceId,
    customer: {
      email: customerDetails.email,
      name: customerDetails.name,
      address: customerDetails.address
    },
    utm: {
      utmCampaign: storedUTMParams.utm_campaign,
      utmSource: storedUTMParams.utm_source,
      utmMedium: storedUTMParams.utm_medium,
      utmTerm: storedUTMParams.utm_term,
      utmContent: storedUTMParams.utm_content,
    },
  };

  const linkParam = getQueryParam("lnk");
  const rebateParam = getQueryParam("rebate");
  const blockPrepaidParam = getQueryParam("bpp")
  const trialParam = getQueryParam("trial")
  const oneWeekCadence = getQueryParam("wkly");

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

  // if (oneWeekCadence) {
  // 	if (STAGING) {
  // 		body.weeklyBillingPriceIds =
  // 			"price_1NzS8nEC8TusN399sbz44Sfi,price_1NzS9zEC8TusN399qHkXdFEv";
  // 	} else { // prod ids
  // 		body.weeklyBillingPriceIds =
  // 			"price_1O066eEC8TusN399nZGYUJ5Z,price_1NzrT0EC8TusN399xjf0DBfZ";
  // 	}
  // }

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  console.log('Creating subscription with:', {
    endpoint: `${ENDPOINT}create-subscription`,
    body: body,
    staging: STAGING
  });

  try {
    const response = await fetch(`${ENDPOINT}create-subscription`, options);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Server response data:', data);

    if (response.status === 201) {
      if (!data?.data?.paymentIntent?.client_secret) {
        console.error('Response missing client_secret:', data);
        throw new Error('Server response missing client_secret');
      }
      return data;
    } else if (response.status === 500) {
      console.log("Promo code is incorrect");
      promo = DEFAULT_PROMO;
      // Retry with default promo
      return createSubscription(customerDetails);
    } else {
      throw new Error(`Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.error('Subscription creation error:', error);
    throw error;
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

  linkAuthenticationElement.on("change", handleLinkAuthenticationChange);
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

  try {
    // Get address details first
    const addressElement = elements.getElement('address');
    const addressValue = await addressElement.getValue();
    
    console.log('Address element value:', addressValue); // Debug log

    // Extract name and address from the correct path in addressValue
    const fullName = addressValue?.value?.name;
    const address = addressValue?.value?.address;

    if (!fullName) {
      console.error('Name not found in address element:', addressValue);
      return showMessage("Please provide your name.");
    }

    // Create subscription with customer details
    if (!subscription) {
      const { firstName, lastName } = splitFullName(fullName);
      
      // Add customer details to the subscription creation
      subscription = await createSubscription({
        name: fullName,
        email: paymentEmail,
        address: address
      });
      
      console.log('Created subscription:', subscription); // Debug log
    }

    if (!subscription?.data?.paymentIntent?.client_secret) {
      console.error('Subscription response:', subscription);
      throw new Error('Invalid subscription response: Missing client secret');
    }

    const { error } = await elements.submit();
    if (error) {
      return showMessage(error?.message ?? "An unexpected error occurred.");
    }

    const clientSecret = subscription.data.paymentIntent.client_secret;
    const order_id = subscription.data.paymentIntent.id;
    customerId = subscription.data.customer;
    subscriptionId = subscription.data.subscription;

    // Get existing data from sessionStorage
    const existingData = JSON.parse(sessionStorage.getItem('stripePaymentInfo') || '{}');
    
    // Merge existing data with new data
    sessionStorage.setItem('stripePaymentInfo', JSON.stringify({
      ...existingData,
      order_id,
      paymentEmail,
      customerName: fullName,
      address: address
    }));

    // Send customer info
    const { firstName, lastName } = splitFullName(fullName);
    const response = await sendCustomerInfo(
      customerId,
      paymentEmail,
      firstName,
      lastName
    );

    if (response.status === 204) {
      console.log("Confirmed, payment is good to go. Attempting payment now.");

      const RETURN_URL = STAGING 
        ? `https://findsunrise.webflow.io/payment-success?redirect=${encodeURIComponent(
            "https://app.staging.findsunrise.com/api/confirm-signup?subscriptionId="
          )}${subscriptionId}`
        : `https://www.findsunrise.com/payment-success?redirect=${encodeURIComponent(
            "https://app.findsunrise.com/api/confirm-signup?subscriptionId="
          )}${subscriptionId}`;

      // Confirm payment with billing details
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: RETURN_URL,
          receipt_email: paymentEmail,
          shipping: {
            name: fullName,
            address: address
          },
          payment_method_data: {
            billing_details: {
              name: fullName,
              email: paymentEmail,
              address: address
            }
          }
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
    console.error('Payment error:', error);
    showMessage(
      error?.message ??
        "An unexpected error occurred. Please contact support@findsunrise.com"
    );
  } finally {
    setLoading(false);
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
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0];
  let lastName = nameParts.slice(1).join(" ");
  // Check if lastName is blank and set a default value
  if (lastName.trim() === "") {
    lastName = "(No Last Name)";
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

    if (document.getElementById("Field-emailInput")) {
      paymentElement.update({
        layout: "tabs",
        defaultValues: {
          billingDetails: {
            email: document.getElementById("Field-emailInput").value,
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
  const duration = getQueryParam('time') || '1month';
  const prices = PRICES[duration]; 
  
  if (!prices) {
    throw new Error('Invalid duration specified');

  }
  

  // Update the month text based on duration
  const monthElement = document.querySelector('#month');
  if (monthElement) {
    const months = duration.replace('month', '');
    monthElement.textContent = `${months} month${months > 1 ? 's' : ''}`;
  }

  // Get existing data from sessionStorage
  const existingData = JSON.parse(sessionStorage.getItem('stripePaymentInfo') || '{}');
  sessionStorage.setItem('stripePaymentInfo', JSON.stringify({
    ...existingData,
    sale_amount: prices.finalPrice,
  }));

  return prices;
}