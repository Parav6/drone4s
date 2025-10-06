// Libraries required:
// FirebaseESP8266.h
// ESP8266WiFi.h

// Initialise each parking place with the following data:
// "place_2": {
//    "device_id": "NODEMCU_LIBRARY",
//    "name": "Library Parking"
// }

//Complete database will look like this.
// {
//     "parking_places": {
//       "place_1": {
//         "name": "Main Gate Parking",
//         "device_id": "NODEMCU_MAIN_GATE",
//         "latitude": 28.545,
//         "longitude": 77.190,
//         "slots": {
//           "slot_1": { "status": "free" },
//           "slot_2": { "status": "occupied" },
//           "slot_3": { "status": "free" }
//         }
//       },
//       "place_2": {
//         "name": "Library Parking",
//         "device_id": "NODEMCU_LIBRARY",
//         "latitude": 28.548,
//         "longitude": 77.192,
//         "slots": {
//           "slot_1": { "status": "free" },
//           "slot_2": { "status": "free" }
//         }
//       }
//     }
//   }
  

//* Sample code for arduino for smart parking system.

#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

// ----------------------------------------
// Firebase credentials
// ----------------------------------------
#define FIREBASE_HOST "YOUR_PROJECT_ID.firebaseio.com"
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET"

// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase objects
FirebaseData firebaseData;
FirebaseJson json;

// ----------------------------------------
// Device identity (set this unique per NodeMCU)
// ----------------------------------------
String deviceID = "NODEMCU_MAIN_GATE";   // Change this for each board
String currentPlacePath = "";             // To store Firebase path of assigned place

// ----------------------------------------
// IR Sensor configuration
// ----------------------------------------
const int numSlots = 3;                   // Number of slots controlled by this board
int irPins[numSlots] = { D1, D2, D3 };    // Pins connected to IR sensors
String slotIDs[numSlots] = { "slot_1", "slot_2", "slot_3" };  // Slot IDs

// ----------------------------------------
// Setup
// ----------------------------------------
void setup() {
  Serial.begin(115200);

  // Setup IR sensor pins
  for (int i = 0; i < numSlots; i++) {
    pinMode(irPins[i], INPUT);
  }

  // Connect to WiFi
  connectWiFi();

  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);

  // Detect assigned parking place
  detectParkingPlace();
}

// ----------------------------------------
// Connect to WiFi
// ----------------------------------------
void connectWiFi() {
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to Wi-Fi");
}

// ----------------------------------------
// Detect which parking place this NodeMCU belongs to
// ----------------------------------------
void detectParkingPlace() {
  Serial.println("🔍 Searching for assigned parking place...");

  if (Firebase.get(firebaseData, "/parking_places")) {
    FirebaseJson &data = firebaseData.jsonObject();
    size_t len = data.iteratorBegin();

    for (size_t i = 0; i < len; i++) {
      String key, value;
      int type;
      data.iteratorGet(i, type, key, value);

      // Extract the place ID (like place_1)
      String placePath = "/parking_places/" + key;
      String devicePath = placePath + "/device_id";

      if (Firebase.getString(firebaseData, devicePath)) {
        String foundDevice = firebaseData.stringData();

        if (foundDevice == deviceID) {
          currentPlacePath = placePath;
          Serial.println("✅ Found assigned parking place: " + key);
          break;
        }
      }
    }

    data.iteratorEnd();
  }

  if (currentPlacePath == "") {
    Serial.println("❌ No matching parking place found for this device.");
  }
}

// ----------------------------------------
// Update slots continuously
// ----------------------------------------
void loop() {
  if (currentPlacePath == "") {
    Serial.println("⚠️ Parking place not assigned. Skipping updates.");
    delay(10000);
    return;
  }

  for (int i = 0; i < numSlots; i++) {
    int sensorValue = digitalRead(irPins[i]);
    String status = (sensorValue == LOW) ? "occupied" : "free"; // depends on IR output type
    String path = currentPlacePath + "/slots/" + slotIDs[i] + "/status";

    if (Firebase.setString(firebaseData, path.c_str(), status)) {
      Serial.println(slotIDs[i] + " updated → " + status);
    } else {
      Serial.println("❌ Failed to update " + slotIDs[i] + ": " + firebaseData.errorReason());
    }
  }

  Serial.println("----------------------------------------------------");
  delay(3000); // Update every 3 seconds
}

