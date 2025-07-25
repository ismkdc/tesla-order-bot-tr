//thx to @erknkaya

(async () => {
    try {
        const { timer, switchMap, exhaustMap, filter, map, tap, concatMap, from } = await import('https://cdn.skypack.dev/rxjs');
        const { webSocket } = await import('https://cdn.skypack.dev/rxjs/webSocket');
        const { fromFetch } = await import('https://cdn.skypack.dev/rxjs/fetch');
        const { firstValueFrom, ReplaySubject } = await import('https://cdn.skypack.dev/rxjs');
        const { retry, bufferTime } = await import('https://cdn.skypack.dev/rxjs');

        const lodash = await import('https://cdn.skypack.dev/lodash');
        const { hCaptchaLoader } = await import('https://cdn.skypack.dev/@hcaptcha/loader');

        const enableColorFilter = false; // true ise renk filtresi aktif, false ise kapalı
        const excludedColors = ["RED", "BLUE", "GREY"]; // Filtrelemek istediğin renkler burada

        const userData = {
            firstName: "",
            lastName: "",
            ccFirstName: "",
            ccLastName: "",
            email: "",
            phoneNumber: "",
            privateVatId: "",
            streetAddress: "",
            city: "",
            stateProvince: "",
            zipCode: "34890",
            distance: 369
        };

        const wsUrl = "ws://localhost:8000";
        let inventoryPath = "inventory";
        let isFirstRun = true;
        const bufferThreshold = 100;
        const captchaButtonId = "fuck-hcaptcha";
        const captchaSiteKey = "eede822a-c29e-46fa-8d88-ad9e06da386e";

        const replaySubject = new ReplaySubject(1);

        // Auth token kısmı: cua_sess cookie alınıyor, yoksa uyarı veriyor
        const authPaths = ["/inventory/", "/api/payments/"];
        const cuaSessCookie = await cookieStore.get('cua_sess');
        const cuaSessValue = cuaSessCookie ? cuaSessCookie.value : '';

        if (!cuaSessValue) {
            console.error("Lütfen önce tesla.com'a giriş yap ve 'cua_sess' cookie'sinin mevcut olduğundan emin ol.");
            return;
        }

        console.log('cua_sess cookie değeri:', cuaSessValue);

        await Promise.all(
            authPaths.map(path =>
                cookieStore.set({
                    name: "coin_auth_session",
                    value: cuaSessValue,
                    domain: "tesla.com",
                    path: path
                })
            )
        );

        console.log('Tüm coin_auth_session cookie\'leri başarıyla ayarlandı.');

        await cookieStore.set({
            name: "NO_CACHE",
            value: "Y",
            domain: "tesla.com"
        });

        const cookieScopes = ["inventory", "coinorder"];
        for (const scope of cookieScopes) {
            await cookieStore.set({
                name: `tesla_logged_in_${scope}`,
                value: "Y",
                domain: "tesla.com"
            });
        }

        console.log("hCaptcha yüklenmesi bekleniyor...");

        await hCaptchaLoader({
            sentry: false,
            render: "explicit"
        });

        console.log("hCaptcha loader başarıyla yüklendi.");

        document.body.insertAdjacentHTML("afterbegin",
            `<button id="${captchaButtonId}" style="display: none;"></button>`
        );

        console.log("===== BOT AKTİF =====");

        const sessionTimer = timer(0, 240000).pipe(
            exhaustMap(() =>
                fromFetch(`https://www.tesla.com/${inventoryPath}/api/v4/sesscheck`, {
                    method: "POST",
                    credentials: "include"
                }).pipe(
                    retry({ delay: 250 }),
                    switchMap(response => response.json())
                )
            )
        );

        sessionTimer.subscribe(replaySubject);

        const vehicleStream = webSocket(wsUrl).pipe(
            retry({ delay: 250 }),
            bufferTime(bufferThreshold),
            filter(items => items.length > 0),
            map(items => lodash.shuffle(items)),
            concatMap(shuffledItems =>
                from(lodash.sortBy(shuffledItems, ({ PAINT: [paintCode] }) => {
                    const paintPriority = ["SILVER", "WHITE", "BLACK", "DIAMOND_BLACK"];
                    const paintIndex = paintPriority.indexOf(paintCode);
                    return paintIndex === -1 ? Infinity : paintIndex;
                }))
            ),
            filter(({ TrimVariantCode }) => TrimVariantCode === "RWD_NV36"),
            filter(({ INTERIOR: [interiorCode] }) => !(interiorCode === "PREMIUM_WHITE")),
            filter(({ PAINT: [paintCode] }) => {
                if (!enableColorFilter) return true;
                return !excludedColors.includes(paintCode);
            })
        );

        vehicleStream.subscribe({
            next: async (vehicleData) => {
                const getCsrfHeaders = async () => {
                    const sessionData = await firstValueFrom(replaySubject);
                    return {
                        "Csrf-Name": sessionData.csrf_key,
                        "Csrf-Value": sessionData.csrf_token
                    };
                };

                await navigator.locks.request("buy-op", async (lock) => {
                    if (!isFirstRun) {
                        return;
                    }

                    const [paintCode] = vehicleData.PAINT;
                    console.log(`⌛⌛⌛ ${paintCode} (${vehicleData.VIN}) REZERVE EDİLİYOR ⌛⌛⌛`);

                    const reservationResult = await reserveVehicle(vehicleData, getCsrfHeaders);

                    if (reservationResult.error) {
                        console.log(`❌❌❌ ${paintCode} (${vehicleData.VIN}) REZERVE EDİLEMEDİ ❌❌❌ ----->`, reservationResult);
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        return;
                    }

                    if (reservationResult.referenceNumber) {
                        isFirstRun = false;
                        const { sessionToken, userId, ...cleanResult } = reservationResult;

                        console.log(`✅✅✅ ${paintCode} (${vehicleData.VIN}) REZERVE EDİLDİ ✅✅✅ ----->`, cleanResult);
                        console.log(`---> VIN: ${vehicleData.VIN}`);
                        console.log(`---> RN: ${reservationResult.referenceNumber}`);
                        console.log(`---> Token: ${reservationResult.pgwSignedTokenResponse || reservationResult.token}`);
                        console.log(`---> payment.js'deki bilgileri doldur ve ödemeyi tamamla.`);
                    }
                });
            }
        });

        async function reserveVehicle(vehicleData, getCsrfHeaders) {
            try {
                const pickupLocationsResponse = await fetch(
                    `https://www.tesla.com/${inventoryPath}/api/v4/pickup-locations-inventory`, {
                    method: "POST",
                    headers: {
                        ...(await getCsrfHeaders()),
                        "X-Requested-With": "XMLHttpRequest",
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        country: vehicleData.CountryCode,
                        id: vehicleData.VIN,
                        version: "v2",
                        isFalconDeliverySelectionEnabled: true
                    }),
                    credentials: "include"
                });

                const pickupLocationsData = await pickupLocationsResponse.json();

                if (!Array.isArray(pickupLocationsData) || pickupLocationsData.length === 0) {
                    return {
                        error: `Araç için uygun teslimat noktası bulunamadı: ${vehicleData.VIN}`
                    };
                }

                vehicleData.LOCS = pickupLocationsData.map(location => ({
                    trt: location.title || location.common_name,
                    trt_id: location.trt_id || +location.service_id,
                    transportFee: 0,
                    transportFeeCurrency: "TRY",
                    location_type: location.location_type,
                    lat: parseFloat(location.latitude),
                    lng: parseFloat(location.longitude),
                    province: location.province || location.city
                }));

                const captchaId = hcaptcha.render(captchaButtonId, {
                    sitekey: captchaSiteKey
                });

                try {
                    const { response: captchaToken } = await hcaptcha.execute(captchaId, {
                        async: true
                    });

                    const { LOCS: locations } = vehicleData;
                    const selectedLocation = locations[Math.floor(Math.random() * locations.length)];

                    const reservationResponse = await fetch(
                        `https://www.tesla.com/${inventoryPath}/api/v4/order`, {
                        method: "POST",
                        headers: {
                            ...(await getCsrfHeaders()),
                            "X-Requested-With": "XMLHttpRequest",
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            BrowserInfo: {
                                Browser: "Chrome",
                                OS: "Windows 11 64-bit",
                                BrowserVersion: "138.0.0.0",
                                DeviceType: "desktop",
                                trafficSource: {},
                                trafficSourceHistory: [],
                                isInventorySwapEnabled: false,
                                numberOfTimesPaymentFailed: 0,
                                activitysessionId: crypto.randomUUID(),
                                isPublicReferred: false,
                                isDm: false
                            },
                            Vin: vehicleData.VIN,
                            isUsedInventory: false,
                            market: vehicleData.CountryCode,
                            language: vehicleData.Language,
                            model: vehicleData.Model,
                            useExisting: false,
                            VehiclePrice: vehicleData.PurchasePrice,
                            optionCodeData: vehicleData.OptionCodeData,
                            SaveWithProfile: true,
                            RegistrationDetail: {
                                RegistrantType: null,
                                RegistrationAddress: {
                                    CountryCode: vehicleData.CountryCode
                                }
                            },
                            Payment: {
                                PaymentAmount: 0,
                                PaymentType: "CREDITCARD",
                                CurrencyCode: vehicleData.CurrencyCode,
                                CountryCode: vehicleData.CountryCode,
                                PayorName: `${userData.firstName} ${userData.lastName}`,
                                BillingInfoDetail: {
                                    CountryCode: vehicleData.CountryCode,
                                    Street: userData.streetAddress,
                                    City: userData.city,
                                    StateProvince: userData.stateProvince,
                                    ZipCode: userData.zipCode,
                                    Address2: "",
                                    PickupLocation: 0,
                                    RegistrationType: null,
                                    PrivateVatId: null,
                                    IsFromSavedProfile: false
                                },
                                PaymentSource: "RESERVATION",
                                PayorIDNumber: null,
                                VerificationPhone: null,
                                VerificationSMSCode: null,
                                AgreementSave: null,
                                RedirectPaymentName: "CREDITCARD",
                                IsOffline: true,
                                OrderAmount: 175000,
                                PaymentSourceSubType: "DEPOSIT_NON_REFUNDABLE",
                                LastFourDigits: null,
                                isV3Payment: true
                            },
                            Accessories: {},
                            InstallationAccessoriesItems: {},
                            InstallerExperienceShown: false,
                            AccountDetails: {
                                FirstName: userData.firstName,
                                LastName: userData.lastName,
                                CCFirstName: userData.ccFirstName,
                                CCLastName: userData.ccLastName,
                                Email: userData.email,
                                PhoneNumber: userData.phoneNumber,
                                PrivateVatId: userData.privateVatId,
                                Password: "",
                                CompanyName: null,
                                VatId: null,
                                CompanyNumber: null,
                                LocalName: "",
                                MiddleName: "",
                                PhoneCountry: vehicleData.CountryCode,
                                CompanyId: null,
                                CompanyAddress1: null,
                                CompanyAddress2: null,
                                CompanyCity: null,
                                CompanyPostalCode: null,
                                CompanyCountryCode: null,
                                IdentificationType: "",
                                IdentificationNumber: null,
                                CompanyState: null,
                                CompanyCounty: null,
                                OfficeType: null,
                                BranchName: null,
                                BranchId: null,
                                CompanyDistrict: null,
                                CompanyProvince: null,
                                TaxOfficeName: null,
                                NonResidentPerson: false,
                                NonResidentCompany: false,
                                PrivateRegistrationCountry: null,
                                BusinessRegistrationCountry: null,
                                RequestedTaxableInvoice: null,
                                UseOfTaxableInvoice: null,
                                AccountType: "private"
                            },
                            UserLocation: {
                                latitude: "",
                                longitude: ""
                            },
                            hasVehicleHistoryReport: false,
                            flexOptions: [],
                            Configs: {
                                config: {
                                    currencyCode: vehicleData.CurrencyCode
                                }
                            },
                            isSwap: false,
                            registrationZipCode: "",
                            DeliveryDetails: {
                                PostalCode: "",
                                Latitude: "",
                                Longitude: "",
                                error: null,
                                city: "",
                                countryCode: "",
                                countryName: "",
                                latitude: "",
                                longitude: "",
                                postalCode: "",
                                transportFee: {
                                    distance: userData.distance,
                                    fee: 0
                                },
                                StateProvince: selectedLocation.province,
                                stateProvince: selectedLocation.province
                            },
                            deliveryLocationSelectionDetails: {
                                locationId: selectedLocation.trt_id,
                                locationStateProvince: selectedLocation.province,
                                locations: locations.map(loc => lodash.omit(loc, ["lat", "lng", "province"])),
                                locationDetails: {
                                    latitude: selectedLocation.lat,
                                    longitude: selectedLocation.lng
                                },
                                distanceMove: userData.distance,
                                pickUpType: "PICKUP_SERVICE_CENTER",
                                distanceType: "km",
                                estimatedTransportationFee: 0,
                                registrationRestrictionStates: [],
                                registrationZipCode: "",
                                registrationState: "",
                                range: null,
                                version: "v2",
                                onSiteSale: false
                            },
                            hcaptchaToken: captchaToken,
                            optionCodes: "",
                            isManualAddress: false
                        }),
                        credentials: "include"
                    });

                    if (reservationResponse.status === 403) {
                        return {
                            error: "IP adresin Akamai tarafından engellendi."
                        };
                    }

                    const reservationResult = await reservationResponse.json();

                    if (reservationResponse.status === 428) {
                        return {
                            ...reservationResult,
                            error: "Akamai, sec_cpt engelini geçemediğin için isteği durdurdu."
                        };
                    }

                    return reservationResult;

                } finally {
                    hcaptcha.remove(captchaId);
                }

            } catch (error) {
                return {
                    error: error.message
                };
            }
        }

    } catch (error) {
        console.error("Bot başlatılırken hata oluştu:", error);
    }
})();
