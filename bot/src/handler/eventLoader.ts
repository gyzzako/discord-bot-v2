import { readdirSync } from "node:fs";
import { join } from "node:path";
import { BotClient, Event } from "../types/clients";

export async function loadEvents(client: BotClient) {
    const path = join(process.cwd(), "src/events");
    const files = readdirSync(path).filter(file => file.endsWith(".ts") || file.endsWith(".js"));
    for (const file of files) {
        const filePath = join(path, file)
        const event = await import(filePath).then(v => v.default) as Event;

        if ("name" in event && "execute" in event) {
            if (event.once) {
                client.once(event.name, event.execute.bind(null, client))
            } else {
                client.on(event.name, event.execute.bind(null, client))
            }
        }else {
            console.warn(`[WARNING] The Event at ${filePath} is missing a required "name" or "execute" property.`)
        }
    }
}