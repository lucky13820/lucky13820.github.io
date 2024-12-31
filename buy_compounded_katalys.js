const isStaging = window.location.href.includes('webflow')
const urlParams = new URLSearchParams(window.location.search)
const email = urlParams.get('email')

async function run() {
    await Promise.all([
        updatePrice(),
        email ? initializePlaceholder(email) : initializePlaceholder(),
    ])

    $('[data-id="payment-embed"]').fadeIn()

    gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: 49,
        items: [
            {
                item_name: 'Weight Loss Subscription',
                currency: 'USD',
                price: 49,
                quantity: 1,
            },
        ],
    })

    gtag('event', 'embedded_checkout_shown')

    // prefill fill email
    setTimeout(function () {
        const intervalId = setInterval(() => {
            if (!elements) {
                return
            }

            const paymentElement = elements.getElement('payment')

            if (!paymentElement) {
                if (isStaging) {
                    console.log('PE not found')
                }
                return
            }

            let emailValue = email
            if (!emailValue) {
                emailValue = localStorage.getItem('email')
            }

            paymentElement.update({
                layout: 'tabs',
                defaultValues: {
                    billingDetails: {
                        email: emailValue,
                    },
                },
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
            })
            if (isStaging) {
                console.log('found and updated')
            }

            clearInterval(intervalId)
        }, 500)
    }, 1000)
}

run()

async function updatePrice() {
    try {
        const { originalPrice, priceOff, finalPrice } = await fetchPrice()

        if (isStaging) {
            console.log(`Original Price: ${originalPrice}`)
            console.log(`Price Off: ${priceOff}`)
        }

        const PRICE = finalPrice

        const buttonPriceElement = document.getElementById('button-price')
        const checkoutPriceElement = document.getElementById('checkout-price')
        const checkoutDiscountElement = document.getElementById('checkout-discount')

        if (buttonPriceElement && checkoutPriceElement) {
            buttonPriceElement.textContent = PRICE
            checkoutPriceElement.textContent = PRICE
        }

        if (checkoutDiscountElement) {
            checkoutDiscountElement.textContent = priceOff
        }

        const promoCode = getQueryParam("promo");

if (promoCode?.toLowerCase() === 'newyear199') {
    const first3MonthElement = document.querySelector('#first3month')
    const after3MonthElement = document.querySelector('#after3month')
    
    if (first3MonthElement) {
        first3MonthElement.innerHTML = '<strong> off your first three months<br></strong>'
    }
    
    if (after3MonthElement) {
        after3MonthElement.textContent = 'Then $349 after the three month'
    }
}
    } catch (error) {
        if (isStaging) {
            console.error(error)
        }
    }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
function readCookies() {
    const cookieMap = {}
    const cookies = document.cookie.split('; ')
    for (const cookiePair of cookies) {
        const [key, ...value] = cookiePair.split('=')
        // The cookie value may have equal signs in it, so re-insert them here
        cookieMap[key] = value.join('=')
    }
    return cookieMap
}

async function getUserData() {
    // Grab the Facebook Click and Browser IDs from the user's cookie
    const { _fbc: fbc, _fbp: fbp } = readCookies()
    const { userAgent } = window.navigator

    // Use Amazon to get the user's IP address
    // See https://ipdata.co/blog/how-to-get-the-ip-address-in-javascript/
    const res = await fetch('https://checkip.amazonaws.com/')
    const ipAddress = (await res.text()).trim()
    return { fbc, fbp, userAgent, ipAddress }
}

function getBaseApiUrl() {
    return isStaging ? 'https://api.staging.findsunrise.com' : 'https://api.findsunrise.com'
}

async function sendAddToCartEvent() {
    const { fbc, fbp, userAgent, ipAddress } = await getUserData()
    const eventId = crypto.randomUUID()

    // Push event to GTM so we can forward this to a pixel
    window.dataLayer.push({
        event: 'begin_checkout_v2',
        event_id: eventId,
        event_name: 'CompoundedSemaglutideAddToCart',
        client_ip_address: ipAddress,
        client_user_agent: userAgent,
        fbc,
        fbp,
    })

    // Parse the quiz answers from localStorage
    const quizAnswers = JSON.parse(localStorage.getItem('quizAnswers') || '{}')

    // Prepare the request body
    const body = {
        eventName: 'CompoundedSemaglutideAddToCart',
        eventId,
        email: quizAnswers.email || '',
        phone: quizAnswers.phone || '',
        fbClickId: fbc,
        fbBrowserId: fbp,
        ipAddress,
        userAgent,
    }

    // Send the CAPI request
    const res = await fetch(`${getBaseApiUrl()}/api/conversions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }).catch((error) => {
        if (isStaging) {
            console.log('Failed to send CAPI request:', body)
            console.error('Error:', error)
        }
    })

    if (isStaging) {
        console.log('Sent CAPI request:', { res, body })
    }
}

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', sendAddToCartEvent)