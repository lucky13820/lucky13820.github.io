// Get the redirect URL from the URL parameter
const redirectParam = new URL(window.location.href).searchParams.get(
  "redirect"
);
const REDIRECT_URL = decodeURI(redirectParam || "");
const ERROR_MESSAGE =
  "There was an error while redirecting you to our app. If you believe this is a mistake, please email support@findsunrise.com using the email you used for the purchase. We apologize for the inconvenience.";


function getCookieValue(cookieName) {
  try {
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    console.warn("Cookie not found:", cookieName);
    return "";
  } catch (error) {
    console.error("Error retrieving cookie:", cookieName, error);
    return "";
  }
}

const getGoogleClickId = (cookieValue = "") => {
  if (!cookieValue) return;
  const components = cookieValue.split(".");
  return components[components.length - 1];
};

// Do not change anything in the following two lines
window.VWO = window.VWO || [];
VWO.event =
  VWO.event ||
  function () {
    VWO.push(["event"].concat([].slice.call(arguments)));
  };

// Function to send the 'purchase' event to VWO
function sendVWOPurchaseEvent(textValue) {
  VWO.event("purchase", {
    purchase: String(textValue),
  });
}

async function performConversion() {
  try {
    await EF.conversion({
      offer_id: 7989,
    });

    if (typeof gtag === "function") {
      const email = localStorage.getItem("email");
      if (email) {
        gtag("event", "payment_success", {
          event_label: email,
        });
      } else {
        gtag("event", "payment_success");
      }
    } else {
      console.log("gtag function is not defined.");
    }

    trackToRewardful();
    sendVWOPurchaseEvent("true");
    trackToKatalys();
    
    // Redirect disabled temporarily
    /* if (REDIRECT_URL) {
      console.log("Ready to redirect to:", REDIRECT_URL);
      setTimeout(function () {
        window.location.href = REDIRECT_URL;
      }, 500);
    } else {
      console.warn("Redirect URL is not defined.");
      showAlertAndRedirect(ERROR_MESSAGE);
    } */
    
  } catch (error) {
    console.error("An error occurred:", error);
    /* if (REDIRECT_URL) {
      window.location.href = REDIRECT_URL;
    } else {
      showAlertAndRedirect(ERROR_MESSAGE);
    } */
  }
}

function showAlertAndRedirect(message) {
  window.alert(message);
  window.location.href = "/";
}

function updateSmiirlCounter() {
  const url =
    "https://api.smiirl.com/e08e3c3a9d88/add-number/53070562d134f314270db90c07a214f8/1";
  fetch(url, { method: "GET" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Failed to update counter. Server responded with " + response.status
        );
      }
      return response.json();
    })
    .then((data) => console.log("counter updated successfully:", data))
    .catch((error) => console.log("Error updating counter:", error.message));
}

performConversion();

try {
  updateSmiirlCounter();
} catch (e) {
  console.log(e);
}

const trackToRewardful = async () => {
  if (typeof rewardful !== "undefined") {
    try {
      const email = localStorage.getItem("email");
      if (email) {
        rewardful("convert", { email: email });
      } else {
        console.log("Email not found in local storage");
      }
    } catch (error) {
      console.log("Error tracking to Rewardful:", error);
    }
  }
};

function trackToKatalys() {
  // Get payment info from sessionStorage
  const paymentInfo = JSON.parse(sessionStorage.getItem('stripePaymentInfo') || '{}');
  const {  order_id, paymentEmail, sale_amount} = paymentInfo;

  _revoffers_track = window._revoffers_track || [];
  _revoffers_track.push({
    action: "convert",
    order_id:  order_id, // Use payment intent ID as order_id, fallback to '1'
    sale_amount: sale_amount, // Use final price as sale_amount, fallback to 9
    email_address: paymentEmail,
  });

  console.log("trackToKatalys: order_id, sale_amount, email", order_id, sale_amount, paymentEmail);

  // Clean up stored payment info
  // sessionStorage.removeItem('stripePaymentInfo');
}
