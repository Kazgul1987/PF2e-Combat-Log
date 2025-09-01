# PF2e Combat Log

A simple [Foundry VTT](https://foundryvtt.com/) module for the Pathfinder Second Edition system. It automatically records each combat encounter to a Journal for later reference.

## Features
- Creates a **Combat Log** journal folder and entry if they do not exist.
- Collects chat messages while combat is active.
- When combat ends or is deleted, generates a journal page with the timestamp, combatants and initiative order, and the chat log.
- Maintains an index page linking to all recorded encounters.

## Installation
1. In Foundry's setup screen open **Add-on Modules** and click **Install Module**.
2. Paste the manifest URL and confirm:
   ```
   https://github.com/user/PF2e-Combat-Log/releases/latest/download/module.json
   ```

## Usage
- Start an encounter in the Pathfinder 2E system.
- Chat messages posted during combat are stored.
- When the encounter finishes, the module creates a new page in the **Combat Log** journal with the initiative table and chat log.

## Development
The module's source lives in the `module/` directory. To package the module, zip the `module` folder and distribute it together with `module.json`.

## License

Released under the MIT License.

