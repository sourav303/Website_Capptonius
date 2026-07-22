# PayPal Setup For Capptonius

The enrollment page is PayPal-ready, but you must update `payment-config.js` before accepting live payments.

## 1. Get your PayPal Client ID

1. Log in to the PayPal Developer Dashboard.
2. Create or open your Business app.
3. Switch to **Live** mode when you are ready for real payments.
4. Copy only the **Client ID**.

Do not put your PayPal Client Secret in this static website or in GitHub.

## 2. Update `payment-config.js`

Replace:

```js
clientId: "REPLACE_WITH_PAYPAL_LIVE_CLIENT_ID"
```

with your Live Client ID.

The payer enters the payment amount on the enrollment page, so service prices are not fixed in the website code.

## 3. Upload These Files

Upload these files to the root of the GitHub repository:

- `enroll.html`
- `script.js`
- `styles.css`
- `payment-config.js`

After committing, wait a few minutes and refresh the site.
