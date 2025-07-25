//https://github.com/ismkdc/tesla-order-bot-tr/issues/8 'da konuşan date_time_fix dosyasının geçersiz olmasıyla alakalı aşağıdaki yamayı deneyebiliriz. Login olduktan sonra çalıştırılacak.
const authPaths = ["/inventory/", "/api/payments/"];
const cuaSessCookie = await cookieStore.get('cua_sess');
const cuaSessValue = cuaSessCookie ? cuaSessCookie.value : '';

console.log('cua_sess cookie value:', cuaSessValue);

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

console.log('All coin_auth_session cookies set successfully.');
