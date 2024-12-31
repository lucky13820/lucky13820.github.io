import { trackEvent } from 'https://sunrise-webflow.vercel.app/scripts/track_event.js';

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

        const promo = urlParams.get('promo')
        console.log(promo)

if (promo?.toLowerCase() === 'newyear199') {
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

// Track Add to Cart when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    trackEvent({
        capiEvent: 'CompoundedSemaglutideAddToCart',
        gtmTrigger: 'begin_checkout_v2',
        gtmEventName: 'CompoundedSemaglutideAddToCart',
    })
})