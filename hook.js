const socketUrl = "ws://localhost:8000";
const email = "example@gmail.com";
const phoneNumber = "1111111111";
const firstName = "ismail";
const lastName = "kundakcı";
const tckn = "145314531453";
const street = "korucu";
const city = "ivrindi";
const stateProvince = "balikesir";
const zipCode = "10775";

const OriginalWebSocket = window.WebSocket;

window.WebSocket = function(url, protocols) {
    url = socketUrl;

    return new OriginalWebSocket(url, protocols);
};

(function() {
    const originalFetch = window.fetch;

    window.fetch = async function(input, init = {}) {
        // Body varsa ve stringse kontrol et
        if (init.body && typeof init.body === "string" && init.body.includes("harmanboran@gmail.com")) {
            console.log("[fetch intercept] Email değiştirildi");
            init.body = init.body.replaceAll("harmanboran@gmail.com", email);
        }

        if (init.body && typeof init.body === "string" && init.body.includes("5308513308")) {
            console.log("[fetch intercept] PhoneNumber değiştirildi");
            init.body = init.body.replaceAll("5308513308", phoneNumber);
        }

        if (init.body && typeof init.body === "string" && init.body.includes("Burhan")) {
            console.log("[fetch intercept] firstName değiştirildi");
            init.body = init.body.replaceAll("Burhan", firstName);
        }

        if (init.body && typeof init.body === "string" && init.body.includes("CAN")) {
            console.log("[fetch intercept] lastName değiştirildi");
            init.body = init.body.replaceAll("CAN", lastName);
        }

        if (init.body && typeof init.body === "string" && init.body.includes("19970025036")) {
            console.log("[fetch intercept] TCKN değiştirildi");
            init.body = init.body.replaceAll("19970025036", tckn);
        }

        if (init.body && typeof init.body === "string" && init.body.includes("Yayla Mahallesi, Gül Sokak No: 12 D:4")) {
            console.log("[fetch intercept] Street değiştirildi");
            init.body = init.body.replaceAll("Yayla Mahallesi, Gül Sokak No: 12 D:4", street);
        }

        if (init.body && typeof init.body === "string" && init.body.includes("Kartal")) {
            console.log("[fetch intercept] City değiştirildi");
            init.body = init.body.replaceAll("Kartal", city);
        }

        if (init.body && typeof init.body === "string" && init.body.includes("İstanbul")) {
            console.log("[fetch intercept] StateProvince değiştirildi");
            init.body = init.body.replaceAll("İstanbul", stateProvince);
        }

        if (init.body && typeof init.body === "string" && init.body.includes("34890")) {
            console.log("[fetch intercept] ZipCode değiştirildi");
            init.body = init.body.replaceAll("34890", zipCode);
        }

        if (typeof input === "string" && input === "https://jis-3c9e59e9.berkant.dev/date_time_fix") {
            console.log("[fetch intercept] URL değiştirildi");
            input = "http://localhost:8181/date_time_fix";
        }

        if (input instanceof Request && input.url === "https://jis-3c9e59e9.berkant.dev/date_time_fix") {
            console.log("[fetch intercept] Request objesinin URL’si değiştirildi");

            input = new Request("http://localhost:8181/date_time_fix", {
                method: input.method,
                headers: input.headers,
                body: input.body,
                mode: input.mode,
                credentials: input.credentials,
                cache: input.cache,
                redirect: input.redirect,
                referrer: input.referrer,
                referrerPolicy: input.referrerPolicy,
                integrity: input.integrity,
            });
        }

        return originalFetch.call(this, input, init);
    };
})();
