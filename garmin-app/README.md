# FinalClimb Connect IQ App

This is the Garmin Connect IQ companion app for FinalClimb. It allows athletes to view their race plan checkpoints and power targets directly on their Garmin device during races.

## Features

- **Sync Code Entry**: Enter a sync code from the FinalClimb web app to download your race plan
- **Race Overview**: View race name, distance, and goal time
- **Power Targets**: See Safe/Tempo/Push power zones and terrain-specific targets
- **Checkpoints**: Scroll through all checkpoints with target times and effort levels
- **Offline Access**: Race plan is cached on device for use without phone connection

## Setup for Development

### Prerequisites

1. **Garmin Connect IQ SDK**: Download from [developer.garmin.com](https://developer.garmin.com/connect-iq/sdk/)
2. **Visual Studio Code** with Connect IQ extension (recommended)
3. **Java JDK** (required for SDK)

### Installation

1. Install the Connect IQ SDK and add to PATH:
   ```bash
   export PATH=$PATH:/path/to/connectiq-sdk/bin
   ```

2. Generate a developer key (first time only):
   ```bash
   openssl genrsa -out developer_key.pem 4096
   openssl pkcs8 -topk8 -inform PEM -outform DER -in developer_key.pem -out developer_key.der -nocrypt
   ```

3. Build the project:
   ```bash
   monkeyc -f monkey.jungle -o bin/FinalClimb.prg -d edge1040 -y developer_key.der
   ```

4. Run in simulator:
   ```bash
   connectiq
   # In simulator, load the .prg file
   ```

### Project Structure

```
garmin-app/
├── manifest.xml          # App configuration
├── resources/
│   ├── strings/          # Localized strings
│   ├── layouts/          # UI layouts
│   └── drawables/        # Icons and images
├── source/
│   ├── FinalClimbApp.mc  # Main app class
│   ├── SyncCodeView.mc   # Sync code entry screen
│   ├── RacePlanView.mc   # Race plan display
│   └── RacePlanSyncer.mc # API communication
└── README.md
```

## Building for Release

1. Create a `monkey.jungle` file if not present
2. Build with optimization:
   ```bash
   monkeyc -f monkey.jungle -o bin/FinalClimb.prg -d edge1040 -y developer_key.der -r
   ```

3. Sign for distribution:
   ```bash
   monkeyc -f monkey.jungle -o bin/FinalClimb.iq -e -y developer_key.der
   ```

## API Integration

The app communicates with the FinalClimb API to fetch race plan data:

- **Endpoint**: `GET /api/garmin/sync/{code}`
- **Response**: JSON containing race name, checkpoints, power targets

### Response Format

```json
{
  "data": {
    "race": "Mid South Gravel",
    "distance": "100 Mile",
    "miles": 100,
    "goal": "8:30",
    "athlete": "John Doe",
    "power": {
      "ftp": 280,
      "adj": 224,
      "safe": 150,
      "tempo": 157,
      "push": 163,
      "climbSafe": 180,
      "climbTempo": 188,
      "climbPush": 196,
      "flatSafe": 135,
      "flatTempo": 141,
      "flatPush": 147
    },
    "checkpoints": [
      {
        "name": "Checkpoint 1",
        "mi": 25.5,
        "time": "2:30",
        "effort": "safe"
      }
    ]
  }
}
```

## Supported Devices

- Edge 530, 540, 830, 840, 1030, 1040, 1050
- Fenix 6, 7, 8 series
- Forerunner 255, 265, 945, 955, 965
- Enduro, Enduro 2
- Epix 2 series

## Publishing

1. Create a developer account at [developer.garmin.com](https://developer.garmin.com)
2. Submit the `.iq` file through the Connect IQ Developer Portal
3. Provide app description, screenshots, and icon assets

## Troubleshooting

### "No internet connection" error
- Ensure phone is connected via Bluetooth
- Check that Garmin Connect app is running
- Verify phone has internet access

### Sync code not working
- Codes expire after 30 days
- Check that the code matches exactly (FC-XXXX-XXXX format)
- Generate a new code from finalclimbapp.com

## License

Proprietary - FinalClimb
