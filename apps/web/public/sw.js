self.addEventListener("push", function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || "CareerGPS Update";
      const options = {
        body: data.body || "You have a new notification",
        icon: "/icon.png", // Ensure you have an icon, fallback to default if missing
        badge: "/badge.png",
        data: data.payload,
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("Push payload is not valid JSON", e);
      event.waitUntil(
        self.registration.showNotification("CareerGPS", {
          body: event.data.text(),
        })
      );
    }
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
