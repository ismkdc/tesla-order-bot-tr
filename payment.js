const cardNumber = "1234123412341234"; // Visa, MasterCard ya da Troy (yalnızca 6 ile başlayan Troy)
const cardHolderName = "İsim Soyisim"; // Kart sahibi adı
const cardExpMonth = "07"; // Kart SKT ay (01-12 arası)
const cardExpYear = "2029"; // Kart SKT yıl (4 haneli)
const cardCVV = "123"; // Kart güvenlik kodu (CVV)

/////////////////////////////////////// https://static-assets-pay.tesla.com/v5/

const RN = "RN125233044";
const VIN = "XP7Y264_887f3de744df0f25bba473f2e7c61f44";
const TOKEN = "e9fa3b00-0a42-4341-b4c0-cfd95499f21b";

const addressLine1 = "x y mahllesi y caddesi";
const city = "artuklu";
const stateProvince = "mardin";
const zipCode = "47100";

["https://static-assets-pay.tesla.com/api/script/adyen-cse.js?countryCode=TR", "https://static-assets-pay.tesla.com/api/script/adyen-df.js"].forEach(async (path) => {
    const {
        promise,
        resolve
    } = Promise.withResolvers();
    const script = document.createElement("script");
    script.src = path;
    script.onload = resolve;
    document.body.appendChild(script);
    await promise;
});
console.log("Ödeme aracısı yükleniyor...");
setTimeout(async () => {
    let fp = {
        style: "style"
    };
    dfInitDS();
    dfSet(fp);
    console.log(`Adyen parmak izi: ${fp.value}`);
    console.log("Ödeme deneniyor...");
    const cse = adyen.createEncryption({
        numberIgnoreNonNumeric: false
    });
    const genTime = {
        generationtime: new Date().toISOString()
    };
    const resp = await fetch("https://static-assets-pay.tesla.com/api/payments/v4", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({
            billingAddress: {
                addressLine1,
                addressLine2: "",
                countryCode: "TR",
                zipCode,
                city,
                stateProvince
            },
            billingContact: {},
            browserInfo: {
                colorDepth: screen.colorDepth,
                javaEnabled: false,
                language: "tr-TR",
                screenHeight: screen.height,
                screenWidth: screen.width,
                timeZoneOffset: 0,
                userAgent: navigator.userAgent
            },
            deliveryAddress: {},
            deviceFingerprint: fp.value,
            ipAddress: "0.0.0.0",
            locale: "tr_TR",
            processWithProfile: false,
            signedData: TOKEN,
            paymentDetails: [{
                amount: 175000,
                currency: "TRY",
                hostUrl: btoa(`https://www.tesla.com/tr_TR/modely/order/payment_done/${RN}/${VIN}`),
                isMobile: false,
                metadata: {
                    redirectMethod: "GET"
                },
                paymentType: "CREDITCARD",
                processWithProfile: false,
                returnUrl: "https://static-assets-pay.tesla.com/v5/adyen_done.html?locale=tr_TR",
                saveToProfile: true,
                nameOnTheInstrument: cardHolderName.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/ı/gu, "i").toUpperCase(),
                encryptedCardNumber: cse.encrypt({
                    ...genTime,
                    number: cardNumber.replace(/\s+/g, "")
                }),
                encryptedExpiryMonth: cse.encrypt({
                    ...genTime,
                    expiryMonth: cardExpMonth
                }),
                encryptedExpiryYear: cse.encrypt({
                    ...genTime,
                    expiryYear: cardExpYear
                }),
                encryptedSecurityCode: cse.encrypt({
                    ...genTime,
                    cvc: cardCVV
                }),
                paymentProcessor: "ADYEN",
                type: "CREDITCARD",
                lastFourDigits: cardNumber.replace(/\s+/g, "").slice(-4),
                expirationMonth: cardExpMonth,
                expirationYear: cardExpYear,
                cardType: (() => {
                    switch (cardNumber[0]) {
                        case "4":
                            return "VISA";
                        case "5":
                            return "MASTERCARD";
                        case "6":
                            return "DISCOVER";
                    }
                })()
            }]
        }),
        credentials: "include"
    });
    if (!resp.ok) {
        console.log("PayX'ten non-OK döndü ---------------------------->");
        console.log(await resp.text());
        console.log("<----------------------------");
        return;
    }
    const data = await resp.json();
    console.log("PayX'ten OK döndü ---------------------------->");
    console.log(data);
    console.log("<----------------------------");
    const [payxResp] = data?.listOfPayXPaymentResponses;
    console.log(`Decision: ${data?.decision}`);
    console.log(`Transaction Number: ${data?.transactionNumber}`);
    console.log(`PayX Decision: ${payxResp?.decision}`);
    console.log(`PayX Code: ${payxResp?.payXResponseCode}`);
    console.log(`PayX Message: ${payxResp?.responseMessage}`);
    console.log(`Unique Order ID: ${payxResp?.uniqueOrderId}`);
    console.log(`3DS URL: ${payxResp?.details?.url}`);
}, 2500);
